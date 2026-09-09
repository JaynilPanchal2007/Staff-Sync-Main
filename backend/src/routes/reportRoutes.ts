import { Router } from 'express';
import { dbService } from '../services/db.js';
import { resolveOrgId } from '../utils/orgContext.js';

export const reportRouter = Router();

reportRouter.get('/reports', (req, res) => {
  try {
    const orgId = resolveOrgId(req);
    const staff = dbService.getStaff(orgId);
    const attendance = dbService.getAttendance(orgId);
    const proxyRequests = dbService.getProxyRequests(orgId);
    const timetable = dbService.getTimetable(orgId);
    const shifts = dbService.getShifts(orgId);
    const gaps = dbService.getGaps(orgId);

    const totalMarked = attendance.length;
    const presentTotal = attendance.filter((a) => a.status === 'present').length;
    const absentTotal = attendance.filter((a) => a.status === 'absent').length;
    const leaveTotal = attendance.filter((a) => a.status === 'on_leave').length;

    const overallAttendanceRate = totalMarked > 0 ? Math.round((presentTotal / totalMarked) * 100) : 100;

    const deptMap: Record<string, { staffCount: number; present: number; absent: number; workload: number }> = {};
    for (const s of staff) {
      const dept = s.department || 'General';
      if (!deptMap[dept]) {
        deptMap[dept] = { staffCount: 0, present: 0, absent: 0, workload: 0 };
      }
      deptMap[dept].staffCount++;
      deptMap[dept].workload += s.assignedLectures || s.weeklyHours || 0;
    }

    for (const a of attendance) {
      const s = staff.find((m) => m.id === a.staffId || m.employeeId === a.staffId || m.staffId === a.staffId);
      const dept = s?.department || 'General';
      if (deptMap[dept]) {
        if (a.status === 'present') deptMap[dept].present++;
        if (a.status === 'absent') deptMap[dept].absent++;
      }
    }

    const departmentStats = Object.keys(deptMap).map((dept) => ({
      department: dept,
      ...deptMap[dept],
    }));

    const proxyFrequency = staff
      .map((s) => ({
        name: s.name,
        employeeId: s.employeeId,
        department: s.department,
        proxyCount: proxyRequests.filter(
          (p) => (p.targetStaffId === s.id || p.targetStaffId === s.employeeId || p.targetStaffId === s.staffId) && p.status === 'accepted'
        ).length,
        workload: s.assignedLectures || s.weeklyHours || 0,
      }))
      .sort((a, b) => b.proxyCount - a.proxyCount);

    const totalGaps = gaps.length;
    const resolvedGaps = gaps.filter((g) => g.status === 'resolved' || g.status === 'accepted').length;
    const resolutionRate = totalGaps > 0 ? Math.round((resolvedGaps / totalGaps) * 100) : 100;

    res.json({
      summary: {
        totalStaff: staff.length,
        overallAttendanceRate,
        totalGapsRecorded: totalGaps,
        resolvedGapsCount: resolvedGaps,
        gapResolutionRate: resolutionRate,
        totalProxiesHandled: proxyRequests.filter((p) => p.status === 'accepted').length,
      },
      departmentStats,
      proxyFrequency: proxyFrequency.slice(0, 10),
      attendanceBreakdown: [
        { name: 'Present', value: presentTotal, color: '#10B981' },
        { name: 'Absent', value: absentTotal, color: '#EF4444' },
        { name: 'On Leave', value: leaveTotal, color: '#F59E0B' },
      ],
      recentReplacements: proxyRequests.filter((p) => p.status === 'accepted').slice(0, 15),
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

reportRouter.get('/reports/export/csv', (req, res) => {
  try {
    const orgId = resolveOrgId(req);
    const staff = dbService.getStaff(orgId);
    const proxyRequests = dbService.getProxyRequests(orgId);

    const headers = ['Employee ID', 'Name', 'Department', 'Role', 'Status', 'Workload', 'Proxies Handled', 'Email'];
    const rows = staff.map((s) => [
      s.employeeId,
      `"${s.name}"`,
      `"${s.department}"`,
      `"${s.role}"`,
      s.status,
      s.assignedLectures || s.weeklyHours || 0,
      proxyRequests.filter((p) => (p.targetStaffId === s.id || p.targetStaffId === s.staffId) && p.status === 'accepted').length,
      s.email,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="staffsync-workforce-report.csv"');
    res.send(csvContent);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});
