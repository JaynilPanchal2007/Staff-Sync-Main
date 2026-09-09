import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  BarChart3,
  TrendingUp,
  CheckCircle2,
  Users,
  AlertTriangle,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

export const ReportsPage: React.FC = () => {
  const { orgType, refreshKey } = useApp();
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadReports = async () => {
    try {
      setIsLoading(true);
      const data = await api.getReports();
      setReportData(data);
    } catch (err) {
      console.error('Failed to load reports', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [refreshKey]);

  const summary = reportData?.summary || {
    totalStaff: 0,
    overallAttendanceRate: 100,
    totalGapsRecorded: 0,
    resolvedGapsCount: 0,
    gapResolutionRate: 100,
    totalProxiesHandled: 0,
  };

  const departmentStats = reportData?.departmentStats || [];
  const proxyFrequency = reportData?.proxyFrequency || [];

  return (
    <div className="space-y-6">
      {/* Header & CSV Export */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Reports & Analytics</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Workforce attendance rates, department workloads, proxy fairness balance, and gap resolution metrics.
          </p>
        </div>

        <a
          href="/api/reports/export/csv"
          download="staffsync-workforce-report.csv"
          className="flex items-center gap-1.5 self-start rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Export CSV Report</span>
        </a>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-semibold text-slate-500">Overall Attendance Rate</span>
          <div className="mt-2 text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {summary.overallAttendanceRate}%
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Calculated from recorded attendance</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-semibold text-slate-500">Gap Resolution Rate</span>
          <div className="mt-2 text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
            {summary.gapResolutionRate}%
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {summary.resolvedGapsCount} of {summary.totalGapsRecorded} gaps covered
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-semibold text-slate-500">Total Proxies Handled</span>
          <div className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">
            {summary.totalProxiesHandled}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Accepted replacements</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-semibold text-slate-500">Total Registered Personnel</span>
          <div className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">
            {summary.totalStaff}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Active roster members</div>
        </div>
      </div>

      {/* Two Column Layout: Department Breakdown & Proxy Fairness Table */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Department Attendance & Workload */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Department Workforce Metrics</h2>
          <p className="mt-0.5 text-xs text-slate-500">Personnel distribution and total assigned workload</p>

          <div className="mt-4 space-y-3">
            {departmentStats.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No department statistics available yet.</div>
            ) : (
              departmentStats.map((dept: any) => (
                <div
                  key={dept.department}
                  className="rounded-xl border border-slate-100 p-3 dark:border-slate-800"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{dept.department}</span>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {dept.staffCount} Staff Members
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Assigned Workload: {dept.workload} hrs/lectures</span>
                    <span>
                      {dept.present} Present / {dept.absent} Absent
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Proxy Fairness / Frequency Leaderboard */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Proxy & Replacement Fairness Tracking</h2>
          <p className="mt-0.5 text-xs text-slate-500">Ensures proxies are evenly distributed without burning out staff</p>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-850">
                <tr>
                  <th className="px-3 py-2">Staff Member</th>
                  <th className="px-3 py-2">Department</th>
                  <th className="px-3 py-2">Proxies Accepted</th>
                  <th className="px-3 py-2">Base Workload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {proxyFrequency.map((item: any) => (
                  <tr key={item.employeeId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-3 py-2.5 font-bold text-slate-900 dark:text-white">{item.name}</td>
                    <td className="px-3 py-2.5 text-slate-500">{item.department}</td>
                    <td className="px-3 py-2.5">
                      <span className="rounded-full bg-indigo-50 px-2 py-0.5 font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                        {item.proxyCount}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-semibold text-slate-700 dark:text-slate-300">{item.workload}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
