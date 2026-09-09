import { Router } from 'express';
import { dbService } from '../services/db.js';
import { resolveAdmin, resolveOrgId } from '../utils/orgContext.js';

export const notificationRouter = Router();

notificationRouter.get('/notifications', (req, res) => {
  try {
    const admin = resolveAdmin(req);
    const orgId = resolveOrgId(req);
    const { staffId } = req.query;
    const list = dbService.getNotifications(orgId, staffId as string);
    res.json({ notifications: list });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

notificationRouter.put('/notifications/:id/read', (req, res) => {
  try {
    const updated = dbService.markNotificationRead(req.params.id);
    res.json({ success: true, notification: updated });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

notificationRouter.put('/notifications/read-all', (req, res) => {
  try {
    const admin = resolveAdmin(req);
    const orgId = resolveOrgId(req);
    const { staffId } = req.body;
    dbService.markAllNotificationsRead(orgId, staffId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});
