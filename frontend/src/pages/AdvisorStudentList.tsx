
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
    Loader2, Users, FileText, CheckCircle2, AlertCircle,
    Search, Filter, ArrowRight, MoreVertical, Clock, GraduationCap
} from 'lucide-react';

interface StudentPaper {
    id: string;
    title: string;
    status: string;
    contentApprovalStatus: string;
    finalApprovalStatus: string;
    finalFileUrl: string | null;
    updatedAt: string;
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

const AdvisorStudentList: React.FC = () => {
    const [students, setStudents] = useState<AssignedStudent[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'REVISION' | 'APPROVED'>('ALL');
    const navigate = useNavigate();

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const response = await api.get('/advisors/me/students');
            setStudents(response.data);
        } catch (error) {
            console.error('Failed to fetch students:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = (paper: StudentPaper) => {
        if (paper.contentApprovalStatus !== 'APPROVED') {
            navigate(`/advisor/review/${paper.id}`);
        } else if (paper.finalFileUrl) {
            navigate(`/advisor/final-review/${paper.id}`);
        } else {
            navigate(`/advisor/review/${paper.id}`);
        }
    };

    const flattenedData = students.flatMap(student => {
        if (student.Paper.length === 0) return [{ student, paper: null }];
        return student.Paper.map(paper => ({ student, paper }));
    });

    const filteredData = flattenedData.filter(({ student, paper }) => {
        const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.nosis.includes(searchTerm);

        if (!matchesSearch) return false;
        if (!paper) return filterStatus === 'ALL';

        if (filterStatus === 'ALL') return true;
        if (filterStatus === 'APPROVED') return paper.finalApprovalStatus === 'APPROVED';
        if (filterStatus === 'REVISION') return paper.contentApprovalStatus === 'REVISION' || paper.finalApprovalStatus === 'REVISION';
        if (filterStatus === 'PENDING') return paper.contentApprovalStatus === 'SUBMITTED' || (paper.contentApprovalStatus === 'APPROVED' && paper.finalApprovalStatus === 'PENDING');

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
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Siswa Bimbingan</h1>
                    <p className="text-slate-500">Daftar lengkap siswa yang Anda bimbing.</p>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                    <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
                        {['ALL', 'PENDING', 'REVISION', 'APPROVED'].map((status) => (
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
                                    status === 'PENDING' ? 'Menunggu' :
                                        status === 'REVISION' ? 'Revisi' : 'Selesai'}
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
                                                <p className="text-xs text-indigo-600 mt-1">{paper.Assignment?.title || 'Tugas'}</p>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <StatusBadge
                                                    label="Konten"
                                                    status={paper.contentApprovalStatus}
                                                />
                                                <ArrowRight size={16} className="text-slate-300" />
                                                <StatusBadge
                                                    label="Final"
                                                    status={paper.finalApprovalStatus}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-slate-100 border-dashed">
                                            <AlertCircle size={16} /> Belum memulai pengerjaan karya tulis
                                        </div>
                                    )}
                                </div>

                                {paper && (
                                    <div className="flex items-center self-end md:self-center">
                                        <button
                                            onClick={() => handleAction(paper)}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-medium text-sm hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-200 active:scale-95"
                                        >
                                            Review
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

const StatusBadge = ({ label, status }: { label: string, status: string | null }) => {
    let colorClass = 'bg-slate-100 text-slate-500 border-slate-200';
    let icon = <Clock size={12} />;
    let text = 'Pending';

    if (status === 'APPROVED') {
        colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        icon = <CheckCircle2 size={12} />;
        text = 'Disetujui';
    } else if (status === 'REVISION') {
        colorClass = 'bg-rose-50 text-rose-700 border-rose-200';
        icon = <AlertCircle size={12} />;
        text = 'Revisi';
    } else if (status === 'SUBMITTED') {
        colorClass = 'bg-blue-50 text-blue-700 border-blue-200';
        icon = <FileText size={12} />;
        text = 'Diserahkan';
    }

    if (!status) {
        text = '-';
    }

    return (
        <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">{label}</span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${colorClass}`}>
                {icon} {text}
            </span>
        </div>
    );
};

export default AdvisorStudentList;
