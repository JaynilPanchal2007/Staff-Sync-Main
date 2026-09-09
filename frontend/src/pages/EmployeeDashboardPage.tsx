import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Factory,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Briefcase,
  MapPin,
  Bell,
  Sparkles,
  ShieldCheck,
  ArrowRightLeft,
  Send,
  RotateCw,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { StaffMember, ShiftEntry, ProxyRequest, NotificationItem, ShiftChangeRequest } from '../types';
import { SHIFT_CATEGORIES } from '../services/mockIndustry';

export const EmployeeDashboardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { refreshKey, triggerRefresh } = useApp();

  const [employeeData, setEmployeeData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [showChangeModal, setShowChangeModal] = useState<ShiftEntry | null>(null);
  const [changeTargetId, setChangeTargetId] = useState('');
  const [changeNote, setChangeNote] = useState('');
  const [isSubmittingChange, setIsSubmittingChange] = useState(false);

  const loadEmployee = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const data = await api.getEmployeeDashboard(id);
      setEmployeeData(data);
    } catch (err) {
      console.error('Failed to load employee dashboard', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEmployee();
  }, [id, refreshKey]);

  const handleAccept = async (requestId: string) => {
    try {
      setActionInProgress(requestId);
      const res = await api.acceptProxyRequest(requestId);
      if (res.success) {
        triggerRefresh();
        loadEmployee();
      }
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      setActionInProgress(requestId);
      const res = await api.rejectProxyRequest(requestId);
      if (res.success) {
        triggerRefresh();
        loadEmployee();
      }
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleAcceptChange = async (requestId: string) => {
    try {
      setActionInProgress(requestId);
      const res = await api.acceptShiftChangeRequest(requestId);
      if (res.success) {
        triggerRefresh();
        loadEmployee();
      }
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDeclineChange = async (requestId: string) => {
    try {
      setActionInProgress(requestId);
      const res = await api.rejectShiftChangeRequest(requestId);
      if (res.success) {
        triggerRefresh();
        loadEmployee();
      }
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleSendChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showChangeModal || !changeTargetId) return;
    setIsSubmittingChange(true);
    try {
      const res = await api.sendShiftChangeRequest({
        fromStaffId: showChangeModal.employeeId,
        fromShiftId: showChangeModal.id,
        toStaffId: changeTargetId,
        note: changeNote,
      });
      if (res.success) {
        setShowChangeModal(null);
        setChangeTargetId('');
        setChangeNote('');
        triggerRefresh();
        loadEmployee();
      }
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsSubmittingChange(false);
    }
  };

  if (isLoading && !employeeData) {
    return <div className="p-12 text-center text-xs text-slate-500">Loading personalized employee workspace...</div>;
  }

  const staff: StaffMember = employeeData?.employee;
  const todayShift: ShiftEntry | null = employeeData?.todayShift;
  const upcomingShifts: ShiftEntry[] = employeeData?.upcomingShifts || [];
  const incomingRequests: ProxyRequest[] = employeeData?.incomingRequests || [];
  const notifications: NotificationItem[] = employeeData?.notifications || [];
  const shiftChangeRequests: { incoming: ShiftChangeRequest[]; outgoing: ShiftChangeRequest[] } =
    employeeData?.shiftChangeRequests || { incoming: [], outgoing: [] };
  const colleagues: StaffMember[] = employeeData?.colleagues || [];

  if (!staff) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Employee Record Not Found</h3>
        <p className="mt-1 text-xs text-slate-500">Please select a valid employee from the workforce directory.</p>
        <Link to="/staff" className="mt-4 inline-block rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white">
          Return to Workforce Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner: Employee Identity */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-600 font-extrabold text-xl text-white shadow-md shadow-amber-600/30">
            {staff.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{staff.name}</h1>
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                {staff.employeeId}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {staff.role} • {staff.department} • Personal Industrial Workforce Workspace
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-center dark:border-slate-800 dark:bg-slate-800">
            <div className="text-lg font-bold text-slate-900 dark:text-white">
              {staff.weeklyHours || 40} / {staff.maxWeeklyHours || 48} hrs
            </div>
            <div className="text-[10px] font-semibold text-slate-500">Weekly Hours</div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-center dark:border-slate-800 dark:bg-slate-800">
            <div className="text-lg font-bold text-amber-600 dark:text-amber-400">{staff.proxyCount || 0}</div>
            <div className="text-[10px] font-semibold text-slate-500">Replacements Covered</div>
          </div>
        </div>
      </div>

      {/* Incoming Shift Replacement Requests */}
      {incomingRequests.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-6 dark:border-amber-900/60 dark:bg-amber-950/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Shift Replacement Requests ({incomingRequests.length})
              </h2>
            </div>
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
              You're requested to cover for a peer
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {incomingRequests.map((req) => (
              <div
                key={req.id}
                className="flex flex-col justify-between gap-4 rounded-xl border border-white/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Shift: {req.workDetails?.role || 'Assembly Operation'}
                    </span>
                    <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                      Absent: {req.fromStaffName}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {req.workDetails?.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {req.workDetails?.startTime} - {req.workDetails?.endTime}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={actionInProgress === req.id}
                    onClick={() => handleAccept(req.id)}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Accept Shift</span>
                  </button>
                  <button
                    disabled={actionInProgress === req.id}
                    onClick={() => handleReject(req.id)}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:border-slate-800 dark:bg-slate-800 disabled:opacity-50"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    <span>Decline</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shift Change Requests: self-service swap with ANY other worker */}
      {(shiftChangeRequests.incoming.length > 0 || shiftChangeRequests.outgoing.length > 0) && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-6 dark:border-indigo-900/60 dark:bg-indigo-950/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RotateCw className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Shift Change Requests ({shiftChangeRequests.incoming.length} awaiting action)
              </h2>
            </div>
            <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
              Swap shifts with any other worker
            </span>
          </div>

          {shiftChangeRequests.incoming.length > 0 && (
            <div className="mt-3 space-y-3">
              {shiftChangeRequests.incoming.map((req) => (
                <div
                  key={req.id}
                  className="flex flex-col justify-between gap-4 rounded-xl border border-white/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <ArrowRightLeft className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {req.fromStaffName} wants to swap with you
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {req.shift.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {SHIFT_CATEGORIES[req.shift.category]?.label || req.shift.category} ({req.shift.startTime} - {req.shift.endTime})
                      </span>
                      <span>{req.shift.role} • {req.shift.department}</span>
                    </div>
                    {req.note && <div className="mt-1 text-[11px] italic text-slate-500">"{req.note}"</div>}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      disabled={actionInProgress === req.id}
                      onClick={() => handleAcceptChange(req.id)}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Accept Swap</span>
                    </button>
                    <button
                      disabled={actionInProgress === req.id}
                      onClick={() => handleDeclineChange(req.id)}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:border-slate-800 dark:bg-slate-800 disabled:opacity-50"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      <span>Decline</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {shiftChangeRequests.outgoing.length > 0 && (
            <div className="mt-3 rounded-xl border border-white/80 bg-white/60 p-4 dark:border-slate-800 dark:bg-slate-900/60">
              <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-indigo-500">My Sent Requests</div>
              <div className="space-y-2">
                {shiftChangeRequests.outgoing.map((req) => (
                  <div key={req.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-2.5 text-xs dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        With {req.toStaffName} • {req.shift.date} ({SHIFT_CATEGORIES[req.shift.category]?.label || req.shift.category})
                      </span>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      req.status === 'pending'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
                        : req.status === 'accepted'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Shift Status */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Today's Shift Card (8 cols) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 lg:col-span-8">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Today's Assigned Shift</h3>
          <p className="text-xs text-slate-500">Live floor allocation and station duties</p>

          {todayShift ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/60 p-5 dark:border-amber-900/60 dark:bg-amber-950/30">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-slate-900 dark:text-white">
                  {todayShift.role} • {todayShift.department}
                </span>
                <span className="rounded-md bg-amber-600 px-2.5 py-1 text-xs font-bold text-white">
                  {todayShift.startTime} - {todayShift.endTime}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-amber-600" />
                  {todayShift.location || 'Floor Bay 1'}
                </span>
                <span>Date: {todayShift.date}</span>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500">
              No shift assigned for today. You are off-duty.
            </div>
          )}

          {/* Upcoming Shifts */}
          <div className="mt-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Upcoming Shifts</h4>
            <div className="mt-3 space-y-2">
              {upcomingShifts.length === 0 ? (
                <div className="text-xs text-slate-400">No upcoming shifts scheduled this week.</div>
              ) : (
                upcomingShifts.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-lg border border-slate-100 p-3 text-xs dark:border-slate-800"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">{s.department}</span> • {s.role}
                      <div className="text-[11px] text-slate-500">{s.date}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {s.startTime} - {s.endTime}
                      </span>
                      <button
                        onClick={() => {
                          setShowChangeModal(s);
                          setChangeTargetId('');
                          setChangeNote('');
                        }}
                        title="Request shift change with any other worker"
                        className="flex items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-2 py-1 text-[10px] font-bold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900/60 dark:bg-indigo-950/50 dark:text-indigo-300"
                      >
                        <ArrowRightLeft className="h-3 w-3" />
                        Change
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right: Skills & Certifications Checklist */}
        <div className="space-y-6 lg:col-span-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Safety & Machine Qualifications
              </h3>
            </div>
            <div className="mt-3 space-y-2 text-xs">
              {(!staff.skills || staff.skills.length === 0) ? (
                <div className="text-[11px] text-slate-400">No certifications on file.</div>
              ) : staff.skills.map((sk, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800/70"
                >
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{sk}</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Workforce Notifications
              </h3>
            </div>
            <div className="mt-3 space-y-2 max-h-52 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-[11px] text-slate-400">No new notifications.</div>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className="rounded-lg border border-slate-100 p-2 text-xs dark:border-slate-800">
                    <div className="font-bold text-slate-800 dark:text-slate-200">{n.title}</div>
                    <div className="mt-0.5 text-[11px] text-slate-500">{n.message}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Shift Change Request Modal */}
      {showChangeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                <ArrowRightLeft className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                Request Shift Change
              </h2>
              <button
                onClick={() => setShowChangeModal(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSendChange} className="mt-4 space-y-3.5">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/60">
                <div className="font-bold text-slate-900 dark:text-white">{showChangeModal.employeeName || staff.name}</div>
                <div className="mt-0.5 text-slate-500">
                  {SHIFT_CATEGORIES[showChangeModal.category || 'morning']?.label} shift • {showChangeModal.date} • {showChangeModal.startTime}–{showChangeModal.endTime}
                </div>
                <div className="mt-0.5 text-slate-400">{showChangeModal.role} • {showChangeModal.department}</div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Worker to change with</label>
                <select
                  required
                  value={changeTargetId}
                  onChange={(e) => setChangeTargetId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-750 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="">Select a worker...</option>
                  {colleagues.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.department} - {c.employeeId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Note (optional)</label>
                <textarea
                  value={changeNote}
                  onChange={(e) => setChangeNote(e.target.value)}
                  rows={2}
                  placeholder="e.g. Doctor appointment that day — can we swap?"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-750 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="flex items-start gap-2 rounded-lg bg-indigo-50 p-2.5 text-[11px] text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  Your request goes straight to {showChangeModal.employeeName ? 'the selected worker' : 'that worker'}'s workspace. When they accept, the shifts are swapped automatically.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowChangeModal(null)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-750 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingChange}
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  {isSubmittingChange ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
