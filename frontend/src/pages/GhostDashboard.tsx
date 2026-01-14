import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
    Ghost, Search, Filter, MoreHorizontal, ChevronRight, FileEdit,
    User, CheckCircle, Clock, ShieldAlert, Award, FileText, Zap, LayoutGrid, List
} from 'lucide-react';
import { useSystem } from '../contexts/SystemContext';
import { useNavigate } from 'react-router-dom';

const GhostDashboard: React.FC = () => {
    const { passingGrade } = useSystem();
    const navigate = useNavigate();

    // Data State
    const [grades, setGrades] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'passed' | 'remedial' | 'ungraded'>('all');

    // Stats for Hero Section
    const [stats, setStats] = useState({
        total: 0,
        graded: 0,
        passed: 0,
        remedial: 0,
        ungraded: 0
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            // Helper has access to ALL papers via this endpoint due to previous backend fix
            const res = await api.get('/grades');
            const data = res.data;
            setGrades(data);

            // Compute stats
            const total = data.length;
            const graded = data.filter((g: any) => g.finalScore > 0).length;
            const passed = data.filter((g: any) => g.finalScore >= passingGrade).length;
            const remedial = data.filter((g: any) => g.finalScore > 0 && g.finalScore < passingGrade).length;
            const ungraded = total - graded;

            setStats({ total, graded, passed, remedial, ungraded });
        } catch (error) {
            console.error('Failed to fetch ghost data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredData = grades.filter(item => {
        const matchesSearch = item.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.studentId.includes(searchQuery) ||
            item.paperTitle?.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;

        if (filterStatus === 'passed') return item.finalScore >= passingGrade;
        if (filterStatus === 'remedial') return item.finalScore > 0 && item.finalScore < passingGrade;
        if (filterStatus === 'ungraded') return !item.finalScore || item.finalScore === 0;

        return true;
    });

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-indigo-50 text-indigo-600 rounded-full animate-pulse">
                        <Ghost size={48} />
                    </div>
                    <p className="text-gray-500 font-medium">Memuat Mode Bayangan...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 space-y-8 animate-in fade-in duration-500">
            {/* Hero Section / Header */}
            <div className="relative bg-white border-b border-gray-200 shadow-sm overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                    <Ghost size={200} />
                </div>
                <div className="relative p-8 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                                <Zap size={12} fill="currentColor" /> Active
                            </span>
                            <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-bold uppercase tracking-wider">
                                System Build v2.4
                            </span>
                        </div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                            Mode Bayangan <span className="text-indigo-600">Pro</span>
                        </h1>
                        <p className="text-lg text-gray-500 mt-2 max-w-2xl">
                            Akses penuh tanpa batas. Mode intervensi langsung untuk membantu pengerjaan siswa secara realtime.
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex flex-col items-center min-w-[100px]">
                            <span className="text-3xl font-black text-indigo-600">{stats.total}</span>
                            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wide">Total Siswa</span>
                        </div>
                        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex flex-col items-center min-w-[100px]">
                            <span className="text-3xl font-black text-emerald-600">{stats.passed}</span>
                            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">Lulus</span>
                        </div>
                        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex flex-col items-center min-w-[100px]">
                            <span className="text-3xl font-black text-amber-600">{stats.ungraded}</span>
                            <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">Belum Dinilai</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 pb-20">
                {/* Toolbar */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                    {/* Search */}
                    <div className="relative w-full md:w-96 group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                            <Search size={20} />
                        </div>
                        <input
                            type="text"
                            placeholder="Cari siswa, Nosis, atau judul..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm hover:shadow-md"
                        />
                    </div>

                    {/* Filters & View Toggle */}
                    <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                        <div className="flex p-1 bg-white border border-gray-200 rounded-xl shadow-sm">
                            {[
                                { id: 'all', label: 'Semua' },
                                { id: 'passed', label: 'Lulus' },
                                { id: 'remedial', label: 'Remedial' },
                                { id: 'ungraded', label: 'Belum Dinilai' },
                            ].map((filter) => (
                                <button
                                    key={filter.id}
                                    onClick={() => setFilterStatus(filter.id as any)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${filterStatus === filter.id
                                        ? 'bg-gray-900 text-white shadow-md'
                                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex p-1 bg-white border border-gray-200 rounded-xl shadow-sm">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <LayoutGrid size={20} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <List size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content Grid/List */}
                {filteredData.length > 0 ? (
                    viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                            {filteredData.map((item) => (
                                <div
                                    key={item.id}
                                    className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 group relative flex flex-col"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold
                        ${item.finalScore >= passingGrade ? 'bg-emerald-100 text-emerald-700' :
                                                    item.finalScore > 0 ? 'bg-rose-100 text-rose-700' :
                                                        'bg-gray-100 text-gray-500'}`}>
                                                {item.studentName.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 line-clamp-1" title={item.studentName}>
                                                    {item.studentName}
                                                </h3>
                                                <p className="text-xs text-gray-500 font-mono">{item.studentId}</p>
                                            </div>
                                        </div>
                                        {item.finalScore > 0 && (
                                            <div className={`px-2 py-1 rounded-lg text-xs font-bold
                        ${item.finalScore >= passingGrade ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                {item.finalScore}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 mb-6">
                                        <p className="text-sm text-gray-600 line-clamp-2 min-h-[40px]" title={item.paperTitle || 'Belum ada judul'}>
                                            {item.paperTitle || <span className="italic text-gray-400">Belum ada judul karya tulis</span>}
                                        </p>
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-50 border border-gray-100 text-xs text-gray-500">
                                                <User size={10} /> {item.advisorName !== 'Unassigned' ? item.advisorName : 'Tanpa Pembimbing'}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => window.open(`#/student/paper/${item.id}`, '_blank')}
                                        className="w-full py-3 bg-white border-2 border-indigo-600 text-indigo-700 font-bold rounded-xl flex items-center justify-center gap-2 group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:scale-[1.02] active:scale-95"
                                    >
                                        <Ghost size={18} />
                                        Ghost Edit
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Siswa</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Judul</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nilai</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredData.map((item) => (
                                        <tr key={item.id} className="hover:bg-indigo-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900">{item.studentName}</div>
                                                <div className="text-xs text-gray-500 font-mono">{item.studentId}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-600 line-clamp-1 max-w-sm">{item.paperTitle || '-'}</div>
                                                <div className="text-xs text-gray-400 mt-1">{item.advisorName}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {item.finalScore > 0 ? (
                                                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${item.finalScore >= passingGrade ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                        {item.finalScore}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => window.open(`#/student/paper/${item.id}`, '_blank')}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition shadow-sm opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0"
                                                >
                                                    <Ghost size={14} /> Edit
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
                        <div className="p-6 bg-gray-50 rounded-full mb-4">
                            <Search size={32} className="text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Tidak ada data ditemukan</h3>
                        <p className="text-gray-500 mt-1">Coba sesuaikan kata kunci pencarian atau filter.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GhostDashboard;
