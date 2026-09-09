import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  BrainCircuit,
  AlertTriangle,
  CheckCircle2,
  Send,
  UserCheck,
  Award,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { StaffingGap, ReplacementCandidate, ProxyRequest } from '../types';

export const SmartAdjustmentPage: React.FC = () => {
  const { orgType, refreshKey, triggerRefresh } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();

  const [gaps, setGaps] = useState<StaffingGap[]>([]);
  const [selectedGapId, setSelectedGapId] = useState<string | null>(searchParams.get('gapId'));
  const [selectedGap, setSelectedGap] = useState<StaffingGap | null>(null);
  const [candidates, setCandidates] = useState<ReplacementCandidate[]>([]);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [sendingRequestId, setSendingRequestId] = useState<string | null>(null);
  const [sentSuccess, setSentSuccess] = useState<string | null>(null);

  // Load active gaps
  const loadGaps = async () => {
    try {
      setIsLoading(true);
      const data = await api.getGaps();
      setGaps(data.gaps || []);

      const targetId = selectedGapId || (data.gaps.length > 0 ? data.gaps[0].id : null);
      if (targetId) {
        setSelectedGapId(targetId);
        loadGapDetails(targetId);
      } else {
        setSelectedGap(null);
        setCandidates([]);
        setAiInsight(null);
      }
    } catch (err) {
      console.error('Failed to load staffing gaps', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadGapDetails = async (id: string) => {
    try {
      setIsEvaluating(true);
      const data = await api.getGapDetails(id);
      setSelectedGap(data.gap);
      setCandidates(data.evaluation?.candidates || []);
      setAiInsight(data.evaluation?.aiInsight || null);
    } catch (err) {
      console.error('Failed to evaluate gap details', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  useEffect(() => {
    loadGaps();
  }, [refreshKey]);

  const handleSelectGap = (gap: StaffingGap) => {
    setSelectedGapId(gap.id);
    setSearchParams({ gapId: gap.id });
    loadGapDetails(gap.id);
    setSentSuccess(null);
  };

  const handleSendRequest = async (candidate: ReplacementCandidate) => {
    if (!selectedGap) return;
    try {
      setSendingRequestId(candidate.staffId);
      const res = await api.sendProxyRequest({
        gapId: selectedGap.id,
        targetStaffId: candidate.staffId,
        matchScore: candidate.matchScore,
        reasons: candidate.reasons,
      });

      if (res.success) {
        setSentSuccess(candidate.staffName);
        triggerRefresh();
        loadGapDetails(selectedGap.id);
      }
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSendingRequestId(null);
    }
  };

  const handleSimulateAccept = async (proxyId: string) => {
    try {
      await api.acceptProxyRequest(proxyId);
      triggerRefresh();
      if (selectedGapId) loadGapDetails(selectedGapId);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const isIndustry = orgType === 'industry';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
              <BrainCircuit className="h-4 w-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Smart Adjustment Center</h1>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Explainable AI decision engine: Evaluates availability, subject/skill compatibility, conflicts, workload,
            and fairness in real time.
          </p>
        </div>

        <button
          onClick={() => triggerRefresh()}
          className="flex items-center gap-1.5 self-start rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-750 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isEvaluating ? 'animate-spin text-indigo-600' : ''}`} />
          <span>Re-evaluate Candidates</span>
        </button>
      </div>

      {/* Main Grid: Left Gaps List, Right Candidate Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Staffing Gaps List (5 cols) */}
        <div className="space-y-3 lg:col-span-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Active Gaps ({gaps.length})
            </span>
            <Link
              to="/attendance"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
            >
              + Mark Absence
            </Link>
          </div>

          {gaps.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />
              <div className="mt-3 text-sm font-bold text-slate-900 dark:text-white">Zero Staffing Gaps</div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                All scheduled work is currently covered by active personnel.
              </p>
              <div className="mt-4">
                <Link
                  to="/attendance"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700"
                >
                  <span>Mark Faculty/Employee Absent to Test</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {gaps.map((gap) => {
                const isSelected = gap.id === selectedGapId;
                const isResolved = gap.status === 'resolved' || gap.status === 'accepted';
                const isSent = gap.status === 'request_sent';

                return (
                  <div
                    key={gap.id}
                    onClick={() => handleSelectGap(gap)}
                    className={`cursor-pointer rounded-xl border p-4 transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 shadow-xs ring-1 ring-indigo-600/30 dark:border-indigo-500 dark:bg-indigo-950/40'
                        : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          {gap.subject || gap.role || 'Unspecified Work'}
                        </div>
                        <div className="mt-0.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
                          {gap.absentStaffName} ({gap.department || 'General'})
                        </div>
                      </div>

                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          isResolved
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : isSent
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {gap.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {gap.startTime} - {gap.endTime}
                      </span>
                      <span>{gap.date}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Selected Gap Details & Candidate Scoring (8 cols) */}
        <div className="lg:col-span-8">
          {!selectedGap ? (
            <div className="flex h-72 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
              <div className="text-xs text-slate-400">Select a staffing gap on the left to review recommendations</div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Gap Header Card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                        Absent: {selectedGap.absentStaffName}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Date: {selectedGap.date} ({selectedGap.day})
                      </span>
                    </div>
                    <h2 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                      {selectedGap.subject || selectedGap.role}
                    </h2>
                    <div className="mt-1 flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
                      <span>Time: {selectedGap.startTime} - {selectedGap.endTime}</span>
                      {selectedGap.room && <span>Location: {selectedGap.room}</span>}
                      {selectedGap.classGrade && <span>Class: {selectedGap.classGrade} - {selectedGap.section}</span>}
                      <span>Department: {selectedGap.department}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300">
                      {candidates.length} Eligible Candidate(s) Evaluated
                    </span>
                  </div>
                </div>

                {/* Status Notice */}
                {selectedGap.status === 'resolved' && (
                  <div className="mt-4 flex items-center justify-between rounded-xl bg-emerald-50 p-3 text-xs font-medium text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>
                        Resolved! Proxy covered by <strong>{selectedGap.resolvedByStaffName}</strong>.
                      </span>
                    </div>
                    <span className="rounded bg-emerald-200/60 px-2 py-0.5 text-[10px] font-bold dark:bg-emerald-900">
                      SYNCHRONIZED
                    </span>
                  </div>
                )}

                {selectedGap.status === 'request_sent' && (
                  <div className="mt-4 flex flex-col justify-between gap-2 rounded-xl bg-blue-50 p-3 text-xs font-medium text-blue-900 dark:bg-blue-950/40 dark:text-blue-200 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span>
                        Request dispatched to <strong>{selectedGap.assignedTargetStaffName}</strong> (Pending acceptance).
                      </span>
                    </div>
                    {selectedGap.proxyRequestId && (
                      <button
                        onClick={() => handleSimulateAccept(selectedGap.proxyRequestId!)}
                        className="self-start rounded-lg bg-blue-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-blue-700"
                      >
                        Simulate Staff Acceptance →
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Gemini AI Strategic Insight Card */}
              {aiInsight && (
                <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50/90 via-purple-50/50 to-white p-4 font-sans shadow-xs dark:border-indigo-900/50 dark:from-indigo-950/40 dark:via-slate-900 dark:to-slate-900">
                  <div className="flex items-center gap-2 font-bold text-xs text-indigo-900 dark:text-indigo-200">
                    <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                    <span>Gemini AI Strategic Adjustment Insight</span>
                    <span className="ml-auto rounded-full bg-indigo-600/10 px-2.5 py-0.5 text-[10px] font-extrabold text-indigo-700 dark:bg-indigo-400/20 dark:text-indigo-300">
                      Gemini 3.6 Flash Active
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed font-medium text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                    {aiInsight}
                  </p>
                </div>
              )}

              {/* Ranked Replacement Candidates */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                    Ranked Replacement Recommendations
                  </h3>
                  <span className="text-xs text-slate-500">Ranked by explainable multi-factor score</span>
                </div>

                {candidates.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
                    <AlertTriangle className="mx-auto h-8 w-8 text-amber-500" />
                    <h4 className="mt-2 text-xs font-bold text-slate-900 dark:text-white">
                      No Available Candidates Fit Constraints
                    </h4>
                    <p className="mt-1 text-xs text-slate-500">
                      All other staff members have timetable conflicts, are on leave, or are marked absent during this
                      slot.
                    </p>
                  </div>
                ) : (
                  candidates.map((c, index) => {
                    const isTopMatch = index === 0;

                    return (
                      <div
                        key={c.staffId}
                        className={`rounded-2xl border p-5 shadow-xs transition-all ${
                          isTopMatch
                            ? 'border-indigo-200 bg-gradient-to-b from-indigo-50/40 to-white dark:border-indigo-900/60 dark:from-slate-900 dark:to-slate-900'
                            : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
                        }`}
                      >
                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                          <div className="flex items-start gap-3">
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-extrabold text-sm ${
                                isTopMatch
                                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                              }`}
                            >
                              #{index + 1}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-base font-bold text-slate-900 dark:text-white">{c.staffName}</h4>
                                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                  {c.employeeId}
                                </span>
                                {isTopMatch && (
                                  <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                    <Sparkles className="h-3 w-3" /> Best Recommendation
                                  </span>
                                )}
                              </div>
                              <p className="mt-0.5 text-xs text-slate-500">
                                {c.role} • {c.department} • Workload: {c.currentWorkload} assigned
                              </p>
                            </div>
                          </div>

                          {/* Score Badge & Action Button */}
                          <div className="flex items-center gap-3 self-end sm:self-auto">
                            <div className="text-right">
                              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                                {c.matchScore}%
                              </div>
                              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                Match Score
                              </div>
                            </div>

                            <button
                              onClick={() => handleSendRequest(c)}
                              disabled={sendingRequestId === c.staffId || selectedGap.status === 'resolved'}
                              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-indigo-600/30 transition-all hover:bg-indigo-700 disabled:opacity-50"
                            >
                              <Send className="h-3.5 w-3.5" />
                              <span>
                                {sendingRequestId === c.staffId
                                  ? 'Sending...'
                                  : selectedGap.status === 'request_sent' &&
                                    selectedGap.assignedTargetStaffId === c.staffId
                                  ? 'Request Sent'
                                  : 'Assign Proxy'}
                              </span>
                            </button>
                          </div>
                        </div>

                        {/* Explainable Decision Factors */}
                        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-850">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Why StaffSync Selected This Candidate:
                          </div>
                          <ul className="mt-2 grid grid-cols-1 gap-1.5 text-xs text-slate-700 dark:text-slate-300 sm:grid-cols-2">
                            {c.reasons?.map((r, ri) => (
                              <li key={ri} className="flex items-center gap-1.5 font-medium">
                                <span className="text-emerald-500">{r}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Visual Breakdown Bars */}
                        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-[10px] text-slate-500 dark:border-slate-800 sm:grid-cols-6">
                          <div>
                            <span className="font-semibold">Compatibility:</span> {c.breakdown?.compatibility ?? '–'}/30
                          </div>
                          <div>
                            <span className="font-semibold">Availability:</span> {c.breakdown?.availability ?? '–'}/20
                          </div>
                          <div>
                            <span className="font-semibold">Conflict:</span> {c.breakdown?.conflict ?? '–'}/15
                          </div>
                          <div>
                            <span className="font-semibold">Workload:</span> {c.breakdown?.workload ?? '–'}/15
                          </div>
                          <div>
                            <span className="font-semibold">Fairness:</span> {c.breakdown?.fairness ?? '–'}/10
                          </div>
                          <div>
                            <span className="font-semibold">Experience:</span> {c.breakdown?.experience ?? '–'}/10
                          </div>
                        </div>

                        {/* Demo link to Staff view */}
                        <div className="mt-3 flex items-center justify-end gap-2 border-t border-slate-100 pt-2 text-[11px] text-slate-400 dark:border-slate-800">
                          <span>Verify personalized staff view:</span>
                          <Link
                            to={isIndustry ? `/employee/${c.staffId}` : `/faculty/${c.staffId}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                          >
                            <span>Open {c.staffName}'s Dashboard</span>
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
