import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ArrowLeft, CheckCircle, XCircle, MessageSquare, FileText, ChevronDown, ChevronRight, Lock, User, Clock, AlertCircle, History } from 'lucide-react';
import { toast } from 'react-hot-toast';

const AdvisorReview: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [paper, setPaper] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [activeChapter, setActiveChapter] = useState<number | null>(0);
    const [feedbackError, setFeedbackError] = useState(false);

    useEffect(() => {
        fetchPaper();
    }, [id]);

    const chapters = paper?.structure || [];
    const currentChapter = activeChapter !== null ? chapters[activeChapter] : null;
    const currentStatus = currentChapter?.status || 'LOCKED';

    useEffect(() => {
        if (currentChapter) {
            setFeedback(currentChapter.feedback || '');
        } else {
            setFeedback('');
        }
    }, [activeChapter]); // Removed 'paper' dependency loop

    const fetchPaper = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/papers/${id}`);
            const paperData = response.data.paper || response.data;
            setPaper(paperData);
            // Don't overwrite feedback here to avoid race conditions with user typing if polling
        } catch (error) {
            console.error('Error fetching paper:', error);
            toast.error('Gagal mengambil data paper');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (status: 'APPROVED' | 'REVISION' | 'SUBMITTED') => {
        if (activeChapter === null) return;

        const currentChapterTitle = paper.structure[activeChapter]?.title || 'Bab ini';

        if (status === 'REVISION' && !feedback.trim()) {
            setFeedbackError(true);
            toast.error('Harap berikan catatan revisi terlebih dahulu.');
            return;
        }
        setFeedbackError(false);

        if (!confirm(status === 'APPROVED' ? 'Setujui bab ini?' : status === 'REVISION' ? 'Kembalikan bab ini untu revisi?' : 'Batalkan status bab ini?')) {
            return;
        }

        setSubmitting(true);
        try {
            await api.put(`/papers/${id}/content-approval`, {
                status,
                feedback: feedback,
                chapterIndex: activeChapter
            });
            toast.success('Status berhasil diperbarui');
            fetchPaper();
        } catch (error) {
            console.error('Error:', error);
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

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans">
            {/* Sticky Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
                <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/advisor/dashboard')} // Corrected Path
                            className="p-2 hover:bg-slate-100 rounded-full transition text-slate-500 hover:text-slate-800"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-lg font-bold text-slate-800 leading-tight hidden md:block">{paper.title}</h1>
                            <p className="text-xs text-slate-500 font-medium flex items-center gap-2">
                                <User size={12} /> Siswa (Blind Review) • <span className="font-mono">***</span>
                            </p>
                        </div>
                    </div>

                    {/* Chapter Progress Summary (Optional Badge) */}
                    <div className="hidden md:flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Progress Review</span>
                        <div className="flex gap-1">
                            {chapters.map((ch: any, i: number) => (
                                <div
                                    key={i}
                                    className={`w-2 h-2 rounded-full 
                                        ${ch.status === 'APPROVED' ? 'bg-emerald-500' :
                                            ch.status === 'REVISION' ? 'bg-rose-500' :
                                                ch.status === 'SUBMITTED' ? 'bg-blue-500' : 'bg-slate-200'}`}
                                    title={`${ch.title}: ${ch.status}`}
                                ></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto p-6 md:p-8">
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

                    {/* Left Column: Chapters & Content (8 cols) */}
                    <div className="xl:col-span-8 space-y-6">

                        {/* Chapter Tabs / Navigation */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="flex overflow-x-auto divide-x divide-slate-100 scrollbar-hide">
                                {chapters.map((chapter: any, index: number) => (
                                    <button
                                        key={index}
                                        onClick={() => setActiveChapter(index)}
                                        className={`flex-none px-6 py-4 flex items-center gap-3 transition-colors relative
                                            ${activeChapter === index ? 'bg-indigo-50/50 text-indigo-700 font-medium' : 'hover:bg-slate-50 text-slate-600'}
                                        `}
                                    >
                                        <div className={`w-2 h-2 rounded-full 
                                            ${chapter.status === 'APPROVED' ? 'bg-emerald-500' :
                                                chapter.status === 'REVISION' ? 'bg-rose-500' :
                                                    chapter.status === 'SUBMITTED' ? 'bg-blue-500 animate-pulse' : 'bg-slate-300'
                                            }
                                        `}></div>
                                        <span className="whitespace-nowrap">{chapter.title}</span>
                                        {activeChapter === index && (
                                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"></div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 min-h-[600px] p-8 md:p-12">
                            {currentChapter ? (
                                <>
                                    <div className="flex justify-between items-start mb-8 border-b border-slate-100 pb-6">
                                        <div>
                                            <h2 className="text-2xl font-bold text-slate-800 mb-2">{currentChapter.title}</h2>
                                            <div className="flex items-center gap-3">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                                                    ${currentStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                                                        currentStatus === 'REVISION' ? 'bg-rose-100 text-rose-700' :
                                                            currentStatus === 'SUBMITTED' ? 'bg-blue-100 text-blue-700' :
                                                                'bg-slate-100 text-slate-500'}
                                                `}>
                                                    {currentStatus === 'APPROVED' ? 'Disetujui' :
                                                        currentStatus === 'REVISION' ? 'Permintaan Revisi' :
                                                            currentStatus === 'SUBMITTED' ? 'Diserahkan' : 'Belum Dikirim'}
                                                </span>
                                                <span className="text-xs text-slate-400 font-medium">
                                                    Update: {currentChapter.updatedAt ? new Date(currentChapter.updatedAt).toLocaleDateString() : '-'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Render HTML Content */}
                                    <div className="prose prose-slate prose-lg max-w-none">
                                        {['SUBMITTED', 'APPROVED', 'REVISION'].includes(currentStatus) ? (
                                            currentChapter.content ? (
                                                <div dangerouslySetInnerHTML={{ __html: currentChapter.content }} />
                                            ) : (
                                                <p className="text-slate-400 italic text-center py-20">Konten bab ini masih kosong.</p>
                                            )
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-32 text-center text-slate-400 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                                                <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                                                    <Lock className="w-8 h-8 text-slate-300" />
                                                </div>
                                                <h3 className="font-semibold text-slate-600">Akses Terkunci</h3>
                                                <p className="max-w-md mt-2 text-sm">Siswa belum menyerahkan bab ini. Konten akan tersedia setelah siswa melakukan submit.</p>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-32 text-slate-400">
                                    <FileText size={48} className="mx-auto mb-4 opacity-20" />
                                    <p>Pilih bab disebelah atas untuk memulai review.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Review Tools (4 cols) */}
                    <div className="xl:col-span-4 space-y-6">
                        {currentChapter && (
                            <div className="bg-white rounded-2xl shadow-[0_4px_20px_-5px_rgba(0,0,0,0.1)] border border-slate-200 sticky top-24">
                                <div className="p-6 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
                                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                        <MessageSquare size={18} className="text-indigo-600" /> Review & Feedback
                                    </h3>
                                </div>

                                <div className="p-6">
                                    {currentStatus === 'APPROVED' ? (
                                        <div className="text-center py-8">
                                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <CheckCircle size={32} className="text-emerald-600" />
                                            </div>
                                            <h4 className="font-bold text-slate-800 mb-2">Bab Telah Disetujui</h4>
                                            <p className="text-sm text-slate-500 mb-6">Anda telah menyetujui bab ini. Siswa dapat melanjutkan ke bab berikutnya.</p>

                                            <button
                                                onClick={() => handleStatusChange('SUBMITTED')} // Revert to Submitted
                                                className="text-sm text-slate-400 hover:text-rose-600 underline transition-colors"
                                            >
                                                Batalkan Persetujuan (Edit)
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="mb-6">
                                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                                    Catatan Pembimbing
                                                </label>
                                                <div className="relative">
                                                    <textarea
                                                        value={feedback}
                                                        onChange={(e) => {
                                                            setFeedback(e.target.value);
                                                            if (e.target.value.trim()) setFeedbackError(false);
                                                        }}
                                                        disabled={!['SUBMITTED', 'REVISION'].includes(currentStatus || '')}
                                                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all h-40 resize-none text-slate-700 text-sm
                                                            ${feedbackError ? 'border-rose-400 bg-rose-50 placeholder-rose-400' : 'border-slate-200'}
                                                            ${!['SUBMITTED', 'REVISION'].includes(currentStatus || '') ? 'opacity-50 cursor-not-allowed' : ''}
                                                        `}
                                                        placeholder={['SUBMITTED', 'REVISION'].includes(currentStatus || '') ? "Tuliskan koreksi atau arahan untuk siswa..." : "Menunggu siswa menyerahkan bab ini."}
                                                    ></textarea>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <button
                                                    onClick={() => handleStatusChange('REVISION')}
                                                    disabled={submitting || !['SUBMITTED', 'REVISION'].includes(currentStatus || '')}
                                                    className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 text-slate-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <XCircle size={20} className="mb-1" />
                                                    <span className="text-xs font-bold">Minta Revisi</span>
                                                </button>

                                                <button
                                                    onClick={() => handleStatusChange('APPROVED')}
                                                    disabled={submitting || !['SUBMITTED', 'REVISION'].includes(currentStatus || '')}
                                                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <CheckCircle size={20} className="mb-1" />
                                                    <span className="text-xs font-bold">Setujui Bab</span>
                                                </button>
                                            </div>
                                        </>
                                    )}

                                    {/* History Timeline */}
                                    {currentChapter.feedbackHistory && currentChapter.feedbackHistory.length > 0 && (
                                        <div className="mt-8 pt-6 border-t border-slate-100">
                                            <h5 className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                                                <History size={14} /> Riwayat Revisi
                                            </h5>
                                            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                                                {[...currentChapter.feedbackHistory].reverse().map((item: any, idx: number) => (
                                                    <div key={idx} className="flex gap-3 relative pb-4 last:pb-0">
                                                        {idx !== currentChapter.feedbackHistory.length - 1 && (
                                                            <div className="absolute top-8 left-3.5 bottom-0 w-0.5 bg-slate-100"></div>
                                                        )}
                                                        <div className={`mt-1 w-7 h-7 rounded-full flex items-center justify-center flex-none text-xs font-bold border-2
                                                            ${item.status === 'APPROVED' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' :
                                                                'bg-orange-50 border-orange-200 text-orange-600'}
                                                        `}>
                                                            {item.status === 'APPROVED' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                                                        </div>
                                                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 w-full text-sm">
                                                            <div className="flex justify-between items-start mb-1">
                                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded
                                                                    ${item.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}
                                                                `}>{item.status === 'APPROVED' ? 'DITERIMA' : 'REVISI'}</span>
                                                                <span className="text-[10px] text-slate-400">{new Date(item.updatedAt).toLocaleDateString()}</span>
                                                            </div>
                                                            <p className="text-slate-600 italic">"{item.feedback || '-'}"</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdvisorReview;
