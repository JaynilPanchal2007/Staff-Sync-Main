import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

describe('Timetable & Shift Schedule API Endpoints', () => {
  let createdTimetableId: string = '';
  let createdShiftId: string = '';
  let employeeId: string = '';

  beforeAll(async () => {
    const staffRes = await request(app).post('/api/staff').send({
      name: 'Grace Hopper',
      employeeId: 'EMP-777',
      department: 'Operations',
      role: 'System Engineer',
    });
    employeeId = staffRes.body.staff.id || staffRes.body.staff.staffId;
  });

  // Timetable Tests
  it('POST /api/timetable - should add a timetable entry', async () => {
    const res = await request(app).post('/api/timetable').send({
      facultyName: 'Dr. Grace Hopper',
      subject: 'Compiler Design',
      day: 'Wednesday',
      startTime: '14:00',
      endTime: '15:00',
      room: 'Lab 5',
      classGrade: 'Year 3',
      section: 'A',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.timetable.subject).toBe('Compiler Design');

    createdTimetableId = res.body.timetable.id || res.body.timetable.timetableId;
  });

  it('GET /api/timetable - should list timetable entries', async () => {
    const res = await request(app).get('/api/timetable?day=Wednesday');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.timetable)).toBe(true);
    expect(res.body.timetable.some((t: any) => t.subject === 'Compiler Design')).toBe(true);
  });

  it('PUT /api/timetable/:id - should update a timetable entry', async () => {
    const res = await request(app).put(`/api/timetable/${createdTimetableId}`).send({
      room: 'Hall B',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.timetable.room).toBe('Hall B');
  });

  it('POST /api/timetable/seed - should seed sample timetable lectures', async () => {
    const res = await request(app).post('/api/timetable/seed');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBeGreaterThan(0);
  });

  it('DELETE /api/timetable/:id - should delete timetable entry', async () => {
    const res = await request(app).delete(`/api/timetable/${createdTimetableId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // Shifts Tests
  it('POST /api/shifts - should schedule a new work shift', async () => {
    const res = await request(app).post('/api/shifts').send({
      employeeId,
      date: '2026-09-10',
      startTime: '08:00',
      endTime: '16:00',
      department: 'Operations',
      role: 'System Engineer',
      location: 'Control Center',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.shift.location).toBe('Control Center');

    createdShiftId = res.body.shift.id || res.body.shift.shiftId;
  });

  it('GET /api/shifts - should fetch shift schedules', async () => {
    const res = await request(app).get(`/api/shifts?date=2026-09-10`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.shifts)).toBe(true);
    expect(res.body.shifts.some((s: any) => s.id === createdShiftId || s.shiftId === createdShiftId)).toBe(true);
  });

  it('DELETE /api/shifts/:id - should delete a shift entry', async () => {
    const res = await request(app).delete(`/api/shifts/${createdShiftId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
