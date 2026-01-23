import React, { useState, useEffect } from 'react';
import {
  Save, Shield, AlertTriangle,
  Settings, Lock, Globe, FileCheck,
  LayoutDashboard,
  GraduationCap,
  Clock,
  UserCheck,
  CheckCircle2,
  Bell,
  Search,
  Filter,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { useSystem } from '../contexts/SystemContext';
import { Toaster, toast } from 'react-hot-toast';

const SystemSettings: React.FC = () => {
  const {
    isSystemOpen, violationThreshold, passingGrade,
    systemAnnouncement, maxPlagiarismScore,
    enableCopyPasteProtection, enableViolationDetection,
    toggleSystemStatus, updateSettings, broadcastAnnouncement, retractAnnouncement,
    announcements, fetchAnnouncements, deleteAnnouncement
  } = useSystem();

  // Local State
  const [localViolationThreshold, setLocalViolationThreshold] = useState(violationThreshold);
  const [localPassingGrade, setLocalPassingGrade] = useState(passingGrade);
  const [localAnnouncement, setLocalAnnouncement] = useState(systemAnnouncement);
  const [localMaxPlagiarismScore, setLocalMaxPlagiarismScore] = useState(maxPlagiarismScore);
  const [localEnableCopyPasteProtection, setLocalEnableCopyPasteProtection] = useState(enableCopyPasteProtection);
  const [localEnableViolationDetection, setLocalEnableViolationDetection] = useState(enableViolationDetection);
  const [broadcastTarget, setBroadcastTarget] = useState('ALL');
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Sync State
  useEffect(() => {
    // ... (existing sync)
    fetchAnnouncements();
  }, []); // Initial load for history

  const handleDeleteHistory = async (id: string) => {
    if (!window.confirm("Hapus pengumuman ini dari riwayat dan tarik notifikasi dari siswa?")) return;
    try {
      await deleteAnnouncement(id);
      toast.success("Pengumuman berhasil dihapus.");
    } catch (e) {
      toast.error("Gagal menghapus.");
    }
  };

  useEffect(() => {
    setLocalViolationThreshold(violationThreshold);

    setLocalPassingGrade(passingGrade);
    setLocalAnnouncement(systemAnnouncement);
    setLocalMaxPlagiarismScore(maxPlagiarismScore);
    setLocalEnableCopyPasteProtection(enableCopyPasteProtection);
    setLocalEnableViolationDetection(enableViolationDetection);
  }, [violationThreshold, passingGrade, systemAnnouncement, maxPlagiarismScore, enableCopyPasteProtection, enableViolationDetection]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings({
        violationThreshold: localViolationThreshold,
        passingGrade: localPassingGrade,
        systemAnnouncement: localAnnouncement,
        maxPlagiarismScore: localMaxPlagiarismScore,
        enableCopyPasteProtection: localEnableCopyPasteProtection,
        enableViolationDetection: localEnableViolationDetection
      });
      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
        setIsSaving(false);
      }, 2000);
    } catch (e) {
      setIsSaving(false);
    }
  };

  const handleBroadcast = async () => {
    if (!localAnnouncement.trim()) {
      toast.error("Isi pesan pengumuman terlebih dahulu.");
      return;
    }
    const confirm = window.confirm(`Kirim notifikasi kepada ${broadcastTarget === 'ALL' ? 'SEMUA USER' : broadcastTarget}?`);
    if (!confirm) return;

    try {
      await broadcastAnnouncement(localAnnouncement, broadcastTarget);
      toast.success("Broadcast Terkirim!");
    } catch (e) {
      toast.error("Gagal mengirim broadcast.");
    }
  };

  const handleRetract = async () => {
    if (!window.confirm("Yakin ingin menarik pengumuman aktif? Banner akan hilang dari dashboard siswa.")) return;

    try {
      await retractAnnouncement();
      setLocalAnnouncement(''); // Clear local input too
      toast.success("Pengumuman ditarik!");
    } catch (e) {
      toast.error("Gagal menarik pengumuman.");
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      <Toaster position="top-right" />

      {/* Dynamic Background (Matches TemplateManagement) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-100 rounded-full blur-3xl opacity-40"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-purple-100 rounded-full blur-3xl opacity-40"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">

        {/* Header & Stats Row */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 rounded-full bg-white shadow-sm border border-gray-100 text-gray-500 text-xs font-bold tracking-widest uppercase">
                Super Admin
              </span>
            </div>
            <h1 className="text-5xl font-black text-gray-900 tracking-tight leading-tight">
              Konfigurasi <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Sistem</span>
            </h1>
            <p className="mt-4 text-gray-500 text-lg font-medium max-w-xl">
              Pusat kendali parameter akademik, keamanan ujian, dan komunikasi global.
            </p>
          </div>

          <div className="flex gap-4">
            <StatCard
              icon={isSystemOpen ? <LayoutDashboard size={28} className="text-white" /> : <Lock size={28} className="text-white" />}
              label="Status Akses"
              value={isSystemOpen ? "TERBUKA" : "TERKUNCI"}
              color={isSystemOpen ? "bg-emerald-500" : "bg-rose-500"}
              onClick={toggleSystemStatus}
              clickable
            />
            <StatCard
              icon={<Clock size={28} className="text-white" />}
              label="Versi Sistem"
              value="v2.1"
              color="bg-slate-800"
            />
          </div>
        </div>

        {/* Toolbar */}
        <div className="mb-8 flex flex-col md:flex-row gap-4 md:items-center justify-between">
          {/* Search (Visual Only for now) */}
          <div className="relative flex-1 group max-w-xl">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <Search className="h-6 w-6 text-gray-300 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Cari pengaturan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-14 pr-5 py-3.5 border-none rounded-2xl bg-white shadow-[0_4px_20px_rgb(0,0,0,0.03)] placeholder-gray-400 focus:ring-2 focus:ring-blue-100 text-gray-700 text-lg font-medium transition-all"
            />
          </div>

          {/* Main Action Button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`flex items-center justify-center px-8 py-3.5 rounded-xl font-bold text-sm shadow-xl shadow-blue-200 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ml-auto md:ml-0 ${isSaved
              ? 'bg-emerald-500 text-white hover:bg-emerald-600'
              : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
          >
            {isSaving ? (
              <>Menyimpan...</>
            ) : isSaved ? (
              <><CheckCircle2 className="w-5 h-5 mr-2" /> Tersimpan</>
            ) : (
              <><Save className="w-5 h-5 mr-2" /> Simpan Perubahan</>
            )}
          </button>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 gap-8">

          {/* CARD 1: ACADEMIC */}
          <SettingsCard
            title="Parameter Akademik"
            subtitle="Nilai standar dan batasan kelulusan."
            icon={<GraduationCap size={24} />}
            theme="blue"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputGroup
                label="Nilai Kelulusan (Passing Grade)"
                desc="Minimum lulus."
                value={localPassingGrade}
                onChange={setLocalPassingGrade}
                suffix="Pts"
                color="blue"
              />
              <InputGroup
                label="Verifikasi Integritas"
                desc="Batas skor untuk konsistensi dokumen."
                value={localMaxPlagiarismScore}
                onChange={setLocalMaxPlagiarismScore}
                suffix="%"
                color="green"
              />
            </div>
          </SettingsCard>

          {/* CARD 2: BROADCAST */}
          <div>
            <SettingsCard
              title="Pemberitahuan & Broadcast"
              subtitle="Kirim pengumuman massal ke siswa dan dosen."
              icon={<Globe size={24} />}
              theme="pink"
            >
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <div className="bg-pink-50 border border-pink-100 rounded-xl p-4 mb-4">
                    <h4 className="font-bold text-pink-800 flex items-center gap-2 mb-1">
                      <Bell size={16} />
                      Pusat Notifikasi
                    </h4>
                    <p className="text-xs text-pink-700 leading-relaxed">
                      Pesan akan muncul sebagai pop-up notifikasi dan tersimpan di riwayat (Lonceng). Target "Siswa" juga mengupdate banner dashboard.
                    </p>
                  </div>
                  <textarea
                    value={localAnnouncement}
                    onChange={(e) => setLocalAnnouncement(e.target.value)}
                    className="w-full h-32 px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-pink-200 text-gray-700 placeholder-gray-400 resize-none font-medium mb-4"
                    placeholder="Tulis pesan pengumuman di sini..."
                  />
                </div>

                <div className="w-full md:w-72 flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Target Penerima</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['ALL', 'SISWA', 'PEMBIMBING', 'PENGUJI'].map((role) => (
                        <button
                          key={role}
                          onClick={() => setBroadcastTarget(role)}
                          className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${broadcastTarget === role
                            ? 'bg-pink-600 text-white border-pink-600 shadow-md'
                            : 'bg-white text-gray-500 border-gray-100 hover:bg-gray-50'
                            }`}
                        >
                          {role === 'ALL' ? 'SEMUA' : role}
                        </button>
                      ))}
                    </div>
                  </div>


                  <div className="flex gap-2 mt-auto w-full">
                    <button
                      onClick={handleRetract}
                      className="flex-1 py-3 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                      title="Hapus pengumuman aktif"
                    >
                      <Bell size={18} className="text-slate-400" />
                      <span className="text-xs">Tarik Pesan</span>
                    </button>
                    <button
                      onClick={handleBroadcast}
                      className="flex-[2] py-3 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-black transition-all flex items-center justify-center gap-2"
                    >
                      <Bell size={18} />
                      Kirim
                    </button>
                  </div>
                </div>
              </div>
            </SettingsCard>
          </div>

          {/* CARD 4: HISTORY */}
          <div className="xl:col-span-2">
            <SettingsCard
              title="Riwayat Pengumuman"
              subtitle="Arsip pengumuman yang pernah disiarkan."
              icon={<Clock size={24} />}
              theme="gray"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                      <th className="py-3 pl-2">Tanggal</th>
                      <th className="py-3">Pesan</th>
                      <th className="py-3">Target</th>
                      <th className="py-3">Oleh</th>
                      <th className="py-3 pr-2 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm font-medium text-gray-600">
                    {announcements.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-400 italic">
                          Belum ada riwayat pengumuman.
                        </td>
                      </tr>
                    ) : (
                      announcements.map((item) => (
                        <tr key={item.id} className="group border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="py-4 pl-2 text-gray-500 whitespace-nowrap">
                            {new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-4 max-w-lg truncate pr-4 text-gray-800" title={item.content}>
                            {item.content}
                          </td>
                          <td className="py-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${item.target === 'ALL' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                              {item.target === 'ALL' ? 'SEMUA' : item.target}
                            </span>
                          </td>
                          <td className="py-4 text-gray-500">
                            {item.Admin?.name || 'Sistem'}
                          </td>
                          <td className="py-4 pr-2 text-right">
                            <button
                              onClick={() => handleDeleteHistory(item.id)}
                              className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                              title="Hapus dari riwayat"
                            >
                              <div className="w-4 h-4">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                              </div>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </SettingsCard>
          </div>

        </div>

      </div>
    </div>
  );
};

// --- SUB COMPONENTS (Styled like TemplateManagement) ---

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  clickable?: boolean;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color, clickable, onClick }) => (
  <div
    onClick={onClick}
    className={`p-5 rounded-3xl ${color} text-white shadow-lg shadow-gray-200 min-w-[140px] transform transition-transform duration-300 ${clickable ? 'cursor-pointer hover:scale-105 hover:opacity-90' : ''}`}
  >
    <div className="mb-3 bg-white/20 w-10 h-10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
      {icon}
    </div>
    <p className="text-xs font-semibold opacity-90 mb-0.5 uppercase tracking-wide">{label}</p>
    <h4 className="text-xl font-black">{value}</h4>
  </div>
);

const SettingsCard = ({ title, subtitle, icon, theme, children }: any) => {
  const themes: any = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100' },
    pink: { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-100' },
    gray: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' },
  };
  const t = themes[theme] || themes.blue;

  return (
    <div className="bg-white rounded-3xl shadow-[0_2px_8px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgb(0,0,0,0.08)] border border-gray-100 transition-all duration-300 overflow-hidden group">
      {/* Header */}
      <div className={`px-8 py-6 border-b border-gray-50 flex items-start gap-5 bg-gradient-to-r from-transparent via-transparent to-${theme}-50/30`}>
        <div className={`p-3.5 rounded-2xl ${t.bg} ${t.text} shadow-sm group-hover:scale-110 transition-transform duration-500`}>
          {icon}
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{title}</h3>
          <p className="text-sm text-gray-500 font-medium mt-1 leading-relaxed">{subtitle}</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {children}
      </div>
    </div>
  )
}

const InputGroup = ({ label, desc, value, onChange, suffix, color }: any) => {
  const focusColors: any = {
    blue: 'focus:ring-blue-100',
    orange: 'focus:ring-orange-100',
    red: 'focus:ring-red-100',
    green: 'focus:ring-green-100',
  };

  return (
    <div>
      <label className="block text-sm font-bold text-gray-800 mb-2">{label}</label>
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className={`block w-full px-4 py-3.5 bg-gray-50 border-none rounded-xl text-gray-900 font-bold text-lg focus:ring-4 ${focusColors[color] || 'focus:ring-blue-100'} transition-all`}
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">{suffix}</span>
      </div>
      <p className="text-xs text-gray-400 mt-2 font-medium">{desc}</p>
    </div>
  );
};

const ToggleRow = ({ label, desc, isActive, onToggle, colorClass }: any) => (
  <div
    onClick={onToggle}
    className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${isActive ? 'bg-gray-50 border-gray-200' : 'bg-white border-transparent hover:bg-gray-50'}`}
  >
    <div className="max-w-[70%]">
      <h4 className={`font-bold text-sm ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>{label}</h4>
      <p className="text-xs text-gray-400 leading-relaxed mt-0.5">{desc}</p>
    </div>

    <div className={`relative w-12 h-7 rounded-full transition-colors duration-300 ${isActive ? colorClass : 'bg-gray-200'}`}>
      <div className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full shadow-md transition-transform duration-300 ${isActive ? 'translate-x-5' : 'translate-x-0'}`}></div>
    </div>
  </div>
);

export default SystemSettings;
