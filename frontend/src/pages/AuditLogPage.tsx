import React, { useState, useEffect } from 'react';
import { History, Shield, RefreshCw, Layers, CheckCircle2, User, Clock } from 'lucide-react';
import { api } from '../services/api';
import { AuditLogItem } from '../types';

export const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadLogs = async () => {
    try {
      setIsLoading(true);
      const res = await api.getAuditLogs();
      setLogs(res.logs || []);
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Audit Trail & System Logs</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Immutable log of all operational events: attendance records, proxy dispatches, acceptances, and configuration changes.
          </p>
        </div>
        <button
          onClick={loadLogs}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-750 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        {logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No audit logs recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Entity</th>
                  <th className="px-4 py-3">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3 text-slate-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{log.actor}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-indigo-50 px-2 py-0.5 font-mono text-[10px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{log.entity}</td>
                    <td className="px-4 py-3 text-[11px] text-slate-500 font-mono">
                      {JSON.stringify(log.metadata || {})}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
