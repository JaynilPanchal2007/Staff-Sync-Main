import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { dbService } from '../src/services/db.js';

describe('Admin & System API Endpoints', () => {
  beforeAll(() => {
    // Setup initial data for testing
    dbService.updateAdmin({
      name: 'Dr. Test Administrator',
      email: 'admin@test.org',
      role: 'Administrator',
    });
  });

  it('GET /api/health - should return 200 OK with health status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toContain('StaffSync');
  });

  it('GET /api/admin/info - should return admin user details and dbStatus', async () => {
    const res = await request(app).get('/api/admin/info');
    expect(res.status).toBe(200);
    expect(res.body.admin).toBeDefined();
    expect(res.body.admin.name).toBe('Dr. Test Administrator');
  });

  it('GET /api/dashboard/admin - should return dashboard statistics', async () => {
    const res = await request(app).get('/api/dashboard/admin');
    expect(res.status).toBe(200);
    expect(res.body.stats).toBeDefined();
    expect(res.body.stats.totalStaff).toBeGreaterThanOrEqual(0);
  });

  it('POST /api/admin/org - should create or update organization profile', async () => {
    const res = await request(app).post('/api/admin/org').send({
      name: 'Test University Campus',
      type: 'college',
      contactEmail: 'contact@testuniv.edu',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.organization.name).toBe('Test University Campus');
  });

  it('GET /api/audit-logs - should return system audit log history', async () => {
    const res = await request(app).get('/api/audit-logs');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.logs)).toBe(true);
  });

  it('GET /api/settings - should return current scoring weights & settings', async () => {
    const res = await request(app).get('/api/settings');
    expect(res.status).toBe(200);
    expect(res.body.settings).toBeDefined();
    expect(res.body.settings.scoringWeights).toBeDefined();
  });

  it('PUT /api/settings - should update scoring weights successfully', async () => {
    const res = await request(app).put('/api/settings').send({
      scoringWeights: {
        compatibility: 35,
        availability: 25,
        conflict: 15,
        workload: 10,
        fairness: 10,
        experience: 5,
      },
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.settings.scoringWeights.compatibility).toBe(35);
  });

  it('POST /api/ai/ask - should answer admin query', async () => {
    const res = await request(app).post('/api/ai/ask').send({
      query: 'Who is absent today?',
    });

    expect(res.status).toBe(200);
    expect(res.body.answer).toBeDefined();
    expect(typeof res.body.answer).toBe('string');
  });
});
