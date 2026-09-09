import {
  AdminUser,
  Organization,
  StaffMember,
  AttendanceRecord,
  TimetableEntry,
  ShiftEntry,
  ShiftChangeRequest,
  StaffingGap,
  ProxyRequest,
  NotificationItem,
  AuditLogItem,
} from '../types';
import { mockIndustryRequest, isTitanEmail } from './mockIndustry';

const API_BASE = '/api';

function toQueryString(params?: Record<string, string | undefined>): string {
  if (!params) return '';
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '' && value !== 'undefined') {
      query.set(key, String(value));
    }
  });
  const serialized = query.toString();
  return serialized ? `?${serialized}` : '';
}

function getSavedUser(): any | null {
  try {
    const u = localStorage.getItem('staffsync_user');
    return u ? JSON.parse(u) : null;
  } catch {
    return null;
  }
}

function shouldUseIndustryMock(endpoint: string, options: RequestInit = {}): boolean {
  const method = (options.method || 'GET').toUpperCase();
  const u = getSavedUser();
  if (u?.organizationType === 'industry') return true;
  if (method === 'POST' && endpoint === '/auth/login') {
    try {
      const body = JSON.parse(String(options.body || '{}'));
      return isTitanEmail(body?.email) || String(body?.email || '').toLowerCase() === 'hr@titanprecision.com';
    } catch {
      return false;
    }
  }
  return false;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const token = localStorage.getItem('staffsync_token');
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const savedUser = localStorage.getItem('staffsync_user');
  if (savedUser) {
    try {
      const u = JSON.parse(savedUser);
      if (u.organizationId) {
        headers['X-Organization-Id'] = u.organizationId;
      }
    } catch { /* ignore */ }
  }

  if (shouldUseIndustryMock(endpoint, options)) {
    const data = await mockIndustryRequest(endpoint, options);
    if (data && typeof data === 'object' && (data as any).error && (data as any).status >= 400) {
      throw new Error((data as any).error);
    }
    return data as T;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Network request failed');
  }
  return data;
}

export const api = {
  // Auth
  login: (credentials: { email: string; password?: string; loginType?: string }) =>
    request<{ success: boolean; token: string; user: any; organization?: Organization }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  register: (data: { name: string; email: string; password?: string; role?: string; organizationName?: string; organizationType?: string; organizationId?: string }) =>
    request<{ success: boolean; token: string; user: any; organization?: Organization }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Admin & Dashboard
  getAdminInfo: () => request<{ admin: AdminUser; organization: Organization | null; dbStatus: any }>('/admin/info'),
  getDashboardStats: () => request<any>('/dashboard/admin'),
  saveOrganization: (orgData: Partial<Organization>) =>
    request<{ success: boolean; organization: Organization }>('/admin/org', {
      method: 'POST',
      body: JSON.stringify(orgData),
    }),
  getAuditLogs: () => request<{ logs: AuditLogItem[] }>('/audit-logs'),
  askAiAssistant: (query: string) =>
    request<{ answer: string }>('/ai/ask', {
      method: 'POST',
      body: JSON.stringify({ query }),
    }),
  getSettings: () => request<{ settings: any }>('/settings'),
  updateSettings: (settings: any) =>
    request<{ success: boolean; settings: any }>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
  getDbStatus: () => request<any>('/database/status'),
  connectDatabase: (uri: string) =>
    request<{ success: boolean; message: string }>('/database/connect', {
      method: 'POST',
      body: JSON.stringify({ uri }),
    }),

  // Staff
  getStaff: (params?: { department?: string; role?: string; status?: string; q?: string }) => {
    return request<{ staff: StaffMember[] }>(`/staff${toQueryString(params)}`);
  },
  getStaffById: (id: string) => request<{ staff: StaffMember }>(`/staff/${id}`),
  addStaff: (data: Partial<StaffMember> & { password?: string }) =>
    request<{ success: boolean; staff: StaffMember }>('/staff', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateStaff: (id: string, data: Partial<StaffMember>) =>
    request<{ success: boolean; staff: StaffMember }>(`/staff/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteStaff: (id: string) =>
    request<{ success: boolean; message: string }>(`/staff/${id}`, {
      method: 'DELETE',
    }),

  // Personal Dashboards
  getFacultyDashboard: (id: string) => request<any>(`/dashboard/faculty/${id}`),
  getEmployeeDashboard: (id: string) => request<any>(`/dashboard/employee/${id}`),

  // Attendance
  getAttendance: (date?: string) =>
    request<{ date: string; records: AttendanceRecord[] }>(`/attendance${date ? `?date=${date}` : ''}`),
  setAttendance: (data: { staffId: string; status: string; date?: string; remarks?: string }) =>
    request<{ success: boolean; attendance: AttendanceRecord; gapsCreated: StaffingGap[] }>('/attendance', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Timetable
  getTimetable: (params?: { facultyId?: string; day?: string }) => {
    return request<{ timetable: TimetableEntry[] }>(`/timetable${toQueryString(params)}`);
  },
  getTodayTimetable: () =>
    request<{ date: string; day: string; lectures: (TimetableEntry & { faculty?: any })[] }>('/timetable/today'),
  createExchange: (data: { sourceTimetableId: string; targetFacultyId: string; note?: string }) =>
    request<{ success: boolean; exchange: any }>('/timetable/exchange', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  acceptExchange: (id: string) =>
    request<{ success: boolean; exchange: any }>(`/timetable/exchange/${id}/accept`, { method: 'PUT' }),
  rejectExchange: (id: string) =>
    request<{ success: boolean; exchange: any }>(`/timetable/exchange/${id}/reject`, { method: 'PUT' }),
  addTimetableEntry: (data: Partial<TimetableEntry> & { facultyName?: string; department?: string }) =>
    request<{ success: boolean; timetable: TimetableEntry }>('/timetable', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTimetableEntry: (id: string, data: Partial<TimetableEntry> & { facultyName?: string; department?: string }) =>
    request<{ success: boolean; timetable: TimetableEntry }>(`/timetable/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteTimetableEntry: (id: string) =>
    request<{ success: boolean; message: string }>(`/timetable/${id}`, {
      method: 'DELETE',
    }),
  seedTimetable: () =>
    request<{ success: boolean; count: number; entries: TimetableEntry[] }>('/timetable/seed', {
      method: 'POST',
    }),

  // Shifts
  getShifts: (params?: { employeeId?: string; date?: string; department?: string }) => {
    return request<{ shifts: ShiftEntry[] }>(`/shifts${toQueryString(params)}`);
  },
  addShift: (data: Partial<ShiftEntry>) =>
    request<{ success: boolean; shift: ShiftEntry }>('/shifts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteShift: (id: string) =>
    request<{ success: boolean; message: string }>(`/shifts/${id}`, {
      method: 'DELETE',
    }),

  // Shift Change Requests (worker self-service shift exchange, proxy-style workflow)
  getShiftChangeRequests: () =>
    request<{ shiftChangeRequests: ShiftChangeRequest[]; categories: any }>('/shifts/change-requests'),
  sendShiftChangeRequest: (data: { fromStaffId: string; fromShiftId: string; toStaffId: string; note?: string }) =>
    request<{ success: boolean; shiftChangeRequest: ShiftChangeRequest }>('/shifts/change-request', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  acceptShiftChangeRequest: (id: string) =>
    request<{ success: boolean; shiftChangeRequest: ShiftChangeRequest }>(`/shifts/change-request/${id}/accept`, {
      method: 'PUT',
    }),
  rejectShiftChangeRequest: (id: string) =>
    request<{ success: boolean; shiftChangeRequest: ShiftChangeRequest }>(`/shifts/change-request/${id}/reject`, {
      method: 'PUT',
    }),

  // Smart Replacement & Gaps
  getGaps: (status?: string) =>
    request<{ gaps: StaffingGap[] }>(`/replacements/gaps${status ? `?status=${status}` : ''}`),
  getGapDetails: (id: string) => request<{ gap: StaffingGap; evaluation: any }>(`/replacements/gaps/${id}`),
  evaluateGap: (id: string) => request<any>(`/replacements/evaluate/${id}`, { method: 'POST' }),
  sendProxyRequest: (data: { gapId: string; targetStaffId: string; matchScore: number; reasons: string[] }) =>
    request<{ success: boolean; proxyRequest: ProxyRequest }>('/proxy', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  acceptProxyRequest: (id: string) =>
    request<{ success: boolean; proxyRequest: ProxyRequest }>(`/proxy/${id}/accept`, {
      method: 'PUT',
    }),
  rejectProxyRequest: (id: string) =>
    request<{ success: boolean; proxyRequest: ProxyRequest }>(`/proxy/${id}/reject`, {
      method: 'PUT',
    }),

  // Notifications
  getNotifications: (staffId?: string) =>
    request<{ notifications: NotificationItem[] }>(`/notifications${staffId ? `?staffId=${staffId}` : ''}`),
  markNotificationRead: (id: string) =>
    request<{ success: boolean; notification: NotificationItem }>(`/notifications/${id}/read`, {
      method: 'PUT',
    }),
  markAllNotificationsRead: (staffId?: string) =>
    request<{ success: boolean }>('/notifications/read-all', {
      method: 'PUT',
      body: JSON.stringify({ staffId }),
    }),

  // Reports
  getReports: () => request<any>('/reports'),

  // PDF
  uploadPdf: async (file: File, type: 'staff' | 'timetable') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const res = await fetch(`${API_BASE}/pdf/import`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'PDF processing failed');
    return data;
  },
  confirmPdfImport: (type: 'staff' | 'timetable', records: any[], fileId?: string) =>
    request<{ success: boolean; insertedCount: number; errors: string[] }>('/pdf/confirm', {
      method: 'POST',
      body: JSON.stringify({ type, records, fileId }),
    }),
  getPdfUploads: () =>
    request<{ success: boolean; uploads: any[] }>('/pdf/uploads'),
  deletePdfUpload: (id: string) =>
    request<{ success: boolean }>(`/pdf/uploads/${id}`, { method: 'DELETE' }),
};
