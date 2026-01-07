import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { AlertTriangle, RefreshCw, CheckCircle, Search, History } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface StudentViolationSummary {
    id: string;
    name: string;
    nosis: string;
    activeViolations: number;
    resetCount: number;
}

interface ViolationDetail {
    id: string;
    type: string;
    description: string;
    date: string;
    resolved: boolean;
    createdAt: string;
}

const ViolationManagement: React.FC = () => {
    const [students, setStudents] = useState<StudentViolationSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    // Detail Modal State
    const [selectedStudent, setSelectedStudent] = useState<{ id: string, name: string } | null>(null);
    const [violationDetails, setViolationDetails] = useState<ViolationDetail[]>([]);
    const [detailLoading, setDetailLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchSummary = async () => {
        try {
            setLoading(true);
            const res = await api.get('/violations/summary');
            setStudents(res.data);
        } catch (error) {
            console.error(error);
            toast.error('Gagal mengambil data pelanggaran.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSummary();
    }, []);

    const handleSoftReset = async (studentId: string, studentName: string) => {
        if (!confirm(`Reset pelanggaran untuk ${studentName}? \n\nPelanggaran akan diarsipkan (Soft Reset) dan akses Editor akan dibuka kembali.`)) return;

        try {
            setRefreshing(true);
            const res = await api.delete(`/violations/reset/${studentId}`);
            // Note: DELETE method used for reset even though it's soft reset now

            toast.success(`Berhasil reset untuk ${studentName}. (Total Reset: ${res.data.resetCount})`);
            fetchSummary(); // Refresh list
        } catch (error) {
            console.error(error);
            toast.error('Gagal mereset pelanggaran.');
        } finally {
            setRefreshing(false);
        }
    };

    const handleViewDetails = async (studentId: string, studentName: string) => {
        setSelectedStudent({ id: studentId, name: studentName });
        setIsModalOpen(true);
        setDetailLoading(true);
        try {
            const res = await api.get(`/violations/user/${studentId}`);
            setViolationDetails(res.data);
        } catch (error) {
            console.error(error);
            toast.error('Gagal mengambil detail pelanggaran.');
        } finally {
            setDetailLoading(false);
        }
    };

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.nosis.includes(searchTerm)
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Manajemen Pelanggaran</h1>
                    <p className="mt-1 text-gray-600">Pantau dan kelola pelanggaran integritas siswa.</p>
                </div>
                <button
                    onClick={fetchSummary}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 transition"
                >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    Refresh Data
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Cari siswa..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-bold tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Siswa</th>
                                <th className="px-6 py-4 text-center">Status Editor</th>
                                <th className="px-6 py-4 text-center">Pelanggaran Aktif</th>
                                <th className="px-6 py-4 text-center">Total Reset</th>
                                <th className="px-6 py-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Memuat data...</td>
                                </tr>
                            ) : filteredStudents.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 flex flex-col items-center">
                                        <CheckCircle size={48} className="text-green-500 mb-3" />
                                        <p className="font-medium text-lg text-gray-800">Tidak ada pelanggaran aktif</p>
                                        <p className="text-sm">Semua siswa aman atau data kosong.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredStudents.map((student) => {
                                    const isLocked = student.activeViolations >= 3; // Hardcoded threshold visual check

                                    return (
                                        <tr key={student.id} className="hover:bg-gray-50 transition">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-800">{student.name}</div>
                                                <div className="text-xs text-gray-500 font-mono">{student.nosis}</div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {isLocked ? (
                                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                                                        <AlertTriangle size={12} /> TERKUNCI
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                                                        <CheckCircle size={12} /> AMAN
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`text-lg font-bold ${student.activeViolations > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                                    {student.activeViolations}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-1 text-gray-600">
                                                    <History size={16} />
                                                    <span className="font-bold">{student.resetCount}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleViewDetails(student.id, student.name)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                        title="Lihat Detail Pelanggaran"
                                                    >
                                                        <Search size={18} />
                                                    </button>
                                                    {student.activeViolations > 0 && (
                                                        <button
                                                            onClick={() => handleSoftReset(student.id, student.name)}
                                                            disabled={refreshing}
                                                            className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg font-medium text-sm transition"
                                                        >
                                                            Reset
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detail Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-800 text-lg">
                                Detail Pelanggaran: {selectedStudent?.name}
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4">
                            {detailLoading ? (
                                <div className="text-center py-8">Loading history...</div>
                            ) : violationDetails.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">Tidak ada riwayat pelanggaran.</div>
                            ) : (
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-2">Waktu</th>
                                            <th className="px-4 py-2">Jenis</th>
                                            <th className="px-4 py-2">Keterangan</th>
                                            <th className="px-4 py-2 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {violationDetails.map((v) => (
                                            <tr key={v.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                                                    {new Date(v.createdAt).toLocaleString('id-ID')}
                                                </td>
                                                <td className="px-4 py-3 font-medium text-gray-800">
                                                    {v.type}
                                                </td>
                                                <td className="px-4 py-3 text-gray-500">
                                                    {v.description || '-'}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {v.resolved ? (
                                                        <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">Resolved</span>
                                                    ) : (
                                                        <span className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full font-bold">Active</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                        <div className="p-4 border-t border-gray-100 bg-gray-50 text-right">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ViolationManagement;
