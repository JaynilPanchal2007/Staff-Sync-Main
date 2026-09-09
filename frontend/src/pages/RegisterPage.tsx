import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Mail,
  Lock,
  User,
  Building2,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Briefcase,
  School,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast, triggerRefresh, setAuthUser } = useApp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'Administrator' | 'Faculty' | 'Shift Worker'>('Administrator');
  const [organizationName, setOrganizationName] = useState('');
  const [organizationType, setOrganizationType] = useState<'school' | 'college' | 'industry'>('college');
  const [organizationId, setOrganizationId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await api.register({
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
        role,
        organizationName: organizationName.trim() || `${name}'s Organization`,
        organizationType,
        organizationId: organizationId.trim() || undefined,
      });

      if (res.success) {
        localStorage.setItem('staffsync_token', res.token);
        localStorage.setItem('staffsync_user', JSON.stringify(res.user));
        setAuthUser(res.user, res.organization);
        showToast('Registration successful! Account created.', 'success');
        triggerRefresh();

        if (role === 'Administrator') {
          navigate('/dashboard');
        } else if (role === 'Faculty') {
          navigate(`/faculty/${res.user.id}`);
        } else {
          navigate(`/employee/${res.user.id}`);
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
        <div className="h-[400px] w-[400px] rounded-full bg-violet-600/15 blur-[100px]" />
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
          Create New Account
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400">
          Register your organization or staff account on StaffSync
        </p>
      </div>

      <div className="relative z-10 mt-6 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* Error Banner */}
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs font-semibold text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Account Role */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Account Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'Administrator', label: 'Organization Admin', icon: Building2 },
                  { id: 'Faculty', label: 'Faculty / Teacher', icon: GraduationCap },
                  { id: 'Shift Worker', label: 'Industry Staff', icon: Briefcase },
                ].map((r) => {
                  const Icon = r.icon;
                  return (
                    <button
                      type="button"
                      key={r.id}
                      onClick={() => setRole(r.id as any)}
                      className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-2.5 text-center text-xs font-bold transition-all ${
                        role === r.id
                          ? 'border-indigo-500 bg-indigo-600/20 text-indigo-300'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-[11px]">{r.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300">Full Name</label>
              <div className="mt-1 relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/90 py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-300">Email Address</label>
              <div className="mt-1 relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@institution.edu"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/90 py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Organization Name & Type (for Admins) */}
            {role === 'Administrator' && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Organization Name
                  </label>
                  <input
                    type="text"
                    required
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder="e.g. Your Institution Name"
                    className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900/90 py-2.5 px-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Sector / Type
                  </label>
                  <select
                    value={organizationType}
                    onChange={(e) => setOrganizationType(e.target.value as any)}
                    className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900/90 py-2.5 px-3 text-xs text-white focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="school">School (K-12)</option>
                    <option value="college">University / College</option>
                    <option value="industry">Industry / Plant / Enterprise</option>
                  </select>
                </div>
              </div>
            )}

            {/* Organization ID (for Faculty / Industry Staff) */}
            {role !== 'Administrator' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300">
                  Organization ID <span className="font-normal text-slate-500">(optional)</span>
                </label>
                <input
                  type="text"
                  value={organizationId}
                  onChange={(e) => setOrganizationId(e.target.value)}
                  placeholder="e.g. org_school_01"
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900/90 py-2.5 px-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
                <p className="mt-1.5 text-[11px] text-slate-500">
                  Joining an existing institution? Enter its Organization ID from your administrator. If left blank, your account links to the default organization.
                </p>
              </div>
            )}

            {/* Passwords */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300">Password</label>
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

              <div>
                <label className="block text-xs font-semibold text-slate-300">
                  Confirm Password
                </label>
                <div className="mt-1 relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/90 py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 disabled:opacity-50 transition-all cursor-pointer"
            >
              <span>{isLoading ? 'Creating Account...' : 'Complete Registration'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 border-t border-slate-800/80 pt-4 text-center">
            <p className="text-xs text-slate-400">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-bold text-indigo-400 hover:text-indigo-300 hover:underline"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
