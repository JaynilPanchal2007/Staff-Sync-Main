import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

describe('Smart Replacement Engine & Proxy Requests API Endpoints', () => {
  let absentStaffId: string = '';
  let candidateStaffId: string = '';
  let gapId: string = '';
  let proxyRequestId: string = '';

  beforeAll(async () => {
    // 1. Create absent staff & candidate staff
    const res1 = await request(app).post('/api/staff').send({
      name: 'Prof. Absent Faculty',
      employeeId: 'ABS-101',
      department: 'Computer Science',
      role: 'Professor',
      subjects: ['Data Structures'],
    });
    absentStaffId = res1.body.staff.id || res1.body.staff.staffId;

    const res2 = await request(app).post('/api/staff').send({
      name: 'Prof. Replacement Candidate',
      employeeId: 'REP-202',
      department: 'Computer Science',
      role: 'Associate Professor',
      subjects: ['Data Structures'],
      experience: '5',
    });
    candidateStaffId = res2.body.staff.id || res2.body.staff.staffId;

    // 2. Schedule a lecture for absent faculty
    await request(app).post('/api/timetable').send({
      facultyId: absentStaffId,
      facultyName: 'Prof. Absent Faculty',
      subject: 'Data Structures',
      day: 'Tuesday',
      startTime: '09:00',
      endTime: '10:00',
      room: 'Hall A',
    });

    // 3. Mark faculty absent to generate gap
    const attRes = await request(app).post('/api/attendance').send({
      staffId: absentStaffId,
      status: 'absent',
      date: '2026-09-08', // Tuesday
      remarks: 'Medical leave',
    });

    if (attRes.body.gapsCreated && attRes.body.gapsCreated.length > 0) {
      gapId = attRes.body.gapsCreated[0].id || attRes.body.gapsCreated[0].gapId;
    }
  });

  it('GET /api/replacements/gaps - should list all open staffing gaps', async () => {
    const res = await request(app).get('/api/replacements/gaps');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.gaps)).toBe(true);
  });

  it('POST /api/proxy - should create and send a proxy replacement request', async () => {
    const gapsList = await request(app).get('/api/replacements/gaps');
    const targetGap = gapsList.body.gaps[0];
    if (targetGap) {
      gapId = targetGap.id || targetGap.gapId;
    }

    const res = await request(app).post('/api/proxy').send({
      gapId,
      targetStaffId: candidateStaffId,
      matchScore: 92,
      reasons: ['✓ Primary subject expertise matched'],
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.proxyRequest).toBeDefined();

    proxyRequestId = res.body.proxyRequest.id || res.body.proxyRequest.proxyRequestId;
  });

  it('PUT /api/proxy/:id/accept - should accept proxy replacement request', async () => {
    const res = await request(app).put(`/api/proxy/${proxyRequestId}/accept`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.proxyRequest.status).toBe('accepted');
  });

  it('PUT /api/proxy/:id/reject - should handle proxy request rejection', async () => {
    // Send another request to test reject
    const newReq = await request(app).post('/api/proxy').send({
      gapId,
      targetStaffId: candidateStaffId,
      matchScore: 88,
    });

    const rejectId = newReq.body.proxyRequest.id || newReq.body.proxyRequest.proxyRequestId;
    const res = await request(app).put(`/api/proxy/${rejectId}/reject`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.proxyRequest.status).toBe('rejected');
  });
});
