export type OrganizationType = 'school' | 'college' | 'industry';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  organizationId: string | null;
  organizationType: OrganizationType | null;
}

export interface Organization {
  id: string;
  name: string;
  type: OrganizationType;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
  workingDays: string[];
  workingHours: { start: string; end: string };
  timezone: string;
}

export interface StaffMember {
  id: string;
  organizationId: string;
  name: string;
  employeeId: string;
  email: string;
  phone?: string;
  department: string;
  role: string;
  subjects?: string[];
  classes?: string[];
  skills?: string[];
  certifications?: string[];
  qualification?: string;
  experience?: string;
  workingDays?: string[];
  availability?: { day: string; available: boolean }[];
  maxWorkload?: number;
  maxWeeklyHours?: number;
  assignedLectures?: number;
  weeklyHours?: number;
  proxyCount?: number;
  status: 'active' | 'inactive' | 'deactivated';
  createdAt?: string;
}

export interface AttendanceRecord {
  id?: string;
  staffId: string;
  employeeId?: string;
  name?: string;
  department?: string;
  role?: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'on_leave' | 'break' | 'off_duty';
  remarks?: string;
}

export interface TimetableEntry {
  id: string;
  organizationId: string;
  facultyId: string;
  facultyName: string;
  facultyEmployeeId?: string;
  subject: string;
  day: string;
  startTime: string;
  endTime: string;
  classGrade?: string;
  section?: string;
  room?: string;
}

export type ShiftCategory = 'morning' | 'evening' | 'night';

export interface ShiftEntry {
  id: string;
  organizationId: string;
  employeeId: string;
  employeeName: string;
  employeeCustomId?: string;
  date: string;
  startTime: string;
  endTime: string;
  department: string;
  role: string;
  requiredSkills?: string[];
  location?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  category?: ShiftCategory;
}

export interface ShiftChangeRequest {
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

export interface CandidateBreakdown {
  compatibility: number;
  availability: number;
  conflict: number;
  workload: number;
  fairness: number;
  experience: number;
}

export interface ReplacementCandidate {
  staffId: string;
  staffName: string;
  employeeId: string;
  role: string;
  department: string;
  matchScore: number;
  breakdown: CandidateBreakdown;
  reasons: string[];
  currentWorkload: number;
  proxyCount: number;
  isAvailable: boolean;
  hasConflict: boolean;
  eliminated: boolean;
  eliminationReason?: string;
}

export interface StaffingGap {
  id: string;
  organizationId: string;
  date: string;
  day?: string;
  startTime: string;
  endTime: string;
  affectedType: 'lecture' | 'shift';
  absentStaffId: string;
  absentStaffName: string;
  absentEmployeeId?: string;
  subject?: string;
  role?: string;
  classGrade?: string;
  section?: string;
  room?: string;
  department?: string;
  requiredSkillsOrSubject?: string;
  status: 'unresolved' | 'candidates_found' | 'request_sent' | 'accepted' | 'resolved';
  candidateCount?: number;
  recommendedCandidate?: ReplacementCandidate;
  assignedTargetStaffId?: string;
  assignedTargetStaffName?: string;
  proxyRequestId?: string;
  resolvedByStaffId?: string;
  resolvedByStaffName?: string;
}

export interface ProxyRequest {
  id: string;
  organizationId: string;
  gapId: string;
  fromStaffId: string;
  fromStaffName: string;
  targetStaffId: string;
  targetStaffName: string;
  targetEmployeeId?: string;
  workDetails: {
    affectedType: string;
    subject?: string;
    role?: string;
    classGrade?: string;
    section?: string;
    room?: string;
    date: string;
    day?: string;
    startTime: string;
    endTime: string;
  };
  matchScore: number;
  reasons: string[];
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  respondedAt?: string;
}

export interface NotificationItem {
  id: string;
  organizationId: string;
  targetStaffId?: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  metadata?: any;
}

export interface AuditLogItem {
  id: string;
  actor: string;
  action: string;
  entity: string;
  entityId: string;
  timestamp: string;
  metadata?: any;
}
