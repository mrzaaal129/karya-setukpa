import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { API_URL } from '../services/api';
import { ArrowLeft, CheckCircle, XCircle, FileText, Download, History, User, Calendar, ShieldCheck, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const AdvisorFinalReview: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [paper, setPaper] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchPaper();
    }, [id]);

    const fetchPaper = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/papers/${id}`);
            const data = response.data.paper || response.data;
            setPaper(data);
            setFeedback(data.finalFeedback || '');
        } catch (error) {
            console.error('Error fetching paper:', error);
            toast.error('Gagal mengambil data paper');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (status: 'APPROVED' | 'REVISION') => {
        if (status === 'REVISION' && !feedback.trim()) {
            toast.error('Harap berikan catatan revisi jika menolak.');
            return;
        }

        if (status === 'APPROVED' && !confirm('Setujui dokumen final? Paper akan dianggap SELESAI dan siap dinilai Penguji.')) {
            return;
        }

        setSubmitting(true);
        try {
            await api.put(`/papers/${id}/final-approval`, {
                status,
                feedback: feedback
            });
            toast.success(status === 'APPROVED' ? 'Dokumen Final Disetujui' : 'Permintaan revisi dikirim');
            fetchPaper();
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Gagal memperbarui status');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center min-h-screen bg-slate-50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    );

    if (!paper) return <div>Paper tidak ditemukan</div>;

    const isApproved = paper.finalApprovalStatus === 'APPROVED';
    const isRevision = paper.finalApprovalStatus === 'REVISION';

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/advisor/dashboard')}
                            className="p-2 hover:bg-slate-100 rounded-full transition text-slate-500 hover:text-slate-800"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-lg font-bold text-slate-800 leading-tight">Review Dokumen Final</h1>
                            <p className="text-xs text-slate-500 font-medium">Siswa (Blind Review) • ***</p>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate(`/advisor/review/${id}`)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 transition border border-indigo-100"
                    >
                        <History size={16} /> Riwayat Per Bab
                    </button>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto p-6">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                    {/* Left Column: PDF Viewer (Takes 2/3 space) */}
                    <div className="xl:col-span-2 space-y-4">
                        {paper.finalFileUrl ? (
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-[calc(100vh-140px)] flex flex-col">
                                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white border border-slate-200 rounded-lg shadow-sm">
                                            <FileText size={20} className="text-indigo-600" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-700 text-sm">{paper.finalFileName}</p>
                                            <p className="text-xs text-slate-500">{(paper.finalFileSize / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <a
                                            href={`${API_URL.replace('/api', '')}${paper.finalFileUrl}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="p-2 hover:bg-white hover:shadow-md rounded-lg transition text-slate-600 border border-transparent hover:border-slate-200"
                                            title="Download"
                                        >
                                            <Download size={20} />
                                        </a>
                                    </div>
                                </div>
                                <div className="flex-1 bg-slate-200 overflow-hidden relative">
                                    {paper.finalFileName?.toLowerCase().endsWith('.pdf') ? (
                                        <iframe
                                            src={`${API_URL.replace('/api', '')}${paper.finalFileUrl}`}
                                            className="w-full h-full"
                                            title="PDF Preview"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-slate-500 flex-col gap-3">
                                            <FileText size={48} className="opacity-20" />
                                            <p>Preview tidak tersedia untuk format ini</p>
                                            <a
                                                href={`${API_URL.replace('/api', '')}${paper.finalFileUrl}`}
                                                className="text-indigo-600 hover:underline font-medium"
                                            >
                                                Download untuk melihat
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="h-[400px] flex items-center justify-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300">
                                <div className="text-center text-slate-500">
                                    <FileText size={48} className="mx-auto mb-4 opacity-20" />
                                    <p className="text-lg font-medium">Belum ada dokumen final</p>
                                    <p className="text-sm">Siswa belum mengupload revisi dokumen final.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Review Controls */}
                    <div className="space-y-6">
                        {/* Status Card */}
                        <div className="bg-white rounded-2xl shadow-[0_2px_20px_-5px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden">
                            <div className={`px-6 py-4 border-b ${isApproved ? 'bg-emerald-50 border-emerald-100' :
                                isRevision ? 'bg-rose-50 border-rose-100' :
                                    'bg-slate-50 border-slate-100'
                                }`}>
                                <p className="text-xs font-bold uppercase tracking-wider opacity-60 mb-1">Status Keputusan</p>
                                <div className="flex items-center gap-2">
                                    {isApproved ? (
                                        <><CheckCircle className="text-emerald-600" size={24} /><span className="text-xl font-bold text-emerald-700">Disetujui</span></>
                                    ) : isRevision ? (
                                        <><AlertCircle className="text-rose-600" size={24} /><span className="text-xl font-bold text-rose-700">Perlu Revisi</span></>
                                    ) : (
                                        <span className="text-xl font-bold text-slate-700">Menunggu Review</span>
                                    )}
                                </div>
                            </div>

                            <div className="p-6">
                                {/* Disabled State or Active Form */}
                                {isApproved && (
                                    <div className="text-center py-6">
                                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <ShieldCheck size={32} className="text-emerald-600" />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-800 mb-2">Dokumen Telah Disetujui</h3>
                                        <p className="text-slate-500 text-sm mb-6">
                                            Dokumen ini telah Anda setujui dan siswa dinyatakan selesai pada tahap ini. Data telah dikunci.
                                        </p>
                                        <button
                                            onClick={() => {
                                                if (confirm('Batalkan persetujuan? Status akan kembali menunggu review.')) {
                                                    handleStatusChange('REVISION'); // Or create a specific cancel endpoint logic if strict
                                                    // For now re-opening as Revision/Pending requires simple logic.
                                                    // Since API maps 'REVISION' or 'APPROVED', to reset we might need new logic.
                                                    // But user asked to just prevent ambiguity.
                                                    // Let's allow "Change to Revision" if made in mistake.
                                                }
                                            }}
                                            className="text-slate-400 hover:text-red-500 text-sm underline"
                                        >
                                            Batalkan Persetujuan (Edit)
                                        </button>
                                    </div>
                                )}

                                {!isApproved && (
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                                Catatan / Feedback Revisi
                                            </label>
                                            <div className="relative">
                                                <textarea
                                                    value={feedback}
                                                    onChange={(e) => setFeedback(e.target.value)}
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all h-40 resize-none text-slate-700 text-base"
                                                    placeholder="Tuliskan detail bagian yang perlu diperbaiki..."
                                                ></textarea>
                                                <div className="absolute bottom-3 right-3 text-xs text-slate-400 font-medium bg-white/50 px-2 py-1 rounded-md">
                                                    {feedback.length} karakter
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => handleStatusChange('REVISION')}
                                                disabled={submitting || !feedback.trim()}
                                                className={`group flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200
                                                    ${isRevision
                                                        ? 'bg-rose-50 border-rose-500 text-rose-700 ring-1 ring-rose-500'
                                                        : 'border-slate-200 text-slate-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700'}
                                                    ${(!feedback.trim() && !isRevision) ? 'opacity-50 cursor-not-allowed' : ''}
                                                `}
                                            >
                                                <XCircle size={24} className="mb-2 group-hover:scale-110 transition-transform" />
                                                <span className="font-bold text-sm">Minta Revisi</span>
                                            </button>

                                            <button
                                                onClick={() => handleStatusChange('APPROVED')}
                                                disabled={submitting}
                                                className="group flex flex-col items-center justify-center p-4 rounded-xl bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 hover:shadow-indigo-200 transition-all duration-200 active:scale-95"
                                            >
                                                <CheckCircle size={24} className="mb-2 group-hover:scale-110 transition-transform" />
                                                <span className="font-bold text-sm">Setujui Final</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Student Info Compact - Anonymized for Blind Review */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                            <h4 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2">
                                <User size={16} className="text-slate-400" /> Informasi Siswa
                            </h4>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between border-b border-slate-50 pb-2">
                                    <span className="text-slate-500">Nama</span>
                                    <span className="font-medium text-slate-800 text-right">Siswa (Blind Review)</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-50 pb-2">
                                    <span className="text-slate-500">NOSIS/NRP</span>
                                    <span className="font-medium text-slate-800 text-right">***</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Judul Karya</span>
                                    <span className="font-medium text-slate-800 text-right max-w-[150px] truncate" title={paper.title}>
                                        {paper.title}
                                    </span>
                                </div>
                            </div>

                            {/* Workflow Info */}
                            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                <p className="text-xs text-amber-700">
                                    <strong>Info:</strong> Persetujuan dokumen final kini ditangani oleh SuperAdmin melalui Verifikasi Integritas.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdvisorFinalReview;
