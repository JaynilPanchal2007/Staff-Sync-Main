import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  GraduationCap,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCcw,
  BookOpen,
  Bell,
  ArrowRight,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { StaffMember, TimetableEntry, ProxyRequest, NotificationItem } from '../types';

export const FacultyDashboardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { refreshKey, triggerRefresh, showToast } = useApp();

  const [facultyData, setFacultyData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [exchangeFor, setExchangeFor] = useState<TimetableEntry | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const loadFaculty = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const data = await api.getFacultyDashboard(id);
      setFacultyData(data);
    } catch (err) {
      console.error('Failed to load faculty dashboard', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFaculty();
  }, [id, refreshKey]);

  const runAction = async (fn: () => Promise<any>, okMsg: string) => {
    try {
      const res = await fn();
      if (res.success) {
        showToast(okMsg, 'success');
        triggerRefresh();
      }
      return res;
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleExchange = async (targetFacultyId: string) => {
    if (!exchangeFor) return;
    await runAction(
      () => api.createExchange({ sourceTimetableId: exchangeFor.id, targetFacultyId }),
      'Exchange request sent to the professor.'
    );
    setExchangeFor(null);
  };

  if (isLoading && !facultyData) {
    return <div className="p-12 text-center text-xs text-slate-500">Loading personalized faculty workspace...</div>;
  }

  const staff: StaffMember = facultyData?.faculty;
  const todayLectures: (TimetableEntry & { isProxyDuty?: boolean; absentStaffName?: string })[] =
    facultyData?.today?.schedule || [];
  const incomingRequests: ProxyRequest[] = facultyData?.proxy?.pending || [];
  const acceptedProxyDuties: ProxyRequest[] = facultyData?.proxy?.accepted || [];
  const exchangeRequests: any[] = facultyData?.exchangeRequests || [];
  const notifications: NotificationItem[] = facultyData?.notifications || [];
  const colleagues: any[] = facultyData?.colleagues || [];
  const todayName = facultyData?.today?.dayName || 'Monday';

  if (!staff) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Faculty Member Not Found</h3>
        <p className="mt-1 text-xs text-slate-500">Please select a valid faculty member from the directory.</p>
        <Link to="/staff" className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white">
          Return to Staff Directory
        </Link>
      </div>
    );
  }

  const LectureCard = ({
    lec,
    action,
  }: {
    lec: TimetableEntry & { isProxyDuty?: boolean; absentStaffName?: string };
    action?: React.ReactNode;
  }) => (
    <div
      className={`flex items-center justify-between rounded-xl border p-4 transition-all ${
        lec.isProxyDuty
          ? 'border-indigo-300 bg-gradient-to-r from-indigo-50/90 to-purple-50/50 shadow-xs dark:border-indigo-800 dark:from-indigo-950/60 dark:to-slate-900'
          : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
      }`}
    >
      <div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-900 dark:text-white">{lec.subject}</span>
          <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
            {lec.startTime} - {lec.endTime}
          </span>
          {lec.isProxyDuty && (
            <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              <Sparkles className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              Proxy Duty for {lec.absentStaffName || 'Absent Faculty'}
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
          <span>Room: {lec.room || 'Hall A'}</span>
          <span>•</span>
          <span>Class: {lec.classGrade} ({lec.section})</span>
        </div>
      </div>
      {action}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Identity Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 font-extrabold text-xl text-white shadow-md shadow-indigo-600/30">
            {staff.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{staff.name}</h1>
              <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                {staff.employeeId}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {staff.role} • {staff.department} Department • Personal Faculty Workspace
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-center dark:border-slate-800 dark:bg-slate-800">
            <div className="text-lg font-bold text-slate-900 dark:text-white">
              {staff.assignedLectures || 0} / {staff.maxWorkload || 18}
            </div>
            <div className="text-[10px] font-semibold text-slate-500">Workload Cap</div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-center dark:border-slate-800 dark:bg-slate-800">
            <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{staff.proxyCount || 0}</div>
            <div className="text-[10px] font-semibold text-slate-500">Proxies Covered</div>
          </div>
        </div>
      </div>

      {/* Incoming Exchange Requests */}
      {exchangeRequests.length > 0 && (
        <div className="rounded-2xl border border-violet-200 bg-violet-50/70 p-6 dark:border-violet-900/60 dark:bg-violet-950/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCcw className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Lecture Exchange Proposals ({exchangeRequests.length})
              </h2>
            </div>
            <span className="text-xs font-semibold text-violet-600 dark:text-violet-400">
              A professor wants to swap a lecture slot with you
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {exchangeRequests.map((req) => (
              <div
                key={req.id}
                className="flex flex-col justify-between gap-4 rounded-xl border border-white/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {req.sourceFacultyName} wants to swap "{req.subject || 'Lecture'}"
                    </span>
                    <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                      {req.day} {req.startTime} - {req.endTime}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    They'll take your slot in return. If accepted, both professors' schedules are swapped.
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={actionInProgress === req.id}
                    onClick={() =>
                      runAction(() => api.acceptExchange(req.id), 'Lecture exchange accepted!')
                    }
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Accept Swap
                  </button>
                  <button
                    disabled={actionInProgress === req.id}
                    onClick={() => runAction(() => api.rejectExchange(req.id), 'Exchange declined.')}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:border-slate-800 dark:bg-slate-800 dark:hover:bg-rose-950/40 disabled:opacity-50"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Incoming Replacement Requests from Gaps */}
      {incomingRequests.length > 0 && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-6 dark:border-indigo-900/60 dark:bg-indigo-950/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Pending Proxy / Replacement Requests ({incomingRequests.length})
              </h2>
            </div>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              Action required: Accept or Decline
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
                      Covering: {req.workDetails?.subject}
                    </span>
                    <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                      For: {req.fromStaffName}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {req.workDetails?.date} ({req.workDetails?.day})
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {req.workDetails?.startTime} - {req.workDetails?.endTime}
                    </span>
                    {req.workDetails?.room && <span>Room: {req.workDetails?.room}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={actionInProgress === req.id}
                    onClick={() => runAction(() => api.acceptProxyRequest(req.id), 'Replacement accepted!')}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Accept Replacement
                  </button>
                  <button
                    disabled={actionInProgress === req.id}
                    onClick={() => runAction(() => api.rejectProxyRequest(req.id), 'Replacement declined.')}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:border-slate-800 dark:bg-slate-800 dark:hover:bg-rose-950/40 disabled:opacity-50"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today's Schedule + Notifications */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 lg:col-span-8">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Today's Schedule ({todayName})
              </h3>
              <p className="text-xs text-slate-500">Request a lecture swap with any colleague directly from here</p>
            </div>
            <span className="rounded-md bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              {todayLectures.length} Session(s)
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {todayLectures.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No lectures scheduled for {todayName}. You have a free teaching day!
              </div>
            ) : (
              todayLectures.map((lec) => (
                <div key={lec.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                  <LectureCard
                    lec={lec}
                    action={
                      <div className="relative">
                        <button
                          onClick={() => setExchangeFor(exchangeFor?.id === lec.id ? null : lec)}
                          className="flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700 hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-300"
                        >
                          <RefreshCcw className="h-3.5 w-3.5" />
                          Exchange
                          <ChevronDown className="h-3 w-3" />
                        </button>
                        {exchangeFor?.id === lec.id && (
                          <div className="absolute right-0 top-full z-20 mt-1 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                            <p className="px-2 py-1 text-[11px] font-bold text-slate-500">
                              Swap with which professor?
                            </p>
                            <div className="max-h-48 overflow-y-auto">
                              {colleagues.length === 0 && (
                                <p className="px-2 py-2 text-[11px] text-slate-400">No colleagues available.</p>
                              )}
                              {colleagues.map((c) => (
                                <button
                                  key={c.id}
                                  onClick={() => handleExchange(c.id)}
                                  className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                                >
                                  <span className="font-semibold">{c.name}</span>
                                  <span className="text-[10px] text-slate-400">{c.employeeId}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    }
                  />
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6 lg:col-span-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Faculty Notifications
              </h3>
            </div>
            <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-[11px] text-slate-400">No personal notifications.</div>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className="rounded-lg border border-slate-100 p-2.5 text-xs dark:border-slate-800">
                    <div className="font-bold text-slate-800 dark:text-slate-200">{n.title}</div>
                    <div className="mt-0.5 text-[11px] text-slate-500">{n.message}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};