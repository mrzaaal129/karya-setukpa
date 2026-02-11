import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { API_URL } from '../services/api';
import { ArrowLeft, Save, Star, FileText, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ExaminerGrading: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [paper, setPaper] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [grade, setGrade] = useState<number | ''>('');
    const [feedback, setFeedback] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showRubric, setShowRubric] = useState(false);

    useEffect(() => {
        fetchPaper();
    }, [id]);

    const fetchPaper = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/papers/${id}`);
            const paperData = response.data.paper || response.data;
            setPaper(paperData);

            if (paperData.grade !== null) {
                setGrade(paperData.grade);
                setFeedback(paperData.feedback || ''); // Assuming feedback is part of the response now or locally stored
            }
        } catch (error) {
            console.error('Error fetching paper:', error);
            toast.error('Gagal mengambil data paper');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (grade === '' || Number(grade) < 0 || Number(grade) > 100) {
            toast.error('Nilai harus antara 0 - 100');
            return;
        }

        if (!confirm('Simpan nilai?')) return;

        setSubmitting(true);
        try {
            await api.post(`/papers/${id}/grade`, {
                grade: Number(grade),
                feedback: feedback
            });
            toast.success('Nilai berhasil disimpan');
            fetchPaper();
        } catch (error) {
            console.error('Error grading:', error);
            toast.error('Gagal menyimpan nilai');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-slate-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    if (!paper) return <div className="p-8 text-center text-slate-500">Paper tidak ditemukan</div>;

    const fileUrl = paper.finalFileUrl?.startsWith('http')
        ? paper.finalFileUrl
        : `${API_URL.replace('/api', '')}${paper.finalFileUrl}`;

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
            {/* Top Bar */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/examiner/dashboard')}
                        className="p-2 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-800 transition-all"
                        title="Kembali"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                            <span className="font-bold text-slate-700 uppercase tracking-wide">{paper.User?.name}</span>
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium text-[10px]">NOSIS: {paper.User?.nosis || '-'}</span>
                        </div>
                        <h1 className="font-bold text-slate-900 text-lg leading-snug line-clamp-2" title={paper.title}>
                            {paper.title}
                        </h1>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {paper.finalFileUrl && (
                        <a
                            href={fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 rounded-lg text-sm font-medium transition-all"
                        >
                            <Download size={16} />
                            <span className="hidden sm:inline">Download PDF</span>
                        </a>
                    )}
                </div>
            </div>

            {/* Split View Content */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden h-[calc(100vh-73px)]">
                {/* Left Panel: Document Preview */}
                <div className="flex-1 bg-slate-100 p-4 lg:p-6 overflow-y-auto border-r border-slate-200 scrollbar-thin scrollbar-thumb-slate-300">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full min-h-[600px] flex flex-col">
                        {paper.finalFileUrl && paper.finalFileName?.toLowerCase().endsWith('.pdf') ? (
                            <iframe
                                src={fileUrl}
                                className="w-full flex-1"
                                title="PDF Preview"
                            />
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-12 text-center">
                                <FileText size={64} className="mb-4 opacity-50" />
                                <h3 className="text-lg font-bold text-slate-600 mb-2">Preview Tidak Tersedia</h3>
                                <p className="text-sm max-w-xs mx-auto mb-6">
                                    Format file ini tidak mendukung pratinjau langsung. Silakan unduh dokumen untuk memeriksa isinya.
                                </p>
                                {paper.finalFileUrl && (
                                    <a
                                        href={fileUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                                    >
                                        Download Makalah
                                    </a>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel: Grading Form */}
                <div className="w-full lg:w-[400px] xl:w-[450px] bg-white flex flex-col shadow-xl z-20">
                    <div className="p-6 flex-1 overflow-y-auto">
                        <div className="mb-6">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-1">
                                <Star className="text-amber-500" size={20} fill="currentColor" />
                                Form Penilaian
                            </h2>
                            <p className="text-xs text-slate-500">
                                Berikan penilaian objektif berdasarkan kualitas karya tulis ilmiah siswa.
                            </p>
                        </div>

                        {/* Grading Card */}
                        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 mb-6">
                            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
                                Skor Akhir (0-100)
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={grade}
                                    onChange={(e) => setGrade(e.target.value === '' ? '' : Number(e.target.value))}
                                    className="w-full pl-6 pr-4 py-4 text-3xl font-bold text-indigo-700 bg-white border border-slate-300 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-center"
                                    placeholder="0"
                                />
                                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 font-medium">/100</span>
                            </div>
                            {grade !== '' && (Number(grade) >= 70 ? (
                                <div className="mt-2 text-xs font-bold text-emerald-600 text-center bg-emerald-100 py-1 rounded">LULUS</div>
                            ) : (
                                <div className="mt-2 text-xs font-bold text-rose-600 text-center bg-rose-100 py-1 rounded">BELUM LULUS</div>
                            ))}
                        </div>

                        {/* Feedback Section */}
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-bold text-slate-700">Catatan & Masukan</label>
                                <button
                                    onClick={() => setShowRubric(!showRubric)}
                                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium underline"
                                >
                                    {showRubric ? 'Sembunyikan Rubrik' : 'Lihat Rubrik'}
                                </button>
                            </div>

                            {showRubric && (
                                <div className="mb-4 bg-yellow-50 p-3 rounded-lg border border-yellow-200 text-xs text-slate-700 space-y-2 animate-in fade-in slide-in-from-top-2">
                                    <p><strong>1. Metodologi (30%)</strong>: Kejelasan metode dan relevansi data.</p>
                                    <p><strong>2. Analisis (40%)</strong>: Kedalaman pembahasan dan ketajaman argumen.</p>
                                    <p><strong>3. Sistematika (30%)</strong>: Tata bahasa, format, dan referensi.</p>
                                </div>
                            )}

                            <textarea
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 text-sm leading-relaxed"
                                rows={8}
                                placeholder="Tuliskan catatan detail untuk siswa mengenai kelebihan dan kekurangan karya tulis ini..."
                            ></textarea>
                            <p className="text-xs text-slate-400 mt-2 text-right">
                                *Catatan ini akan dapat dilihat oleh siswa
                            </p>
                        </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="p-6 bg-white border-t border-slate-100">
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg shadow-slate-900/10 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex justify-center items-center gap-2"
                        >
                            {submitting ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            ) : (
                                <Save size={20} />
                            )}
                            {submitting ? 'Menyimpan...' : 'Simpan Penilaian'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExaminerGrading;
