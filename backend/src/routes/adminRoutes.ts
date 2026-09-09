import { Router } from 'express';
import { dbService } from '../services/db.js';
import { askStaffSyncAssistant } from '../services/geminiAssistant.js';
import { emitToOrg } from '../sockets.js';
import { resolveAdmin, resolveOrgId } from '../utils/orgContext.js';

export const adminRouter = Router();

adminRouter.get('/dashboard/admin', (req, res) => {
  try {
    const headerOrgId = (req.headers['x-organization-id'] as string) || (req.query.orgId as string);
    const admin = resolveAdmin(req);
    const orgId = headerOrgId || admin.organizationId || 'org_school_01';
    const org = dbService.getOrganization(orgId);
    const staff = dbService.getStaff(orgId);
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = dbService.getAttendance(orgId, today);
    const timetable = dbService.getTimetable(orgId);
    const shifts = dbService.getShifts(orgId, undefined, today);
    const gaps = dbService.getGaps(orgId);
    const proxyRequests = dbService.getProxyRequests(orgId);
    const auditLogs = dbService.getAuditLogs(orgId, 15);
    const settings = dbService.getSettings();

    const presentCount = todayAttendance.filter((a) => a.status === 'present').length;
    const absentCount = todayAttendance.filter((a) => a.status === 'absent').length;
    const onLeaveCount = todayAttendance.filter((a) => a.status === 'on_leave').length;
    const lateCount = todayAttendance.filter((a) => a.status === 'late').length;

    const activeGaps = gaps.filter((g) => g.status !== 'resolved' && g.status !== 'accepted');
    const resolvedGaps = gaps.filter((g) => g.status === 'resolved' || g.status === 'accepted');

    const exchanges = dbService.getExchanges(orgId);
    const pendingProxies = proxyRequests.filter((p) => p.status === 'pending');
    const pendingExchanges = exchanges.filter((e) => e.status === 'pending');
    const acceptedProxies = proxyRequests.filter((p) => p.status === 'accepted');

    const todayDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const todayLectures = timetable.filter((t) => t.day?.toLowerCase() === todayDayName.toLowerCase());

    res.json({
      admin: {
        ...admin,
        organizationId: orgId,
        organizationType: org?.type || admin.organizationType || 'school',
      },
      organization: org,
      stats: {
        totalStaff: staff.length,
        presentToday: presentCount,
        absentToday: absentCount,
        onLeaveToday: onLeaveCount,
        lateToday: lateCount,
        activeGapsCount: activeGaps.length,
        resolvedGapsCount: resolvedGaps.length,
        pendingProxyCount: pendingProxies.length,
        pendingExchangeCount: pendingExchanges.length,
        totalPendingRequestsCount: pendingProxies.length + pendingExchanges.length,
        acceptedProxyCount: acceptedProxies.length,
        todayLecturesCount: todayLectures.length,
        todayShiftsCount: shifts.length,
      },
      activeGaps: activeGaps.slice(0, 5),
      recentProxyRequests: proxyRequests.slice(0, 6),
      recentExchangeRequests: exchanges.slice(0, 6),
      recentLogs: auditLogs,
      settings,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

adminRouter.get('/admin/info', (req, res) => {
  const headerOrgId = (req.headers['x-organization-id'] as string) || (req.query.orgId as string);
  const admin = resolveAdmin(req);
  const orgId = headerOrgId || admin.organizationId || 'org_school_01';
  const org = dbService.getOrganization(orgId);
  res.json({
    admin: {
      ...admin,
      organizationId: orgId,
      organizationType: org?.type || admin.organizationType || 'school',
    },
    organization: org,
    dbStatus: dbService.getStatus(),
  });
});

adminRouter.post('/admin/org', (req, res) => {
  try {
    const { name, type, address, contactEmail, contactPhone, workingDays, workingHours, timezone } = req.body;
    if (!name || !type) {
      return res.status(400).json({ error: 'Organization name and type (school, college, industry) are required.' });
    }

    const admin = resolveAdmin(req);
    const orgId = admin.organizationId || `org_${Date.now()}`;
    const newOrg = {
      id: orgId,
      orgId,
      name,
      type,
      address: address || '',
      contactEmail: contactEmail || admin.email,
      contactPhone: contactPhone || '',
      workingDays: workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      workingHours: workingHours || { start: '08:00', end: '17:00' },
      timezone: timezone || 'UTC+05:30',
    };

    dbService.saveOrganization(newOrg);
    dbService.updateAdmin({ organizationId: orgId, organizationType: type });

    dbService.addAuditLog({
      actor: admin.name,
      action: 'UPDATE_ORGANIZATION',
      entity: 'Organization',
      entityId: orgId,
      metadata: { name, type },
    });

    emitToOrg(orgId, 'dashboard:refresh', { type: 'org_updated' });
    res.json({ success: true, organization: newOrg });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

adminRouter.get('/audit-logs', (req, res) => {
  const admin = resolveAdmin(req);
  const orgId = resolveOrgId(req);
  const logs = dbService.getAuditLogs(orgId);
  res.json({ logs });
});

adminRouter.post('/ai/ask', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query is required.' });
    }
    const admin = resolveAdmin(req);
    const orgId = resolveOrgId(req);
    const answer = await askStaffSyncAssistant(orgId, query);
    res.json({ answer });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

adminRouter.get('/settings', (req, res) => {
  res.json({ settings: dbService.getSettings() });
});

adminRouter.put('/settings', (req, res) => {
  try {
    const updated = dbService.updateSettings(req.body);
    const admin = resolveAdmin(req);
    dbService.addAuditLog({
      actor: admin.name,
      action: 'UPDATE_SETTINGS',
      entity: 'Settings',
      entityId: 'scoring_weights',
      metadata: req.body,
    });
    res.json({ success: true, settings: updated });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

adminRouter.get('/database/status', (req, res) => {
  res.json(dbService.getStatus());
});

adminRouter.post('/database/sync', async (_req, res) => {
  try {
    await dbService.syncFromMongo();
    res.json({ success: true, ...dbService.getStatus() });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

adminRouter.post('/database/connect', async (req, res) => {
  const { uri } = req.body;
  if (!uri) return res.status(400).json({ error: 'MongoDB connection string URI is required.' });
  const result = await dbService.connectMongo(uri);
  res.json(result);
});
