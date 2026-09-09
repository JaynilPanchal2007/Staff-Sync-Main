import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck2,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Coffee,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Search,
  Filter,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { StaffMember, AttendanceRecord, StaffingGap } from '../types';

export const AttendancePage: React.FC = () => {
  const { orgType, refreshKey, triggerRefresh } = useApp();

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [recentGapAlert, setRecentGapAlert] = useState<{ name: string; gaps: StaffingGap[] } | null>(null);

  const isIndustry = orgType === 'industry';

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [staffRes, attRes] = await Promise.all([
        api.getStaff(),
        api.getAttendance(selectedDate),
      ]);
      setStaffList(staffRes.staff || []);
      setAttendanceRecords(attRes.records || []);
    } catch (err) {
      console.error('Failed to load attendance data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate, refreshKey]);

  const handleStatusChange = async (staff: StaffMember, newStatus: string) => {
    try {
      setUpdatingId(staff.id);
      setRecentGapAlert(null);
      const res = await api.setAttendance({
        staffId: staff.id,
        status: newStatus,
        date: selectedDate,
      });

      if (res.success) {
        // Update local records
        setAttendanceRecords((prev) => {
          const filtered = prev.filter((r) => r.staffId !== staff.id && r.staffId !== staff.employeeId);
          return [...filtered, res.attendance];
        });

        // If gaps were created because staff was absent, show notification banner!
        if (res.gapsCreated && res.gapsCreated.length > 0) {
          setRecentGapAlert({
            name: staff.name,
            gaps: res.gapsCreated,
          });
        }

        triggerRefresh();
      }
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusForStaff = (staffId: string) => {
    const record = attendanceRecords.find(
      (r) => r.staffId === staffId || r.employeeId === staffId
    );
    return record ? record.status : 'present'; // default present
  };

  const departments = Array.from(new Set(staffList.map((s) => s.department).filter(Boolean)));

  const filteredStaff = staffList.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.employeeId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDept === 'all' || s.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  const presentCount = attendanceRecords.filter((r) => r.status === 'present').length;
  const absentCount = attendanceRecords.filter((r) => r.status === 'absent').length;
  const onLeaveCount = attendanceRecords.filter((r) => r.status === 'on_leave').length;
  const lateCount = attendanceRecords.filter((r) => r.status === 'late').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Daily Attendance Matrix</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Mark status in real time. Marking someone Absent immediately flags scheduled lectures/shifts and creates
            staffing gaps.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 dark:border-slate-800 dark:bg-slate-900">
            <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-semibold text-slate-900 focus:outline-none dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
        </div>
      </div>

      {/* Gap Detection Banner Alert */}
      {recentGapAlert && (
        <div className="flex flex-col justify-between gap-3 rounded-xl border border-rose-300 bg-rose-50 p-4 text-rose-950 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-100 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-600 text-white shadow-xs">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold">
                {recentGapAlert.gaps.length} Staffing Gap(s) Automatically Triggered for {recentGapAlert.name}!
              </div>
              <div className="text-[11px] text-rose-800 dark:text-rose-300">
                StaffSync analyzed the schedule and identified uncovered slots. Qualified replacements have been ranked.
              </div>
            </div>
          </div>

          <Link
            to="/adjustments"
            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-rose-700"
          >
            <span>Open Smart Adjustment Center</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* Attendance Summary Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-semibold text-slate-500">Present</span>
          <div className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{presentCount}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-semibold text-slate-500">Absent</span>
          <div className="mt-1 text-2xl font-bold text-rose-600 dark:text-rose-400">{absentCount}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-semibold text-slate-500">On Leave</span>
          <div className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">{onLeaveCount}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-semibold text-slate-500">Late</span>
          <div className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">{lateCount}</div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or employee ID..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Staff Attendance Grid */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3">Personnel</th>
                <th className="px-4 py-3">Department & Role</th>
                <th className="px-4 py-3">Current Status</th>
                <th className="px-4 py-3 text-right">Quick Status Toggle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStaff.map((staff) => {
                const currentStatus = getStatusForStaff(staff.id);
                const isUpdating = updatingId === staff.id;

                return (
                  <tr key={staff.id} className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {staff.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{staff.name}</div>
                          <div className="text-[11px] text-slate-400">{staff.employeeId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-slate-700 dark:text-slate-200">{staff.department}</div>
                      <div className="text-[11px] text-slate-400">{staff.role}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                          currentStatus === 'present'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : currentStatus === 'absent'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                            : currentStatus === 'on_leave'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                        }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {currentStatus.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-2xs dark:border-slate-750 dark:bg-slate-800">
                        <button
                          disabled={isUpdating}
                          onClick={() => handleStatusChange(staff, 'present')}
                          className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                            currentStatus === 'present'
                              ? 'bg-emerald-600 text-white'
                              : 'text-slate-600 hover:text-emerald-600 dark:text-slate-300'
                          }`}
                        >
                          Present
                        </button>
                        <button
                          disabled={isUpdating}
                          onClick={() => handleStatusChange(staff, 'absent')}
                          className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                            currentStatus === 'absent'
                              ? 'bg-rose-600 text-white'
                              : 'text-slate-600 hover:text-rose-600 dark:text-slate-300'
                          }`}
                        >
                          Absent
                        </button>
                        <button
                          disabled={isUpdating}
                          onClick={() => handleStatusChange(staff, 'on_leave')}
                          className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                            currentStatus === 'on_leave'
                              ? 'bg-amber-500 text-white'
                              : 'text-slate-600 hover:text-amber-600 dark:text-slate-300'
                          }`}
                        >
                          Leave
                        </button>
                        <button
                          disabled={isUpdating}
                          onClick={() => handleStatusChange(staff, 'late')}
                          className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                            currentStatus === 'late'
                              ? 'bg-blue-600 text-white'
                              : 'text-slate-600 hover:text-blue-600 dark:text-slate-300'
                          }`}
                        >
                          Late
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
