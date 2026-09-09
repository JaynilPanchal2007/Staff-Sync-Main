import { Router } from 'express';
import { dbService } from '../services/db.js';
import { emitToOrg } from '../sockets.js';
import { resolveAdmin, resolveOrgId } from '../utils/orgContext.js';
export const shiftRouter = Router();
function timeOverlaps(start1, end1, start2, end2) {
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
shiftRouter.get('/shifts', (req, res) => {
    try {
        const admin = resolveAdmin(req);
        const orgId = resolveOrgId(req);
        const { employeeId, date, department } = req.query;
        let list = dbService.getShifts(orgId, employeeId, date);
        if (department && department !== 'all') {
            list = list.filter((s) => s.department === department);
        }
        res.json({ shifts: list });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
shiftRouter.post('/shifts', (req, res) => {
    try {
        const admin = resolveAdmin(req);
        const orgId = resolveOrgId(req);
        const { employeeId, date, startTime, endTime, department, role, requiredSkills, location } = req.body;
        if (!employeeId || !date || !startTime || !endTime) {
            return res.status(400).json({ error: 'employeeId, date, startTime, and endTime are required.' });
        }
        const employee = dbService.getStaffById(employeeId);
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found.' });
        }
        const existingShifts = dbService.getShifts(orgId, employee.id || employee.staffId, date);
        for (const sh of existingShifts) {
            if (timeOverlaps(startTime, endTime, sh.startTime, sh.endTime)) {
                return res.status(400).json({
                    error: `Shift conflict: ${employee.name} is already assigned to shift (${sh.startTime} - ${sh.endTime}) on ${date}.`,
                });
            }
        }
        const newShift = dbService.addShift({
            organizationId: orgId,
            employeeId: employee.id || employee.staffId,
            employeeName: employee.name,
            employeeCustomId: employee.employeeId,
            date,
            startTime,
            endTime,
            department: department || employee.department || 'Operations',
            role: role || employee.role || 'Operator',
            requiredSkills: Array.isArray(requiredSkills)
                ? requiredSkills
                : requiredSkills
                    ? requiredSkills.split(',').map((s) => s.trim())
                    : employee.skills || [],
            location: location || 'Main Facility',
            status: 'scheduled',
        });
        dbService.addAuditLog({
            actor: admin.name,
            action: 'ADD_SHIFT',
            entity: 'Shift',
            entityId: newShift.id || newShift.shiftId,
            metadata: { employeeName: employee.name, date, time: `${startTime}-${endTime}` },
        });
        emitToOrg(orgId, 'shift:updated', newShift);
        emitToOrg(orgId, 'dashboard:refresh', { type: 'shift_added' });
        res.status(201).json({ success: true, shift: newShift });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
shiftRouter.delete('/shifts/:id', (req, res) => {
    try {
        const admin = resolveAdmin(req);
        const orgId = resolveOrgId(req);
        dbService.deleteShift(req.params.id);
        emitToOrg(orgId, 'shift:updated', { id: req.params.id });
        emitToOrg(orgId, 'dashboard:refresh', { type: 'shift_deleted' });
        res.json({ success: true, message: 'Shift deleted.' });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
