import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sun,
  Moon,
  Bell,
  Search,
  Building2,
  Database,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  ChevronDown,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Navbar: React.FC = () => {
  const {
    admin,
    organization,
    orgType,
    theme,
    toggleTheme,
    notifications,
    unreadCount,
    dbStatus,
    markNotificationAsRead,
    clearAllNotifications,
    setShowOrgModal,
    logout,
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/staff?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const getOrgTypeLabel = () => {
    if (orgType === 'school') return 'School Edition';
    if (orgType === 'college') return 'College Edition';
    return 'Industry / Workforce';
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90 sm:px-6">
      {/* Left: Logo and Organization Info */}
      <div className="flex items-center gap-4">
        <Link to="/dashboard" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white shadow-sm shadow-indigo-500/30">
            <Layers className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">StaffSync</span>
              <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300">
                PRO
              </span>
            </div>
            <span className="hidden text-[11px] font-medium text-slate-500 dark:text-slate-400 sm:block">
              Intelligent Workforce Adjustment
            </span>
          </div>
        </Link>

        {/* Organization Info Badge (Locked to User's Registered Org) */}
        <div className="ml-2 hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-750 dark:bg-slate-800 dark:text-slate-200 md:flex">
          <Building2 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
          <span className="max-w-[180px] truncate font-bold">
            {organization?.name || 'Organization'}
          </span>
          <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300">
            {getOrgTypeLabel()}
          </span>
        </div>
      </div>

      {/* Middle: Global Search */}
      <form onSubmit={handleSearchSubmit} className="mx-4 hidden max-w-md flex-1 lg:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search staff, employee ID, department, skills..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50/70 py-1.5 pl-9 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-750 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-900"
          />
        </div>
      </form>

      {/* Right Controls: Database status, Theme, Notifications, Admin Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Database Status Chip */}
        <div
          onClick={() => navigate('/settings')}
          className="hidden cursor-pointer items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300 sm:flex"
          title={dbStatus?.isMongoConnected ? 'MongoDB Connected' : 'Persistent Storage Engine Active (Zero-config)'}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              dbStatus?.isMongoConnected ? 'animate-pulse bg-emerald-500' : 'bg-emerald-500'
            }`}
          />
          <Database className="h-3 w-3 text-slate-500 dark:text-slate-400" />
          <span>{dbStatus?.isMongoConnected ? 'MongoDB Live' : 'Storage Engine Active'}</span>
        </div>

        {/* Real Light / Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle light and dark mode"
          className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-750 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? (
            <>
              <Sun className="h-4 w-4 text-amber-500" />
              <span className="hidden sm:inline">Light</span>
            </>
          ) : (
            <>
              <Moon className="h-4 w-4 text-indigo-400" />
              <span className="hidden sm:inline">Dark</span>
            </>
          )}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-750 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            aria-label="View notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:w-96">
              <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Live Notifications</span>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-indigo-100 px-1.5 py-0.2 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <button
                  onClick={clearAllNotifications}
                  className="text-[11px] font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
                >
                  Mark all read
                </button>
              </div>

              <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                    You're all caught up! No notifications.
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => markNotificationAsRead(notif.id)}
                      className={`cursor-pointer px-3 py-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                        !notif.read ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100">
                          {notif.type.includes('proxy') || notif.type.includes('accepted') ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          ) : notif.type.includes('shortage') ? (
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                          ) : (
                            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                          )}
                          <span>{notif.title}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-300">{notif.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Auth Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 shadow-sm dark:border-slate-750 dark:bg-slate-800">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 font-bold text-white text-xs shadow-inner">
              {(admin?.name || 'Admin')
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(-2)}
            </div>
            <div className="hidden text-left sm:block">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {admin?.name || 'Admin'}
                </span>
                <UserCheck className="h-3 w-3 text-emerald-500" />
              </div>
              <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                {admin?.role || 'Administrator'}
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-semibold text-slate-600 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-colors"
            title="Sign Out / Switch User"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
};
