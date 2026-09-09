import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Layers,
  ArrowRight,
  School,
  GraduationCap,
  Factory,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  BrainCircuit,
  Zap,
  Clock,
  Users,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const LandingPage: React.FC = () => {
  const { theme, toggleTheme, updateOrganization } = useApp();
  const navigate = useNavigate();

  const handleSelectModeAndEnter = async (type: 'school' | 'college' | 'industry') => {
    let name = 'New School';
    if (type === 'college') name = 'New College';
    if (type === 'industry') name = 'New Company';

    await updateOrganization({
      name,
      type,
      workingHours: { start: '08:00', end: '17:00' },
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      timezone: 'UTC+05:30',
    });
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      {/* Top Header */}
      <header className="border-b border-slate-100 dark:border-slate-850">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white shadow-sm shadow-indigo-600/30">
              <Layers className="h-5 w-5" />
            </div>
            <span className="text-xl font-extrabold tracking-tight">StaffSync</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
            >
              {theme === 'light' ? '🌙 Dark Mode' : '☀ Light Mode'}
            </button>
            <Link
              to="/login"
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Sign In
            </Link>
            <Link
              to="/dashboard"
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/30 transition-transform hover:-translate-y-0.5 hover:bg-indigo-700"
            >
              <span>Enter Admin Dashboard</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300">
            <BrainCircuit className="h-3.5 w-3.5" />
            <span>Intelligent Workforce Adjustment Platform</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            When staff availability changes,{' '}
            <span className="text-indigo-600 dark:text-indigo-400">StaffSync</span> finds the smartest way forward.
          </h1>

          <p className="mt-6 text-base leading-relaxed text-slate-600 dark:text-slate-300 sm:text-lg">
            Keep your organization running smoothly when sudden absences strike. Built with deterministic scoring,
            timetable conflict resolution, workload balance, and real-time proxy synchronization.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/dashboard"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-7 font-bold text-white shadow-lg shadow-indigo-600/25 transition-all hover:bg-indigo-700 sm:w-auto"
            >
              <span>Enter Admin Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/adjustments"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-7 font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 sm:w-auto"
            >
              <Zap className="h-4 w-4 text-amber-500" />
              <span>Smart Adjustment Center</span>
            </Link>
          </div>

          <div className="mt-6 flex items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-500" /> Secure Role-Based Access
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-indigo-500" /> Real Database Persistence
            </span>
          </div>
        </div>

        {/* 3 Application Mode Cards */}
        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* School */}
          <div className="group relative rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition-all hover:-translate-y-1 hover:border-indigo-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-900">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-400">
              <School className="h-6 w-6" />
            </div>
            <h3 className="mt-5 text-xl font-bold text-slate-900 dark:text-white">School</h3>
            <p className="mt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              Smart faculty scheduling, attendance, and proxy management.
            </p>
            <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Manage class periods, divisions, subject-matter expertise, and instant teacher replacements without lecture
              disruption.
            </p>
            <button
              onClick={() => handleSelectModeAndEnter('school')}
              className="mt-6 flex items-center gap-2 text-xs font-bold text-indigo-600 group-hover:text-indigo-700 dark:text-indigo-400"
            >
              <span>Launch School Dashboard</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          {/* College */}
          <div className="group relative rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition-all hover:-translate-y-1 hover:border-indigo-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-900">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/80 dark:text-blue-400">
              <GraduationCap className="h-6 w-6" />
            </div>
            <h3 className="mt-5 text-xl font-bold text-slate-900 dark:text-white">College</h3>
            <p className="mt-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
              Faculty timetable, lecture exchange, and intelligent replacement.
            </p>
            <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Support complex collegiate department matrices, multiple courses, elective divisions, and workload balance.
            </p>
            <button
              onClick={() => handleSelectModeAndEnter('college')}
              className="mt-6 flex items-center gap-2 text-xs font-bold text-blue-600 group-hover:text-blue-700 dark:text-blue-400"
            >
              <span>Launch College Dashboard</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          {/* Industry */}
          <div className="group relative rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition-all hover:-translate-y-1 hover:border-indigo-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-900">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950/80 dark:text-amber-400">
              <Factory className="h-6 w-6" />
            </div>
            <h3 className="mt-5 text-xl font-bold text-slate-900 dark:text-white">Industry</h3>
            <p className="mt-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
              Shift management, workforce allocation, and employee replacement.
            </p>
            <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Resolve factory line shortages, match mandatory safety certifications, monitor overtime, and swap shifts in
              real time.
            </p>
            <button
              onClick={() => handleSelectModeAndEnter('industry')}
              className="mt-6 flex items-center gap-2 text-xs font-bold text-amber-600 group-hover:text-amber-700 dark:text-amber-400"
            >
              <span>Launch Industry Dashboard</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>

        {/* Architecture & Algorithmic Principles */}
        <div className="mt-20 rounded-2xl border border-slate-200 bg-slate-50/70 p-8 dark:border-slate-800 dark:bg-slate-900/50">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Core Algorithmic Engine
              </h4>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                Detect → Analyze → Recommend → Request → Accept → Synchronize
              </p>
            </div>
            <Link
              to="/adjustments"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:underline dark:text-indigo-400"
            >
              <span>Explore Smart Adjustment Center</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 text-center dark:border-slate-800 dark:bg-slate-850">
              <div className="text-sm font-bold text-slate-900 dark:text-white">30%</div>
              <div className="mt-0.5 text-[11px] font-medium text-slate-500">Compatibility</div>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 text-center dark:border-slate-800 dark:bg-slate-850">
              <div className="text-sm font-bold text-slate-900 dark:text-white">20%</div>
              <div className="mt-0.5 text-[11px] font-medium text-slate-500">Availability</div>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 text-center dark:border-slate-800 dark:bg-slate-850">
              <div className="text-sm font-bold text-slate-900 dark:text-white">15%</div>
              <div className="mt-0.5 text-[11px] font-medium text-slate-500">Conflict Elimination</div>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 text-center dark:border-slate-800 dark:bg-slate-850">
              <div className="text-sm font-bold text-slate-900 dark:text-white">15%</div>
              <div className="mt-0.5 text-[11px] font-medium text-slate-500">Workload Balance</div>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 text-center dark:border-slate-800 dark:bg-slate-850">
              <div className="text-sm font-bold text-slate-900 dark:text-white">10%</div>
              <div className="mt-0.5 text-[11px] font-medium text-slate-500">Fairness History</div>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 text-center dark:border-slate-800 dark:bg-slate-850">
              <div className="text-sm font-bold text-slate-900 dark:text-white">10%</div>
              <div className="mt-0.5 text-[11px] font-medium text-slate-500">Experience & Tenure</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
