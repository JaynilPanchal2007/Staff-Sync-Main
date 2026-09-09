import { Router } from 'express';
import { dbService } from '../services/db.js';
import { replacementEngine } from '../engines/replacementEngine.js';
import { emitToOrg, emitToStaff } from '../sockets.js';
import { resolveAdmin, resolveOrgId } from '../utils/orgContext.js';
export const attendanceRouter = Router();
attendanceRouter.get('/attendance', (req, res) => {
    try {
        const admin = resolveAdmin(req);
        const orgId = resolveOrgId(req);
        const { date } = req.query;
        const targetDate = date || new Date().toISOString().split('T')[0];
        const attendance = dbService.getAttendance(orgId, targetDate);
        const staff = dbService.getStaff(orgId);
        const list = staff.map((s) => {
            const record = attendance.find((a) => a.staffId === s.id || a.staffId === s.employeeId || a.staffId === s.staffId);
            return {
                staffId: s.id || s.staffId,
                employeeId: s.employeeId,
                name: s.name,
                department: s.department,
                role: s.role,
                status: record ? record.status : 'present',
                remarks: record ? record.remarks : '',
                date: targetDate,
            };
        });
        res.json({ date: targetDate, records: list });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
attendanceRouter.post('/attendance', async (req, res) => {
    try {
        const admin = resolveAdmin(req);
        const orgId = resolveOrgId(req);
        const { staffId, status, date, remarks } = req.body;
        if (!staffId || !status) {
            return res.status(400).json({ error: 'staffId and status are required.' });
        }
        const targetDate = date || new Date().toISOString().split('T')[0];
        const staff = dbService.getStaffById(staffId);
        if (!staff) {
            return res.status(404).json({ error: 'Staff member not found.' });
        }
        const org = dbService.getOrganization(orgId);
        const orgType = org?.type || 'school';
        const record = dbService.setAttendance({
            organizationId: orgId,
            staffId: staff.id || staff.staffId,
            employeeId: staff.employeeId,
            staffName: staff.name,
            date: targetDate,
            status,
            remarks: remarks || '',
        });
        dbService.addAuditLog({
            actor: admin.name,
            action: 'UPDATE_ATTENDANCE',
            entity: 'Attendance',
            entityId: staff.id || staff.staffId,
            metadata: { staffName: staff.name, status, date: targetDate },
        });
        const createdGaps = [];
        if (status === 'absent' || status === 'on_leave') {
            const [year, month, day] = targetDate.split('-').map(Number);
            const localDate = new Date(year, (month || 1) - 1, day || 1);
            const dayOfWeek = localDate.toLocaleDateString('en-US', { weekday: 'long' });
            if (orgType === 'school' || orgType === 'college') {
                const lectures = dbService
                    .getTimetable(orgId, staff.id || staff.staffId)
                    .filter((t) => t.day?.toLowerCase() === dayOfWeek.toLowerCase());
                for (const lec of lectures) {
                    const existingGaps = dbService.getGaps(orgId);
                    const staffIdentifiers = [staff.id, staff.staffId, staff.employeeId].filter(Boolean);
                    const alreadyExists = existingGaps.some((g) => staffIdentifiers.includes(g.absentStaffId) &&
                        g.date === targetDate &&
                        g.startTime === lec.startTime &&
                        g.endTime === lec.endTime &&
                        g.status !== 'resolved');
                    if (!alreadyExists) {
                        const gap = dbService.addGap({
                            organizationId: orgId,
                            date: targetDate,
                            day: dayOfWeek,
                            startTime: lec.startTime,
                            endTime: lec.endTime,
                            affectedType: 'lecture',
                            targetItem: lec,
                            absentStaffId: staff.id || staff.staffId,
                            absentStaffName: staff.name,
                            absentEmployeeId: staff.employeeId,
                            subject: lec.subject,
                            classGrade: lec.classGrade,
                            section: lec.section,
                            room: lec.room,
                            department: staff.department,
                            requiredSkillsOrSubject: lec.subject,
                            status: 'unresolved',
                        });
                        try {
                            const recommendation = await replacementEngine.evaluateGap(gap.id || gap.gapId);
                            gap.candidateCount = recommendation.candidates.length;
                            gap.recommendedCandidate = recommendation.bestCandidate;
                        }
                        catch (evalErr) {
                            console.error('Error evaluating gap:', evalErr);
                        }
                        createdGaps.push(gap);
                        dbService.addNotification({
                            organizationId: orgId,
                            type: 'staffing_shortage',
                            title: `Staffing Gap: ${lec.subject} (${lec.startTime} - ${lec.endTime})`,
                            message: `Faculty ${staff.name} is marked ${status}. Replacement recommendation generated.`,
                            metadata: { gapId: gap.id || gap.gapId },
                        });
                        emitToOrg(orgId, 'staffing:gap-created', gap);
                    }
                }
            }
            else {
                const shifts = dbService.getShifts(orgId, staff.id || staff.staffId, targetDate);
                for (const sh of shifts) {
                    const existingGaps = dbService.getGaps(orgId);
                    const alreadyExists = existingGaps.some((g) => g.absentStaffId === (staff.id || staff.staffId) &&
                        g.date === targetDate &&
                        g.startTime === sh.startTime &&
                        g.endTime === sh.endTime &&
                        g.status !== 'resolved');
                    if (!alreadyExists) {
                        const gap = dbService.addGap({
                            organizationId: orgId,
                            date: targetDate,
                            day: dayOfWeek,
                            startTime: sh.startTime,
                            endTime: sh.endTime,
                            affectedType: 'shift',
                            targetItem: sh,
                            absentStaffId: staff.id || staff.staffId,
                            absentStaffName: staff.name,
                            absentEmployeeId: staff.employeeId,
                            role: sh.role,
                            department: sh.department,
                            requiredSkills: sh.requiredSkills || [],
                            requiredSkillsOrSubject: (sh.requiredSkills || []).join(', ') || sh.role,
                            status: 'unresolved',
                        });
                        try {
                            const recommendation = await replacementEngine.evaluateGap(gap.id || gap.gapId);
                            gap.candidateCount = recommendation.candidates.length;
                            gap.recommendedCandidate = recommendation.bestCandidate;
                        }
                        catch (evalErr) {
                            console.error('Error evaluating shift gap:', evalErr);
                        }
                        createdGaps.push(gap);
                        dbService.addNotification({
                            organizationId: orgId,
                            type: 'staffing_shortage',
                            title: `Shift Gap: ${sh.role || sh.department} (${sh.startTime} - ${sh.endTime})`,
                            message: `Employee ${staff.name} is marked ${status}. Smart Replacement Engine evaluated.`,
                            metadata: { gapId: gap.id || gap.gapId },
                        });
                        emitToOrg(orgId, 'staffing:gap-created', gap);
                    }
                }
            }
        }
        emitToOrg(orgId, 'attendance:updated', record);
        emitToOrg(orgId, 'dashboard:refresh', { type: 'attendance_changed', createdGapsCount: createdGaps.length });
        emitToStaff(staff.id || staff.staffId, 'attendance:updated', record);
        res.json({
            success: true,
            attendance: record,
            gapsCreated: createdGaps,
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
