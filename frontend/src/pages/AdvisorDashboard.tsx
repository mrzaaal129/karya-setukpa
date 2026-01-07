import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import WelcomeBanner from '../components/dashboard/WelcomeBanner';
import StatCard from '../components/dashboard/StatCard';
import api from '../services/api';
import {
    Loader2, Users, FileText, CheckCircle2, AlertCircle,
    Clock, ArrowRight, Bell
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

const AdvisorDashboard: React.FC = () => {
    const { currentUser } = useUser();
    const [students, setStudents] = useState<AssignedStudent[]>([]);
    const [loading, setLoading] = useState(true);
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

    // Derived Data
    const flattenedData = students.flatMap(student => {
        if (student.Paper.length === 0) return [];
        return student.Paper.map(paper => ({ student, paper }));
    });

    const pendingActions = flattenedData.filter(({ paper }) =>
        paper.contentApprovalStatus === 'SUBMITTED' ||
        (paper.contentApprovalStatus === 'APPROVED' && paper.finalApprovalStatus === 'SUBMITTED')
    );

    // Stats Calculation
    const totalStudents = students.length;
    const pendingReviews = pendingActions.length;
    const needRevision = flattenedData.filter(({ paper }) =>
        paper.contentApprovalStatus === 'REVISION' || paper.finalApprovalStatus === 'REVISION'
    ).length;
    const completed = flattenedData.filter(({ paper }) =>
        paper.finalApprovalStatus === 'APPROVED'
    ).length;

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-slate-50">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans pb-12">

            <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-6">
                {/* Welcome Banner */}
                <WelcomeBanner userName={currentUser?.name || 'Pembimbing'} />

                {/* Stats Grid - Overlapping Banner */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 -mt-16 relative z-10">
                    <StatCard
                        title="Total Siswa"
                        value={totalStudents}
                        icon={Users}
                        color="indigo"
                        description="Siswa Bimbingan"
                    />
                    <StatCard
                        title="Menunggu Review"
                        value={pendingReviews}
                        icon={FileText}
                        color="amber"
                        description="Perlu Tindakan"
                    />
                    <StatCard
                        title="Revisi Diperlukan"
                        value={needRevision}
                        icon={AlertCircle}
                        color="rose"
                        description="Sedang Direvisi"
                    />
                    <StatCard
                        title="Selesai (Final)"
                        value={completed}
                        icon={CheckCircle2}
                        color="emerald"
                        description="Dokumen Final"
                    />
                </div>

                {/* Main Content */}
                <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Col: Pending Actions */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Bell className="text-amber-500" size={20} /> Perlu Ditinjau
                            </h2>
                            <button onClick={() => navigate('/advisor/students')} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                                Lihat Semua Siswa &rarr;
                            </button>
                        </div>

                        {pendingActions.length > 0 ? (
                            pendingActions.map(({ student, paper }, index) => (
                                <div key={index} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 font-bold">
                                            {student.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800">{student.name}</h4>
                                            <p className="text-sm text-slate-500">{paper.title || 'Judul belum diset'}</p>
                                            <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700">
                                                <Clock size={10} />
                                                {paper.finalApprovalStatus === 'SUBMITTED' ? 'Menunggu Review Final' : 'Menunggu Review Konten'}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleAction(paper)}
                                        className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-all"
                                    >
                                        Review
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white p-12 rounded-2xl border border-slate-200 border-dashed text-center">
                                <CheckCircle2 className="mx-auto text-emerald-500 mb-3" size={32} />
                                <h3 className="font-bold text-slate-800">Semua tugas selesai!</h3>
                                <p className="text-slate-500 text-sm">Tidak ada dokumen yang perlu ditinjau saat ini.</p>
                            </div>
                        )}
                    </div>

                    {/* Right Col: Quick Links / Helper */}
                    <div className="lg:col-span-1">
                        <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200">
                            <h3 className="text-lg font-bold mb-2">Panduan Pembimbing</h3>
                            <p className="text-indigo-100 text-sm mb-6 leading-relaxed">
                                Pastikan untuk memberikan feedback yang konstruktif pada setiap bab sebelum menyetujui dokumen final.
                            </p>
                            <button onClick={() => navigate('/advisor/students')} className="w-full py-3 bg-white text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-all">
                                Buka Daftar Siswa
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdvisorDashboard;
