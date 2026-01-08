
import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { API_URL } from '../services/api';

interface SystemSettings {
  isSystemOpen: boolean;
  violationThreshold: number;
  passingGrade: number;
  systemAnnouncement: string;
  submissionDeadline?: string;
  maxPlagiarismScore: number;
  enableCopyPasteProtection: boolean;
  enableViolationDetection: boolean;
}

interface SystemContextType extends SystemSettings {
  loading: boolean;
  toggleSystemStatus: () => Promise<void>;
  updateSettings: (newSettings: Partial<SystemSettings>) => Promise<void>;
  broadcastAnnouncement: (message: string, target?: string) => Promise<void>;
  retractAnnouncement: () => Promise<void>;

  refreshSettings: () => Promise<void>;
  announcements: any[];
  fetchAnnouncements: () => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
}

const SystemContext = createContext<SystemContextType | undefined>(undefined);

export const SystemProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<SystemSettings>({
    isSystemOpen: true,
    violationThreshold: 3,
    passingGrade: 70,
    systemAnnouncement: '',
    maxPlagiarismScore: 25,
    enableCopyPasteProtection: false,
    enableViolationDetection: true
  });

  const getToken = () => localStorage.getItem('token');

  const fetchSettings = useCallback(async (isPolling = false) => {
    const token = getToken();
    if (!token) return;
    try {
      const response = await axios.get(`${API_URL}/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = response.data;
      // console.log("🔍 Fetch Settings Raw:", data);

      // Fix: Backend returns 'announcement', frontend expects 'systemAnnouncement'
      const newSettings: SystemSettings = {
        ...data,
        systemAnnouncement: data.announcement || data.systemAnnouncement || ''
      };

      setSettings(prev => {
        // Notification Logic
        const prevAnnounce = prev.systemAnnouncement;
        const newAnnounce = newSettings.systemAnnouncement;

        // console.log(`📡 Polling: ${isPolling}, Old: '${prevAnnounce}', New: '${newAnnounce}'`);

        if (isPolling && newAnnounce !== prevAnnounce && newAnnounce.trim() !== "") {
          console.log("🔔 Triggering Notification!");
          import('react-hot-toast').then(({ toast }) => {
            toast((t) => (
              <div className="flex flex-col gap-2 min-w-[300px]">
                <div className="flex items-center gap-2 font-bold text-indigo-600">
                  📢 Pengumuman Baru
                </div>
                <div className="text-sm text-gray-700">
                  {newAnnounce}
                </div>
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="text-xs bg-gray-100 p-1 rounded hover:bg-gray-200 mt-2 self-end px-3 font-medium"
                >
                  Tutup
                </button>
              </div>
            ), {
              duration: 8000,
              position: 'top-center',
              style: { background: '#fff', border: '1px solid #E0E7FF', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }
            });
          });
        }
        return newSettings;
      });

    } catch (error) {
      console.error('Failed to fetch system settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSettings(); // Initial load

      // "Instant" Polling every 5 seconds
      const interval = setInterval(() => {
        fetchSettings(true);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchSettings]);

  const toggleSystemStatus = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    const newStatus = !settings.isSystemOpen;
    // Optimistic update
    setSettings(prev => ({ ...prev, isSystemOpen: newStatus }));

    try {
      await axios.put(`${API_URL}/settings`,
        { ...settings, isSystemOpen: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('Failed to update system status:', error);
      // Revert on error
      setSettings(prev => ({ ...prev, isSystemOpen: !newStatus }));
    }
  }, [settings, isAuthenticated]);

  const updateSettings = useCallback(async (newSettings: Partial<SystemSettings>) => {
    const token = getToken();
    if (!token) return;

    // Optimistic update
    setSettings(prev => ({ ...prev, ...newSettings }));

    try {
      // Fix: Send 'announcement' to backend
      const payload: any = { ...settings, ...newSettings };
      if (newSettings.systemAnnouncement !== undefined) {
        payload.announcement = newSettings.systemAnnouncement;
      }

      await axios.put(`${API_URL}/settings`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Refresh immediately after update to ensure sync
      fetchSettings(false);
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  }, [settings, isAuthenticated, fetchSettings]);

  // History Logic
  const [announcements, setAnnouncements] = useState<any[]>([]);

  const fetchAnnouncements = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await axios.get(`${API_URL}/settings/announcements`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnnouncements(res.data);
    } catch (err) {
      console.error("Failed to fetch announcements", err);
    }
  }, []);

  const broadcastAnnouncement = useCallback(async (message: string) => {
    const token = getToken();
    if (!token) return;

    try {
      await axios.post(`${API_URL}/settings/broadcast`,
        { announcement: message },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Refresh to see update
      fetchSettings(false);
      fetchAnnouncements(); // Refresh history immediately
    } catch (error) {
      console.error('Broadcast failed:', error);
      throw error;
    }
  }, [fetchSettings, fetchAnnouncements]);

  const retractAnnouncement = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    try {
      await axios.post(`${API_URL}/settings/retract`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Refresh to see update
      fetchSettings(false);
    } catch (error) {
      console.error('Retract failed:', error);
      throw error;
    }
  }, [fetchSettings]);



  const deleteAnnouncement = useCallback(async (id: string) => {
    const token = getToken();
    if (!token) return;
    try {
      await axios.delete(`${API_URL}/settings/announcements/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAnnouncements(); // Refresh list
      fetchSettings(false); // Refresh banner status
    } catch (err) {
      console.error("Failed to delete announcement", err);
      throw err;
    }
  }, [fetchAnnouncements, fetchSettings]);

  return (
    <SystemContext.Provider value={{
      ...settings, loading, toggleSystemStatus, updateSettings,
      broadcastAnnouncement, retractAnnouncement, refreshSettings: () => fetchSettings(false),
      announcements, fetchAnnouncements, deleteAnnouncement
    }}>
      {children}
    </SystemContext.Provider>
  );
};

export const useSystem = (): SystemContextType => {
  const context = useContext(SystemContext);
  if (!context) {
    throw new Error('useSystem must be used within a SystemProvider');
  }
  return context;
};