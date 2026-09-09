import { Router } from 'express';
import { dbService } from '../services/db.js';
import { replacementEngine } from '../engines/replacementEngine.js';
import { emitToOrg, emitToStaff } from '../sockets.js';
import { resolveAdmin, resolveOrgId } from '../utils/orgContext.js';

export const replacementRouter = Router();

replacementRouter.get('/replacements/gaps', (req, res) => {
  try {
    const admin = resolveAdmin(req);
    const orgId = resolveOrgId(req);
    const { status } = req.query;
    const gaps = dbService.getGaps(orgId, status as string);
    res.json({ gaps });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

replacementRouter.get('/replacements/gaps/:id', async (req, res) => {
  try {
    const gap = dbService.getGapById(req.params.id);
    if (!gap) {
      return res.status(404).json({ error: 'Staffing gap not found.' });
    }

    const evaluation = await replacementEngine.evaluateGap(gap.id || gap.gapId);
    res.json({ gap, evaluation });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

replacementRouter.post('/replacements/evaluate/:id', async (req, res) => {
  try {
    const result = await replacementEngine.evaluateGap(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

replacementRouter.post('/proxy', (req, res) => {
  try {
    const admin = resolveAdmin(req);
    const orgId = resolveOrgId(req);
    const { gapId, targetStaffId, matchScore, reasons } = req.body;

    if (!gapId || !targetStaffId) {
      return res.status(400).json({ error: 'gapId and targetStaffId are required.' });
    }

    const gap = dbService.getGapById(gapId);
    if (!gap) {
      return res.status(404).json({ error: 'Staffing gap not found.' });
    }

    const targetStaff = dbService.getStaffById(targetStaffId);
    if (!targetStaff) {
      return res.status(404).json({ error: 'Target staff member not found.' });
    }

    const proxyReq = dbService.addProxyRequest({
      organizationId: orgId,
      gapId: gap.id || gap.gapId,
      fromStaffId: gap.absentStaffId,
      fromStaffName: gap.absentStaffName,
      targetStaffId: targetStaff.id || targetStaff.staffId,
      targetStaffName: targetStaff.name,
      targetEmployeeId: targetStaff.employeeId,
      workDetails: {
        affectedType: gap.affectedType,
        subject: gap.subject,
        role: gap.role,
        classGrade: gap.classGrade,
        section: gap.section,
        room: gap.room,
        date: gap.date,
        day: gap.day,
        startTime: gap.startTime,
        endTime: gap.endTime,
      },
      matchScore: matchScore || 90,
      reasons: reasons || [],
      status: 'pending',
    });

    dbService.updateGap(gap.id || gap.gapId, {
      status: 'request_sent',
      assignedTargetStaffId: targetStaff.id || targetStaff.staffId,
      assignedTargetStaffName: targetStaff.name,
      proxyRequestId: proxyReq.id || proxyReq.proxyRequestId,
    });

    dbService.addNotification({
      organizationId: orgId,
      targetStaffId: targetStaff.id || targetStaff.staffId,
      type: 'proxy_request',
      title: `New Replacement Request: ${gap.subject || gap.role}`,
      message: `You have been requested to cover for ${gap.absentStaffName} on ${gap.date} (${gap.startTime} - ${gap.endTime}).`,
      metadata: { proxyRequestId: proxyReq.id || proxyReq.proxyRequestId, gapId: gap.id || gap.gapId },
    });

    dbService.addAuditLog({
      actor: admin.name,
      action: 'SEND_PROXY_REQUEST',
      entity: 'ProxyRequest',
      entityId: proxyReq.id || proxyReq.proxyRequestId,
      metadata: { targetStaff: targetStaff.name, work: gap.subject || gap.role, date: gap.date },
    });

    emitToOrg(orgId, 'proxy:created', proxyReq);
    emitToStaff(targetStaff.id || targetStaff.staffId, 'proxy:created', proxyReq);
    emitToOrg(orgId, 'staffing:gap-updated', { gapId: gap.id || gap.gapId, status: 'request_sent' });
    emitToOrg(orgId, 'dashboard:refresh', { type: 'proxy_request_sent' });

    res.status(201).json({ success: true, proxyRequest: proxyReq });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

replacementRouter.put('/proxy/:id/accept', (req, res) => {
  try {
    const proxyReq = dbService.getProxyRequestById(req.params.id);
    if (!proxyReq) {
      return res.status(404).json({ error: 'Proxy request not found.' });
    }

    const updatedProxy = dbService.updateProxyRequest(proxyReq.id || proxyReq.proxyRequestId, {
      status: 'accepted',
      respondedAt: new Date().toISOString(),
    });

    const gap = dbService.getGapById(proxyReq.gapId);
    if (gap) {
      dbService.updateGap(gap.id || gap.gapId, {
        status: 'resolved',
        resolvedByStaffId: proxyReq.targetStaffId,
        resolvedByStaffName: proxyReq.targetStaffName,
        resolvedAt: new Date().toISOString(),
      });
    }

    const targetStaff = dbService.getStaffById(proxyReq.targetStaffId);
    if (targetStaff) {
      dbService.updateStaff(targetStaff.id || targetStaff.staffId, {
        proxyCount: (targetStaff.proxyCount || 0) + 1,
        assignedLectures: (targetStaff.assignedLectures || 0) + 1,
      });
    }

    const fromStaff = dbService.getStaffById(proxyReq.fromStaffId);
    if (fromStaff) {
      dbService.updateStaff(fromStaff.id || fromStaff.staffId, {
        assignedLectures: Math.max(0, (fromStaff.assignedLectures || 1) - 1),
      });
    }

    // Reassign schedule slot in persistent DB so schedule board reflects the substitute
    const orgId = proxyReq.organizationId;
    if (proxyReq.workDetails?.affectedType === 'lecture' || proxyReq.workDetails?.subject) {
      const timetable = dbService.getTimetable(orgId);
      const matchingEntry = timetable.find(
        (t) =>
          (t.facultyId === proxyReq.fromStaffId || t.facultyName === proxyReq.fromStaffName) &&
          t.day?.toLowerCase() === (proxyReq.workDetails?.day || '').toLowerCase() &&
          t.startTime === proxyReq.workDetails?.startTime
      );
      if (matchingEntry) {
        dbService.updateTimetableEntry(matchingEntry.id, {
          facultyId: targetStaff?.id || targetStaff?.staffId || proxyReq.targetStaffId,
          facultyName: targetStaff?.name || proxyReq.targetStaffName,
          facultyEmployeeId: targetStaff?.employeeId || proxyReq.targetEmployeeId,
        });
        emitToOrg(orgId, 'timetable:updated', { id: matchingEntry.id });
      }
    } else {
      const shifts = dbService.getShifts(orgId, undefined, proxyReq.workDetails?.date);
      const matchingShift = shifts.find(
        (s) =>
          (s.employeeId === proxyReq.fromStaffId || s.employeeName === proxyReq.fromStaffName) &&
          s.startTime === proxyReq.workDetails?.startTime
      );
      if (matchingShift) {
        dbService.updateShift(matchingShift.id, {
          employeeId: targetStaff?.id || targetStaff?.staffId || proxyReq.targetStaffId,
          employeeName: targetStaff?.name || proxyReq.targetStaffName,
          employeeCustomId: targetStaff?.employeeId || proxyReq.targetEmployeeId,
        });
        emitToOrg(orgId, 'shifts:updated', { id: matchingShift.id });
      }
    }

    dbService.addNotification({
      organizationId: proxyReq.organizationId,
      type: 'request_accepted',
      title: `Proxy Request Accepted`,
      message: `${proxyReq.targetStaffName} accepted replacement for ${proxyReq.workDetails?.subject || 'work'} on ${proxyReq.workDetails?.date}.`,
      metadata: { proxyRequestId: proxyReq.id || proxyReq.proxyRequestId },
    });

    dbService.addNotification({
      organizationId: proxyReq.organizationId,
      targetStaffId: proxyReq.fromStaffId,
      type: 'request_accepted',
      title: `Lecture Reassigned`,
      message: `Your scheduled lecture (${proxyReq.workDetails?.subject}) has been covered by ${proxyReq.targetStaffName}.`,
      metadata: { proxyRequestId: proxyReq.id || proxyReq.proxyRequestId },
    });

    dbService.addAuditLog({
      actor: proxyReq.targetStaffName,
      action: 'ACCEPT_PROXY_REQUEST',
      entity: 'ProxyRequest',
      entityId: proxyReq.id || proxyReq.proxyRequestId,
      metadata: {
        targetStaff: proxyReq.targetStaffName,
        forStaff: proxyReq.fromStaffName,
        subject: proxyReq.workDetails?.subject,
      },
    });

    emitToOrg(proxyReq.organizationId, 'proxy:accepted', updatedProxy);
    emitToStaff(proxyReq.targetStaffId, 'proxy:accepted', updatedProxy);
    emitToStaff(proxyReq.fromStaffId, 'proxy:accepted', updatedProxy);
    emitToOrg(proxyReq.organizationId, 'staffing:gap-updated', { gapId: gap?.id || gap?.gapId, status: 'resolved' });
    emitToOrg(proxyReq.organizationId, 'dashboard:refresh', { type: 'proxy_accepted' });

    res.json({ success: true, proxyRequest: updatedProxy });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

replacementRouter.put('/proxy/:id/reject', (req, res) => {
  try {
    const proxyReq = dbService.getProxyRequestById(req.params.id);
    if (!proxyReq) {
      return res.status(404).json({ error: 'Proxy request not found.' });
    }

    const updatedProxy = dbService.updateProxyRequest(proxyReq.id || proxyReq.proxyRequestId, {
      status: 'rejected',
      respondedAt: new Date().toISOString(),
    });

    const gap = dbService.getGapById(proxyReq.gapId);
    if (gap) {
      dbService.updateGap(gap.id || gap.gapId, {
        status: 'candidates_found',
      });
    }

    dbService.addNotification({
      organizationId: proxyReq.organizationId,
      type: 'request_rejected',
      title: `Proxy Request Declined`,
      message: `${proxyReq.targetStaffName} declined the replacement request for ${proxyReq.workDetails?.subject || 'work'}.`,
      metadata: { proxyRequestId: proxyReq.id || proxyReq.proxyRequestId },
    });

    dbService.addAuditLog({
      actor: proxyReq.targetStaffName,
      action: 'REJECT_PROXY_REQUEST',
      entity: 'ProxyRequest',
      entityId: proxyReq.id || proxyReq.proxyRequestId,
      metadata: { targetStaff: proxyReq.targetStaffName },
    });

    emitToOrg(proxyReq.organizationId, 'proxy:rejected', updatedProxy);
    emitToStaff(proxyReq.targetStaffId, 'proxy:rejected', updatedProxy);
    emitToOrg(proxyReq.organizationId, 'staffing:gap-updated', { gapId: gap?.id || gap?.gapId, status: 'candidates_found' });
    emitToOrg(proxyReq.organizationId, 'dashboard:refresh', { type: 'proxy_rejected' });

    res.json({ success: true, proxyRequest: updatedProxy });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});
