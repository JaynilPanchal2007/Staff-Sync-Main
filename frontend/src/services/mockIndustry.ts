// StaffSync - Industry Organization Offline Mock Engine
// The industry enterprise runs ENTIRELY on local mock data (localStorage), with NO backend or database calls.
// Mirrors the real backend response shapes so existing pages render without changes.

export type ShiftCategory = 'morning' | 'evening' | 'night';

export const SHIFT_CATEGORIES: Record<ShiftCategory, { label: string; startTime: string; endTime: string }> = {
  morning: { label: 'Morning', startTime: '06:00', endTime: '14:00' },
  evening: { label: 'Evening', startTime: '14:00', endTime: '22:00' },
  night: { label: 'Night', startTime: '22:00', endTime: '06:00' },
};

const ORG_ID = 'org_industry_01';
const ADMIN = {
  id: 'admin_titan_industry',
  adminId: 'admin_titan_industry',
  name: 'Rajesh Mehta',
  email: 'hr@titanprecision.com',
  role: 'Plant HR Manager',
  organizationId: ORG_ID,
  organizationType: 'industry',
};
const ORGANIZATION = {
  id: ORG_ID,
  orgId: ORG_ID,
  name: 'Titan Precision Manufacturing Enterprise',
  type: 'industry',
  address: 'Industrial Area Sanwer Road, Indore, MP 452015',
  contactEmail: 'hr@titanprecision.com',
  contactPhone: '+91 98222 30000',
  workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  workingHours: { start: '06:00', end: '22:00' },
  timezone: 'UTC+05:30',
};
const SETTINGS = {
  scoringWeights: { compatibility: 30, availability: 20, conflict: 15, workload: 15, fairness: 10, experience: 10 },
  workingHours: { start: '06:00', end: '22:00' },
  maxWeeklyHours: 48,
  maxWorkloadLectures: 0,
};

const STORAGE_KEY = 'staffsync_industry_mock_v1';

interface MockWorker {
  id: string;
  staffId: string;
  organizationId: string;
  name: string;
  employeeId: string;
  email: string;
  phone: string;
  department: string;
  role: string;
  subjects: string[];
  classes: string[];
  skills: string[];
  qualification: string;
  experience: string;
  workingDays: string[];
  availability: { day: string; available: boolean }[];
  maxWorkload: number;
  maxWeeklyHours: number;
  assignedLectures: number;
  weeklyHours: number;
  proxyCount: number;
  status: 'active' | 'inactive';
}

interface MockShift {
  id: string;
  shiftId: string;
  organizationId: string;
  category: ShiftCategory;
  employeeId: string;
  employeeName: string;
  employeeCustomId: string;
  date: string;
  startTime: string;
  endTime: string;
  department: string;
  role: string;
  requiredSkills: string[];
  location: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

interface MockChangeRequest {
  id: string;
  requestId: string;
  organizationId: string;
  fromStaffId: string;
  fromStaffName: string;
  fromShiftId: string;
  shift: {
    date: string;
    category: ShiftCategory;
    startTime: string;
    endTime: string;
    role: string;
    department: string;
    location: string;
  };
  toStaffId: string;
  toStaffName: string;
  toStaffEmployeeId: string;
  note: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  respondedAt?: string;
}

interface MockNotification {
  id: string;
  notificationId: string;
  organizationId: string;
  targetStaffId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  metadata?: any;
}

export function deriveCategory(startTime: string): ShiftCategory {
  const hour = Number((startTime || '00:00').split(':')[0]);
  if (hour >= 5 && hour < 13) return 'morning';
  if (hour >= 13 && hour < 21) return 'evening';
  return 'night';
}

function floorDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function todayStr(): string {
  return floorDate(new Date());
}

function isoDaysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return floorDate(d);
}

function delay(ms = 120): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function uid(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
}

function buildWorkers(): MockWorker[] {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const availability = days.map((day) => ({ day, available: true }));
  const mk = (
    staffId: string,
    name: string,
    employeeId: string,
    email: string,
    department: string,
    role: string,
    skills: string[],
    qualification: string,
    experience: string
  ): MockWorker => ({
    id: staffId,
    staffId,
    organizationId: ORG_ID,
    name,
    employeeId,
    email,
    phone: '+91 98222 30xxx',
    department,
    role,
    subjects: skills,
    classes: [],
    skills,
    qualification,
    experience,
    workingDays: days,
    availability,
    maxWorkload: 40,
    maxWeeklyHours: 48,
    assignedLectures: 0,
    weeklyHours: 40,
    proxyCount: 0,
    status: 'active',
  });

  return [
    mk('staff_industry_1', 'Alex Rivera', 'EMP-I101', 'alex.rivera@titanprecision.com', 'Operations & Assembly', 'Senior Line Operator', ['CNC Milling', 'Precision Machining', 'Pneumatics', 'Safety Inspection'], 'Diploma in Mechanical Engineering', '7'),
    mk('staff_industry_2', 'Marcus Vance', 'EMP-I102', 'marcus.vance@titanprecision.com', 'Quality Control', 'QC Inspector', ['Tolerance Testing', 'ISO Audit', 'CMM Testing'], 'B.E. Manufacturing', '5'),
    mk('staff_industry_3', 'Sarah Jenkins', 'EMP-I103', 'sarah.industrial@titanprecision.com', 'Maintenance & Automation', 'Automation Technician', ['PLC Programming', 'SCADA', 'Robotic Maintenance'], 'Diploma in Electrical & Automation', '6'),
    mk('staff_industry_4', 'David Chen', 'EMP-I104', 'david.chen@titanprecision.com', 'Production Planning', 'Shift Supervisor', ['Shift Scheduling', 'Lean Manufacturing', 'Six Sigma Green Belt'], 'B.Tech Industrial Engineering', '10'),
    mk('staff_industry_5', 'Priya Nair', 'EMP-I105', 'priya.nair@titanprecision.com', 'Operations & Assembly', 'Line Operator', ['Assembly Line Operations', '5S'], 'ITI Fitter', '3'),
    mk('staff_industry_6', 'Tom Becker', 'EMP-I106', 'tom.becker@titanprecision.com', 'Quality Control', 'Junior Inspector', ['Calipers', 'Gauge Reading'], 'Diploma in Quality', '2'),
  ];
}

function buildShifts(workers: MockWorker[]): MockShift[] {
  const shifts: MockShift[] = [];
  const rotation: ShiftCategory[] = ['morning', 'evening', 'night', 'morning', 'evening', 'night'];
  const locationByDept: Record<string, string> = {
    'Operations & Assembly': 'Assembly Line 1',
    'Quality Control': 'QC Lab',
    'Maintenance & Automation': 'Robotics Bay',
    'Production Planning': 'Plant Floor 1',
  };
  for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
    const date = isoDaysFromNow(dayIndex);
    workers.forEach((w, wi) => {
      const category = rotation[(dayIndex + wi) % 3];
      const meta = SHIFT_CATEGORIES[category];
      const isPast = date < todayStr();
      shifts.push({
        id: `shift_ind_${w.staffId.slice(-1)}_${date}`,
        shiftId: `shift_ind_${w.staffId.slice(-1)}_${date}`,
        organizationId: ORG_ID,
        category,
        employeeId: w.id,
        employeeName: w.name,
        employeeCustomId: w.employeeId,
        date,
        startTime: meta.startTime,
        endTime: meta.endTime,
        department: w.department,
        role: w.role,
        requiredSkills: w.skills,
        location: locationByDept[w.department] || 'Main Floor',
        status: isPast ? 'completed' : 'scheduled',
      });
    });
  }
  return shifts;
}

function buildAttendance(workers: MockWorker[], shifts: MockShift[]): any[] {
  const today = todayStr();
  const out: any[] = [];
  for (const w of workers) {
    const hasTodayShift = shifts.some((s) => s.employeeId === w.id && s.date === today);
    if (!hasTodayShift) continue;
    const isAlexAbsent = w.id === 'staff_industry_1';
    out.push({
      id: `att_ind_${w.staffId.slice(-1)}_${today}`,
      attendanceId: `att_ind_${w.staffId.slice(-1)}_${today}`,
      staffId: w.id,
      employeeId: w.employeeId,
      name: w.name,
      staffName: w.name,
      department: w.department,
      role: w.role,
      date: today,
      status: isAlexAbsent ? 'absent' : 'present',
      remarks: isAlexAbsent ? 'Emergency leave on Morning Shift.' : 'Clocked in on time.',
    });
  }
  return out;
}

function buildGaps(workers: MockWorker[]): any[] {
  const today = todayStr();
  const alex = workers[0];
  const marcus = workers[1];
  const morningShift = { date: today, category: 'morning' as ShiftCategory, role: 'Senior Line Operator', department: 'Operations & Assembly', startTime: '06:00', endTime: '14:00', location: 'Assembly Line 1' };
  return [
    {
      id: `gap_industry_shift_${today}`,
      gapId: `gap_industry_shift_${today}`,
      organizationId: ORG_ID,
      date: today,
      day: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
      startTime: '06:00',
      endTime: '14:00',
      affectedType: 'shift',
      absentStaffId: alex.id,
      absentStaffName: alex.name,
      absentEmployeeId: alex.employeeId,
      role: morningShift.role,
      department: morningShift.department,
      requiredSkillsOrSubject: 'CNC Milling, Pneumatics',
      status: 'candidates_found',
      candidateCount: 1,
      recommendedCandidate: {
        staffId: marcus.id,
        staffName: marcus.name,
        employeeId: marcus.employeeId,
        role: marcus.role,
        department: marcus.department,
        matchScore: 88,
        reasons: ['✓ Certified in CNC Milling & Pneumatics', '✓ Present on Morning Shift'],
        isAvailable: true,
        hasConflict: false,
        eliminated: false,
      },
    },
  ];
}

function buildSeeds(): any {
  const workers = buildWorkers();
  const shifts = buildShifts(workers);
  const attendance = buildAttendance(workers, shifts);
  const gaps = buildGaps(workers);
  const today = todayStr();
  const proxyRequests = [
    {
      id: `req_industry_proxy_${today}`,
      proxyRequestId: `req_industry_proxy_${today}`,
      organizationId: ORG_ID,
      gapId: gaps[0].gapId,
      fromStaffId: 'staff_industry_1',
      fromStaffName: 'Alex Rivera',
      targetStaffId: 'staff_industry_2',
      targetStaffName: 'Marcus Vance',
      targetEmployeeId: 'EMP-I102',
      workDetails: {
        affectedType: 'shift',
        role: 'Senior Line Operator',
        department: 'Operations & Assembly',
        date: today,
        day: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
        startTime: '06:00',
        endTime: '14:00',
        requiredSkills: ['CNC Milling', 'Pneumatics'],
        location: 'Assembly Line 1',
      },
      matchScore: 88,
      reasons: ['✓ Certified in CNC Milling & Pneumatics', '✓ Present on Morning Shift'],
      status: 'pending',
      createdAt: new Date().toISOString(),
    },
  ];
  const tomorrow = isoDaysFromNow(1);
  const sarah = workers[2];
  const david = workers[3];
  const sarahShift = shifts.find((s) => s.employeeId === sarah.id && s.date === tomorrow) || shifts[0];
  const shiftChangeRequests: MockChangeRequest[] = [
    {
      id: 'chg_sarah_david_seed',
      requestId: 'chg_sarah_david_seed',
      organizationId: ORG_ID,
      fromStaffId: sarah.id,
      fromStaffName: sarah.name,
      fromShiftId: sarahShift.id,
      shift: {
        date: sarahShift.date,
        category: sarahShift.category,
        startTime: sarahShift.startTime,
        endTime: sarahShift.endTime,
        role: sarahShift.role,
        department: sarahShift.department,
        location: sarahShift.location,
      },
      toStaffId: david.id,
      toStaffName: david.name,
      toStaffEmployeeId: david.employeeId,
      note: 'Can we swap? Need to be at plant early that day.',
      status: 'pending',
      createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    },
  ];
  const notifications: MockNotification[] = [
    {
      id: `notif_ind_proxy_${today}`,
      notificationId: `notif_ind_proxy_${today}`,
      organizationId: ORG_ID,
      targetStaffId: 'staff_industry_2',
      type: 'proxy_request',
      title: 'Cover Morning Shift?',
      message: 'Alex Rivera is absent. You are the best match to cover the Senior Line Operator shift (06:00\u201314:00).',
      read: false,
      createdAt: new Date().toISOString(),
      metadata: { gapId: gaps[0].gapId },
    },
    {
      id: `notif_ind_change_${today}`,
      notificationId: `notif_ind_change_${today}`,
      organizationId: ORG_ID,
      targetStaffId: david.id,
      type: 'shift_change',
      title: 'Shift Change Request Received',
      message: `${sarah.name} wants to change shifts with you on ${sarahShift.date} (${SHIFT_CATEGORIES[sarahShift.category].label} shift).`,
      read: false,
      createdAt: new Date(Date.now() - 3600 * 1000).toISOString(),
      metadata: { requestId: shiftChangeRequests[0].id },
    },
  ];
  const auditLogs = [
    { id: 'log_ind_init', logId: 'log_ind_init', actor: 'System', action: 'INITIALIZE_INDUSTRY_DEMO', entity: 'Admin', entityId: 'admin_titan_industry', timestamp: new Date().toISOString(), metadata: { note: 'Industry module running on offline mock data (no backend/database).' } },
    { id: 'log_ind_kpi', logId: 'log_ind_kpi', actor: ADMIN.name, action: 'UPDATE_SHIFT_SCHEDULE', entity: 'Shift', entityId: 'morning_routine', timestamp: new Date().toISOString(), metadata: { category: 'morning' } },
  ];

  return { workers, shifts, attendance, gaps, proxyRequests, shiftChangeRequests, notifications, auditLogs, tomorrow };
}

function loadState(): any {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.version === 1) return parsed;
    }
  } catch { /* ignore */ }
  const fresh = { version: 1, ...buildSeeds() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  return fresh;
}

function saveState(state: any) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function sanitizeWorker(w: MockWorker): any {
  const { hashedPassword, ...rest } = w as any;
  return { ...rest };
}

function getCleanWorkers(state: any): any[] {
  return state.workers.map(sanitizeWorker);
}

function todayShifts(state: any, date: string): MockShift[] {
  const now = new Date();
  return state.shifts
    .filter((s: MockShift) => s.date === date)
    .map((s: MockShift) => {
      if (s.date < todayStr()) return { ...s, status: 'completed' };
      if (s.date === todayStr()) {
        const endH = Number(s.endTime.split(':')[0]);
        const endM = Number(s.endTime.split(':')[1] || '0');
        const isNight = s.endTime <= s.startTime || s.category === 'night';
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), endH, endM);
        if (isNight && (endH <= 6)) end.setDate(end.getDate() + 1);
        if (now > end) return { ...s, status: 'completed' };
      }
      return s;
    });
}

function buildDashboardStats(state: any): any {
  const today = todayStr();
  const staff = state.workers;
  const attendance = state.attendance.filter((a: any) => a.date === today);
  const presentCount = attendance.filter((a: any) => a.status === 'present').length;
  const absentCount = attendance.filter((a: any) => a.status === 'absent').length;
  const todayShiftsList = todayShifts(state, today).filter((s: MockShift) => s.status === 'scheduled');
  const gaps = state.gaps.filter((g: any) => g.status !== 'resolved' && g.status !== 'accepted');
  const proxies = state.proxyRequests;
  return {
    stats: {
      totalStaff: staff.length,
      presentToday: presentCount,
      absentToday: absentCount,
      onLeaveToday: 0,
      lateToday: 0,
      activeGapsCount: gaps.length,
      resolvedGapsCount: state.gaps.length - gaps.length,
      pendingProxyCount: proxies.filter((p: any) => p.status === 'pending').length,
      acceptedProxyCount: proxies.filter((p: any) => p.status === 'accepted').length,
      todayLecturesCount: 0,
      todayShiftsCount: todayShiftsList.length,
    },
    activeGaps: gaps.slice(0, 5),
    recentProxyRequests: proxies.slice(0, 6),
    recentLogs: state.auditLogs.slice(0, 15),
    settings: SETTINGS,
  };
}

function employeeDashboard(state: any, id: string): any {
  const staff = state.workers.find((w: MockWorker) => w.id === id || w.employeeId === id);
  if (!staff) {
    const err = new Error('Employee not found.') as any;
    err.status = 404;
    throw err;
  }
  const today = todayStr();
  const allShifts = state.shifts.filter((s: MockShift) => s.employeeId === staff.id);
  const todayShift = todayShifts(state, today).find((s: MockShift) => s.employeeId === staff.id) || null;
  const attendance =
    state.attendance.find((a: any) => a.staffId === staff.id && a.date === today) ||
    (todayShift ? { status: 'present' } : { status: 'off_duty' });

  const weeklyHours = allShifts.reduce((acc: number, curr: MockShift) => {
    const [sh, sm] = (curr.startTime || '08:00').split(':').map(Number);
    const [eh, em] = (curr.endTime || '16:00').split(':').map(Number);
    let diff = (eh * 60 + em - (sh * 60 + sm)) / 60;
    if (diff <= 0) diff += 24;
    return acc + diff;
  }, 0);
  const maxWeeklyHours = staff.maxWeeklyHours || 48;
  const overtime = Math.max(0, weeklyHours - maxWeeklyHours);

  const incomingProxy = state.proxyRequests.filter(
    (r: any) => (r.targetStaffId === staff.id || r.targetStaffId === staff.employeeId) && r.status === 'pending'
  );
  const allChangeRequests = state.shiftChangeRequests;
  const incomingChange = allChangeRequests.filter((r: MockChangeRequest) => r.toStaffId === staff.id && r.status === 'pending');
  const outgoingChange = allChangeRequests.filter((r: MockChangeRequest) => r.fromStaffId === staff.id);
  const colleagues = state.workers.filter((w: MockWorker) => w.id !== staff.id).map(sanitizeWorker);
  const notifications = state.notifications
    .filter((n: MockNotification) => !n.targetStaffId || n.targetStaffId === staff.id || n.targetStaffId === '')
    .slice(0, 10);

  return {
    employee: sanitizeWorker(staff),
    today: { date: today, shift: todayShift, status: attendance.status },
    todayShift,
    upcomingShifts: state.shifts
      .filter((s: MockShift) => s.employeeId === staff.id && s.date >= today)
      .slice(0, 7),
    workload: {
      weeklyHours: Math.round(weeklyHours * 10) / 10,
      maxAllowed: maxWeeklyHours,
      overtime: Math.round(overtime * 10) / 10,
      remainingHours: Math.max(0, maxWeeklyHours - weeklyHours),
    },
    requests: {
      pending: incomingProxy,
      accepted: state.proxyRequests.filter((r: any) => r.targetStaffId === staff.id && r.status === 'accepted'),
      rejected: state.proxyRequests.filter((r: any) => r.targetStaffId === staff.id && r.status === 'rejected'),
    },
    incomingRequests: incomingProxy,
    shiftChangeRequests: { incoming: incomingChange, outgoing: outgoingChange },
    colleagues,
    notifications,
  };
}

function evaluateGap(state: any, gapId: string): any {
  const gap = state.gaps.find((g: any) => g.id === gapId || g.gapId === gapId);
  if (!gap) throw new Error('Staffing gap not found.');
  const candidates = state.workers
    .filter((w: MockWorker) => w.id !== gap.absentStaffId)
    .map((w: MockWorker, idx: number) => ({
      staffId: w.id,
      staffName: w.name,
      employeeId: w.employeeId,
      role: w.role,
      department: w.department,
      matchScore: Math.max(60, 95 - idx * 7),
      breakdown: {
        compatibility: Math.max(18, Math.min(30, 30 - idx * 3)),
        availability: Math.max(12, Math.min(20, 20 - idx * 2)),
        conflict: Math.max(9, Math.min(15, 15 - idx)),
        workload: Math.max(9, Math.min(15, 15 - Math.floor(idx / 2))),
        fairness: 10 - Math.min(2, idx),
        experience: Math.max(4, 10 - idx * 2),
      },
      reasons: idx === 0 ? ['✓ Certified in required skills', '✓ Free at that slot'] : ['✓ Available'],
      currentWorkload: Math.round((3 + idx) / 7 * 40),
      isAvailable: true,
      hasConflict: false,
      eliminated: false,
    }));
  return { gap, candidates, evaluation: candidates };
}

function createShiftChangeRequest(state: any, body: any): MockChangeRequest {
  const { fromStaffId, fromShiftId, toStaffId, note } = body;
  if (!fromStaffId || !fromShiftId || !toStaffId) throw new Error('fromStaffId, fromShiftId, and toStaffId are required.');
  if (fromStaffId === toStaffId) throw new Error('You cannot request a shift change with yourself.');
  const fromStaff = state.workers.find((w: MockWorker) => w.id === fromStaffId);
  const toStaff = state.workers.find((w: MockWorker) => w.id === toStaffId);
  const shift = state.shifts.find((s: MockShift) => s.id === fromShiftId || s.shiftId === fromShiftId);
  if (!fromStaff || !toStaff) throw new Error('Worker not found.');
  if (!shift) throw new Error('Shift not found.');
  const existing = state.shiftChangeRequests.find(
    (r: MockChangeRequest) =>
      r.fromShiftId === shift.id &&
      r.toStaffId === toStaffId &&
      r.status === 'pending'
  );
  if (existing) throw new Error('A pending shift change request already exists for this shift.');
  const req: MockChangeRequest = {
    id: uid('chg'),
    requestId: uid('chg'),
    organizationId: ORG_ID,
    fromStaffId: fromStaff.id,
    fromStaffName: fromStaff.name,
    fromShiftId: shift.id,
    shift: {
      date: shift.date,
      category: shift.category,
      startTime: shift.startTime,
      endTime: shift.endTime,
      role: shift.role,
      department: shift.department,
      location: shift.location,
    },
    toStaffId: toStaff.id,
    toStaffName: toStaff.name,
    toStaffEmployeeId: toStaff.employeeId,
    note: note || '',
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  state.shiftChangeRequests.unshift(req);
  state.notifications.unshift({
    id: uid('notif'),
    notificationId: uid('notif'),
    organizationId: ORG_ID,
    targetStaffId: toStaff.id,
    type: 'shift_change',
    title: 'Shift Change Request Received',
    message: `${fromStaff.name} wants to change shifts with you on ${shift.date} (${SHIFT_CATEGORIES[shift.category as ShiftCategory].label}, ${shift.startTime}\u2013${shift.endTime}).`,
    read: false,
    createdAt: new Date().toISOString(),
    metadata: { requestId: req.id },
  });
  state.auditLogs.unshift({
    id: uid('log'),
    logId: uid('log'),
    actor: fromStaff.name,
    action: 'SHIFT_CHANGE_REQUEST',
    entity: 'ShiftChangeRequest',
    entityId: req.id,
    timestamp: new Date().toISOString(),
    metadata: { toStaff: toStaff.name, shiftId: shift.id },
  });
  return req;
}

function acceptShiftChangeRequest(state: any, id: string): MockChangeRequest {
  const req = state.shiftChangeRequests.find((r: MockChangeRequest) => r.id === id || r.requestId === id);
  if (!req) throw new Error('Shift change request not found.');
  if (req.status !== 'pending') throw new Error('Only pending requests can be accepted.');
  if (req.status === 'accepted') return req;

  const fromShift = state.shifts.find((s: MockShift) => s.id === req.fromShiftId || s.shiftId === req.fromShiftId);
  if (fromShift) {
    const targetShiftSameSlot = state.shifts.find(
      (s: MockShift) =>
        s.employeeId === req.toStaffId && s.date === req.shift.date && s.category === req.shift.category && s.id !== fromShift.id
    );
    const fromStaff = state.workers.find((w: MockWorker) => w.id === req.fromStaffId);
    const toStaff = state.workers.find((w: MockWorker) => w.id === req.toStaffId);
    if (targetShiftSameSlot) {
      // Full swap: the two workers exchange their identical-slot shifts.
      targetShiftSameSlot.employeeId = fromShift.employeeId;
      targetShiftSameSlot.employeeName = fromShift.employeeName;
      targetShiftSameSlot.employeeCustomId = fromShift.employeeCustomId;
      fromShift.employeeId = req.toStaffId;
      fromShift.employeeName = req.toStaffName;
      fromShift.employeeCustomId = req.toStaffEmployeeId;
      state.notifications.unshift({
        id: uid('notif'),
        notificationId: uid('notif'),
        organizationId: ORG_ID,
        targetStaffId: req.toStaffId,
        type: 'shift_change',
        title: 'Shift Change Accepted',
        message: `${fromStaff.name} accepted your request. You now cover their ${SHIFT_CATEGORIES[req.shift.category as ShiftCategory].label} shift on ${req.shift.date}.`,
        read: false,
        createdAt: new Date().toISOString(),
        metadata: { requestId: req.id },
      });
    } else {
      // Transfer: the requester releases the slot; the target takes it over.
      fromShift.employeeId = req.toStaffId;
      fromShift.employeeName = req.toStaffName;
      fromShift.employeeCustomId = req.toStaffEmployeeId;
      state.notifications.unshift({
        id: uid('notif'),
        notificationId: uid('notif'),
        organizationId: ORG_ID,
        targetStaffId: req.fromStaffId,
        type: 'shift_change',
        title: 'Shift Change Accepted',
        message: `${toStaff.name} accepted your request and will cover your ${SHIFT_CATEGORIES[req.shift.category as ShiftCategory].label} shift on ${req.shift.date}.`,
        read: false,
        createdAt: new Date().toISOString(),
        metadata: { requestId: req.id },
      });
    }
  }
  req.status = 'accepted';
  req.respondedAt = new Date().toISOString();
  state.auditLogs.unshift({
    id: uid('log'),
    logId: uid('log'),
    actor: req.toStaffName,
    action: 'SHIFT_CHANGE_ACCEPTED',
    entity: 'ShiftChangeRequest',
    entityId: req.id,
    timestamp: new Date().toISOString(),
    metadata: { fromStaff: req.fromStaffName, date: req.shift.date },
  });
  return req;
}

function rejectShiftChangeRequest(state: any, id: string): MockChangeRequest {
  const req = state.shiftChangeRequests.find((r: MockChangeRequest) => r.id === id || r.requestId === id);
  if (!req) throw new Error('Shift change request not found.');
  if (req.status !== 'pending') throw new Error('Only pending requests can be rejected.');
  req.status = 'rejected';
  req.respondedAt = new Date().toISOString();
  const toStaff = state.workers.find((w: MockWorker) => w.id === req.toStaffId);
  state.notifications.unshift({
    id: uid('notif'),
    notificationId: uid('notif'),
    organizationId: ORG_ID,
    targetStaffId: req.fromStaffId,
    type: 'shift_change',
    title: 'Shift Change Declined',
    message: `${toStaff?.name || 'The worker'} declined your shift change request for ${req.shift.date}.`,
    read: false,
    createdAt: new Date().toISOString(),
    metadata: { requestId: req.id },
  });
  return req;
}

function handleAuth(body: any): any {
  const input = String(body?.email || '').trim().toLowerCase();
  const workers = buildWorkers();
  if (input === ADMIN.email) {
    return {
      success: true,
      token: `token_admin_mock_${Date.now()}`,
      user: {
        id: ADMIN.adminId,
        name: ADMIN.name,
        email: ADMIN.email,
        role: 'Administrator',
        organizationId: ORG_ID,
        organizationType: 'industry',
      },
      organization: ORGANIZATION,
    };
  }
  const worker =
    workers.find((w) => w.email.toLowerCase() === input) ||
    workers.find((w) => w.employeeId.toLowerCase() === input);
  if (worker) {
    return {
      success: true,
      token: `token_staff_mock_${Date.now()}`,
      user: {
        id: worker.id,
        name: worker.name,
        email: worker.email,
        employeeId: worker.employeeId,
        role: 'Worker',
        department: worker.department,
        organizationId: ORG_ID,
        organizationType: 'industry',
      },
      organization: ORGANIZATION,
    };
  }
  const err = new Error('Account not found. Try a Titan Precision worker or HR admin email.') as any;
  err.status = 401;
  throw err;
}

export function isTitanEmail(email?: string): boolean {
  return Boolean(email && String(email).trim().toLowerCase().includes('titanprecision.com'));
}

export async function mockIndustryRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
  await delay(120);
  const method = (options.method || 'GET').toUpperCase();
  const [path, qs] = endpoint.split('?');
  const query: Record<string, string> = {};
  new URLSearchParams(qs || '').forEach((v, k) => { query[k] = v; });
  const bodyParsed = (() => {
    try { return options.body ? JSON.parse(String(options.body)) : {}; } catch { return {}; }
  })();
  const state = loadState();

  const respond = (data: any) => data;
  const notFound = () => { const e = new Error('Mock endpoint not found: ' + endpoint) as any; e.status = 404; throw e; };

  // -- Auth -----------------------------------------------------------
  if (method === 'POST' && path === '/auth/login') return respond(handleAuth(bodyParsed));
  if (path === '/auth/me') {
    return respond({
      user: { id: ADMIN.adminId, name: ADMIN.name, email: ADMIN.email, role: 'Administrator', organizationId: ORG_ID, organizationType: 'industry' },
      organization: ORGANIZATION,
    });
  }

  // -- Admin & dashboard ---------------------------------------------
  if (method === 'GET' && path === '/admin/info')
    return respond({ admin: ADMIN, organization: ORGANIZATION, dbStatus: { connected: true, provider: 'offline-mock', industryMode: 'mock-data-no-database', collections: 0 } });
  if (method === 'GET' && path === '/dashboard/admin') return respond({ admin: ADMIN, organization: ORGANIZATION, ...buildDashboardStats(state) });
  if (method === 'POST' && path === '/admin/org') return respond({ success: true, organization: ORGANIZATION });
  if (path === '/audit-logs') return respond({ logs: state.auditLogs.slice(0, 60) });
  if (path === '/ai/ask') return respond({ answer: 'Industry module runs on offline mock data. Use the Shift Management and Worker Workspace to schedule shifts, request shift changes, and approve replacements.' });
  if (path === '/settings') {
    if (method === 'PUT') { const updated = { ...SETTINGS, ...bodyParsed }; state.settings = updated; saveState(state); return respond({ success: true, settings: updated }); }
    return respond({ settings: SETTINGS });
  }
  if (method === 'GET' && path === '/database/status') return respond({ connected: true, provider: 'offline-mock', industryMode: 'mock' });
  if (method === 'POST' && (path === '/database/connect' || path === '/database/sync')) return respond({ success: true, connected: true, note: 'Industry runs on offline mock data; database connection unnecessary.' });

  // -- Staff ----------------------------------------------------------
  if (method === 'GET' && path === '/staff') {
    let list = getCleanWorkers(state);
    if (query.department && query.department !== 'all') list = list.filter((s) => s.department === query.department);
    if (query.role && query.role !== 'all') list = list.filter((s) => s.role === query.role);
    if (query.status && query.status !== 'all') list = list.filter((s) => s.status === query.status);
    if (query.q) {
      const q = query.q.toLowerCase();
      list = list.filter((s) => s.name.toLowerCase().includes(q) || s.employeeId.toLowerCase().includes(q) || s.department.toLowerCase().includes(q));
    }
    return respond({ staff: list });
  }
  let staffById: any = null;
  const staffGetMatch = path.match(/^\/staff\/([^/]+)$/);
  if (staffGetMatch && method === 'GET') {
    const w = state.workers.find((x: MockWorker) => x.id === staffGetMatch[1] || x.staffId === staffGetMatch[1]);
    if (!w) notFound();
    return respond({ staff: sanitizeWorker(w) });
  }
  if (method === 'POST' && path === '/staff') {
    const w = bodyParsed;
    const id = w.id || w.staffId || `staff_${Date.now()}`;
    const nu: MockWorker = {
      id,
      staffId: id,
      organizationId: ORG_ID,
      name: w.name || 'Unnamed Worker',
      employeeId: w.employeeId || `EMP-${String(Date.now()).slice(-4)}`,
      email: w.email || `${(w.name || 'worker').toLowerCase().replace(/[^a-z0-9]/g, '')}@titanprecision.com`,
      phone: w.phone || '',
      department: w.department || 'Operations & Assembly',
      role: w.role || 'Line Operator',
      subjects: w.subjects || [],
      classes: [],
      skills: w.skills || (w.requiredSkills || []),
      qualification: w.qualification || '',
      experience: w.experience || '',
      workingDays: w.workingDays || Object.keys(SHIFT_CATEGORIES).map((k) => k),
      availability: [],
      maxWorkload: w.maxWorkload || 40,
      maxWeeklyHours: w.maxWeeklyHours || 48,
      assignedLectures: 0,
      weeklyHours: w.weeklyHours || 0,
      proxyCount: w.proxyCount || 0,
      status: w.status || 'active',
    };
    state.workers.push(nu);
    state.auditLogs.unshift({ id: uid('log'), logId: uid('log'), actor: ADMIN.name, action: 'ADD_WORKER', entity: 'Staff', entityId: id, timestamp: new Date().toISOString(), metadata: { name: nu.name } });
    saveState(state);
    return respond({ success: true, staff: sanitizeWorker(nu) });
  }
  if (staffGetMatch && method === 'PUT') {
    const w = state.workers.find((x: MockWorker) => x.id === staffGetMatch[1] || x.staffId === staffGetMatch[1]);
    if (!w) notFound();
    const updated = { ...w, ...bodyParsed, id: w.id, staffId: w.id };
    state.workers = state.workers.map((x: MockWorker) => (x.id === w.id ? updated : x));
    saveState(state);
    return respond({ success: true, staff: sanitizeWorker(updated) });
  }
  if (staffGetMatch && method === 'DELETE') {
    state.workers = state.workers.filter((x: MockWorker) => x.id !== staffGetMatch[1] && x.staffId !== staffGetMatch[1]);
    state.shifts = state.shifts.filter((s: MockShift) => s.employeeId !== staffGetMatch[1]);
    saveState(state);
    return respond({ success: true, message: 'Worker removed successfully.' });
  }

  // -- Personal dashboards ---------------------------------------------
  const empDashMatch = path.match(/^\/dashboard\/employee\/([^/]+)$/);
  if (empDashMatch && method === 'GET') return respond(employeeDashboard(state, empDashMatch[1]));
  const facDashMatch = path.match(/^\/dashboard\/faculty\/([^/]+)$/);
  if (facDashMatch && method === 'GET') {
    const dash = employeeDashboard(state, facDashMatch[1]);
    return respond({ faculty: dash.employee, today: { date: dash.today.date, dayName: new Date().toLocaleDateString('en-US', { weekday: 'long' }), status: dash.today.status, schedule: dash.today.shift ? [dash.today.shift] : [], freePeriods: [] }, weeklyTimetable: [], proxy: { received: dash.incomingRequests, pending: dash.requests.pending, accepted: dash.requests.accepted, rejected: dash.requests.rejected }, workload: dash.workload, notifications: dash.notifications, shiftChangeRequests: dash.shiftChangeRequests, colleagues: dash.colleagues });
  }

  // -- Attendance -------------------------------------------------------
  if (path === '/attendance') {
    if (method === 'POST') {
      const { staffId, status, date, remarks } = bodyParsed;
      const w = state.workers.find((x: MockWorker) => x.id === staffId);
      const d = date || todayStr();
      const id = `att_${staffId}_${d}`;
      if (w) {
        const existing = state.attendance.findIndex((a: any) => a.staffId === w.id && a.date === d);
        const record = { id, attendanceId: id, staffId: w.id, employeeId: w.employeeId, name: w.name, staffName: w.name, department: w.department, role: w.role, date: d, status: status || 'present', remarks: remarks || '' };
        if (existing >= 0) state.attendance[existing] = record; else state.attendance.push(record);
      }
      saveState(state);
      return respond({ success: true, attendance: { staffId, date: d, status }, gapsCreated: state.gaps.filter((g: any) => g.date === d) });
    }
    const date = query.date || todayStr();
    let records = state.attendance.filter((a: any) => a.date === date).map((a: any) => a);
    if (records.length === 0) {
      records = todayShifts(state, date)
        .filter((s: MockShift) => s.status === 'scheduled')
        .map((s: MockShift) => ({ id: `att_${s.employeeId}_${date}`, staffId: s.employeeId, employeeId: s.employeeCustomId, name: s.employeeName, staffName: s.employeeName, department: s.department, role: s.role, date, status: 'present' as string, remarks: '' }));
    }
    return respond({ date, records });
  }

  // -- Timetable (empty for industry) -----------------------------------
  if (method === 'GET' && path === '/timetable') return respond({ timetable: [] });
  if (method === 'GET' && path === '/timetable/today') return respond({ date: todayStr(), day: new Date().toLocaleDateString('en-US', { weekday: 'long' }), lectures: [] });
  if (method === 'PUT' && path.startsWith('/timetable/')) return respond({ success: true, timetable: bodyParsed });

  // -- Shifts -----------------------------------------------------------
  if (path === '/shifts') {
    if (method === 'POST') {
      const s = bodyParsed;
      const id = s.id || s.shiftId || uid('shift_ind');
      const cat = s.category || deriveCategory(s.startTime || '06:00');
      const shift: MockShift = {
        id,
        shiftId: id,
        organizationId: ORG_ID,
        category: cat,
        employeeId: s.employeeId,
        employeeName: s.employeeName || 'Unassigned',
        employeeCustomId: s.employeeCustomId || s.employeeId,
        date: s.date || todayStr(),
        startTime: s.startTime || SHIFT_CATEGORIES[cat as ShiftCategory].startTime,
        endTime: s.endTime || SHIFT_CATEGORIES[cat as ShiftCategory].endTime,
        department: s.department || 'Operations & Assembly',
        role: s.role || 'Line Operator',
        requiredSkills: s.requiredSkills || [],
        location: s.location || 'Main Floor',
        status: s.status || 'scheduled',
      };
      state.shifts.push(shift);
      state.auditLogs.unshift({ id: uid('log'), logId: uid('log'), actor: ADMIN.name, action: 'SCHEDULE_SHIFT', entity: 'Shift', entityId: id, timestamp: new Date().toISOString(), metadata: { employee: s.employeeName, date: shift.date, category: cat } });
      saveState(state);
      return respond({ success: true, shift });
    }
    let list: MockShift[] = query.date ? todayShifts(state, query.date) : state.shifts;
    if (query.date) list = list.filter((s: MockShift) => s.date === query.date);
    if (query.employeeId) list = list.filter((s: MockShift) => s.employeeId === query.employeeId || s.employeeCustomId === query.employeeId);
    if (query.department && query.department !== 'all') list = list.filter((s: MockShift) => s.department === query.department);
    return respond({ shifts: list });
  }
  const shiftDeleteMatch = path.match(/^\/shifts\/([^/]+)$/);
  if (shiftDeleteMatch && method === 'DELETE') {
    state.shifts = state.shifts.filter((s: MockShift) => s.id !== shiftDeleteMatch[1] && s.shiftId !== shiftDeleteMatch[1]);
    state.shiftChangeRequests = state.shiftChangeRequests.filter((r: MockChangeRequest) => r.fromShiftId !== shiftDeleteMatch[1]);
    saveState(state);
    return respond({ success: true, message: 'Shift deleted.' });
  }

  // -- Shift change requests (self-service) -----------------------------
  if (method === 'GET' && path === '/shifts/change-requests') {
    return respond({ shiftChangeRequests: state.shiftChangeRequests, categories: SHIFT_CATEGORIES });
  }
  if (method === 'POST' && path === '/shifts/change-request') {
    const req = createShiftChangeRequest(state, bodyParsed);
    saveState(state);
    return respond({ success: true, shiftChangeRequest: req });
  }
  const changeMatch = path.match(/^\/shifts\/change-request\/([^/]+)\/(accept|reject)$/);
  if (changeMatch) {
    const req = changeMatch[2] === 'accept' ? acceptShiftChangeRequest(state, changeMatch[1]) : rejectShiftChangeRequest(state, changeMatch[1]);
    saveState(state);
    return respond({ success: true, shiftChangeRequest: req });
  }

  // -- Gaps & proxy replacements -----------------------------------------
  if (method === 'GET' && (path === '/replacements/gaps' || path === '/gaps')) {
    let gaps = state.gaps;
    if (query.status && query.status !== 'all') gaps = gaps.filter((g: any) => g.status === query.status);
    return respond({ gaps });
  }
  const gapDetailMatch = path.match(/^\/replacements\/gaps\/([^/]+)$/);
  if (gapDetailMatch && method === 'GET') {
    const gap = state.gaps.find((g: any) => g.id === gapDetailMatch[1] || g.gapId === gapDetailMatch[1]);
    if (!gap) notFound();
    return respond({ gap, evaluation: evaluateGap(state, gap.id) });
  }
  const evaluateMatch = path.match(/^\/replacements\/evaluate\/([^/]+)$/);
  if (evaluateMatch && method === 'POST') {
    const gap = state.gaps.find((g: any) => g.id === evaluateMatch[1] || g.gapId === evaluateMatch[1]);
    if (!gap) notFound();
    return respond(evaluateGap(state, gap.id));
  }
  if (method === 'POST' && path === '/proxy') {
    const { gapId, targetStaffId, matchScore, reasons } = bodyParsed;
    const gap = state.gaps.find((g: any) => g.id === gapId || g.gapId === gapId);
    const target = state.workers.find((w: MockWorker) => w.id === targetStaffId);
    if (!gap || !target) notFound();
    const req = {
      id: uid('req'),
      proxyRequestId: uid('req'),
      organizationId: ORG_ID,
      gapId: gap.id,
      fromStaffId: gap.absentStaffId,
      fromStaffName: gap.absentStaffName,
      targetStaffId: target.id,
      targetStaffName: target.name,
      targetEmployeeId: target.employeeId,
      workDetails: { affectedType: 'shift', role: gap.role, department: gap.department, date: gap.date, startTime: gap.startTime, endTime: gap.endTime },
      matchScore: matchScore || 90,
      reasons: reasons || [],
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    state.proxyRequests.unshift(req);
    state.gaps = state.gaps.map((g: any) => (g.id === gap.id ? { ...g, status: 'request_sent', assignedTargetStaffId: target.id, assignedTargetStaffName: target.name, proxyRequestId: req.id } : g));
    state.notifications.unshift({ id: uid('notif'), notificationId: uid('notif'), organizationId: ORG_ID, targetStaffId: target.id, type: 'proxy_request', title: 'New Shift Coverage Request', message: `Cover for ${gap.absentStaffName}'s ${gap.role} shift (${gap.startTime}\u2013${gap.endTime}).`, read: false, createdAt: new Date().toISOString(), metadata: { gapId: gap.id } });
    saveState(state);
    return respond({ success: true, proxyRequest: req });
  }
  const proxyActionMatch = path.match(/^\/proxy\/([^/]+)\/(accept|reject)$/);
  if (proxyActionMatch) {
    const req = state.proxyRequests.find((r: any) => r.id === proxyActionMatch[1] || r.proxyRequestId === proxyActionMatch[1]);
    if (!req) notFound();
    req.status = proxyActionMatch[2] === 'accept' ? 'accepted' : 'rejected';
    req.respondedAt = new Date().toISOString();
    if (req.status === 'accepted') {
      const gap = state.gaps.find((g: any) => g.id === req.gapId || g.gapId === req.gapId);
      if (gap) {
        gap.status = 'resolved';
        gap.resolvedByStaffId = req.targetStaffId;
        gap.resolvedByStaffName = req.targetStaffName;
      }
      const absentShift = state.shifts.find(
        (s: MockShift) =>
          (s.employeeId === req.fromStaffId || s.employeeName === req.fromStaffName) &&
          s.date === req.workDetails.date &&
          s.startTime === req.workDetails.startTime
      );
      if (absentShift) {
        absentShift.employeeId = req.targetStaffId;
        absentShift.employeeName = req.targetStaffName;
        absentShift.employeeCustomId = req.targetEmployeeId || req.targetStaffId;
      }
      const targetWorker = state.workers.find((w: MockWorker) => w.id === req.targetStaffId);
      if (targetWorker) {
        targetWorker.proxyCount = (targetWorker.proxyCount || 0) + 1;
        targetWorker.assignedLectures = (targetWorker.assignedLectures || 0) + 1;
      }
      const fromWorker = state.workers.find((w: MockWorker) => w.id === req.fromStaffId);
      if (fromWorker) {
        fromWorker.assignedLectures = Math.max(0, (fromWorker.assignedLectures || 1) - 1);
      }
    }
    saveState(state);
    return respond({ success: true, proxyRequest: req });
  }

  // -- Notifications ------------------------------------------------------
  if (method === 'PUT' && path === '/notifications/read-all') {
    state.notifications.forEach((n: MockNotification) => { n.read = true; });
    saveState(state);
    return respond({ success: true });
  }
  if (path === '/notifications') {
    let list = state.notifications;
    if (method === 'GET' && query.staffId) list = list.filter((n: MockNotification) => !n.targetStaffId || n.targetStaffId === query.staffId);
    return respond({ notifications: list.slice(0, 50) });
  }
  const notifReadMatch = path.match(/^\/notifications\/([^/]+)\/read$/);
  if (notifReadMatch && method === 'PUT') {
    const n = state.notifications.find((x: MockNotification) => x.id === notifReadMatch[1] || x.notificationId === notifReadMatch[1]);
    if (n) { n.read = true; saveState(state); }
    return respond({ success: true, notification: n || null });
  }

  // -- Reports & PDF --------------------------------------------------------
  if (method === 'GET' && path === '/reports') {
    const staff = getCleanWorkers(state);
    const today = todayStr();
    return respond({
      staff,
      summary: {
        totalStaff: staff.length,
        totalShifts: state.shifts.filter((s: MockShift) => s.date >= today).length,
        pendingChanges: state.shiftChangeRequests.filter((r: MockChangeRequest) => r.status === 'pending').length,
        coverage: { morning: state.shifts.filter((s: MockShift) => s.category === 'morning' && s.date === today).length, evening: state.shifts.filter((s: MockShift) => s.category === 'evening' && s.date === today).length, night: state.shifts.filter((s: MockShift) => s.category === 'night' && s.date === today).length },
      },
      reports: [],
    });
  }
  if (method === 'GET' && path === '/pdf/uploads') return respond({ success: true, uploads: [] });
  const pdfDelMatch = path.match(/^\/pdf\/uploads\/([^/]+)$/);
  if (pdfDelMatch && method === 'DELETE') return respond({ success: true });
  if (path === '/pdf/import') throw Object.assign(new Error('PDF import is disabled in the offline industry demo (mock data mode).'), { status: 400 });

  return notFound();
}