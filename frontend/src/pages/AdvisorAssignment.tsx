import React, { useState, useMemo, useEffect } from 'react';
import api from '../services/api';
import { SearchIcon } from '../components/icons';
import { Users, UserCheck, UserX, AlertCircle, CheckCircle2, Trash2, ChevronDown, Loader2, X, Plus, Zap, Settings } from 'lucide-react';

interface Student {
    id: string;
    name: string;
    nosis: string;
    pembimbingId?: string;
    pembimbingName?: string;
    pembimbingNosis?: string;
}

interface Advisor {
    id: string;
    name: string;
    nosis: string;
    currentStudents: number;
    maxStudents: number;
    availableSlots: number;
    isFull: boolean;
    percentage: number;
}

interface AdvisorCapacityData {
    advisors: Advisor[];
    summary: {
        totalAdvisors: number;
        fullAdvisors: number;
        availableAdvisors: number;
        totalCapacity: number;
        totalAssigned: number;
    };
}

const AdvisorAssignment: React.FC = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [advisorCapacity, setAdvisorCapacity] = useState<AdvisorCapacityData | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAdvisorFilter, setSelectedAdvisorFilter] = useState<string>('all');
    const [loading, setLoading] = useState(false);
    const [autoAssigning, setAutoAssigning] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // Assignment Modal state
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [selectedAdvisorId, setSelectedAdvisorId] = useState('');
    const [modalAssigning, setModalAssigning] = useState(false);

    // Capacity Modal state
    const [showCapacityModal, setShowCapacityModal] = useState(false);
    const [selectedAdvisor, setSelectedAdvisor] = useState<Advisor | null>(null);
    const [newCapacity, setNewCapacity] = useState(25);
    const [updatingCapacity, setUpdatingCapacity] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    // Clear notification after 3 seconds
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [studentsRes, capacityRes] = await Promise.all([
                api.get('/advisor-assignment/students'),
                api.get('/advisor-assignment/capacity')
            ]);

            setStudents(studentsRes.data.students || []);
            setAdvisorCapacity(capacityRes.data);
        } catch (error) {
            console.error('Failed to fetch data:', error);
            setNotification({ type: 'error', message: 'Gagal memuat data.' });
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = useMemo(() => {
        let filtered = students;

        if (searchTerm) {
            filtered = filtered.filter(s =>
                s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.nosis.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (selectedAdvisorFilter !== 'all') {
            if (selectedAdvisorFilter === 'unassigned') {
                filtered = filtered.filter(s => !s.pembimbingId);
            } else if (selectedAdvisorFilter === 'assigned') {
                filtered = filtered.filter(s => s.pembimbingId);
            } else {
                filtered = filtered.filter(s => s.pembimbingId === selectedAdvisorFilter);
            }
        }

        return filtered;
    }, [students, searchTerm, selectedAdvisorFilter]);

    const handleAutoAssign = async () => {
        if (!confirm('Mulai auto-assignment untuk siswa yang belum punya pembimbing?')) return;

        setAutoAssigning(true);
        try {
            const response = await api.post('/advisor-assignment/auto-assign');
            setNotification({ type: 'success', message: `${response.data.message} (${response.data.assigned} ditugaskan)` });
            await fetchData();
        } catch (error: any) {
            setNotification({ type: 'error', message: error.response?.data?.message || 'Gagal auto-assignment' });
        } finally {
            setAutoAssigning(false);
        }
    };

    const openAssignModal = (student: Student) => {
        setSelectedStudent(student);
        setSelectedAdvisorId(student.pembimbingId || '');
        setShowAssignModal(true);
    };

    const handleModalAssign = async () => {
        if (!selectedStudent || !selectedAdvisorId) return;

        setModalAssigning(true);
        try {
            await api.put(`/users/${selectedStudent.id}`, {
                pembimbingId: selectedAdvisorId
            });

            setNotification({ type: 'success', message: 'Pembimbing berhasil ditugaskan!' });
            setShowAssignModal(false);
            await fetchData();
        } catch (error: any) {
            setNotification({ type: 'error', message: error.response?.data?.error || 'Gagal menugaskan pembimbing' });
        } finally {
            setModalAssigning(false);
        }
    };

    const handleRemoveAdvisor = async (studentId: string) => {
        if (!confirm('Hapus pembimbing dari siswa ini?')) return;
        try {
            await api.put(`/users/${studentId}`, {
                pembimbingId: null
            });
            setNotification({ type: 'success', message: 'Pembimbing dihapus' });
            await fetchData();
        } catch (error) {
            setNotification({ type: 'error', message: 'Gagal menghapus pembimbing' });
        }
    };

    const handleUpdateCapacity = async () => {
        if (!selectedAdvisor) return;

        setUpdatingCapacity(true);
        try {
            await api.patch(`/advisor-assignment/capacity/${selectedAdvisor.id}`, {
                advisorId: selectedAdvisor.id,
                maxStudents: newCapacity
            });

            setNotification({ type: 'success', message: `Kapasitas ${selectedAdvisor.name} diperbarui menjadi ${newCapacity} siswa!` });
            setShowCapacityModal(false);
            await fetchData();
        } catch (error: any) {
            setNotification({ type: 'error', message: error.response?.data?.error || 'Gagal memperbarui kapasitas' });
        } finally {
            setUpdatingCapacity(false);
        }
    };

    const getProgressBarColor = (percentage: number) => {
        if (percentage >= 100) return 'bg-red-500';
        if (percentage >= 80) return 'bg-amber-500';
        return 'bg-emerald-500';
    };

    const availableAdvisorsForModal = useMemo(() => {
        if (!advisorCapacity) return [];
        return advisorCapacity.advisors.filter(a => !a.isFull);
    }, [advisorCapacity]);

    if (loading && !students.length) {
        return (
            <div className="flex flex-col items-center justify-center h-96">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Memuat data penugasan...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Manajemen Pembimbing</h1>
                    <p className="mt-2 text-gray-500 max-w-2xl">
                        Pantau kapasitas dan kelola penugasan pembimbing secara efisien. Setiap siswa wajib memiliki 1 pembimbing.
                    </p>
                </div>
                {notification && (
                    <div className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-5 duration-300 ${notification.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                        {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        <span className="font-medium text-sm">{notification.message}</span>
                    </div>
                )}
            </div>

            {/* Stats Cards */}
            {advisorCapacity && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                            <span className="text-xs font-bold px-2 py-1 bg-blue-50 text-blue-600 rounded-full">Total</span>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 mb-1">{advisorCapacity.summary.totalAdvisors}</div>
                        <div className="text-sm text-gray-500">Pembimbing Terdaftar</div>
                    </div>

                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-emerald-50 rounded-lg">
                                <UserCheck className="w-6 h-6 text-emerald-600" />
                            </div>
                            <span className="text-xs font-bold px-2 py-1 bg-emerald-50 text-emerald-600 rounded-full">Available</span>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 mb-1">{advisorCapacity.summary.availableAdvisors}</div>
                        <div className="text-sm text-gray-500">Pembimbing Tersedia</div>
                    </div>

                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-red-50 rounded-lg">
                                <UserX className="w-6 h-6 text-red-600" />
                            </div>
                            <span className="text-xs font-bold px-2 py-1 bg-red-50 text-red-600 rounded-full">Full</span>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 mb-1">{advisorCapacity.summary.fullAdvisors}</div>
                        <div className="text-sm text-gray-500">Pembimbing Penuh</div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-5 rounded-xl shadow-md text-white">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                <CheckCircle2 className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xs font-bold px-2 py-1 bg-white/20 text-white rounded-full backdrop-blur-sm">Capacity</span>
                        </div>
                        <div className="text-3xl font-bold mb-1">{advisorCapacity.summary.totalAssigned} <span className="text-lg font-normal opacity-80">/ {advisorCapacity.summary.totalCapacity}</span></div>
                        <div className="text-sm text-blue-100">Total Penugasan</div>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Advisor List (Capacity) */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                            <h3 className="font-semibold text-gray-800">Status Kapasitas</h3>
                            <button
                                onClick={handleAutoAssign}
                                disabled={autoAssigning}
                                className="text-xs font-medium px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                            >
                                {autoAssigning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                                Auto Assign
                            </button>
                        </div>
                        <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
                            {advisorCapacity?.advisors.map(advisor => (
                                <div key={advisor.id} className="group p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-900 text-sm">{advisor.name}</div>
                                            <div className="text-xs text-gray-500">{advisor.nosis}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${advisor.isFull ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                                                }`}>
                                                {advisor.currentStudents}/{advisor.maxStudents}
                                            </span>
                                            <button
                                                onClick={() => {
                                                    setSelectedAdvisor(advisor);
                                                    setNewCapacity(advisor.maxStudents);
                                                    setShowCapacityModal(true);
                                                }}
                                                className="text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all p-1.5 rounded-lg border border-gray-200 hover:border-indigo-300"
                                                title="Edit Kapasitas"
                                            >
                                                <Settings className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1">
                                        <div
                                            className={`h-1.5 rounded-full transition-all duration-500 ${getProgressBarColor(advisor.percentage)}`}
                                            style={{ width: `${Math.min(advisor.percentage, 100)}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-400">
                                        <span>{advisor.percentage.toFixed(0)}% Terisi</span>
                                        <span>{advisor.availableSlots} Slot Tersedia</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Student Assignment Table */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Filters */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari siswa..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                        </div>
                        <div className="relative w-full sm:w-64">
                            <select
                                value={selectedAdvisorFilter}
                                onChange={(e) => setSelectedAdvisorFilter(e.target.value)}
                                className="w-full pl-3 pr-10 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none bg-white transition-all"
                            >
                                <option value="all">Semua Status</option>
                                <option value="unassigned">⚠️ Belum Ada Pembimbing</option>
                                <option value="assigned">✅ Sudah Ada Pembimbing</option>
                                <optgroup label="Filter per Pembimbing">
                                    {advisorCapacity?.advisors.map(a => (
                                        <option key={a.id} value={a.id}>{a.name}</option>
                                    ))}
                                </optgroup>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50/50 border-b border-gray-100">
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Siswa</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Pembimbing</th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredStudents.length > 0 ? (
                                        filteredStudents.map((student) => (
                                            <tr key={student.id} className="hover:bg-gray-50/50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                                                            {student.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-gray-900 text-sm">{student.name}</div>
                                                            <div className="text-xs text-gray-500 font-mono">{student.nosis}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {student.pembimbingId ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                                                            <CheckCircle2 className="w-3 h-3" /> Ada Pembimbing
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                                                            <AlertCircle className="w-3 h-3" /> Belum Ada
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {student.pembimbingId && student.pembimbingName ? (
                                                        <div className="flex items-center justify-between group/cell bg-gray-50 px-3 py-1.5 rounded-lg border border-transparent hover:border-gray-200 transition-all">
                                                            <span className="text-sm text-gray-700 truncate max-w-[200px]" title={student.pembimbingName}>
                                                                {student.pembimbingName}
                                                            </span>
                                                            <button
                                                                onClick={() => handleRemoveAdvisor(student.id)}
                                                                className="text-gray-400 hover:text-red-600 opacity-0 group-hover/cell:opacity-100 transition-opacity p-1"
                                                                title="Hapus Pembimbing"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="text-xs text-gray-400 italic">Belum ada pembimbing</div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => openAssignModal(student)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                                                    >
                                                        <Plus className="w-3.5 h-3.5" />
                                                        {student.pembimbingId ? 'Ubah' : 'Tugaskan'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center">
                                                <div className="flex flex-col items-center justify-center text-gray-400">
                                                    <Users className="w-12 h-12 mb-3 opacity-20" />
                                                    <p className="text-base font-medium text-gray-500">Tidak ada siswa ditemukan</p>
                                                    <p className="text-sm mt-1">Coba sesuaikan filter pencarian Anda</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Assignment Modal */}
            {showAssignModal && selectedStudent && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-white">Tugaskan Pembimbing</h3>
                                <p className="text-sm text-blue-100 mt-0.5">{selectedStudent.name}</p>
                            </div>
                            <button
                                onClick={() => setShowAssignModal(false)}
                                className="text-white/80 hover:text-white transition-colors p-1"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Pilih Pembimbing <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={selectedAdvisorId}
                                    onChange={(e) => setSelectedAdvisorId(e.target.value)}
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white text-sm"
                                >
                                    <option value="">-- Pilih Pembimbing --</option>
                                    {availableAdvisorsForModal.map(a => (
                                        <option key={a.id} value={a.id}>
                                            {a.name} ({a.availableSlots} slot tersedia)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Info */}
                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex gap-2">
                                <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-blue-700">
                                    Pilih 1 pembimbing untuk siswa ini. Pembimbing yang sudah penuh tidak akan muncul dalam daftar.
                                </p>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end">
                            <button
                                onClick={() => setShowAssignModal(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                disabled={modalAssigning}
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleModalAssign}
                                disabled={!selectedAdvisorId || modalAssigning}
                                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                            >
                                {modalAssigning && <Loader2 className="w-4 h-4 animate-spin" />}
                                {modalAssigning ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Capacity Edit Modal */}
            {showCapacityModal && selectedAdvisor && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-white">Edit Kapasitas Pembimbing</h3>
                                <p className="text-sm text-blue-100 mt-0.5">{selectedAdvisor.name}</p>
                            </div>
                            <button
                                onClick={() => setShowCapacityModal(false)}
                                className="text-white/80 hover:text-white transition-colors p-1"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Kapasitas Maksimal Siswa <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    min={selectedAdvisor.currentStudents}
                                    max={100}
                                    value={newCapacity}
                                    onChange={(e) => setNewCapacity(parseInt(e.target.value) || 0)}
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                                />
                                <p className="text-xs text-gray-500 mt-1.5">
                                    Saat ini: <span className="font-semibold text-gray-700">{selectedAdvisor.currentStudents} siswa</span> sudah ditugaskan
                                </p>
                                {newCapacity < selectedAdvisor.currentStudents && (
                                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        Kapasitas tidak boleh kurang dari jumlah siswa yang sudah ditugaskan
                                    </p>
                                )}
                            </div>

                            {/* Info */}
                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex gap-2">
                                <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-blue-700">
                                    Kapasitas menentukan berapa banyak siswa yang dapat ditugaskan ke pembimbing ini. Anda dapat mengatur kapasitas berbeda untuk setiap pembimbing.
                                </p>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end">
                            <button
                                onClick={() => setShowCapacityModal(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                disabled={updatingCapacity}
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleUpdateCapacity}
                                disabled={updatingCapacity || newCapacity < selectedAdvisor.currentStudents || newCapacity < 1}
                                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                            >
                                {updatingCapacity && <Loader2 className="w-4 h-4 animate-spin" />}
                                {updatingCapacity ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdvisorAssignment;