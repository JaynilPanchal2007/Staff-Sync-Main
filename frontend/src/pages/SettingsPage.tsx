import React, { useState, useEffect } from 'react';
import {
  Settings,
  Database,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Building,
  Save,
  RefreshCw,
  Server,
  Zap,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

export const SettingsPage: React.FC = () => {
  const { admin, organization, dbStatus, triggerRefresh, setShowOrgModal } = useApp();

  const [mongoUri, setMongoUri] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectResult, setConnectResult] = useState<{ success: boolean; message: string } | null>(null);

  // Scoring weights state
  const [weights, setWeights] = useState({
    compatibility: 30,
    availability: 20,
    conflict: 15,
    workload: 15,
    fairness: 10,
    experience: 10,
  });

  const [isSavingWeights, setIsSavingWeights] = useState(false);
  const [weightsSaved, setWeightsSaved] = useState(false);

  useEffect(() => {
    api.getSettings().then((res) => {
      if (res.settings?.scoringWeights) {
        setWeights(res.settings.scoringWeights);
      }
    });
  }, []);

  const handleConnectMongo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mongoUri.trim()) return;
    setIsConnecting(true);
    setConnectResult(null);
    try {
      const res = await api.connectDatabase(mongoUri.trim());
      setConnectResult(res);
      triggerRefresh();
    } catch (err) {
      setConnectResult({ success: false, message: (err as Error).message });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSaveWeights = async () => {
    setIsSavingWeights(true);
    setWeightsSaved(false);
    try {
      await api.updateSettings({ scoringWeights: weights });
      setWeightsSaved(true);
      triggerRefresh();
      setTimeout(() => setWeightsSaved(false), 3000);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsSavingWeights(false);
    }
  };

  const totalWeight = Object.values(weights).reduce((a: number, b: number) => a + b, 0);

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4 dark:border-slate-800">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Settings & Algorithm Configuration
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Configure persistent storage connection, customize multi-factor recommendation weights, and update operating
          parameters.
        </p>
      </div>

      {/* Database Connection Panel */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Database Engine & Persistence</h2>
              <p className="text-xs text-slate-500">
                StaffSync includes persistent file storage and supports MongoDB Atlas connectivity.
              </p>
            </div>
          </div>

          <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            {dbStatus?.isMongoConnected ? 'MongoDB Live' : 'Active Persistent Engine'}
          </span>
        </div>

        <form onSubmit={handleConnectMongo} className="mt-5 space-y-3">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            MongoDB Atlas Connection String (Optional)
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={mongoUri}
              onChange={(e) => setMongoUri(e.target.value)}
              placeholder="mongodb+srv://<username>:<password>@cluster.mongodb.net/staffsync?retryWrites=true&w=majority"
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-750 dark:bg-slate-800 dark:text-slate-100"
            />
            <button
              type="submit"
              disabled={isConnecting || !mongoUri.trim()}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {isConnecting ? 'Connecting...' : 'Connect MongoDB'}
            </button>
          </div>

          {connectResult && (
            <div
              className={`rounded-xl p-3 text-xs font-semibold ${
                connectResult.success
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
              }`}
            >
              {connectResult.message}
            </div>
          )}
        </form>
      </div>

      {/* Smart Replacement Engine Weights (Customizable Algorithmic Balance) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Smart Replacement Scoring Weights (Sum: {totalWeight}%)
            </h2>
          </div>

          <button
            onClick={handleSaveWeights}
            disabled={isSavingWeights || totalWeight !== 100}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{isSavingWeights ? 'Saving...' : 'Apply Weights'}</span>
          </button>
        </div>

        {weightsSaved && (
          <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            <span>Weights updated! All future candidate evaluations will use these parameters.</span>
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <div className="flex justify-between text-xs font-semibold">
              <span>Subject / Skill Compatibility</span>
              <span className="font-bold text-indigo-600">{weights.compatibility}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              value={weights.compatibility}
              onChange={(e) => setWeights({ ...weights, compatibility: Number(e.target.value) })}
              className="mt-2 w-full accent-indigo-600"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold">
              <span>Free Period / Shift Availability</span>
              <span className="font-bold text-indigo-600">{weights.availability}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              value={weights.availability}
              onChange={(e) => setWeights({ ...weights, availability: Number(e.target.value) })}
              className="mt-2 w-full accent-indigo-600"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold">
              <span>Conflict Elimination</span>
              <span className="font-bold text-indigo-600">{weights.conflict}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="40"
              value={weights.conflict}
              onChange={(e) => setWeights({ ...weights, conflict: Number(e.target.value) })}
              className="mt-2 w-full accent-indigo-600"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold">
              <span>Workload Balance</span>
              <span className="font-bold text-indigo-600">{weights.workload}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="40"
              value={weights.workload}
              onChange={(e) => setWeights({ ...weights, workload: Number(e.target.value) })}
              className="mt-2 w-full accent-indigo-600"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold">
              <span>Fairness History (Proxy Count)</span>
              <span className="font-bold text-indigo-600">{weights.fairness}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              value={weights.fairness}
              onChange={(e) => setWeights({ ...weights, fairness: Number(e.target.value) })}
              className="mt-2 w-full accent-indigo-600"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold">
              <span>Experience & Tenure</span>
              <span className="font-bold text-indigo-600">{weights.experience}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              value={weights.experience}
              onChange={(e) => setWeights({ ...weights, experience: Number(e.target.value) })}
              className="mt-2 w-full accent-indigo-600"
            />
          </div>
        </div>
      </div>

      {/* Organization Switcher */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Organization Configuration</h3>
            <p className="text-xs text-slate-500">
              Current: <strong className="text-slate-800 dark:text-slate-200">{organization?.name}</strong> (
              {organization?.type?.toUpperCase()})
            </p>
          </div>
          <button
            onClick={() => setShowOrgModal(true)}
            className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-750 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Configure Mode
          </button>
        </div>
      </div>
    </div>
  );
};
