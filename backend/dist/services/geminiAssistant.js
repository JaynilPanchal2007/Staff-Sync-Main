import { GoogleGenAI } from '@google/genai';
import { dbService } from './db.js';
let geminiClient = null;
function getGemini() {
    if (!geminiClient && process.env.GEMINI_API_KEY) {
        geminiClient = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY,
            httpOptions: {
                headers: {
                    'User-Agent': 'aistudio-build',
                },
            },
        });
    }
    return geminiClient;
}
export async function askStaffSyncAssistant(orgId, query) {
    const admin = dbService.getAdmin();
    const org = orgId ? dbService.getOrganization(orgId) : null;
    const staff = dbService.getStaff(orgId);
    const today = new Date().toISOString().split('T')[0];
    const attendance = dbService.getAttendance(orgId, today);
    const gaps = dbService.getGaps(orgId);
    const timetable = dbService.getTimetable(orgId);
    const shifts = dbService.getShifts(orgId, undefined, today);
    const proxyRequests = dbService.getProxyRequests(orgId);
    const absentStaff = attendance
        .filter((a) => ['absent', 'on_leave'].includes(a.status))
        .map((a) => {
        const s = staff.find((m) => m.id === a.staffId || m.employeeId === a.staffId);
        return `${s?.name || a.staffName} (${a.status}, Dept: ${s?.department || 'N/A'})`;
    });
    const presentStaff = attendance
        .filter((a) => a.status === 'present')
        .map((a) => {
        const s = staff.find((m) => m.id === a.staffId || m.employeeId === a.staffId);
        return s?.name || a.staffName;
    });
    const unresolvedGaps = gaps.filter((g) => g.status === 'unresolved' || g.status === 'candidates_found');
    const contextData = {
        organization: org ? { name: org.name, type: org.type, workingHours: org.workingHours } : 'Not yet fully configured',
        totalStaff: staff.length,
        staffMembers: staff.map((s) => ({
            name: s.name,
            id: s.employeeId,
            department: s.department,
            role: s.role,
            subjects: s.subjects || [],
            skills: s.skills || [],
            workload: s.assignedLectures || s.weeklyHours || 0,
            proxyCount: s.proxyCount || 0,
        })),
        today,
        attendanceSummary: {
            totalMarkedToday: attendance.length,
            presentCount: presentStaff.length,
            absentCount: absentStaff.length,
            absentList: absentStaff,
        },
        staffingGaps: unresolvedGaps.map((g) => ({
            id: g.id,
            date: g.date,
            time: `${g.startTime} - ${g.endTime}`,
            work: g.subject || g.role || 'Unspecified',
            absentStaff: g.absentStaffName,
            status: g.status,
        })),
        pendingProxyRequests: proxyRequests
            .filter((p) => p.status === 'pending')
            .map((p) => `Request to ${p.targetStaffName} for ${p.workDetails?.subject || 'work'} (${p.status})`),
    };
    const ai = getGemini();
    if (ai) {
        try {
            const prompt = `Database Context of StaffSync:
${JSON.stringify(contextData, null, 2)}

User Question: "${query}"

Instructions:
- You are StaffSync AI Assistant.
- Answer strictly based on the real database context provided above.
- If the database is empty or does not contain enough records to answer, state clearly: "I don't have enough data to answer that. Please ensure the relevant staff, attendance, or timetable records are added."
- Keep the response clear, professional, factual, and directly actionable for the administrator.`;
            const response = await ai.models.generateContent({
                model: 'gemini-3.6-flash',
                contents: prompt,
            });
            if (response.text && response.text.trim().length > 0) {
                return response.text.trim();
            }
        }
        catch (err) {
            console.warn('Gemini call failed or timed out, falling back to deterministic DB assistant:', err.message);
        }
    }
    const q = query.toLowerCase();
    if (q.includes('who is absent') || q.includes('absent today') || q.includes('attendance')) {
        if (absentStaff.length === 0) {
            return `According to today's database records (${today}), no staff members are marked absent or on leave.`;
        }
        return `Currently, ${absentStaff.length} staff member(s) are recorded as absent/on leave today (${today}):\n${absentStaff.map((s) => `• ${s}`).join('\n')}`;
    }
    if (q.includes('gap') || q.includes('shortage') || q.includes('unresolved')) {
        if (unresolvedGaps.length === 0) {
            return `No active staffing gaps are currently open in the database. All scheduled lectures/shifts are covered.`;
        }
        return `There are ${unresolvedGaps.length} active staffing gap(s) requiring attention:\n${unresolvedGaps
            .map((g) => `• ${g.work} (${g.time}): Absent: ${g.absentStaff} [Status: ${g.status}]`)
            .join('\n')}`;
    }
    if (q.includes('lowest workload') || q.includes('least work')) {
        if (staff.length === 0)
            return `I don't have enough data to answer that. No staff records exist yet in the database.`;
        const sorted = [...staff].sort((a, b) => (a.assignedLectures || a.weeklyHours || 0) - (b.assignedLectures || b.weeklyHours || 0));
        const top3 = sorted.slice(0, 3);
        return `Staff members with the lowest recorded workload:\n${top3
            .map((s) => `• ${s.name} (${s.department}): ${s.assignedLectures || s.weeklyHours || 0} hrs/periods assigned`)
            .join('\n')}`;
    }
    if (q.includes('replace') || q.includes('proxy')) {
        if (unresolvedGaps.length === 0) {
            return `There are currently no open staffing gaps in the system. If a staff member is absent, mark their attendance to trigger replacement recommendations.`;
        }
        const firstGap = unresolvedGaps[0];
        return `For active gap "${firstGap.work}" (${firstGap.time}, absent: ${firstGap.absentStaff}), please check the Smart Adjustment Center where StaffSync automatically scores eligible candidates based on availability, compatibility, schedule conflict, and workload.`;
    }
    if (staff.length === 0) {
        return `I don't have enough data to answer that. The database currently has 0 staff members registered. Please add staff or import a staff PDF to begin.`;
    }
    return `StaffSync summary for ${org?.name || 'your organization'}: Total staff registered: ${staff.length}. Present today: ${presentStaff.length}, Absent: ${absentStaff.length}. Active staffing gaps: ${unresolvedGaps.length}. Ask me specifically about staff attendance, workload comparisons, or active staffing gaps.`;
}
export async function getSmartAdjustmentAiInsight(gap, candidates) {
    const ai = getGemini();
    if (!ai || !candidates || candidates.length === 0)
        return null;
    try {
        const topCandidates = candidates.slice(0, 3).map((c, i) => ({
            rank: i + 1,
            name: c.staffName,
            employeeId: c.employeeId,
            department: c.department,
            role: c.role,
            matchScore: c.matchScore,
            currentWorkload: c.currentWorkload,
            keyReasons: c.reasons,
        }));
        const prompt = `StaffSync Smart Adjustment Decision Context:
- Absent Staff: ${gap.absentStaffName}
- Work / Subject / Shift: ${gap.subject || gap.role || 'Work Assignment'}
- Department: ${gap.department || 'N/A'}
- Date & Time: ${gap.date} (${gap.startTime} - ${gap.endTime})

Top Eligible Replacement Candidates Evaluated by Algorithm:
${JSON.stringify(topCandidates, null, 2)}

Instructions:
- You are Gemini AI Assistant for StaffSync Smart Adjustment Center.
- Synthesize an executive AI Recommendation summary (2-3 concise sentences).
- Clearly explain why candidate #1 (${topCandidates[0]?.name}) is recommended over others (highlighting subject/skill fit, workload balance, or schedule availability), and mention any practical trade-off or recommendation for the administrator.
- Keep it highly professional, factual, and direct.`;
        const response = await ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: prompt,
        });
        if (response.text && response.text.trim().length > 0) {
            return response.text.trim();
        }
    }
    catch (err) {
        console.warn('Gemini Smart Adjustment insight call failed:', err.message);
    }
    return null;
}
