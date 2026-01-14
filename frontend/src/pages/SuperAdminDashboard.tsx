
import React, { useState, useEffect } from 'react';
import { useSystem } from '../contexts/SystemContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import WelcomeBanner from '../components/dashboard/WelcomeBanner';
import StatCard from '../components/dashboard/StatCard';
import CalendarWidget from '../components/dashboard/CalendarWidget';
import { SubmissionChart, GradeDistributionChart } from '../components/dashboard/RealCharts';
import {
  Users, FileText, Award, Activity, BarChart3, PieChart, Calendar,
  CheckCircle, ArrowRight, Clock, ShieldCheck, ShieldAlert, GraduationCap, User, Shield
} from 'lucide-react';
import OnlineUsersModal from '../components/dashboard/OnlineUsersModal';

const SuperAdminDashboard: React.FC = () => {
  const { isSystemOpen, toggleSystemStatus } = useSystem();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalAdvisors: 0,
    totalExaminers: 0,
    activeAssignments: 0,
    averageGrade: 0,
    violations: 0,
    completedTasks: 0,
    pendingReviews: 0,
    templates: 0,
    activeStudents: 0,
    passedStudents: 0,
    failedStudents: 0,
    onlineStats: {
      siswa: 0,
      pembimbing: 0,
      penguji: 0
    }
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  /* Online Modal State */
  const [isOnlineModalOpen, setIsOnlineModalOpen] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState({ siswa: [], pembimbing: [], penguji: [] });
  const [selectedOnlineRole, setSelectedOnlineRole] = useState<'siswa' | 'pembimbing' | 'penguji' | null>(null);
  const [loadingOnlineUsers, setLoadingOnlineUsers] = useState(false);

  const navigate = useNavigate();

  const handleOpenOnlineModal = async (role: 'siswa' | 'pembimbing' | 'penguji' | null = null) => {
    setSelectedOnlineRole(role);
    setIsOnlineModalOpen(true);
    setLoadingOnlineUsers(true);

    try {
      const res = await api.get('/dashboard/online-users');
      setOnlineUsers(res.data);
    } catch (error) {
      console.error("Failed to fetch online users", error);
    } finally {
      setLoadingOnlineUsers(false);
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const statsRes = await api.get('/dashboard/stats');

        if (statsRes.data) {
          setStats(statsRes.data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    // Polling every 30s
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const QuickActionCard = ({ title, icon: Icon, onClick, colorClass, desc }: any) => (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 text-left h-full flex flex-col justify-between`}
    >
      <div className={`absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500 ${colorClass}`}>
        <Icon size={100} />
      </div>
      <div>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${colorClass} bg-opacity-10 text-opacity-100 shadow-sm group-hover:scale-110 transition-transform`}>
          <Icon size={24} className={colorClass.replace('bg-', 'text-')} />
        </div>
        <h3 className="font-bold text-slate-800 text-lg group-hover:text-blue-700 transition-colors">{title}</h3>
        <p className="text-sm text-slate-500 mt-1 leading-relaxed">{desc}</p>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-50 flex items-center text-xs font-semibold text-slate-400 group-hover:text-blue-600 transition-colors">
        Akses Cepat <ArrowRight size={14} className="ml-2 transform group-hover:translate-x-1 transition-transform" />
      </div>
    </button>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-12">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-8 pt-6">

        {/* Welcome Banner */}
        <WelcomeBanner userName="Super Admin" />

        {/* Key Stats Overlap */}
        {/* User Stats by Role + Performance Stats */}
        <div className="-mt-16 relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <StatCard title="Total Siswa" value={stats.totalStudents} icon={GraduationCap} color="blue" description="Siswa Terdaftar" />
          <StatCard title="Total Pembimbing" value={stats.totalAdvisors} icon={User} color="teal" description="Dosen Pembimbing" />
          <StatCard title="Total Penguji" value={stats.totalExaminers} icon={Shield} color="indigo" description="Dosen Penguji" />
          <StatCard title="Siswa Lulus" value={stats.passedStudents || 0} icon={CheckCircle} color="emerald" description="Memenuhi Syarat" />
          <StatCard title="Siswa Remedial" value={stats.failedStudents || 0} icon={ShieldAlert} color="rose" description="Perlu Perbaikan" />
          <StatCard title="Pelanggaran" value={stats.violations} icon={ShieldAlert} color="purple" description="Perlu Perhatian" />
        </div>

        {/* Online Users Section (Restored) */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Activity className="text-emerald-500" size={20} />
            Pengguna Online
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Siswa Online */}
            <button onClick={() => handleOpenOnlineModal('siswa')} className="bg-white p-5 rounded-2xl shadow-sm border border-emerald-100 flex items-center justify-between hover:shadow-md transition-all group text-left">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Siswa Online</p>
                <h4 className="text-2xl font-bold text-emerald-600 flex items-center gap-2">
                  {stats.onlineStats.siswa}
                  <span className="text-xs font-normal text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full animate-pulse">Live</span>
                </h4>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
                <GraduationCap size={24} />
              </div>
            </button>

            {/* Pembimbing Online */}
            <button onClick={() => handleOpenOnlineModal('pembimbing')} className="bg-white p-5 rounded-2xl shadow-sm border border-blue-100 flex items-center justify-between hover:shadow-md transition-all group text-left">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Pembimbing Online</p>
                <h4 className="text-2xl font-bold text-blue-600 flex items-center gap-2">
                  {stats.onlineStats.pembimbing}
                  <span className="text-xs font-normal text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full animate-pulse">Live</span>
                </h4>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                <User size={24} />
              </div>
            </button>

            {/* Penguji Online */}
            <button onClick={() => handleOpenOnlineModal('penguji')} className="bg-white p-5 rounded-2xl shadow-sm border border-purple-100 flex items-center justify-between hover:shadow-md transition-all group text-left">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Penguji Online</p>
                <h4 className="text-2xl font-bold text-purple-600 flex items-center gap-2">
                  {stats.onlineStats.penguji}
                  <span className="text-xs font-normal text-purple-500 bg-purple-50 px-2 py-0.5 rounded-full animate-pulse">Live</span>
                </h4>
              </div>
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 transition-transform">
                <Shield size={24} />
              </div>
            </button>
          </div>
        </div>

        {/* OnlineUsersModal */}
        <OnlineUsersModal
          isOpen={isOnlineModalOpen}
          onClose={() => setIsOnlineModalOpen(false)}
          users={onlineUsers}
          loading={loadingOnlineUsers}
          selectedRole={selectedOnlineRole}
        />

        {/* BENTO GRID LAYOUT */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 auto-rows-min">

          {/* LEFT COLUMN (3 Cols Wide) */}
          <div className="xl:col-span-3 space-y-6">

            {/* Row 1: System Control & Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* System Control (1 Col) */}
              <div className="md:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 relative overflow-hidden group">
                <div className={`absolute top-0 left-0 w-full h-1 ${isSystemOpen ? 'bg-emerald-500' : 'bg-rose-500'} transition-colors duration-500`} />
                <div className="flex items-center justify-between mb-6">
                  <div className={`p-3 rounded-xl ${isSystemOpen ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {isSystemOpen ? <ShieldCheck size={28} /> : <ShieldAlert size={28} />}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${isSystemOpen ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {isSystemOpen ? 'SYSTEM ONLINE' : 'MAINTENANCE'}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Status Sistem</h3>
                <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                  {isSystemOpen ? 'Siswa dapat mengakses dan mengumpulkan tugas.' : 'Akses siswa dibatasi (Read-only mode).'}
                </p>
                <label className="flex items-center justify-between cursor-pointer p-1 bg-gray-100 rounded-full w-full relative">
                  <input type="checkbox" className="sr-only" checked={isSystemOpen} onChange={toggleSystemStatus} />
                  <span className={`flex-1 text-center text-xs font-bold py-2 rounded-full z-10 transition-colors ${!isSystemOpen ? 'text-slate-500' : 'text-slate-400'}`}>OFF</span>
                  <span className={`flex-1 text-center text-xs font-bold py-2 rounded-full z-10 transition-colors ${isSystemOpen ? 'text-white' : 'text-slate-400'}`}>ON</span>
                  <div className={`absolute w-[calc(50%-4px)] h-[calc(100%-8px)] top-1 bg-white rounded-full shadow-sm transition-transform duration-300 transform ${isSystemOpen ? 'translate-x-[calc(100%+8px)] bg-emerald-500' : 'translate-x-1'}`} ></div>
                </label>
              </div>

              {/* Quick Actions (2 Cols) */}
              <div className="md:col-span-2 grid grid-cols-2 gap-4">
                <QuickActionCard title="Kelola User" desc="Tambah atau edit siswa/dosen" icon={Users} onClick={() => navigate('/users')} colorClass="bg-blue-600 text-blue-600" />
                <QuickActionCard title="Template" desc="Atur format naskah" icon={FileText} onClick={() => navigate('/super-admin/templates')} colorClass="bg-indigo-600 text-indigo-600" />
              </div>
            </div>

            {/* Row 2: Charts Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-80">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <BarChart3 className="text-blue-500" size={20} /> Aktivitas Pengumpulan
                  </h3>
                  <span className="text-xs font-medium text-slate-400">7 Hari Terakhir</span>
                </div>
                <div className="flex-1 w-full min-h-0">
                  <SubmissionChart />
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <PieChart className="text-purple-500" size={20} /> Sebaran Nilai
                  </h3>
                  <span className="text-xs font-medium text-slate-400">Total</span>
                </div>
                <div className="flex-1 w-full min-h-0 flex items-center">
                  <GradeDistributionChart />
                  {/* Custom Legend */}
                  <div className="space-y-2 text-xs ml-4">
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /> A (Sangat Baik)</div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500" /> B (Baik)</div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500" /> C (Cukup)</div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-rose-500" /> D (Kurang)</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 3: More Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <QuickActionCard title="Jadwal & Tugas" desc="Atur penugasan dan deadline" icon={Calendar} onClick={() => navigate('/assignments')} colorClass="bg-amber-600 text-amber-600" />
              <QuickActionCard title="Laporan & Analitik" desc="Download laporan PDF/Excel" icon={BarChart3} onClick={() => navigate('/reports')} colorClass="bg-purple-600 text-purple-600" />
            </div>
          </div>

          {/* RIGHT COLUMN (1 Col Wide - Sidebary stuff) */}
          <div className="xl:col-span-1 flex flex-col gap-6">

            {/* Calendar Widget */}
            <CalendarWidget />

            {/* System Information (Replaces Live Updates) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex-1">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-800">Informasi Sistem</h3>
                <div className="px-2 py-1 rounded-lg bg-gray-100 text-xs font-mono text-gray-500">v2.4.0</div>
              </div>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                  <p className="text-xs text-blue-600 font-bold uppercase mb-1">Last Backup</p>
                  <p className="text-blue-900 font-medium text-sm flex items-center gap-2">
                    <Clock size={14} /> Otomatis: 02:00 WIB
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                  <p className="text-xs text-emerald-600 font-bold uppercase mb-1">Server License</p>
                  <p className="text-emerald-900 font-medium text-sm flex items-center gap-2">
                    <CheckCircle size={14} /> Enterprise Active
                  </p>
                </div>
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-400 mb-2">Technical Support</p>
                  <p className="text-sm text-gray-600">hubungi@karyasetukpa.id</p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;