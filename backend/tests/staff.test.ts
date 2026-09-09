import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

describe('Staff & Member API Endpoints', () => {
  let createdStaffId: string = '';

  it('POST /api/staff - should create a new staff member', async () => {
    const res = await request(app).post('/api/staff').send({
      name: 'Prof. Alan Turing',
      employeeId: 'FAC-999',
      email: 'alan.turing@staffsync.org',
      department: 'Computer Science',
      role: 'Professor',
      subjects: ['Theory of Computation', 'Cryptography'],
      qualification: 'Ph.D in Mathematics',
      experience: '15',
      maxWorkload: 20,
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.staff.name).toBe('Prof. Alan Turing');
    expect(res.body.staff.employeeId).toBe('FAC-999');

    createdStaffId = res.body.staff.id || res.body.staff.staffId;
  });

  it('GET /api/staff - should list all staff members with filtering', async () => {
    const res = await request(app).get('/api/staff?department=Computer Science');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.staff)).toBe(true);
    expect(res.body.staff.some((s: any) => s.employeeId === 'FAC-999')).toBe(true);
  });

  it('GET /api/staff - should ignore empty or undefined filter params', async () => {
    const res = await request(app).get('/api/staff?q=&department=undefined');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.staff)).toBe(true);
    expect(res.body.staff.some((s: any) => s.employeeId === 'FAC-999')).toBe(true);
  });

  it('GET /api/staff/:id - should get individual staff member by ID', async () => {
    const res = await request(app).get(`/api/staff/${createdStaffId}`);
    expect(res.status).toBe(200);
    expect(res.body.staff.name).toBe('Prof. Alan Turing');
  });

  it('PUT /api/staff/:id - should update staff details', async () => {
    const res = await request(app).put(`/api/staff/${createdStaffId}`).send({
      phone: '+1 555-9999',
      assignedLectures: 5,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.staff.phone).toBe('+1 555-9999');
    expect(res.body.staff.assignedLectures).toBe(5);
  });

  it('GET /api/dashboard/faculty/:id - should get personalized faculty dashboard', async () => {
    const res = await request(app).get(`/api/dashboard/faculty/${createdStaffId}`);
    expect(res.status).toBe(200);
    expect(res.body.faculty).toBeDefined();
    expect(res.body.today).toBeDefined();
    expect(res.body.workload).toBeDefined();
  });

  it('GET /api/dashboard/employee/:id - should get personalized employee dashboard', async () => {
    const res = await request(app).get(`/api/dashboard/employee/${createdStaffId}`);
    expect(res.status).toBe(200);
    expect(res.body.employee).toBeDefined();
    expect(res.body.workload).toBeDefined();
  });

  it('DELETE /api/staff/:id - should delete staff member', async () => {
    const res = await request(app).delete(`/api/staff/${createdStaffId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
