import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Mail,
  Lock,
  ArrowRight,
  UserCheck,
  Building2,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Users,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast, triggerRefresh, setAuthUser } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginRole, setLoginRole] = useState<'admin' | 'faculty' | 'employee'>('admin');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email or Employee ID.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await api.login({
        email: email.trim(),
        password: password.trim(),
        loginType: loginRole,
      });

      if (res.success) {
        localStorage.setItem('staffsync_token', res.token);
        localStorage.setItem('staffsync_user', JSON.stringify(res.user));
        setAuthUser(res.user, res.organization);
        showToast(`Welcome back, ${res.user.name}!`, 'success');
        triggerRefresh();

        if (res.user.role === 'Administrator' || loginRole === 'admin') {
          navigate('/dashboard');
        } else if (res.user.role === 'Faculty' || loginRole === 'faculty') {
          navigate(`/faculty/${res.user.id || 'staff_1'}`);
        } else {
          navigate(`/employee/${res.user.id || 'staff_1'}`);
        }
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-slate-900 px-4 py-12 text-slate-100 sm:px-6 lg:px-8">
      {/* Background Glow */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center overflow-hidden">
        <div className="h-[500px] w-[500px] rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="h-[400px] w-[400px] rounded-full bg-emerald-600/15 blur-[100px]" />
      </div>

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo Banner */}
        <div className="flex items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 font-black text-white shadow-lg shadow-indigo-500/30">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <div className="text-left">
            <span className="text-2xl font-black tracking-tight text-white">StaffSync</span>
            <span className="ml-1.5 rounded-md bg-indigo-500/20 px-2 py-0.5 text-xs font-bold text-indigo-400 border border-indigo-500/30">
              PRO
            </span>
          </div>
        </div>

        <h2 className="mt-4 text-center text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
          Sign in to your account
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400">
          Intelligent Workforce Adjustment & Sector-Tailored Management
        </p>
      </div>

      <div className="relative z-10 mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* Role selector tabs */}
          <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-900/90 p-1 border border-slate-800/80">
            <button
              type="button"
              onClick={() => setLoginRole('admin')}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all ${
                loginRole === 'admin'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>Org Admin</span>
            </button>
            <button
              type="button"
              onClick={() => setLoginRole('faculty')}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all ${
                loginRole === 'faculty'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <GraduationCap className="h-3.5 w-3.5" />
              <span>Faculty</span>
            </button>
            <button
              type="button"
              onClick={() => setLoginRole('employee')}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all ${
                loginRole === 'employee'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Worker</span>
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs font-semibold text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300">
                Email Address or Employee ID
              </label>
              <div className="mt-1 relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={
                    loginRole === 'admin'
                      ? 'admin@institution.edu'
                      : loginRole === 'faculty'
                      ? 'faculty@institution.edu or EMP-101'
                      : 'employee@industry.com'
                  }
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/90 py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-300">Password</label>
              </div>
              <div className="mt-1 relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/90 py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 disabled:opacity-50 transition-all cursor-pointer"
            >
              <span>{isLoading ? 'Signing in...' : 'Sign In to Portal'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 border-t border-slate-800/80 pt-4 text-center">
            <p className="text-xs text-slate-400">
              Don't have an organization account yet?{' '}
              <Link
                to="/register"
                className="font-bold text-indigo-400 hover:text-indigo-300 hover:underline"
              >
                Create New Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
