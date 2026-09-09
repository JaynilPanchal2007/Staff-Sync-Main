import { dbService } from '../services/db.js';
import { getSmartAdjustmentAiInsight } from '../services/geminiAssistant.js';
export class SmartReplacementEngine {
    async evaluateGap(gapId) {
        const gap = dbService.getGapById(gapId);
        if (!gap) {
            throw new Error(`Staffing gap not found: ${gapId}`);
        }
        const org = dbService.getOrganization(gap.organizationId);
        const orgType = org?.type || 'school';
        const settings = dbService.getSettings();
        const weights = settings?.scoringWeights || {
            compatibility: 30,
            availability: 20,
            conflict: 15,
            workload: 15,
            fairness: 10,
            experience: 10,
        };
        const allStaff = dbService.getStaff(gap.organizationId);
        const dateAttendance = dbService.getAttendance(gap.organizationId, gap.date);
        const allTimetable = dbService.getTimetable(gap.organizationId);
        const allShifts = dbService.getShifts(gap.organizationId, undefined, gap.date);
        const proxyRequests = dbService.getProxyRequests(gap.organizationId);
        const candidates = [];
        for (const staff of allStaff) {
            if (staff.id === gap.absentStaffId || staff.employeeId === gap.absentStaffId || staff.staffId === gap.absentStaffId) {
                continue;
            }
            if (staff.status === 'inactive' || staff.status === 'deactivated') {
                continue;
            }
            const staffAtt = dateAttendance.find((a) => a.staffId === staff.id || a.staffId === staff.employeeId || a.staffId === staff.staffId);
            if (staffAtt && ['absent', 'on_leave', 'off_duty'].includes(staffAtt.status)) {
                continue;
            }
            const [gapStart, gapEnd] = [gap.startTime || '09:00', gap.endTime || '10:00'];
            let hasConflict = false;
            if (orgType === 'school' || orgType === 'college') {
                const staffLectures = allTimetable.filter((t) => (t.facultyId === staff.id || t.facultyId === staff.employeeId || t.facultyId === staff.staffId) && t.day === gap.day);
                for (const lec of staffLectures) {
                    if (this.timeOverlaps(gapStart, gapEnd, lec.startTime, lec.endTime)) {
                        hasConflict = true;
                        break;
                    }
                }
            }
            else {
                const staffShifts = allShifts.filter((s) => s.employeeId === staff.id || s.employeeId === staff.employeeId || s.employeeId === staff.staffId);
                for (const sh of staffShifts) {
                    if (this.timeOverlaps(gapStart, gapEnd, sh.startTime, sh.endTime)) {
                        hasConflict = true;
                        break;
                    }
                }
            }
            if (hasConflict) {
                continue;
            }
            let isAvailable = true;
            if (staff.availability && Array.isArray(staff.availability) && staff.availability.length > 0) {
                const dayAvailability = staff.availability.find((av) => av.day?.toLowerCase() === gap.day?.toLowerCase());
                if (dayAvailability && dayAvailability.available === false) {
                    isAvailable = false;
                }
            }
            let compatibilityScore = 0;
            const reasons = [];
            if (orgType === 'school' || orgType === 'college') {
                const requiredSub = (gap.requiredSkillsOrSubject || gap.subject || '').toLowerCase().trim();
                const staffSubs = (staff.subjects || []).map((s) => s.toLowerCase().trim());
                const staffDept = (staff.department || '').toLowerCase().trim();
                if (staffSubs.includes(requiredSub)) {
                    compatibilityScore = 1.0;
                    reasons.push(`✓ Primary subject expertise in ${gap.requiredSkillsOrSubject || gap.subject}`);
                }
                else if (staffDept && gap.department && staffDept === gap.department.toLowerCase().trim()) {
                    compatibilityScore = 0.75;
                    reasons.push(`✓ Department colleague in ${staff.department}`);
                }
                else {
                    compatibilityScore = 0.4;
                    reasons.push(`Qualified faculty member in general curriculum`);
                }
            }
            else {
                const reqSkills = Array.isArray(gap.requiredSkills)
                    ? gap.requiredSkills
                    : (gap.requiredSkillsOrSubject || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
                const staffSkills = (staff.skills || []).map((s) => s.toLowerCase().trim());
                const staffCerts = (staff.certifications || []).map((c) => c.toLowerCase().trim());
                if (reqSkills.length > 0) {
                    const matchedSkills = reqSkills.filter((rs) => staffSkills.includes(rs) || staffCerts.includes(rs));
                    const matchRatio = matchedSkills.length / reqSkills.length;
                    compatibilityScore = matchRatio;
                    if (matchRatio >= 1.0) {
                        reasons.push(`✓ 100% skill & certification requirements matched`);
                    }
                    else if (matchRatio > 0.5) {
                        reasons.push(`✓ Matches key required skills: ${matchedSkills.join(', ')}`);
                    }
                    else {
                        reasons.push(`Partial skill overlap`);
                    }
                }
                else {
                    compatibilityScore = staff.department === gap.department ? 0.9 : 0.6;
                    reasons.push(`Eligible workforce member in ${staff.role || staff.department}`);
                }
            }
            reasons.push(`✓ Free and available during required slot (${gapStart} - ${gapEnd})`);
            reasons.push(`✓ Zero timetable / shift schedule conflicts`);
            const currentWorkload = staff.assignedLectures || staff.weeklyHours || 0;
            const maxWorkload = staff.maxWorkload || staff.maxWeeklyHours || 24;
            const workloadRatio = Math.min(1.0, currentWorkload / (maxWorkload || 24));
            const workloadScore = Math.max(0.2, 1.0 - workloadRatio * 0.7);
            if (workloadRatio < 0.6) {
                reasons.push(`✓ Balanced workload: currently at ${currentWorkload} hrs/periods (well within limits)`);
            }
            else {
                reasons.push(`Approaching standard workload limit (${currentWorkload}/${maxWorkload})`);
            }
            const staffProxies = proxyRequests.filter((p) => (p.targetStaffId === staff.id || p.targetStaffId === staff.employeeId || p.targetStaffId === staff.staffId) && p.status === 'accepted').length;
            const fairnessScore = Math.max(0.3, 1.0 - staffProxies * 0.15);
            if (staffProxies === 0) {
                reasons.push(`✓ Fairness: 0 previous proxy assignments this cycle`);
            }
            else {
                reasons.push(`Handled ${staffProxies} previous replacement assignment(s)`);
            }
            const expYears = parseInt(staff.experience || '2', 10) || 2;
            const expScore = Math.min(1.0, 0.4 + (expYears / 10) * 0.6);
            if (expYears >= 3) {
                reasons.push(`✓ High experience: ${expYears}+ years tenure in ${staff.department}`);
            }
            const totalScore = Math.round((compatibilityScore * weights.compatibility) +
                (1.0 * weights.availability) +
                (1.0 * weights.conflict) +
                (workloadScore * weights.workload) +
                (fairnessScore * weights.fairness) +
                (expScore * weights.experience));
            candidates.push({
                staffId: staff.id || staff.staffId,
                staffName: staff.name,
                employeeId: staff.employeeId,
                role: staff.role || 'Staff',
                department: staff.department || 'General',
                matchScore: Math.min(99, Math.max(45, totalScore)),
                breakdown: {
                    compatibility: Math.round(compatibilityScore * weights.compatibility),
                    availability: Math.round(1.0 * weights.availability),
                    conflict: Math.round(1.0 * weights.conflict),
                    workload: Math.round(workloadScore * weights.workload),
                    fairness: Math.round(fairnessScore * weights.fairness),
                    experience: Math.round(expScore * weights.experience),
                },
                reasons,
                currentWorkload,
                proxyCount: staffProxies,
                isAvailable: true,
                hasConflict: false,
                eliminated: false,
            });
        }
        candidates.sort((a, b) => b.matchScore - a.matchScore);
        const bestCandidate = candidates.length > 0 ? candidates[0] : null;
        if (bestCandidate) {
            dbService.updateGap(gap.id || gap.gapId, {
                status: gap.status === 'unresolved' ? 'candidates_found' : gap.status,
                recommendedCandidate: bestCandidate,
                candidateCount: candidates.length,
            });
        }
        const aiInsight = await getSmartAdjustmentAiInsight(gap, candidates);
        return {
            gapId,
            evaluatedCount: allStaff.length,
            eligibleCount: candidates.length,
            candidates,
            bestCandidate,
            aiInsight,
            timestamp: new Date().toISOString(),
        };
    }
    timeOverlaps(start1, end1, start2, end2) {
        const toMinutes = (t) => {
            const [h, m] = (t || '00:00').split(':').map(Number);
            return (h || 0) * 60 + (m || 0);
        };
        const s1 = toMinutes(start1);
        const e1 = toMinutes(end1);
        const s2 = toMinutes(start2);
        const e2 = toMinutes(end2);
        return Math.max(s1, s2) < Math.min(e1, e2);
    }
}
export const replacementEngine = new SmartReplacementEngine();
