import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BrainCircuit,
  Users,
  CalendarCheck2,
  BarChart3,
  CalendarDays,
  FileSpreadsheet,
  Bot,
  History,
  Settings,
  Clock,
  Briefcase,
  FileText,
  UserCheck2,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Sidebar: React.FC<{ isOpen: boolean; setIsOpen: (open: boolean) => void }> = ({
  isOpen,
  setIsOpen,
}) => {
  const { orgType } = useApp();

  const isIndustry = orgType === 'industry';

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all group ${
      isActive
        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/60'
    }`;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed bottom-0 top-16 z-30 flex w-64 flex-col border-r border-slate-200 bg-white transition-all duration-200 dark:border-slate-800 dark:bg-slate-900 lg:static lg:w-64 ${
          isOpen ? 'left-0' : '-left-64 lg:left-0'
        }`}
      >
        <div className="flex flex-1 flex-col overflow-y-auto px-3 py-4">
          {/* Main Section */}
          <div className="mb-4">
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Core Intelligence
            </div>
            <nav className="space-y-1">
              <NavLink to="/dashboard" className={navItemClass}>
                <LayoutDashboard className="h-4 w-4" />
                <span>Overview</span>
              </NavLink>
              <NavLink to="/adjustments" className={navItemClass}>
                <BrainCircuit className="h-4 w-4 text-indigo-400 group-hover:text-current" />
                <span className="flex-1">Smart Adjustment</span>
                <span className="rounded-full bg-indigo-500/20 px-1.5 py-0.5 text-[9px] font-bold text-indigo-700 dark:text-indigo-300">
                  AI
                </span>
              </NavLink>
            </nav>
          </div>

          {/* Workforce Section */}
          <div className="mb-4">
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {orgType === 'school'
                ? 'School Operations'
                : orgType === 'college'
                ? 'Academic Operations'
                : 'Plant Workforce'}
            </div>
            <nav className="space-y-1">
              <NavLink to="/staff" className={navItemClass}>
                <Users className="h-4 w-4" />
                <span>
                  {orgType === 'school'
                    ? 'Teachers & Staff'
                    : orgType === 'college'
                    ? 'Professors & Faculty'
                    : 'Workforce Roster'}
                </span>
              </NavLink>
              <NavLink to="/attendance" className={navItemClass}>
                <CalendarCheck2 className="h-4 w-4" />
                <span>
                  {orgType === 'school'
                    ? 'School Attendance'
                    : orgType === 'college'
                    ? 'Faculty Attendance'
                    : 'Floor Attendance'}
                </span>
              </NavLink>
              <NavLink to="/workload" className={navItemClass}>
                <BarChart3 className="h-4 w-4" />
                <span>Workload & Balance</span>
              </NavLink>
            </nav>
          </div>

          {/* Scheduling Section */}
          <div className="mb-4">
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {isIndustry ? 'Shift Scheduling' : 'Academic Scheduling'}
            </div>
            <nav className="space-y-1">
              {isIndustry ? (
                <>
                  <NavLink to="/shifts" className={navItemClass}>
                    <Clock className="h-4 w-4" />
                    <span>Shift Management</span>
                  </NavLink>
                  <NavLink to="/live-workforce" className={navItemClass}>
                    <Briefcase className="h-4 w-4" />
                    <span>Live Floor Allocation</span>
                  </NavLink>
                </>
              ) : (
                <>
                  <NavLink to="/timetable" className={navItemClass}>
                    <CalendarDays className="h-4 w-4" />
                    <span>{orgType === 'school' ? 'Class Timetable' : 'Master Lecture Grid'}</span>
                  </NavLink>
                  <NavLink to="/today-lectures" className={navItemClass}>
                    <CalendarCheck2 className="h-4 w-4" />
                    <span>Today's Lectures</span>
                  </NavLink>
                  <NavLink to="/proxy-management" className={navItemClass}>
                    <UserCheck2 className="h-4 w-4" />
                    <span>Proxy Registry</span>
                  </NavLink>
                </>
              )}
            </nav>
          </div>

          {/* Management & AI Section */}
          <div className="mb-4">
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Intelligence & Records
            </div>
            <nav className="space-y-1">
              <NavLink to="/pdf-import" className={navItemClass}>
                <FileSpreadsheet className="h-4 w-4" />
                <span>PDF Import Studio</span>
              </NavLink>
              <NavLink to="/reports" className={navItemClass}>
                <FileText className="h-4 w-4" />
                <span>Reports & Analytics</span>
              </NavLink>
              <NavLink to="/ai-assistant" className={navItemClass}>
                <Bot className="h-4 w-4 text-emerald-500 group-hover:text-current" />
                <span>AI Assistant</span>
              </NavLink>
              <NavLink to="/audit-log" className={navItemClass}>
                <History className="h-4 w-4" />
                <span>Audit Trail</span>
              </NavLink>
            </nav>
          </div>

          {/* Bottom Settings */}
          <div className="mt-auto border-t border-slate-100 pt-3 dark:border-slate-800">
            <NavLink to="/settings" className={navItemClass}>
              <Settings className="h-4 w-4" />
              <span>Settings & Engine</span>
            </NavLink>
          </div>
        </div>
      </aside>
    </>
  );
};
