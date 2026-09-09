import React, { useState, useEffect } from 'react';
import { Calendar, Clock, GraduationCap, User, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

export const TodayBoardPage: React.FC = () => {
  const { refreshKey } = useApp();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.getTodayTimetable();
      setData(res);
    } catch (err) {
      console.error('Failed to load today lectures', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [refreshKey]);

  const lectures = data?.lectures || [];
  const coveredBy = (lec: any) => (lec.facultyId === 'unassigned' ? null : lec.faculty);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            Today's Lectures
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            {data?.day || 'Today'} • {data?.date || ''} — every lecture happening across the organization
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 dark:border-slate-800 dark:bg-slate-800">
          <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
            {lectures.length} Lecture(s) Today
          </span>
        </div>
      </div>

      {loading && !data ? (
        <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-12 dark:border-slate-800 dark:bg-slate-900">
          <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
        </div>
      ) : lectures.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-xs text-slate-400 dark:border-slate-800 dark:bg-slate-900">
          No lectures scheduled today.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/60">
              <tr>
                <th className="px-4 py-3 font-bold text-slate-500 dark:text-slate-400">Time</th>
                <th className="px-4 py-3 font-bold text-slate-500 dark:text-slate-400">Subject</th>
                <th className="px-4 py-3 font-bold text-slate-500 dark:text-slate-400">Professor</th>
                <th className="px-4 py-3 font-bold text-slate-500 dark:text-slate-400">Class / Section</th>
                <th className="px-4 py-3 font-bold text-slate-500 dark:text-slate-400">Room</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {lectures.map((lec: any) => {
                const fac = coveredBy(lec);
                return (
                  <tr key={lec.id}>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 font-bold text-indigo-600 dark:text-indigo-400">
                        <Clock className="h-3 w-3" />
                        {lec.startTime} - {lec.endTime}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">{lec.subject}</td>
                    <td className="px-4 py-3">
                      {fac ? (
                        <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                          <User className="h-3 w-3 text-slate-400" />
                          {fac.name}
                          <span className="text-[10px] text-slate-400">({fac.employeeId})</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">Unassigned / TBA</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {lec.classGrade} ({lec.section})
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{lec.room}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};