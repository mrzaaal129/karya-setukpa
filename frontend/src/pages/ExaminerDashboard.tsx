import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import WelcomeBanner from '../components/dashboard/WelcomeBanner';
import StatCard from '../components/dashboard/StatCard';
import api from '../services/api';
import {
    Loader2, Users, FileText, CheckCircle2, AlertCircle,
    Star, Bell, CheckSquare, Download
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface StudentPaper {
    id: string;
    title: string;
    status: string;
    finalApprovalStatus: string;
    finalFileUrl: string | null;
    grade: number | null;
}

interface AssignedStudent {
    id: string;
    name: string;
    nrp: string | null;
    nosis: string;
    Paper: StudentPaper[];
}

const ExaminerDashboard: React.FC = () => {
    const { currentUser } = useUser();
    const [students, setStudents] = useState<AssignedStudent[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
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

        fetchStudents();
    }, []);

    const handleAction = (paper: StudentPaper) => {
        navigate(`/examiner/grading/${paper.id}`);
    };

    // Derived Data
    const totalStudents = students.length;

    // Flatten the data to handle multiple papers per student
    const allStudentPapers = students.flatMap(student => {
        if (!student.Paper || student.Paper.length === 0) return [];
        return student.Paper.map(paper => ({ student, paper }));
    });

    // Students ready for grading: Paper exists, approved by advisor, and NOT graded yet
    const readyToGrade = allStudentPapers.filter(({ paper }) =>
        paper.finalApprovalStatus === 'APPROVED' && !paper.grade
    );

    // Papers graded
    const gradedPapers = allStudentPapers.filter(({ paper }) =>
        paper.grade
    );

    const handleExport = () => {
        if (gradedPapers.length === 0) return;

        const dataToExport = gradedPapers.map(({ student, paper }) => ({
            'Nama Siswa': student.name,
            'NOSIS': student.nosis,
            'Judul Makalah': paper.title,
            'Nilai': paper.grade
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        XLSX.utils.book_append_sheet(wb, ws, 'Nilai');
        XLSX.writeFile(wb, 'Rekap_Nilai_Siswa.xlsx');
    };

    // Pending Actions List (Ready to Grade)
    const pendingActions = readyToGrade;

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
                <WelcomeBanner userName={currentUser?.name || 'Penguji'} />

                {/* Stats Grid - Overlapping Banner */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 -mt-16 relative z-10">
                    <StatCard
                        title="Total Siswa"
                        value={totalStudents}
                        icon={Users}
                        color="indigo"
                        description="Siswa Ditugaskan"
                    />
                    <StatCard
                        title="Siap Dinilai"
                        value={readyToGrade.length}
                        icon={FileText}
                        color="amber"
                        description="Menunggu Penilaian"
                    />
                    <StatCard
                        title="Selesai Dinilai"
                        value={gradedPapers.length}
                        icon={CheckCircle2}
                        color="emerald"
                        description="Nilai Tersimpan"
                    />
                </div>

                {/* Main Content */}
                <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Col: Pending Actions */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Bell className="text-amber-500" size={20} /> Perlu Penilaian
                            </h2>
                            {/* Assuming there might be a separate list view later, or smooth scroll */}
                        </div>

                        {pendingActions.length > 0 ? (
                            pendingActions.map(({ student, paper }, index) => {
                                return (
                                    <div key={`${student.id}-${paper.id}`} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 font-bold">
                                                {student.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800">{student.name}</h4>
                                                <p className="text-sm text-slate-500">{paper?.title || 'Judul belum diset'}</p>
                                                <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700">
                                                    <CheckSquare size={10} />
                                                    Siap Dinilai
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleAction(paper)}
                                            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-all"
                                        >
                                            Beri Nilai
                                        </button>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="bg-white p-12 rounded-2xl border border-slate-200 border-dashed text-center">
                                <CheckCircle2 className="mx-auto text-emerald-500 mb-3" size={32} />
                                <h3 className="font-bold text-slate-800">Semua penilaian selesai!</h3>
                                <p className="text-slate-500 text-sm">Tidak ada siswa yang perlu dinilai saat ini.</p>
                            </div>
                        )}

                        {/* Recent Activity / Other Students could go here if needed */}
                        <div className="pt-8">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <Star className="text-indigo-500" size={20} /> Riwayat Penilaian
                                </h2>
                                <button
                                    onClick={handleExport}
                                    disabled={gradedPapers.length === 0}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${gradedPapers.length > 0
                                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                        }`}
                                >
                                    <Download size={16} /> Export Excel
                                </button>
                            </div>

                            {gradedPapers.length > 0 ? (
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-slate-50 border-b border-slate-100">
                                                <tr>
                                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Siswa</th>
                                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Judul</th>
                                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Nilai</th>
                                                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase">Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {gradedPapers.map(({ student, paper }) => (
                                                    <tr key={`${student.id}-${paper.id}`} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="font-medium text-slate-800">{student.name}</div>
                                                            <div className="text-xs text-slate-500">{student.nosis}</div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm text-slate-600 truncate max-w-xs">{paper.title}</div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="inline-flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg text-sm">
                                                                {paper.grade}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <button
                                                                onClick={() => handleAction(paper)}
                                                                className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                                                            >
                                                                Ubah Nilai
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-slate-500 text-sm italic">Belum ada riwayat penilaian.</p>
                            )}
                        </div>

                    </div>

                    {/* Right Col: Quick Links / Helper */}
                    <div className="lg:col-span-1">
                        <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200 sticky top-6">
                            <h3 className="text-lg font-bold mb-2">Panduan Penguji</h3>
                            <p className="text-indigo-100 text-sm mb-6 leading-relaxed">
                                Berikan penilaian yang objektif terhadap karya tulis siswa. Pastikan semua aspek penilaian telah dipertimbangkan sebelum menyimpan nilai akhir.
                            </p>
                            <div className="space-y-3">
                                <div className="flex items-start gap-3 p-3 bg-indigo-500/20 rounded-xl">
                                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
                                    <p className="text-xs text-indigo-100">Baca seluruh konten karya tulis dengan seksama.</p>
                                </div>
                                <div className="flex items-start gap-3 p-3 bg-indigo-500/20 rounded-xl">
                                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
                                    <p className="text-xs text-indigo-100">Gunakan rubrik penilaian yang tersedia di halaman penilaian.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExaminerDashboard;
