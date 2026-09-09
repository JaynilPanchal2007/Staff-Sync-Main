import React, { useState, useEffect } from 'react';
import {
  Clock,
  Plus,
  Trash2,
  Factory,
  MapPin,
  X,
  CheckCircle2,
  Calendar,
  ArrowRightLeft,
  Send,
  Sunrise,
  Sunset,
  MoonStar,
  RotateCw,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { ShiftEntry, StaffMember, ShiftChangeRequest, ShiftCategory } from '../types';
import { SHIFT_CATEGORIES } from '../services/mockIndustry';

const CATEGORY_STYLES: Record<ShiftCategory, { chip: string; tab: string; icon: React.ReactNode; iconColor: string }> = {
  morning: {
    chip: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300',
    tab: 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-100',
    icon: <Sunrise className="h-4 w-4" />,
    iconColor: 'text-amber-500',
  },
  evening: {
    chip: 'bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300',
    tab: 'border-sky-300 bg-sky-50 text-sky-900 dark:border-sky-800 dark:bg-sky-950/60 dark:text-sky-100',
    icon: <Sunset className="h-4 w-4" />,
    iconColor: 'text-sky-500',
  },
  night: {
    chip: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300',
    tab: 'border-indigo-300 bg-indigo-50 text-indigo-900 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-100',
    icon: <MoonStar className="h-4 w-4" />,
    iconColor: 'text-indigo-500',
  },
};

export const ShiftsPage: React.FC = () => {
  const { orgType, refreshKey, triggerRefresh } = useApp();
  const isIndustry = orgType === 'industry';

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [activeCategory, setActiveCategory] = useState<ShiftCategory>('morning');
  const [shifts, setShifts] = useState<ShiftEntry[]>([]);
  const [allShifts, setAllShifts] = useState<ShiftEntry[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [changeRequests, setChangeRequests] = useState<ShiftChangeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showChangeModal, setShowChangeModal] = useState<ShiftEntry | null>(null);

  // Add Shift form
  const [employeeId, setEmployeeId] = useState('');
  const [category, setCategory] = useState<ShiftCategory>('morning');
  const [department, setDepartment] = useState('Operations & Assembly');
  const [role, setRole] = useState('Line Operator');
  const [location, setLocation] = useState('Assembly Line 1');
  const [skills, setSkills] = useState('CNC, Safety Level 2');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Change request modal state
  const [changeTargetId, setChangeTargetId] = useState('');
  const [changeNote, setChangeNote] = useState('');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [shiftsRes, staffRes] = await Promise.all([api.getShifts(), api.getStaff()]);
      setShifts(shiftsRes.shifts || []);
      setAllShifts(shiftsRes.shifts || []);
      setStaffList(staffRes.staff || []);
      if (isIndustry) {
        try {
          const chg = await api.getShiftChangeRequests();
          setChangeRequests(chg.shiftChangeRequests || []);
        } catch { /* not available for this sector */ }
      }
      if (staffRes.staff && staffRes.staff.length > 0 && !employeeId) {
        setEmployeeId(staffRes.staff[0].id);
      }
    } catch (err) {
      console.error('Failed to load shifts', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate, refreshKey]);

  const dateShifts = allShifts.filter((s) => s.date === selectedDate);
  const categoryCounts: Record<ShiftCategory, number> = { morning: 0, evening: 0, night: 0 };
  dateShifts.forEach((s) => {
    const c = s.category || (s.startTime < '13:00' ? 'morning' : s.startTime < '21:00' ? 'evening' : 'night');
    categoryCounts[c] = (categoryCounts[c] || 0) + 1;
  });
  const visibleShifts = dateShifts.filter((s) => (s.category || (s.startTime < '13:00' ? 'morning' : s.startTime < '21:00' ? 'evening' : 'night')) === activeCategory);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const selectedStaff = staffList.find((s) => s.id === employeeId);
      const meta = SHIFT_CATEGORIES[category];
      await api.addShift({
        employeeId,
        employeeName: selectedStaff?.name || 'Unassigned',
        employeeCustomId: selectedStaff?.employeeId,
        date: selectedDate,
        startTime: meta.startTime,
        endTime: meta.endTime,
        category,
        department,
        role,
        location,
        requiredSkills: skills.split(',').map((s) => s.trim()),
      });

      setShowAddModal(false);
      triggerRefresh();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showChangeModal || !changeTargetId) return;
    setIsSubmitting(true);
    try {
      await api.sendShiftChangeRequest({
        fromStaffId: showChangeModal.employeeId,
        fromShiftId: showChangeModal.id,
        toStaffId: changeTargetId,
        note: changeNote,
      });
      setShowChangeModal(null);
      setChangeTargetId('');
      setChangeNote('');
      triggerRefresh();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAccRej = async (id: string, action: 'accept' | 'reject') => {
    try {
      setActionInProgress(id);
      if (action === 'accept') await api.acceptShiftChangeRequest(id);
      else await api.rejectShiftChangeRequest(id);
      triggerRefresh();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this scheduled shift? Anyone working this slot will be unassigned.')) {
      try {
        await api.deleteShift(id);
        triggerRefresh();
      } catch (err) {
        alert((err as Error).message);
      }
    }
  };

  const pendingChangeRequests = changeRequests.filter((r) => r.status === 'pending');
  const resolvedChangeRequests = changeRequests.filter((r) => r.status !== 'pending');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            {isIndustry ? 'Industry Shift Management' : 'Shift Management'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isIndustry
              ? 'Three shift categories: Morning, Evening, Night — with worker self-service shift change (proxy-style) workflow.'
              : 'Workforce shift allocation, line balancing, skills compliance, and conflict detection.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 dark:border-slate-800 dark:bg-slate-900">
            <Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-semibold text-slate-900 focus:outline-none dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-700"
          >
            <Plus className="h-4 w-4" />
            <span>Schedule Shift</span>
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="grid grid-cols-3 gap-2">
        {(Object.keys(SHIFT_CATEGORIES) as ShiftCategory[]).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-xs font-bold transition-all ${
              activeCategory === cat
                ? CATEGORY_STYLES[cat].tab + ' shadow-sm'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400'
            }`}
          >
            {CATEGORY_STYLES[cat].icon}
            <span>
              {SHIFT_CATEGORIES[cat].label}{' '}
              <span className="opacity-70">({SHIFT_CATEGORIES[cat].startTime.slice(0, 5)}–{SHIFT_CATEGORIES[cat].endTime.slice(0, 5)})</span>
            </span>
            <span className="rounded-full bg-white/70 px-1.5 py-0.5 text-[9px] font-black dark:bg-slate-950/50">
              {categoryCounts[cat]}
            </span>
          </button>
        ))}
      </div>

      {/* Shifts Listing for active category */}
      {visibleShifts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <Factory className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
          <h3 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
            No {SHIFT_CATEGORIES[activeCategory].label} shifts on {selectedDate}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Click 'Schedule Shift' to assign a worker to the {SHIFT_CATEGORIES[activeCategory].label} ({SHIFT_CATEGORIES[activeCategory].startTime} – {SHIFT_CATEGORIES[activeCategory].endTime}) slot.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visibleShifts.map((shift) => {
            const style = CATEGORY_STYLES[activeCategory];
            return (
              <div
                key={shift.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-amber-300 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between">
                  <span className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-bold ${style.chip}`}>
                    {style.icon}
                    <span>{shift.startTime} - {shift.endTime}</span>
                  </span>
                  <button
                    onClick={() => handleDelete(shift.id)}
                    className="rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                    title="Delete shift"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <h3 className="mt-3 flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-xs font-black text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {shift.employeeName.charAt(0)}
                  </span>
                  {shift.employeeName}
                </h3>
                <div className="text-[11px] font-semibold text-slate-400">{shift.role} • {shift.employeeCustomId}</div>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Department:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">{shift.department}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <MapPin className="h-3 w-3" />
                    <span>{shift.location || 'Main Floor'}</span>
                  </div>
                  {shift.status !== 'scheduled' && (
                    <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      {shift.status}
                    </span>
                  )}
                </div>

                {isIndustry && (
                  <button
                    onClick={() => {
                      setShowChangeModal(shift);
                      setChangeTargetId('');
                      setChangeNote('');
                    }}
                    className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900/60 dark:bg-indigo-950/50 dark:text-indigo-300 dark:hover:bg-indigo-950"
                  >
                    <ArrowRightLeft className="h-3.5 w-3.5" />
                    <span>Request Shift Change</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Shift Change Requests (mutual swaps, proxy-style workflow) */}
      {isIndustry && (
        <div className="rounded-2xl border border-indigo-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <RotateCw className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Shift Change Requests ({pendingChangeRequests.length} pending)
              </h2>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">Worker-to-worker shift swaps • live on worker dashboards</span>
          </div>

          {changeRequests.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-slate-200 p-8 text-center dark:border-slate-800">
              <Send className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
              <h3 className="mt-2 text-xs font-bold text-slate-900 dark:text-white">No Shift Change Requests</h3>
              <p className="mt-1 text-xs text-slate-500">
                Workers can request a shift change with any other worker from their personal workspace, or use 'Request Shift Change' on a shift card.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {changeRequests.map((req) => (
                <div
                  key={req.id}
                  className={`flex flex-col justify-between gap-3 rounded-xl border p-3.5 sm:flex-row sm:items-center ${
                    req.status === 'pending'
                      ? 'border-indigo-200 bg-indigo-50/50 dark:border-indigo-900/60 dark:bg-indigo-950/30'
                      : req.status === 'accepted'
                      ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/60 dark:bg-emerald-950/20'
                      : 'border-rose-200 bg-rose-50/40 dark:border-rose-900/60 dark:bg-rose-950/20'
                  }`}
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-bold text-slate-900 dark:text-white">{req.fromStaffName}</span>
                      <ArrowRightLeft className={`h-3.5 w-3.5 ${req.status === 'pending' ? 'animate-pulse text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                      <span className="font-bold text-slate-900 dark:text-white">{req.toStaffName}</span>
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
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                      <span>{req.shift.date}</span>
                      <span>•</span>
                      <span>{SHIFT_CATEGORIES[req.shift.category]?.label || req.shift.category} ({req.shift.startTime}–{req.shift.endTime})</span>
                      <span>•</span>
                      <span>{req.shift.role} • {req.shift.department}</span>
                    </div>
                    {req.note && <div className="mt-1 text-[11px] italic text-slate-500">"{req.note}"</div>}
                  </div>

                  <div className="flex items-center gap-2">
                    {req.status === 'pending' && (
                      <>
                        <button
                          disabled={actionInProgress === req.id}
                          onClick={() => handleAccRej(req.id, 'accept')}
                          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Accept
                        </button>
                        <button
                          disabled={actionInProgress === req.id}
                          onClick={() => handleAccRej(req.id, 'reject')}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:border-slate-700 dark:bg-slate-800 disabled:opacity-50"
                        >
                          Decline
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Schedule Shift Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Schedule Industry Shift</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Select Employee</label>
                <select
                  required
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-750 dark:bg-slate-800 dark:text-slate-100"
                >
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.department} - {s.employeeId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Shift Category</label>
                <div className="mt-1 grid grid-cols-3 gap-2">
                  {(Object.keys(SHIFT_CATEGORIES) as ShiftCategory[]).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`flex items-center justify-center gap-1 rounded-lg border px-2 py-2 text-[11px] font-bold ${
                        category === cat
                          ? CATEGORY_STYLES[cat].tab
                          : 'border-slate-200 bg-white text-slate-500 dark:border-slate-750 dark:bg-slate-800'
                      }`}
                    >
                      {CATEGORY_STYLES[cat].icon}
                      {SHIFT_CATEGORIES[cat].label}
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-[10px] text-slate-400">
                  {SHIFT_CATEGORIES[category].label}: {SHIFT_CATEGORIES[category].startTime} – {SHIFT_CATEGORIES[category].endTime}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Department / Line</label>
                  <input
                    type="text"
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-750 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Role</label>
                  <input
                    type="text"
                    required
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-750 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Floor Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-750 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-750 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-amber-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Scheduling...' : 'Schedule Shift'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                <div className="font-bold text-slate-900 dark:text-white">{showChangeModal.employeeName}</div>
                <div className="mt-0.5 text-slate-500">
                  {SHIFT_CATEGORIES[showChangeModal.category || (showChangeModal.startTime < '13:00' ? 'morning' : showChangeModal.startTime < '21:00' ? 'evening' : 'night')]?.label} shift • {showChangeModal.date} • {showChangeModal.startTime}–{showChangeModal.endTime}
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
                  {staffList
                    .filter((s) => s.id !== showChangeModal.employeeId)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.department} - {s.employeeId})
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
                  placeholder="e.g. Need to leave early that day, would prefer your slot."
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-750 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="flex items-start gap-2 rounded-lg bg-indigo-50 p-2.5 text-[11px] text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  The selected worker will be notified in their workspace and can Accept or Decline. On accept, matching
                  shifts are swapped automatically; otherwise your slot is transferred.
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
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  {isSubmitting ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};