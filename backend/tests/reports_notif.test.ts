import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

describe('Notifications & Analytics Reports API Endpoints', () => {
  let notificationId: string = '';

  it('GET /api/notifications - should return notification list', async () => {
    const res = await request(app).get('/api/notifications');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.notifications)).toBe(true);

    if (res.body.notifications.length > 0) {
      notificationId = res.body.notifications[0].id || res.body.notifications[0].notificationId;
    }
  });

  it('PUT /api/notifications/:id/read - should mark single notification read', async () => {
    if (!notificationId) return;
    const res = await request(app).put(`/api/notifications/${notificationId}/read`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('PUT /api/notifications/read-all - should mark all notifications read', async () => {
    const res = await request(app).put('/api/notifications/read-all').send({});
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /api/reports - should return overall analytics report summary', async () => {
    const res = await request(app).get('/api/reports');
    expect(res.status).toBe(200);
    expect(res.body.summary).toBeDefined();
    expect(Array.isArray(res.body.departmentStats)).toBe(true);
    expect(Array.isArray(res.body.attendanceBreakdown)).toBe(true);
  });

  it('GET /api/reports/export/csv - should export workforce report as CSV file', async () => {
    const res = await request(app).get('/api/reports/export/csv');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text).toContain('Employee ID,Name,Department');
  });
});
