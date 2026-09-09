import { Router } from 'express';
import { dbService } from '../services/db.js';
import { emitToOrg, emitToStaff } from '../sockets.js';
import { resolveAdmin, resolveOrgId, sanitizeStaff } from '../utils/orgContext.js';

export const timetableRouter = Router();

timetableRouter.get('/timetable/today', (req, res) => {
  try {
    const admin = resolveAdmin(req);
    const orgId = resolveOrgId(req);
    const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const date = new Date().toISOString().split('T')[0];
    const lectures = dbService
      .getTimetable(orgId)
      .filter((t) => t.day?.toLowerCase() === dayName.toLowerCase())
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

    res.json({
      date,
      day: dayName,
      lectures: lectures.map((l) => ({ ...l, faculty: sanitizeStaff(dbService.getStaffById(l.facultyId)) })),
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

timetableRouter.get('/timetable', (req, res) => {
  try {
    const admin = resolveAdmin(req);
    const orgId = resolveOrgId(req);
    const { facultyId, day } = req.query;
    let list = dbService.getTimetable(orgId, facultyId as string);
    if (day && day !== 'all') {
      list = list.filter((t) => t.day?.toLowerCase() === (day as string).toLowerCase());
    }
    res.json({ timetable: list });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

function timeOverlaps(start1: string, end1: string, start2: string, end2: string): boolean {
  const toMinutes = (t: string) => {
    const [h, m] = (t || '00:00').split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };
  const s1 = toMinutes(start1);
  const e1 = toMinutes(end1);
  const s2 = toMinutes(start2);
  const e2 = toMinutes(end2);
  return Math.max(s1, s2) < Math.min(e1, e2);
}

timetableRouter.post('/timetable', (req, res) => {
  try {
    const admin = resolveAdmin(req);
    const orgId = resolveOrgId(req);
    const { facultyId, facultyName, subject, day, startTime, endTime, classGrade, section, room, department } = req.body;

    if (!subject || !String(subject).trim()) {
      return res.status(400).json({ error: 'Subject / Course title is required.' });
    }
    if (!day) {
      return res.status(400).json({ error: 'Day of the week is required.' });
    }
    if (!startTime || !endTime) {
      return res.status(400).json({ error: 'Both start time and end time are required.' });
    }
    if (startTime >= endTime) {
      return res.status(400).json({ error: 'End time must be later than start time.' });
    }

    let faculty = null;
    if (facultyId && facultyId !== 'unassigned') {
      faculty = dbService.getStaffById(facultyId);
    }
    if (!faculty && facultyName && String(facultyName).trim() && String(facultyName).trim().toLowerCase() !== 'unassigned') {
      faculty = dbService.getStaffById(String(facultyName).trim());
      if (!faculty) {
        const fName = String(facultyName).trim();
        faculty = dbService.addStaff({
          organizationId: orgId,
          name: fName,
          employeeId: `FAC-${Date.now().toString().slice(-4)}`,
          email: `${fName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'faculty'}@staffsync.org`,
          department: department || 'General',
          role: 'Faculty Member',
          subjects: [subject],
          qualification: 'B.Tech / M.Sc',
          experience: '3',
          maxWorkload: 18,
          status: 'active',
        });
      }
    }

    if (faculty) {
      const existingLectures = dbService
        .getTimetable(orgId, faculty.id || faculty.staffId)
        .filter((t) => t.day?.toLowerCase() === day.toLowerCase());

      for (const lec of existingLectures) {
        if (timeOverlaps(startTime, endTime, lec.startTime, lec.endTime)) {
          return res.status(400).json({
            error: `Timetable conflict: ${faculty.name} is already scheduled for "${lec.subject}" (${lec.startTime} - ${lec.endTime}) on ${day}.`,
          });
        }
      }
    }

    if (room && String(room).trim() && String(room).trim().toLowerCase() !== 'tba') {
      const roomConflict = dbService
        .getTimetable(orgId)
        .find(
          (t) =>
            t.day?.toLowerCase() === day.toLowerCase() &&
            t.room?.toLowerCase() === String(room).trim().toLowerCase() &&
            timeOverlaps(startTime, endTime, t.startTime, t.endTime)
        );
      if (roomConflict) {
        return res.status(400).json({
          error: `Room conflict: "${room}" is already occupied by "${roomConflict.subject}" (${roomConflict.startTime} - ${roomConflict.endTime}) on ${day}.`,
        });
      }
    }

    const entry = dbService.addTimetableEntry({
      organizationId: orgId,
      facultyId: faculty ? (faculty.id || faculty.staffId) : 'unassigned',
      facultyName: faculty ? faculty.name : (facultyName ? String(facultyName).trim() : 'Unassigned / TBA'),
      facultyEmployeeId: faculty ? faculty.employeeId : '',
      subject: String(subject).trim(),
      day,
      startTime,
      endTime,
      classGrade: classGrade || 'Grade 10',
      section: section || 'A',
      room: room || 'Room 101',
    });

    if (faculty) {
      const totalFacultyLectures = dbService.getTimetable(orgId, faculty.id || faculty.staffId).length;
      dbService.updateStaff(faculty.id || faculty.staffId, { assignedLectures: totalFacultyLectures });
    }

    dbService.addAuditLog({
      actor: admin.name,
      action: 'ADD_TIMETABLE_ENTRY',
      entity: 'Timetable',
      entityId: entry.id || entry.timetableId,
      metadata: { facultyName: entry.facultyName, subject, day, time: `${startTime}-${endTime}` },
    });

    emitToOrg(orgId, 'timetable:updated', entry);
    emitToOrg(orgId, 'dashboard:refresh', { type: 'timetable_added' });

    res.status(201).json({ success: true, timetable: entry });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

timetableRouter.post('/timetable/seed', (req, res) => {
  try {
    const admin = resolveAdmin(req);
    const orgId = resolveOrgId(req);
    let staffList = dbService.getStaff(orgId);

    if (staffList.length === 0) {
      const defaultFaculty = [
        { name: 'Dr. Robert Vance', role: 'Professor', department: 'Computer Science', subjects: ['Data Structures', 'Algorithms'], empId: 'FAC-101' },
        { name: 'Prof. Sarah Jenkins', role: 'Associate Professor', department: 'Computer Science', subjects: ['Operating Systems', 'DBMS'], empId: 'FAC-102' },
        { name: 'Dr. Michael Chang', role: 'Assistant Professor', department: 'Information Tech', subjects: ['Computer Networks', 'Cloud Computing'], empId: 'FAC-103' },
      ];
      for (const f of defaultFaculty) {
        const added = dbService.addStaff({
          organizationId: orgId,
          name: f.name,
          employeeId: f.empId,
          email: `${f.name.toLowerCase().replace(/[^a-z]/g, '')}@staffsync.org`,
          department: f.department,
          role: f.role,
          subjects: f.subjects,
          qualification: 'Ph.D in Computer Science',
          experience: '6',
          status: 'active',
        });
        staffList.push(added);
      }
    }

    const sampleLectures = [
      { day: 'Monday', startTime: '09:00', endTime: '10:00', subject: 'Data Structures', room: 'Hall A', classGrade: 'Year 2', section: 'A', facultyIdx: 0 },
      { day: 'Monday', startTime: '10:15', endTime: '11:15', subject: 'Operating Systems', room: 'Lab 2', classGrade: 'Year 2', section: 'A', facultyIdx: 1 },
      { day: 'Monday', startTime: '11:30', endTime: '12:30', subject: 'Computer Networks', room: 'Room 304', classGrade: 'Year 3', section: 'B', facultyIdx: 2 },
      { day: 'Tuesday', startTime: '09:00', endTime: '10:00', subject: 'DBMS Lab', room: 'CS Lab 1', classGrade: 'Year 2', section: 'B', facultyIdx: 1 },
      { day: 'Tuesday', startTime: '10:15', endTime: '11:15', subject: 'Algorithms Analysis', room: 'Hall B', classGrade: 'Year 3', section: 'A', facultyIdx: 0 },
      { day: 'Wednesday', startTime: '09:00', endTime: '10:00', subject: 'Cloud Computing', room: 'Room 201', classGrade: 'Year 4', section: 'A', facultyIdx: 2 },
      { day: 'Wednesday', startTime: '10:15', endTime: '11:15', subject: 'Advanced Algorithms', room: 'Hall A', classGrade: 'Year 3', section: 'A', facultyIdx: 0 },
      { day: 'Thursday', startTime: '09:00', endTime: '10:00', subject: 'System Design', room: 'Room 105', classGrade: 'Year 4', section: 'B', facultyIdx: 1 },
      { day: 'Friday', startTime: '10:00', endTime: '11:00', subject: 'Network Security', room: 'Lab 3', classGrade: 'Year 4', section: 'A', facultyIdx: 2 },
    ];

    const addedEntries: any[] = [];
    for (const item of sampleLectures) {
      const assignedFaculty = staffList[item.facultyIdx % staffList.length];
      const entry = dbService.addTimetableEntry({
        organizationId: orgId,
        facultyId: assignedFaculty.id || assignedFaculty.staffId,
        facultyName: assignedFaculty.name,
        facultyEmployeeId: assignedFaculty.employeeId,
        subject: item.subject,
        day: item.day,
        startTime: item.startTime,
        endTime: item.endTime,
        room: item.room,
        classGrade: item.classGrade,
        section: item.section,
      });
      addedEntries.push(entry);
    }

    emitToOrg(orgId, 'timetable:updated', { type: 'seed' });
    emitToOrg(orgId, 'dashboard:refresh', { type: 'timetable_seeded' });

    res.json({ success: true, count: addedEntries.length, entries: addedEntries });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

timetableRouter.put('/timetable/:id', (req, res) => {
  try {
    const admin = resolveAdmin(req);
    const orgId = resolveOrgId(req);
    const existing = dbService.getTimetableEntryById(req.params.id);
    if (!existing || existing.organizationId !== orgId) {
      return res.status(404).json({ error: 'Timetable entry not found.' });
    }

    const { facultyId, facultyName, subject, day, startTime, endTime, classGrade, section, room, department } = req.body;

    const newSubject = subject !== undefined ? String(subject).trim() : existing.subject;
    const newDay = day !== undefined ? day : existing.day;
    const newStartTime = startTime !== undefined ? startTime : existing.startTime;
    const newEndTime = endTime !== undefined ? endTime : existing.endTime;

    if (!newSubject) {
      return res.status(400).json({ error: 'Subject / Course title is required.' });
    }
    if (!newDay) {
      return res.status(400).json({ error: 'Day of the week is required.' });
    }
    if (!newStartTime || !newEndTime) {
      return res.status(400).json({ error: 'Both start time and end time are required.' });
    }
    if (newStartTime >= newEndTime) {
      return res.status(400).json({ error: 'End time must be later than start time.' });
    }

    let faculty = null;
    let targetFacultyId = facultyId !== undefined ? facultyId : existing.facultyId;
    let targetFacultyName = facultyName !== undefined ? String(facultyName).trim() : existing.facultyName;

    if (targetFacultyId && targetFacultyId !== 'unassigned') {
      faculty = dbService.getStaffById(targetFacultyId);
    }
    if (!faculty && targetFacultyName && targetFacultyName.toLowerCase() !== 'unassigned' && targetFacultyName.toLowerCase() !== 'unassigned / tba') {
      faculty = dbService.getStaffById(targetFacultyName);
      if (!faculty && facultyName) {
        faculty = dbService.addStaff({
          organizationId: orgId,
          name: targetFacultyName,
          employeeId: `FAC-${Date.now().toString().slice(-4)}`,
          email: `${targetFacultyName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'faculty'}@staffsync.org`,
          department: department || 'General',
          role: 'Faculty Member',
          subjects: [newSubject],
          qualification: 'B.Tech / M.Sc',
          experience: '3',
          maxWorkload: 18,
          status: 'active',
        });
      }
    }

    const currentId = existing.id || existing.timetableId;

    if (faculty) {
      const existingLectures = dbService
        .getTimetable(orgId, faculty.id || faculty.staffId)
        .filter((t) => (t.id || t.timetableId) !== currentId && t.day?.toLowerCase() === newDay.toLowerCase());

      for (const lec of existingLectures) {
        if (timeOverlaps(newStartTime, newEndTime, lec.startTime, lec.endTime)) {
          return res.status(400).json({
            error: `Timetable conflict: ${faculty.name} is already scheduled for "${lec.subject}" (${lec.startTime} - ${lec.endTime}) on ${newDay}.`,
          });
        }
      }
    }

    const targetRoom = room !== undefined ? String(room).trim() : existing.room;
    if (targetRoom && targetRoom.toLowerCase() !== 'tba') {
      const roomConflict = dbService
        .getTimetable(orgId)
        .find(
          (t) =>
            (t.id || t.timetableId) !== currentId &&
            t.day?.toLowerCase() === newDay.toLowerCase() &&
            t.room?.toLowerCase() === targetRoom.toLowerCase() &&
            timeOverlaps(newStartTime, newEndTime, t.startTime, t.endTime)
        );
      if (roomConflict) {
        return res.status(400).json({
          error: `Room conflict: "${targetRoom}" is already occupied by "${roomConflict.subject}" (${roomConflict.startTime} - ${roomConflict.endTime}) on ${newDay}.`,
        });
      }
    }

    const oldFacultyId = existing.facultyId;

    const updated = dbService.updateTimetableEntry(currentId, {
      facultyId: faculty ? (faculty.id || faculty.staffId) : (targetFacultyId === 'unassigned' ? 'unassigned' : targetFacultyId || 'unassigned'),
      facultyName: faculty ? faculty.name : (targetFacultyName || 'Unassigned / TBA'),
      facultyEmployeeId: faculty ? faculty.employeeId : (existing.facultyEmployeeId || ''),
      subject: newSubject,
      day: newDay,
      startTime: newStartTime,
      endTime: newEndTime,
      classGrade: classGrade !== undefined ? classGrade : existing.classGrade,
      section: section !== undefined ? section : existing.section,
      room: targetRoom || existing.room,
    });

    const newFid = updated?.facultyId;
    if (oldFacultyId && oldFacultyId !== 'unassigned') {
      const total = dbService.getTimetable(orgId, oldFacultyId).length;
      dbService.updateStaff(oldFacultyId, { assignedLectures: total });
    }
    if (newFid && newFid !== 'unassigned' && newFid !== oldFacultyId) {
      const total = dbService.getTimetable(orgId, newFid).length;
      dbService.updateStaff(newFid, { assignedLectures: total });
    }

    dbService.addAuditLog({
      actor: admin.name,
      action: 'UPDATE_TIMETABLE_ENTRY',
      entity: 'Timetable',
      entityId: currentId,
      metadata: { subject: updated?.subject, day: updated?.day, time: `${updated?.startTime}-${updated?.endTime}` },
    });

    emitToOrg(orgId, 'timetable:updated', updated);
    emitToOrg(orgId, 'dashboard:refresh', { type: 'timetable_updated' });
    res.json({ success: true, timetable: updated });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

timetableRouter.delete('/timetable/:id', (req, res) => {
  try {
    const admin = resolveAdmin(req);
    const orgId = resolveOrgId(req);
    dbService.deleteTimetableEntry(req.params.id);
    emitToOrg(orgId, 'timetable:updated', { id: req.params.id });
    emitToOrg(orgId, 'dashboard:refresh', { type: 'timetable_deleted' });
    res.json({ success: true, message: 'Timetable entry deleted.' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ──────────────────────────────────────────────
// Lecture Exchange (swap two faculty slots)
// ──────────────────────────────────────────────
timetableRouter.post('/timetable/exchange', (req, res) => {
  try {
    const admin = resolveAdmin(req);
    const orgId = resolveOrgId(req);
    const { sourceTimetableId, targetFacultyId, note } = req.body;

    if (!sourceTimetableId || !targetFacultyId) {
      return res.status(400).json({ error: 'sourceTimetableId and targetFacultyId are required.' });
    }

    const source = dbService.getTimetableEntryById(sourceTimetableId);
    if (!source || source.organizationId !== orgId) {
      return res.status(404).json({ error: 'Lecture slot not found in this organization.' });
    }

    const targetStaff = dbService.getStaffById(targetFacultyId);
    if (!targetStaff || targetStaff.organizationId !== orgId) {
      return res.status(404).json({ error: 'Target faculty member not found.' });
    }
    if (targetStaff.id === source.facultyId) {
      return res.status(400).json({ error: 'You cannot exchange a lecture with yourself.' });
    }

    const targetCandidates = dbService.getTimetable(orgId, targetStaff.id);
    if (targetCandidates.length === 0) {
      return res.status(400).json({
        error: `${targetStaff.name} has no lecture slots to exchange right now.`,
      });
    }

    const toMinutes = (t: string) => {
      const [h, m] = (t || '0').split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    };
    const overlap = (a: any, b: any) =>
      Math.max(0, Math.min(toMinutes(a.endTime), toMinutes(b.endTime)) - Math.max(toMinutes(a.startTime), toMinutes(b.startTime)));

    const sameDay = targetCandidates.filter((t) => t.day?.toLowerCase() === (source.day || '').toLowerCase());
    const pool = sameDay.length > 0 ? sameDay : targetCandidates;
    const targetSlot = pool.sort((a, b) =>
      sameDay.length > 0 ? overlap(source, b) - overlap(source, a) : Math.abs(toMinutes(a.startTime) - toMinutes(source.startTime)) - Math.abs(toMinutes(b.startTime) - toMinutes(source.startTime))
    )[0];

    const exchange = dbService.addExchangeRequest({
      organizationId: orgId,
      sourceTimetableId: source.id || source.timetableId,
      sourceFacultyId: source.facultyId,
      sourceFacultyName: source.facultyName,
      targetTimetableId: targetSlot.id || targetSlot.timetableId,
      targetFacultyId: targetStaff.id || targetStaff.staffId,
      targetFacultyName: targetStaff.name,
      day: source.day,
      startTime: source.startTime,
      endTime: source.endTime,
      subject: source.subject,
      note: note || '',
      status: 'pending',
    });

    dbService.addNotification({
      organizationId: orgId,
      targetStaffId: targetStaff.id || targetStaff.staffId,
      type: 'exchange_request',
      title: `Lecture Exchange Proposal: ${source.subject}`,
      message: `${source.facultyName} wants to exchange "${source.subject}" (${source.day} ${source.startTime} - ${source.endTime}) with your slot "${targetSlot.subject}".`,
      metadata: { exchangeId: exchange.id || exchange.exchangeId },
    });

    dbService.addAuditLog({
      actor: source.facultyName,
      action: 'PROPOSE_LECTURE_EXCHANGE',
      entity: 'Timetable',
      entityId: exchange.id || exchange.exchangeId,
      metadata: { subject: source.subject, day: source.day, target: targetStaff.name },
    });

    emitToOrg(orgId, 'timetable:updated', { type: 'exchange', exchangeId: exchange.id });
    emitToOrg(orgId, 'dashboard:refresh', { type: 'exchange_requested' });
    emitToStaff(targetStaff.id || targetStaff.staffId, 'exchange:requested', exchange);

    res.status(201).json({ success: true, exchange });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

timetableRouter.put('/timetable/exchange/:id/accept', (req, res) => {
  try {
    const admin = resolveAdmin(req);
    const orgId = resolveOrgId(req);
    const exchange = dbService.getExchangeById(req.params.id);
    if (!exchange) return res.status(404).json({ error: 'Exchange request not found.' });
    if (exchange.status !== 'pending') {
      return res.status(400).json({ error: 'This exchange request is no longer pending.' });
    }

    const source = dbService.getTimetableEntryById(exchange.sourceTimetableId);
    const targetSlot = dbService.getTimetableEntryById(exchange.targetTimetableId);
    if (!source && !targetSlot) {
      return res.status(404).json({ error: 'Lecture slots no longer exist.' });
    }

    const sw = (a: any, b: any) => {
      if (!a || !b) return;
      const aFid = a.facultyId, aFname = a.facultyName, aFemp = a.facultyEmployeeId;
      dbService.updateTimetableEntry(a.id || a.timetableId, {
        facultyId: b.facultyId,
        facultyName: b.facultyName,
        facultyEmployeeId: b.facultyEmployeeId,
      });
      dbService.updateTimetableEntry(b.id || b.timetableId, {
        facultyId: aFid,
        facultyName: aFname,
        facultyEmployeeId: aFemp,
      });
    };
    sw(source, targetSlot);

    const recalc = (fid: string) => {
      if (!fid) return;
      const total = dbService.getTimetable(orgId, fid).length;
      dbService.updateStaff(fid, { assignedLectures: total });
    };
    recalc(source?.facultyId);
    recalc(targetSlot?.facultyId);

    const updated = dbService.updateExchangeRequest(req.params.id, {
      status: 'accepted',
      respondedAt: new Date().toISOString(),
    });

    dbService.addNotification({
      organizationId: orgId,
      targetStaffId: exchange.sourceFacultyId,
      type: 'exchange_accepted',
      title: 'Lecture Exchange Accepted',
      message: `${exchange.targetFacultyName} accepted the exchange. "${exchange.subject}" (${exchange.day} ${exchange.startTime} - ${exchange.endTime}) is now covered.`,
      metadata: { exchangeId: exchange.id || exchange.exchangeId },
    });

    dbService.addAuditLog({
      actor: exchange.targetFacultyName,
      action: 'ACCEPT_LECTURE_EXCHANGE',
      entity: 'Timetable',
      entityId: exchange.id || exchange.exchangeId,
      metadata: { subject: exchange.subject, day: exchange.day },
    });

    emitToOrg(orgId, 'timetable:updated', { type: 'exchange', exchangeId: exchange.id });
    emitToOrg(orgId, 'dashboard:refresh', { type: 'exchange_accepted' });
    emitToStaff(exchange.sourceFacultyId, 'exchange:accepted', updated);
    emitToStaff(exchange.targetFacultyId, 'exchange:accepted', updated);

    res.json({ success: true, exchange: updated });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

timetableRouter.put('/timetable/exchange/:id/reject', (req, res) => {
  try {
    const admin = resolveAdmin(req);
    const orgId = resolveOrgId(req);
    const exchange = dbService.getExchangeById(req.params.id);
    if (!exchange) return res.status(404).json({ error: 'Exchange request not found.' });
    if (exchange.status !== 'pending') {
      return res.status(400).json({ error: 'This exchange request is no longer pending.' });
    }

    const updated = dbService.updateExchangeRequest(req.params.id, {
      status: 'rejected',
      respondedAt: new Date().toISOString(),
    });

    dbService.addNotification({
      organizationId: orgId,
      targetStaffId: exchange.sourceFacultyId,
      type: 'exchange_rejected',
      title: 'Lecture Exchange Declined',
      message: `${exchange.targetFacultyName} declined the exchange for "${exchange.subject}" on ${exchange.day}.`,
      metadata: { exchangeId: exchange.id || exchange.exchangeId },
    });

    emitToOrg(orgId, 'timetable:updated', { type: 'exchange', exchangeId: exchange.id });
    emitToOrg(orgId, 'dashboard:refresh', { type: 'exchange_rejected' });

    res.json({ success: true, exchange: updated });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});
