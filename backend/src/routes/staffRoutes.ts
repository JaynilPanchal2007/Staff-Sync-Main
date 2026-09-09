import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { dbService } from '../services/db.js';
import { emitToOrg, emitToStaff } from '../sockets.js';
import { resolveAdmin, resolveOrgId, sanitizeStaff } from '../utils/orgContext.js';

export const staffRouter = Router();

staffRouter.get('/staff', (req, res) => {
  try {
    const admin = resolveAdmin(req);
    const orgId = resolveOrgId(req);
    const { department, role, status, q } = req.query;
    let staff = dbService.getStaff(orgId);

    const isRealFilter = (value: unknown) => {
      const text = String(value ?? '').trim();
      return Boolean(text) && text !== 'all' && text !== 'undefined' && text !== 'null';
    };

    if (isRealFilter(department)) {
      staff = staff.filter((s) => s.department === department);
    }
    if (isRealFilter(role)) {
      staff = staff.filter((s) => s.role === role);
    }
    if (isRealFilter(status)) {
      staff = staff.filter((s) => s.status === status);
    }
    if (isRealFilter(q)) {
      const search = (q as string).toLowerCase();
      staff = staff.filter(
        (s) =>
          s.name?.toLowerCase().includes(search) ||
          s.employeeId?.toLowerCase().includes(search) ||
          s.email?.toLowerCase().includes(search) ||
          s.department?.toLowerCase().includes(search) ||
          (s.subjects && s.subjects.some((sub: string) => sub.toLowerCase().includes(search))) ||
          (s.skills && s.skills.some((sk: string) => sk.toLowerCase().includes(search)))
      );
    }

res.json({ staff: staff.map(sanitizeStaff) });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

staffRouter.post('/staff', async (req, res) => {
  try {
    const admin = resolveAdmin(req);
    const orgId = resolveOrgId(req);
    const {
      name,
      employeeId,
      email,
      phone,
      password,
      department,
      role,
      subjects,
      classes,
      skills,
      certifications,
      qualification,
      experience,
      workingDays,
      availability,
      maxWorkload,
      maxWeeklyHours,
      status,
    } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Name is required.' });
    }

    const trimmedName = String(name).trim();
    let empId = employeeId ? String(employeeId).trim() : '';
    if (!empId) {
      empId = `FAC-${Date.now().toString().slice(-4)}`;
    }

    const existingStaff = dbService.getStaff(orgId);
    if (existingStaff.some((s) => s.employeeId?.toLowerCase() === empId.toLowerCase())) {
      if (employeeId) {
        return res.status(400).json({ error: `Staff with ID "${empId}" already exists. Please choose a different Employee ID.` });
      } else {
        empId = `FAC-${Date.now().toString().slice(-4)}-${Math.floor(10 + Math.random() * 90)}`;
      }
    }

    let staffEmail = email ? String(email).trim() : '';
    if (!staffEmail) {
      const sanitizedName = trimmedName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'staff';
      staffEmail = `${sanitizedName}@staffsync.org`;
      if (existingStaff.some((s) => s.email?.toLowerCase() === staffEmail.toLowerCase())) {
        staffEmail = `${sanitizedName}.${Date.now().toString().slice(-4)}@staffsync.org`;
      }
    } else if (existingStaff.some((s) => s.email?.toLowerCase() === staffEmail.toLowerCase())) {
      return res.status(400).json({ error: `Staff with Email "${staffEmail}" already exists.` });
    }

    const passwordHash = password ? await bcrypt.hash(password, 10) : await bcrypt.hash('staff123', 10);

    const newStaff = dbService.addStaff({
      organizationId: orgId,
      name: trimmedName,
      employeeId: empId,
      email: staffEmail,
      phone: phone || '',
      passwordHash,
      department: department || 'General',
      role: role || (admin.organizationType === 'industry' ? 'Technician' : 'Faculty'),
      subjects: Array.isArray(subjects) ? subjects : subjects ? subjects.split(',').map((s: string) => s.trim()) : [],
      classes: Array.isArray(classes) ? classes : classes ? classes.split(',').map((c: string) => c.trim()) : [],
      skills: Array.isArray(skills) ? skills : skills ? skills.split(',').map((sk: string) => sk.trim()) : [],
      certifications: Array.isArray(certifications)
        ? certifications
        : certifications
        ? certifications.split(',').map((c: string) => c.trim())
        : [],
      qualification: qualification || 'B.Tech / M.Sc',
      experience: experience || '2',
      workingDays: workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      availability: availability || [
        { day: 'Monday', available: true },
        { day: 'Tuesday', available: true },
        { day: 'Wednesday', available: true },
        { day: 'Thursday', available: true },
        { day: 'Friday', available: true },
      ],
      maxWorkload: Number(maxWorkload) || 24,
      maxWeeklyHours: Number(maxWeeklyHours) || 40,
      assignedLectures: 0,
      weeklyHours: 0,
      proxyCount: 0,
      status: status || 'active',
    });

    dbService.addAuditLog({
      actor: admin.name,
      action: 'ADD_STAFF',
      entity: 'Staff',
      entityId: newStaff.id,
      metadata: { name: newStaff.name, employeeId: newStaff.employeeId, role: newStaff.role },
    });

    emitToOrg(orgId, 'staff:created', newStaff);
    emitToOrg(orgId, 'dashboard:refresh', { type: 'staff_added' });

    res.status(201).json({ success: true, staff: sanitizeStaff(newStaff) });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

staffRouter.get('/staff/:id', (req, res) => {
  const staff = dbService.getStaffById(req.params.id);
  if (!staff) {
    return res.status(404).json({ error: 'Staff member not found.' });
  }
  res.json({ staff: sanitizeStaff(staff) });
});

staffRouter.put('/staff/:id', (req, res) => {
  try {
    const admin = resolveAdmin(req);
    const orgId = resolveOrgId(req);
    const existing = dbService.getStaffById(req.params.id);
    if (!existing || existing.organizationId !== orgId) {
      return res.status(404).json({ error: 'Staff member not found.' });
    }

    const updates: Record<string, any> = { ...req.body };

    if (updates.subjects !== undefined) {
      updates.subjects = Array.isArray(updates.subjects)
        ? updates.subjects
        : String(updates.subjects)
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
    }
    if (updates.skills !== undefined) {
      updates.skills = Array.isArray(updates.skills)
        ? updates.skills
        : String(updates.skills)
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
    }
    if (updates.classes !== undefined) {
      updates.classes = Array.isArray(updates.classes)
        ? updates.classes
        : String(updates.classes)
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
    }
    if (updates.certifications !== undefined) {
      updates.certifications = Array.isArray(updates.certifications)
        ? updates.certifications
        : String(updates.certifications)
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
    }

    if (updates.maxWorkload !== undefined) {
      updates.maxWorkload = Number(updates.maxWorkload) || 18;
    }
    if (updates.maxWeeklyHours !== undefined) {
      updates.maxWeeklyHours = Number(updates.maxWeeklyHours) || 40;
    }

    if (updates.name) updates.name = String(updates.name).trim();
    if (updates.employeeId) updates.employeeId = String(updates.employeeId).trim();
    if (updates.department) updates.department = String(updates.department).trim();
    if (updates.role) updates.role = String(updates.role).trim();
    if (updates.email) updates.email = String(updates.email).trim();

    const updated = dbService.updateStaff(req.params.id, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Staff member not found.' });
    }

    dbService.addAuditLog({
      actor: admin.name,
      action: 'UPDATE_STAFF',
      entity: 'Staff',
      entityId: updated.id,
      metadata: { name: updated.name, employeeId: updated.employeeId },
    });

    emitToOrg(orgId, 'staff:updated', updated);
    emitToStaff(updated.id, 'staff:updated', updated);
    emitToOrg(orgId, 'dashboard:refresh', { type: 'staff_updated' });

    res.json({ success: true, staff: sanitizeStaff(updated) });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

staffRouter.delete('/staff/:id', (req, res) => {
  try {
    const admin = resolveAdmin(req);
    const orgId = resolveOrgId(req);
    const staff = dbService.getStaffById(req.params.id);
    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found.' });
    }

    dbService.deleteStaff(req.params.id);

    dbService.addAuditLog({
      actor: admin.name,
      action: 'DELETE_STAFF',
      entity: 'Staff',
      entityId: req.params.id,
      metadata: { name: staff.name, employeeId: staff.employeeId },
    });

    emitToOrg(orgId, 'staff:deleted', { id: req.params.id });
    emitToOrg(orgId, 'dashboard:refresh', { type: 'staff_deleted' });

    res.json({ success: true, message: 'Staff member removed successfully.' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

staffRouter.get('/dashboard/faculty/:id', (req, res) => {
  try {
    const staff = dbService.getStaffById(req.params.id);
    if (!staff) {
      return res.status(404).json({ error: 'Faculty member not found.' });
    }

    const orgId = staff.organizationId;
    const today = new Date().toISOString().split('T')[0];
    const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    const allTimetable = dbService.getTimetable(orgId, staff.id);
    const todaySchedule = allTimetable.filter((t) => t.day?.toLowerCase() === dayName.toLowerCase());

    const attendance = dbService.getAttendance(orgId, today).find(
      (a) => a.staffId === staff.id || a.staffId === staff.employeeId
    );

    const staffIds = [staff.id, staff.staffId, staff.employeeId].filter(Boolean);
    const proxyRequests = dbService.getProxyRequests(orgId);
    const acceptedProxies = proxyRequests.filter(
      (p) => staffIds.includes(p.targetStaffId) && p.status === 'accepted'
    );

    const acceptedTodayProxies = acceptedProxies.filter(
      (p) => p.workDetails?.date === today || p.workDetails?.day?.toLowerCase() === dayName.toLowerCase()
    );

    const proxyLecturesToday = acceptedTodayProxies.map((p) => ({
      id: `proxy_${p.id}`,
      organizationId: orgId,
      facultyId: staff.id,
      facultyName: staff.name,
      subject: p.workDetails?.subject || p.workDetails?.role || 'Proxy Lecture',
      day: p.workDetails?.day || dayName,
      startTime: p.workDetails?.startTime || '09:00',
      endTime: p.workDetails?.endTime || '10:00',
      classGrade: p.workDetails?.classGrade || 'Grade 10',
      section: p.workDetails?.section || 'A',
      room: p.workDetails?.room || 'Room 101',
      isProxyDuty: true,
      absentStaffName: p.fromStaffName,
      proxyRequestId: p.id,
    }));

    const combinedTodaySchedule = [...todaySchedule, ...proxyLecturesToday].sort((a, b) =>
      (a.startTime || '').localeCompare(b.startTime || '')
    );

    const notifications = dbService.getNotifications(orgId, staff.id);
    const incomingExchanges = dbService
      .getExchanges(orgId)
      .filter((x) => x.targetFacultyId === staff.id && x.status === 'pending');
    const colleagues = dbService.getStaff(orgId).filter((s) => s.id !== staff.id && s.id !== staff.staffId);

    const allPeriods = ['09:00 - 10:00', '10:00 - 11:00', '11:15 - 12:15', '13:00 - 14:00', '14:00 - 15:00'];
    const occupiedPeriods = combinedTodaySchedule.map((s) => `${s.startTime} - ${s.endTime}`);
    const freePeriods = allPeriods.filter((p) => !occupiedPeriods.includes(p));

    res.json({
      faculty: sanitizeStaff(staff),
      today: {
        date: today,
        dayName,
        status: attendance?.status || 'present',
        schedule: combinedTodaySchedule,
        freePeriods,
      },
      weeklyTimetable: allTimetable,
      proxy: {
        received: proxyRequests.filter((p) => staffIds.includes(p.targetStaffId)),
        pending: proxyRequests.filter((p) => staffIds.includes(p.targetStaffId) && p.status === 'pending'),
        accepted: acceptedProxies,
        rejected: proxyRequests.filter((p) => staffIds.includes(p.targetStaffId) && p.status === 'rejected'),
      },
      acceptedProxyDuties: acceptedProxies,
      workload: {
        assignedWeeklyLectures: allTimetable.length + acceptedProxies.length,
        proxiesAccepted: acceptedProxies.length,
        maxCapacity: staff.maxWorkload || 24,
      },
      notifications: notifications.slice(0, 10),
      exchangeRequests: incomingExchanges,
      colleagues: colleagues.map(sanitizeStaff),
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

staffRouter.get('/dashboard/employee/:id', (req, res) => {
  try {
    const staff = dbService.getStaffById(req.params.id);
    if (!staff) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    const orgId = staff.organizationId;
    const today = new Date().toISOString().split('T')[0];
    const staffIds = [staff.id, staff.staffId, staff.employeeId].filter(Boolean);

    const allShifts = dbService.getShifts(orgId, staff.id);
    const todayShift = allShifts.find((s) => s.date === today);

    const attendance = dbService.getAttendance(orgId, today).find(
      (a) => a.staffId === staff.id || a.staffId === staff.employeeId
    );

    const replacementRequests = dbService.getProxyRequests(orgId);
    const userReplacementRequests = replacementRequests.filter((r) => staffIds.includes(r.targetStaffId));
    const acceptedProxies = userReplacementRequests.filter((r) => r.status === 'accepted');

    const todayProxyShift = acceptedProxies.find((p) => p.workDetails?.date === today);
    const effectiveTodayShift = todayShift
      ? todayShift
      : todayProxyShift
      ? {
          id: `proxy_shift_${todayProxyShift.id}`,
          organizationId: orgId,
          employeeId: staff.id,
          employeeName: staff.name,
          date: today,
          startTime: todayProxyShift.workDetails?.startTime || '08:00',
          endTime: todayProxyShift.workDetails?.endTime || '16:00',
          department: todayProxyShift.workDetails?.department || staff.department,
          role: todayProxyShift.workDetails?.role || 'Substitute',
          isProxyDuty: true,
          absentStaffName: todayProxyShift.fromStaffName,
          status: 'scheduled',
        }
      : null;

    const notifications = dbService.getNotifications(orgId, staff.id);

    const weeklyHours = allShifts.reduce((acc, curr) => {
      const [sh, sm] = (curr.startTime || '08:00').split(':').map(Number);
      const [eh, em] = (curr.endTime || '16:00').split(':').map(Number);
      const diff = (eh * 60 + em - (sh * 60 + sm)) / 60;
      return acc + Math.max(0, diff);
    }, 0);

    const maxWeeklyHours = staff.maxWeeklyHours || 40;
    const overtime = Math.max(0, weeklyHours - maxWeeklyHours);

    res.json({
      employee: sanitizeStaff(staff),
      today: {
        date: today,
        shift: effectiveTodayShift,
        status: attendance?.status || 'present',
      },
      upcomingShifts: allShifts.filter((s) => s.date >= today).slice(0, 7),
      acceptedProxyDuties: acceptedProxies,
      workload: {
        weeklyHours: Math.round(weeklyHours * 10) / 10,
        maxAllowed: maxWeeklyHours,
        overtime: Math.round(overtime * 10) / 10,
        remainingHours: Math.max(0, maxWeeklyHours - weeklyHours),
      },
      requests: {
        pending: userReplacementRequests.filter((r) => r.status === 'pending'),
        accepted: acceptedProxies,
        rejected: userReplacementRequests.filter((r) => r.status === 'rejected'),
      },
      notifications: notifications.slice(0, 10),
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});
