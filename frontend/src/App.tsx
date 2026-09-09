import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { OrganizationModal } from './components/common/OrganizationModal';
import { Toast } from './components/common/Toast';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { SmartAdjustmentPage } from './pages/SmartAdjustmentPage';
import { StaffPage } from './pages/StaffPage';
import { AttendancePage } from './pages/AttendancePage';
import { TimetablePage } from './pages/TimetablePage';
import { TodayBoardPage } from './pages/TodayBoardPage';
import { ShiftsPage } from './pages/ShiftsPage';
import { PdfImportPage } from './pages/PdfImportPage';
import { ReportsPage } from './pages/ReportsPage';
import { AiAssistantPage } from './pages/AiAssistantPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { SettingsPage } from './pages/SettingsPage';
import { FacultyDashboardPage } from './pages/FacultyDashboardPage';
import { EmployeeDashboardPage } from './pages/EmployeeDashboardPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ArrowLeft, Menu, Sparkles } from 'lucide-react';

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <Navbar />
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <main className="flex-1 px-4 py-6 sm:px-8 max-w-7xl mx-auto w-full">
          {/* Mobile sidebar toggle button */}
          <div className="mb-4 lg:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            >
              <Menu className="h-4 w-4" />
              <span>Navigation Menu</span>
            </button>
          </div>
          {children}
        </main>
      </div>
      <OrganizationModal />
      <Toast />
    </div>
  );
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { admin } = useApp();
  const savedUserStr = localStorage.getItem('staffsync_user');
  let user = admin;
  if (!user && savedUserStr) {
    try {
      user = JSON.parse(savedUserStr);
    } catch { /* ignore */ }
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const userRole = (user.role || '').toLowerCase();
  const isAdmin = userRole.includes('admin') || userRole.includes('hr') || userRole === 'administrator';

  if (!isAdmin) {
    if (userRole.includes('worker') || userRole.includes('employee') || user.organizationType === 'industry') {
      return <Navigate to={`/employee/${user.id || 'staff_1'}`} replace />;
    }
    return <Navigate to={`/faculty/${user.id || 'staff_1'}`} replace />;
  }

  return <AdminLayout>{children}</AdminLayout>;
};

const StaffPersonalLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { admin } = useApp();
  const savedUserStr = localStorage.getItem('staffsync_user');
  let user = admin;
  if (!user && savedUserStr) {
    try {
      user = JSON.parse(savedUserStr);
    } catch { /* ignore */ }
  }

  const userRole = (user?.role || '').toLowerCase();
  const isAdmin = userRole.includes('admin') || userRole.includes('hr') || userRole === 'administrator';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      {isAdmin && (
        <div className="bg-indigo-600 px-4 py-2 text-white shadow-xs">
          <div className="mx-auto flex max-w-7xl items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-medium">
              <Sparkles className="h-4 w-4 text-amber-300" />
              <span>Personalized Staff Member Workspace Preview (Admin Inspection Mode)</span>
            </div>
            <Link to="/dashboard" className="inline-flex items-center gap-1 font-bold text-white hover:underline">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Return to Admin Console</span>
            </Link>
          </div>
        </div>
      )}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-8">{children}</main>
      <Toast />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Auth Pages */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Landing / Entry Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Admin Dashboard & Workspaces (Protected with AdminRoute) */}
          <Route
            path="/dashboard"
            element={
              <AdminRoute>
                <DashboardPage />
              </AdminRoute>
            }
          />
          <Route
            path="/adjustments"
            element={
              <AdminRoute>
                <SmartAdjustmentPage />
              </AdminRoute>
            }
          />
          <Route
            path="/staff"
            element={
              <AdminRoute>
                <StaffPage />
              </AdminRoute>
            }
          />
          <Route
            path="/attendance"
            element={
              <AdminRoute>
                <AttendancePage />
              </AdminRoute>
            }
          />
          <Route
            path="/timetable"
            element={
              <AdminRoute>
                <TimetablePage />
              </AdminRoute>
            }
          />
          <Route
            path="/today-lectures"
            element={
              <AdminRoute>
                <TodayBoardPage />
              </AdminRoute>
            }
          />
          <Route
            path="/proxy-management"
            element={
              <AdminRoute>
                <SmartAdjustmentPage />
              </AdminRoute>
            }
          />
          <Route
            path="/shifts"
            element={
              <AdminRoute>
                <ShiftsPage />
              </AdminRoute>
            }
          />
          <Route
            path="/live-workforce"
            element={
              <AdminRoute>
                <ShiftsPage />
              </AdminRoute>
            }
          />
          <Route
            path="/workload"
            element={
              <AdminRoute>
                <ReportsPage />
              </AdminRoute>
            }
          />
          <Route
            path="/pdf-import"
            element={
              <AdminRoute>
                <PdfImportPage />
              </AdminRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <AdminRoute>
                <ReportsPage />
              </AdminRoute>
            }
          />
          <Route
            path="/ai-assistant"
            element={
              <AdminRoute>
                <AiAssistantPage />
              </AdminRoute>
            }
          />
          <Route
            path="/audit-log"
            element={
              <AdminRoute>
                <AuditLogPage />
              </AdminRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <AdminRoute>
                <SettingsPage />
              </AdminRoute>
            }
          />

          {/* Personalized Faculty Workspace */}
          <Route
            path="/faculty/:id"
            element={
              <StaffPersonalLayout>
                <FacultyDashboardPage />
              </StaffPersonalLayout>
            }
          />

          {/* Personalized Employee Workspace */}
          <Route
            path="/employee/:id"
            element={
              <StaffPersonalLayout>
                <EmployeeDashboardPage />
              </StaffPersonalLayout>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
