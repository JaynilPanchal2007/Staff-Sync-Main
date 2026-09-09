import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

describe('Attendance & Gap Detection API Endpoints', () => {
  let staffId: string = '';

  beforeAll(async () => {
    // Create a staff member for attendance testing
    const res = await request(app).post('/api/staff').send({
      name: 'Dr. Ada Lovelace',
      employeeId: 'FAC-888',
      email: 'ada.lovelace@staffsync.org',
      department: 'Computer Science',
      role: 'Professor',
      subjects: ['Algorithms'],
    });
    staffId = res.body.staff.id || res.body.staff.staffId;

    // Add a scheduled lecture for Ada Lovelace on Monday
    await request(app).post('/api/timetable').send({
      facultyId: staffId,
      facultyName: 'Dr. Ada Lovelace',
      subject: 'Algorithms',
      day: 'Monday',
      startTime: '10:00',
      endTime: '11:00',
      room: 'Room 202',
    });
  });

  it('POST /api/attendance - should mark staff present', async () => {
    const res = await request(app).post('/api/attendance').send({
      staffId,
      status: 'present',
      date: '2026-09-08',
      remarks: 'Present on time',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.attendance.status).toBe('present');
  });

  it('POST /api/attendance - marking absent should trigger staffing gap creation', async () => {
    const res = await request(app).post('/api/attendance').send({
      staffId,
      status: 'absent',
      date: '2026-09-07', // Monday date
      remarks: 'Sick Leave',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.attendance.status).toBe('absent');
    expect(Array.isArray(res.body.gapsCreated)).toBe(true);
  });

  it('GET /api/attendance - should fetch list of attendance records', async () => {
    const res = await request(app).get('/api/attendance?date=2026-09-08');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.records)).toBe(true);
    expect(res.body.records.some((r: any) => r.name === 'Dr. Ada Lovelace')).toBe(true);
  });
});
