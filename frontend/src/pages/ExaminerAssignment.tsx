import React, { useState, useMemo, useEffect } from 'react';
import api from '../services/api';
import { SearchIcon, UserGroupIcon } from '../components/icons';
import { Users, UserCheck, UserX, AlertCircle, CheckCircle2, Trash2, ChevronDown, Loader2, X, Plus, Zap, Settings } from 'lucide-react';

interface Student {
    id: string;
    name: string;
    nosis: string;
    examiners: Array<{
        id: string;
        examinerId: string;
        examinerName: string;
        examinerNosis?: string;
    }>;
}

interface Examiner {
    id: string;
    name: string;
    nosis: string;
    currentStudents: number;
    maxStudents: number;
    availableSlots: number;
    isFull: boolean;
    percentage: number;
}

interface ExaminerCapacityData {
    examiners: Examiner[];
    summary: {
        totalExaminers: number;
        fullExaminers: number;
        availableExaminers: number;
        totalCapacity: number;
        totalAssigned: number;
    };
}

const ExaminerAssignment: React.FC = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [examinerCapacity, setExaminerCapacity] = useState<ExaminerCapacityData | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedExaminerFilter, setSelectedExaminerFilter] = useState<string>('all');
    const [loading, setLoading] = useState(false);
    const [autoAssigning, setAutoAssigning] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // Assignment Modal state
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [modalExaminer1, setModalExaminer1] = useState('');
    const [modalExaminer2, setModalExaminer2] = useState('');
    const [modalAssigning, setModalAssigning] = useState(false);

    // Capacity Modal state
    const [showCapacityModal, setShowCapacityModal] = useState(false);
    const [selectedExaminer, setSelectedExaminer] = useState<Examiner | null>(null);
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
                api.get('/examiner-assignment/students'),
                api.get('/examiner-assignment/capacity')
            ]);

            setStudents(studentsRes.data.students || []);
            setExaminerCapacity(capacityRes.data);
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

        if (selectedExaminerFilter !== 'all') {
            if (selectedExaminerFilter === 'incomplete') {
                filtered = filtered.filter(s => s.examiners.length < 2);
            } else if (selectedExaminerFilter === 'complete') {
                filtered = filtered.filter(s => s.examiners.length === 2);
            } else {
                filtered = filtered.filter(s =>
                    s.examiners.some(e => e.examinerId === selectedExaminerFilter)
                );
            }
        }

        return filtered;
    }, [students, searchTerm, selectedExaminerFilter]);

    const handleAutoAssign = async () => {
        if (!confirm('Mulai auto-assignment untuk siswa yang belum lengkap?')) return;

        setAutoAssigning(true);
        try {
            const response = await api.post('/examiner-assignment/auto-assign');
            setNotification({ type: 'success', message: `${response.data.message} (${response.data.assigned} ditugaskan)` });
            await fetchData();
        } catch (error: any) {
            setNotification({ type: 'error', message: error.response?.data?.message || 'Gagal auto-assignment' });
        } finally {
            setAutoAssigning(false);
        }
    };

    const handleAssignExaminer = async (studentId: string, examinerId: string) => {
        if (!examinerId) return;
        try {
            await api.post('/examiner-assignment/assign', { studentId, examinerId });
            setNotification({ type: 'success', message: 'Penguji berhasil ditugaskan' });
            await fetchData();
        } catch (error: any) {
            setNotification({ type: 'error', message: error.response?.data?.error || 'Gagal menugaskan penguji' });
        }
    };

    const handleRemoveExaminer = async (assignmentId: string) => {
        if (!confirm('Hapus penugasan ini?')) return;
        try {
            await api.delete(`/examiner-assignment/${assignmentId}`);
            setNotification({ type: 'success', message: 'Penugasan dihapus' });
            await fetchData();
        } catch (error) {
            setNotification({ type: 'error', message: 'Gagal menghapus penugasan' });
        }
    };

    const openAssignModal = (student: Student) => {
        setSelectedStudent(student);
        setModalExaminer1(student.examiners[0]?.examinerId || '');
        setModalExaminer2(student.examiners[1]?.examinerId || '');
        setShowAssignModal(true);
    };

    const handleModalAssign = async () => {
        if (!selectedStudent) return;

        setModalAssigning(true);
        try {
            // Remove existing assignments first
            for (const examiner of selectedStudent.examiners) {
                await api.delete(`/examiner-assignment/${examiner.id}`);
            }

            // Assign new examiners
            const assignments = [];
            if (modalExaminer1) {
                assignments.push(api.post('/examiner-assignment/assign', {
                    studentId: selectedStudent.id,
                    examinerId: modalExaminer1
                }));
            }
            if (modalExaminer2 && modalExaminer2 !== modalExaminer1) {
                assignments.push(api.post('/examiner-assignment/assign', {
                    studentId: selectedStudent.id,
                    examinerId: modalExaminer2
                }));
            }

            await Promise.all(assignments);

            setNotification({ type: 'success', message: 'Penguji berhasil ditugaskan!' });
            setShowAssignModal(false);
            await fetchData();
        } catch (error: any) {
            setNotification({ type: 'error', message: error.response?.data?.error || 'Gagal menugaskan penguji' });
        } finally {
            setModalAssigning(false);
        }
    };

    const handleUpdateCapacity = async () => {
        if (!selectedExaminer) return;

        setUpdatingCapacity(true);
        try {
            await api.patch(`/examiner-assignment/capacity/${selectedExaminer.id}`, {
                examinerId: selectedExaminer.id,
                maxStudents: newCapacity
            });

            setNotification({ type: 'success', message: `Kapasitas ${selectedExaminer.name} diperbarui menjadi ${newCapacity} siswa!` });
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

    const availableExaminersForModal = useMemo(() => {
        if (!examinerCapacity) return [];
        return examinerCapacity.examiners.filter(e => !e.isFull);
    }, [examinerCapacity]);

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
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Manajemen Penguji</h1>
                    <p className="mt-2 text-gray-500 max-w-2xl">
                        Pantau kapasitas dan kelola penugasan penguji secara efisien. Setiap siswa wajib memiliki 2 penguji.
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
            {examinerCapacity && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                            <span className="text-xs font-bold px-2 py-1 bg-blue-50 text-blue-600 rounded-full">Total</span>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 mb-1">{examinerCapacity.summary.totalExaminers}</div>
                        <div className="text-sm text-gray-500">Penguji Terdaftar</div>
                    </div>

                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-emerald-50 rounded-lg">
                                <UserCheck className="w-6 h-6 text-emerald-600" />
                            </div>
                            <span className="text-xs font-bold px-2 py-1 bg-emerald-50 text-emerald-600 rounded-full">Available</span>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 mb-1">{examinerCapacity.summary.availableExaminers}</div>
                        <div className="text-sm text-gray-500">Penguji Tersedia</div>
                    </div>

                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-red-50 rounded-lg">
                                <UserX className="w-6 h-6 text-red-600" />
                            </div>
                            <span className="text-xs font-bold px-2 py-1 bg-red-50 text-red-600 rounded-full">Full</span>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 mb-1">{examinerCapacity.summary.fullExaminers}</div>
                        <div className="text-sm text-gray-500">Penguji Penuh</div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-5 rounded-xl shadow-md text-white">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                <CheckCircle2 className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xs font-bold px-2 py-1 bg-white/20 text-white rounded-full backdrop-blur-sm">Capacity</span>
                        </div>
                        <div className="text-3xl font-bold mb-1">{examinerCapacity.summary.totalAssigned} <span className="text-lg font-normal opacity-80">/ {examinerCapacity.summary.totalCapacity}</span></div>
                        <div className="text-sm text-blue-100">Total Penugasan</div>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Examiner List (Capacity) */}
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
                            {examinerCapacity?.examiners.map(examiner => (
                                <div key={examiner.id} className="group p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-900 text-sm">{examiner.name}</div>
                                            <div className="text-xs text-gray-500">{examiner.nosis}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${examiner.isFull ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                                                }`}>
                                                {examiner.currentStudents}/{examiner.maxStudents}
                                            </span>
                                            <button
                                                onClick={() => {
                                                    setSelectedExaminer(examiner);
                                                    setNewCapacity(examiner.maxStudents);
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
                                            className={`h-1.5 rounded-full transition-all duration-500 ${getProgressBarColor(examiner.percentage)}`}
                                            style={{ width: `${Math.min(examiner.percentage, 100)}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-400">
                                        <span>{examiner.percentage.toFixed(0)}% Terisi</span>
                                        <span>{examiner.availableSlots} Slot Tersedia</span>
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
                                value={selectedExaminerFilter}
                                onChange={(e) => setSelectedExaminerFilter(e.target.value)}
                                className="w-full pl-3 pr-10 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none bg-white transition-all"
                            >
                                <option value="all">Semua Status</option>
                                <option value="incomplete">⚠️ Belum Lengkap</option>
                                <option value="complete">✅ Sudah Lengkap</option>
                                <optgroup label="Filter per Penguji">
                                    {examinerCapacity?.examiners.map(e => (
                                        <option key={e.id} value={e.id}>{e.name}</option>
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
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Penguji</th>
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
                                                    {student.examiners.length === 2 ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                                                            <CheckCircle2 className="w-3 h-3" /> Lengkap
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                                                            <AlertCircle className="w-3 h-3" /> {student.examiners.length}/2
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-1.5">
                                                        {student.examiners.length > 0 ? (
                                                            student.examiners.map((examiner, idx) => (
                                                                <div key={examiner.id} className="flex items-center justify-between group/cell bg-gray-50 px-3 py-1.5 rounded-lg border border-transparent hover:border-gray-200 transition-all">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-[10px] font-bold text-gray-400">#{idx + 1}</span>
                                                                        <span className="text-sm text-gray-700 truncate max-w-[150px]" title={examiner.examinerName}>
                                                                            {examiner.examinerName}
                                                                        </span>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => handleRemoveExaminer(examiner.id)}
                                                                        className="text-gray-400 hover:text-red-600 opacity-0 group-hover/cell:opacity-100 transition-opacity p-1"
                                                                        title="Hapus Penguji"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="text-xs text-gray-400 italic">Belum ada penguji</div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => openAssignModal(student)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                                                    >
                                                        <Plus className="w-3.5 h-3.5" />
                                                        {student.examiners.length === 0 ? 'Tugaskan' : 'Ubah'}
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
                                <h3 className="text-lg font-bold text-white">Tugaskan Penguji</h3>
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
                            {/* Penguji 1 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Penguji 1 <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={modalExaminer1}
                                    onChange={(e) => setModalExaminer1(e.target.value)}
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white text-sm"
                                >
                                    <option value="">-- Pilih Penguji 1 --</option>
                                    {availableExaminersForModal.map(e => (
                                        <option key={e.id} value={e.id} disabled={e.id === modalExaminer2}>
                                            {e.name} ({e.availableSlots} slot)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Penguji 2 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Penguji 2 <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={modalExaminer2}
                                    onChange={(e) => setModalExaminer2(e.target.value)}
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white text-sm"
                                >
                                    <option value="">-- Pilih Penguji 2 --</option>
                                    {availableExaminersForModal.map(e => (
                                        <option key={e.id} value={e.id} disabled={e.id === modalExaminer1}>
                                            {e.name} ({e.availableSlots} slot)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Info */}
                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex gap-2">
                                <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-blue-700">
                                    Pilih 2 penguji yang berbeda untuk siswa ini. Penguji yang sudah penuh tidak akan muncul dalam daftar.
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
                                disabled={!modalExaminer1 || !modalExaminer2 || modalExaminer1 === modalExaminer2 || modalAssigning}
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
            {showCapacityModal && selectedExaminer && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-white">Edit Kapasitas Penguji</h3>
                                <p className="text-sm text-blue-100 mt-0.5">{selectedExaminer.name}</p>
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
                                    min={selectedExaminer.currentStudents}
                                    max={100}
                                    value={newCapacity}
                                    onChange={(e) => setNewCapacity(parseInt(e.target.value) || 0)}
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                                />
                                <p className="text-xs text-gray-500 mt-1.5">
                                    Saat ini: <span className="font-semibold text-gray-700">{selectedExaminer.currentStudents} siswa</span> sudah ditugaskan
                                </p>
                                {newCapacity < selectedExaminer.currentStudents && (
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
                                    Kapasitas menentukan berapa banyak siswa yang dapat ditugaskan ke penguji ini. Anda dapat mengatur kapasitas berbeda untuk setiap penguji.
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
                                disabled={updatingCapacity || newCapacity < selectedExaminer.currentStudents || newCapacity < 1}
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

export default ExaminerAssignment;
