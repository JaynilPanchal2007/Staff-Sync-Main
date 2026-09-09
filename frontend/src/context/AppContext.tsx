import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { AdminUser, Organization, NotificationItem, OrganizationType } from '../types';
import { api } from '../services/api';

interface AppContextType {
  admin: AdminUser | null;
  organization: Organization | null;
  orgType: OrganizationType;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  notifications: NotificationItem[];
  unreadCount: number;
  dbStatus: any;
  socket: Socket | null;
  refreshKey: number;
  triggerRefresh: () => void;
  updateOrganization: (orgData: Partial<Organization>) => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  isLoading: boolean;
  showOrgModal: boolean;
  setShowOrgModal: (show: boolean) => void;
  toast: { id: number; message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  logout: () => void;
  setAuthUser: (user: any, organization?: any) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showOrgModal, setShowOrgModal] = useState<boolean>(false);
  const [toast, setToast] = useState<{ id: number; message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setToast({ id, message, type });
    setTimeout(() => {
      setToast((curr) => (curr?.id === id ? null : curr));
    }, 4500);
  }, []);

  // Theme state: default light, persisted in localStorage
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('staffsync_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return 'light';
  });

  useEffect(() => {
    localStorage.setItem('staffsync_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const triggerRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const setAuthUser = useCallback((user: any, org?: any) => {
    if (user) {
      setAdmin({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || 'Administrator',
        organizationId: user.organizationId,
        organizationType: user.organizationType || 'school',
      });
      if (org) setOrganization(org);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('staffsync_token');
    localStorage.removeItem('staffsync_user');
    setAdmin(null);
    setOrganization(null);
    showToast('Signed out successfully.', 'info');
    triggerRefresh();
  }, [showToast, triggerRefresh]);

  // Initialize Socket.IO connection
  useEffect(() => {
    const s = io(window.location.origin, {
      transports: ['websocket', 'polling'],
    });

    s.on('connect', () => {
      console.log('[StaffSync Socket] Connected:', s.id);
    });

    s.on('dashboard:refresh', () => {
      console.log('[StaffSync Socket] dashboard:refresh received');
      triggerRefresh();
    });

    s.on('notification:created', (notif: NotificationItem) => {
      setNotifications((prev) => [notif, ...prev]);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [triggerRefresh]);

  // Load initial admin and org info
  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      const savedUserStr = localStorage.getItem('staffsync_user');
      const data = await api.getAdminInfo();

      if (savedUserStr) {
        try {
          const savedUser = JSON.parse(savedUserStr);
          setAdmin({
            id: savedUser.id,
            name: savedUser.name,
            email: savedUser.email,
            role: savedUser.role || 'Administrator',
            organizationId: savedUser.organizationId,
            organizationType: savedUser.organizationType || 'school',
          });
        } catch {
          setAdmin(data.admin);
        }
      } else {
        setAdmin(data.admin);
      }

      setOrganization(data.organization);
      setDbStatus(data.dbStatus);

      // If organization is not set yet, prompt modal
      if (!data.organization && (!data.admin?.organizationType && !savedUserStr)) {
        setShowOrgModal(true);
      }

      if (data.organization?.id && socket) {
        socket.emit('join:organization', data.organization.id);
      }

      const notifData = await api.getNotifications();
      setNotifications(notifData.notifications || []);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [socket]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData, refreshKey]);

  const updateOrganization = async (orgData: Partial<Organization>) => {
    const res = await api.saveOrganization(orgData);
    if (res.success) {
      setOrganization(res.organization);
      if (admin) {
        setAdmin({ ...admin, organizationId: res.organization.id, organizationType: res.organization.type });
      }
      setShowOrgModal(false);
      triggerRefresh();
    }
  };

  const markNotificationAsRead = async (id: string) => {
    await api.markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const clearAllNotifications = async () => {
    await api.markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const orgType: OrganizationType = organization?.type || admin?.organizationType || 'school';

  return (
    <AppContext.Provider
      value={{
        admin,
        organization,
        orgType,
        theme,
        toggleTheme,
        notifications,
        unreadCount,
        dbStatus,
        socket,
        refreshKey,
        triggerRefresh,
        updateOrganization,
        markNotificationAsRead,
        clearAllNotifications,
        isLoading,
        showOrgModal,
        setShowOrgModal,
        toast,
        showToast,
        logout,
        setAuthUser,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
