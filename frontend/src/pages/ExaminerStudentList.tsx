
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
    Loader2, Search, Filter, ArrowRight, MoreVertical,
    CheckCircle2, AlertCircle, FileText, Star, Clock
} from 'lucide-react';

interface StudentPaper {
    id: string;
    title: string;
    status: string;
    finalApprovalStatus: string;
    finalFileUrl: string | null;
    grade: number | null;
    Assignment: {
        title: string;
    };
}

interface AssignedStudent {
    id: string;
    name: string;
    nrp: string | null;
    nosis: string;
    Paper: StudentPaper[];
}

const ExaminerStudentList: React.FC = () => {
    const [students, setStudents] = useState<AssignedStudent[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'READY' | 'GRADED'>('ALL');
    const navigate = useNavigate();

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const response = await api.get('/examiners/me/students');
            setStudents(response.data);
        } catch (error) {
            console.error('Failed to fetch students:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = (paper: StudentPaper) => {
        navigate(`/examiner/grading/${paper.id}`);
    };

    // Derived Data
    const flattenedData = students.flatMap(student => {
        if (student.Paper.length === 0) return [{ student, paper: null }];
        return student.Paper.map(paper => ({ student, paper }));
    });

    const filteredData = flattenedData.filter(({ student, paper }) => {
        const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.nosis.includes(searchTerm);

        if (!matchesSearch) return false;
        if (!paper) return filterStatus === 'ALL'; // If no paper, show only in ALL

        if (filterStatus === 'ALL') return true;
        if (filterStatus === 'READY') return paper.finalApprovalStatus === 'APPROVED' && !paper.grade;
        if (filterStatus === 'GRADED') return !!paper.grade;

        return true;
    });

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-slate-50">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans pb-12 p-6 lg:p-12">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Daftar Makalah Siswa</h1>
                    <p className="text-slate-500">Kelola penilaian makalah siswa yang ditugaskan kepada Anda.</p>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                    <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
                        {['ALL', 'READY', 'GRADED'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status as any)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
                                    ${filterStatus === status
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}
                                `}
                            >
                                {status === 'ALL' ? 'Semua' :
                                    status === 'READY' ? 'Siap Dinilai' : 'Sudah Dinilai'}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Cari nama siswa atau NOSIS..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white"
                        />
                    </div>
                </div>

                {/* Student List */}
                <div className="space-y-4">
                    {filteredData.length > 0 ? (
                        filteredData.map(({ student, paper }, index) => (
                            <div
                                key={index}
                                className="group bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center gap-6"
                            >
                                <div className="flex items-center gap-4 min-w-[250px]">
                                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-lg">
                                        {student.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800">{student.name}</h3>
                                        <p className="text-sm text-slate-500 font-mono">{student.nosis}</p>
                                    </div>
                                </div>

                                <div className="flex-1 w-full">
                                    {paper ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Judul Karya</div>
                                                <p className="text-sm font-medium text-slate-800 line-clamp-1" title={paper.title}>
                                                    {paper.title || 'Belum ada judul'}
                                                </p>
                                                {/* Optional: Assignment title if available in API response */}
                                                {/* <p className="text-xs text-indigo-600 mt-1">{paper.Assignment?.title || 'Tugas Akhir'}</p> */}
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <StatusBadge
                                                    paper={paper}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-slate-100 border-dashed">
                                            <AlertCircle size={16} /> Belum ada paper
                                        </div>
                                    )}
                                </div>

                                {paper && (
                                    <div className="flex items-center self-end md:self-center">
                                        <button
                                            onClick={() => handleAction(paper)}
                                            disabled={paper.finalApprovalStatus !== 'APPROVED'}
                                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg active:scale-95 ${paper.finalApprovalStatus === 'APPROVED'
                                                    ? 'bg-slate-900 text-white hover:bg-indigo-600 shadow-indigo-200'
                                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                                                }`}
                                        >
                                            {paper.grade ? 'Ubah Nilai' : 'Beri Nilai'}
                                            <ArrowRight size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="text-slate-300" size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">Tidak ditemukan</h3>
                            <p className="text-slate-500">Coba ubah filter atau kata kunci pencarian Anda.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const StatusBadge = ({ paper }: { paper: StudentPaper }) => {
    // Logic for badge
    // 1. If not approved -> Belum Final (Gray)
    // 2. If approved & no grade -> Siap Dinilai (Green)
    // 3. If grade exists -> Sudah Dinilai (Blue) + Grade

    if (paper.finalApprovalStatus !== 'APPROVED') {
        return (
            <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Status</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border bg-slate-100 text-slate-500 border-slate-200">
                    <Clock size={12} /> Belum Final
                </span>
            </div>
        );
    }

    if (paper.grade) {
        return (
            <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Nilai Akhir</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border bg-emerald-50 text-emerald-700 border-emerald-200">
                    <Star size={12} fill="currentColor" /> {paper.grade}
                </span>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Status</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border bg-amber-50 text-amber-700 border-amber-200">
                <CheckCircle2 size={12} /> Siap Dinilai
            </span>
        </div>
    );
};

export default ExaminerStudentList;
