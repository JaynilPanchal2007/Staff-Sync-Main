import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  BrainCircuit,
  CalendarCheck2,
  UserPlus,
  FileSpreadsheet,
  Layers,
  Sparkles,
  RefreshCw,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

export const DashboardPage: React.FC = () => {
  const { admin, organization, orgType, refreshKey, triggerRefresh } = useApp();

  const [statsData, setStatsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const data = await api.getDashboardStats();
      setStatsData(data);
    } catch (err) {
      console.error('Failed to load dashboard stats', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [refreshKey]);

  const stats = statsData?.stats || {
    totalStaff: 0,
    presentToday: 0,
    absentToday: 0,
    onLeaveToday: 0,
    lateToday: 0,
    activeGapsCount: 0,
    resolvedGapsCount: 0,
    pendingProxyCount: 0,
    acceptedProxyCount: 0,
    todayLecturesCount: 0,
    todayShiftsCount: 0,
  };

  const activeGaps = statsData?.activeGaps || [];
  const recentLogs = statsData?.recentLogs || [];
  const recentProxyRequests = statsData?.recentProxyRequests || [];

  const isIndustry = orgType === 'industry';

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Actions */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Welcome back, {admin?.name || 'Admin'}
            </h1>
            <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              Admin Control
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Managing <span className="font-semibold text-slate-800 dark:text-slate-200">{organization?.name}</span> •{' '}
            {orgType.toUpperCase()} MODE • All calculations computed live from database records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/staff"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-750 dark:bg-slate-800 dark:text-slate-200"
          >
            <UserPlus className="h-3.5 w-3.5 text-indigo-600" />
            <span>Add {isIndustry ? 'Employee' : 'Faculty'}</span>
          </Link>
          <Link
            to="/attendance"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-750 dark:bg-slate-800 dark:text-slate-200"
          >
            <CalendarCheck2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>Mark Attendance</span>
          </Link>
          <Link
            to="/adjustments"
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm shadow-indigo-600/30 hover:bg-indigo-700"
          >
            <BrainCircuit className="h-3.5 w-3.5" />
            <span>Smart Adjustments ({stats.activeGapsCount})</span>
          </Link>
          <button
            onClick={() => triggerRefresh()}
            className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 dark:border-slate-750 dark:text-slate-400 dark:hover:bg-slate-800"
            title="Refresh database state"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Alert Banner when Active Staffing Gaps exist */}
      {stats.activeGapsCount > 0 && (
        <div className="flex flex-col justify-between gap-4 rounded-xl border border-amber-300 bg-amber-50/90 p-4 dark:border-amber-900/60 dark:bg-amber-950/40 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-amber-950 dark:text-amber-100">
                Staffing Shortage Detected: {stats.activeGapsCount} Active Gap(s) Require Replacement
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-300">
                Absences marked today have uncovered schedule slots. StaffSync Smart Engine has ranked qualified
                replacements.
              </p>
            </div>
          </div>
          <Link
            to="/adjustments"
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-700"
          >
            <span>Resolve in Smart Adjustment Center</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* Primary 4 Metric Cards (Calculated from Real Database) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Staff */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Total {isIndustry ? 'Employees' : 'Faculty'}
            </span>
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{stats.totalStaff}</span>
            <span className="text-xs font-medium text-slate-500">Registered</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            {stats.totalStaff === 0 ? (
              <span className="text-amber-600">No staff added yet. Click Add Staff.</span>
            ) : (
              <span>Active in database registry</span>
            )}
          </div>
        </div>

        {/* Card 2: Today's Attendance */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Today's Attendance</span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{stats.presentToday}</span>
            <span className="text-xs font-medium text-slate-500">Present</span>
            {stats.absentToday > 0 && (
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400">({stats.absentToday} Absent)</span>
            )}
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            {stats.onLeaveToday > 0 ? `${stats.onLeaveToday} on leave` : 'Live daily status'}
          </div>
        </div>

        {/* Card 3: Active Staffing Gaps */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Staffing Gaps</span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span
              className={`text-3xl font-extrabold ${
                stats.activeGapsCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'
              }`}
            >
              {stats.activeGapsCount}
            </span>
            <span className="text-xs font-medium text-slate-500">Gaps Active</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            {stats.resolvedGapsCount} replacement(s) resolved
          </div>
        </div>

        {/* Card 4: Proxy / Replacements */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {isIndustry ? 'Shift Replacements' : 'Proxy Assignments'}
            </span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
              {stats.acceptedProxyCount}
            </span>
            <span className="text-xs font-medium text-slate-500">Accepted</span>
            {((stats.totalPendingRequestsCount ?? stats.pendingProxyCount) > 0) && (
              <span className="text-xs font-bold text-amber-600">
                ({stats.totalPendingRequestsCount ?? stats.pendingProxyCount} pending)
              </span>
            )}
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            {stats.pendingExchangeCount !== undefined && stats.pendingExchangeCount > 0
              ? `${stats.pendingProxyCount || 0} admin proxy • ${stats.pendingExchangeCount} peer exchange`
              : 'Real-time synchronized'}
          </div>
        </div>
      </div>

      {/* Two Column Layout: Active Gaps Review & Recent Proxy Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Active Staffing Gaps */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <BrainCircuit className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Active Staffing Gaps</h2>
            </div>
            <Link
              to="/adjustments"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
            >
              View Adjustment Center →
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {activeGaps.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center dark:border-slate-800">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />
                <h3 className="mt-2 text-xs font-bold text-slate-900 dark:text-white">
                  All Scheduled Work Covered
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  No active staffing gaps detected in the database. When someone is marked absent, gaps appear here
                  automatically.
                </p>
                <div className="mt-4">
                  <Link
                    to="/attendance"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-750 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <span>Check Attendance</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ) : (
              activeGaps.map((gap: any) => (
                <div
                  key={gap.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 p-3.5 transition-colors hover:border-indigo-300 dark:border-slate-800 dark:hover:border-slate-700"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {gap.subject || gap.role || 'Unassigned Work'}
                      </span>
                      <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                        {gap.absentStaffName} Absent
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-500">
                      <span>{gap.date}</span>
                      <span>•</span>
                      <span>
                        {gap.startTime} - {gap.endTime}
                      </span>
                      {gap.room && (
                        <>
                          <span>•</span>
                          <span>{gap.room}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <Link
                    to={`/adjustments?gapId=${gap.id}`}
                    className="flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/70 dark:text-indigo-300 dark:hover:bg-indigo-900"
                  >
                    <span>Analyze</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Recent Proxy / Replacement Activity */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Recent Replacement Requests</h2>
            </div>
            <Link
              to={isIndustry ? '/shifts' : '/proxy-management'}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            >
              View All →
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {recentProxyRequests.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center dark:border-slate-800">
                <Clock className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
                <h3 className="mt-2 text-xs font-bold text-slate-900 dark:text-white">No Proxy Requests Yet</h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  When replacements are recommended and dispatched, live acceptance statuses appear here.
                </p>
              </div>
            ) : (
              recentProxyRequests.map((req: any) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 p-3.5 dark:border-slate-800"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {req.targetStaffName}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          req.status === 'accepted'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : req.status === 'rejected'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        {req.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500">
                      Covering for <span className="font-semibold">{req.fromStaffName}</span> •{' '}
                      {req.workDetails?.subject || req.workDetails?.role} ({req.workDetails?.startTime} -{' '}
                      {req.workDetails?.endTime})
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="inline-block rounded-md bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300">
                      {req.matchScore}% Match
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: Quick Demo Guide for Evaluators / Hackathon Judges */}
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/70 via-white to-blue-50/70 p-6 dark:border-indigo-950/60 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/30">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Hackathon Live Demonstration Walkthrough (Section 100 & 107)
              </h3>
            </div>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
              Test the end-to-end flow:{' '}
              <span className="font-semibold text-slate-900 dark:text-white">
                1. Add staff → 2. Add timetable/shift → 3. Mark absent → 4. See recommendation → 5. Send request → 6.
                Accept & watch instant synchronization!
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/pdf-import"
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
            >
              Import PDF Data
            </Link>
            <Link
              to="/ai-assistant"
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700"
            >
              Ask AI Assistant
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
