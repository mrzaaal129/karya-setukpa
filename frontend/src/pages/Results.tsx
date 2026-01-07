import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
    Download, ArrowLeft, FileText, MessageCircle, User, BookOpen, File,
    ExternalLink, CheckCircle2, Clock, ChevronRight, LayoutGrid,
    Calendar, TrendingUp, Award, Timer, AlignLeft, Send, CheckSquare, Printer, Edit2
} from 'lucide-react';

const Results: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'chapters' | 'pdf'>('chapters');
    const [activeChapter, setActiveChapter] = useState<number>(0);

    // Title Enforcement State
    const [showTitleModal, setShowTitleModal] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [isTitleSaving, setIsTitleSaving] = useState(false);

    useEffect(() => {
        const fetchResult = async () => {
            try {
                const response = await api.get(`/grades/paper/${id}`);
                setData(response.data.grade);
                // Pre-fill title for modal if needed
                if (response.data.grade?.title) {
                    setNewTitle(response.data.grade.title);
                }
            } catch (error) {
                console.error('Failed to fetch result:', error);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchResult();
    }, [id]);

    // Check title on load
    useEffect(() => {
        if (data) {
            // Check if title is default or empty
            // Default usually matches Assignment Title if auto-generated, or "Untitled Paper" 
            // Note: In results, we might not have 'Assignment' object nested directly or deeply, let's check field carefully.
            // The API /grades/paper/${id} returns `grade` object which has title. 
            // We need to know the assignment title to compare? 
            // If assignment title isn't in `data`, we might rely on "Untitled Paper" or empty checks.
            // HOWEVER, user issue is specifically about "KARYA II" (Assignment Name) vs Title.
            // Let's assume if it matches the Subject or we just force it if it looks generic? 
            // Actually, the `data` in Results likely comes from `grade` which might NOT have assignment title.
            // Let's check what `api.get(/grades/paper/${id})` returns in backend `gradeController`.
            // But to be safe, we can enforce if it equals "Untitled Paper" or empty. 
            // User said: "KARYA II" (Assignment Name) -> No popup. 
            // If we don't have Assignment Title here, we can't compare. 
            // Workaround: We accept that we might miss the exact assignment name match here UNLESS we fetch assignment details OR current title is suspiciously short/generic? 
            // BETTER: Let's fetch the PAPER details to get Assignment Title if we suspect a match? 
            // Actually, `data` from `/grades/paper/:id` usually mimics the paper structure. 
            // Let's add the check.

            // Simplest robust check: 
            // OR, just implement the modal logic for empty/untitled for now, and rely on the editor for the rest? 
            // User explicitly asked for completed tasks. 
            // Let's modify the check: If title is exactly "KARYA II" or matches Subject? 
            // Wait, `data.subject` is available.

            // Check comparison with Assignment Title (now available from backend)
            const assignmentTitle = data.assignmentTitle || '';
            const currentTitle = data.title || '';

            const isDefault =
                !currentTitle ||
                currentTitle.trim() === '' ||
                currentTitle === 'Untitled Paper' ||
                (assignmentTitle && currentTitle.trim().toLowerCase() === assignmentTitle.trim().toLowerCase());

            if (isDefault) {
                setShowTitleModal(true);
                setNewTitle(currentTitle);
            }
        }
    }, [data]);

    const handleUpdateTitle = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim() || newTitle === 'Untitled Paper') {
            alert('Silakan masukkan judul yang valid.');
            return;
        }

        setIsTitleSaving(true);
        try {
            // We reuse the update paper endpoint. The ID in params is Paper ID? 
            // Route is `/results/:id`. In App.tsx: `/results/:id` -> Results. 
            // In Results.tsx: `api.get('/grades/paper/${id}')`.
            // So `id` is Paper ID.
            await api.put(`/papers/${id}`, { title: newTitle });

            // Update local state
            setData((prev: any) => ({ ...prev, title: newTitle }));
            setShowTitleModal(false);
        } catch (error) {
            console.error('Failed to update title:', error);
            alert('Gagal menyimpan judul.');
        } finally {
            setIsTitleSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-[3px] border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
                    <p className="text-sm font-medium text-slate-500 animate-pulse">Memuat data...</p>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
                <div className="text-center">
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Data Tidak Ditemukan</h2>
                    <button onClick={() => navigate('/assignments')} className="text-sm text-slate-500 hover:text-slate-800 underline underline-offset-4">Kembali ke Daftar Tugas</button>
                </div>
            </div>
        );
    }

    const finalScore = data.finalScore ?? 0;
    const passingGrade = 70;
    const isPass = finalScore >= passingGrade;
    const paperContent = data.paperContent || [];
    const examinerFeedback = (data.feedbacks || []).find((fb: any) => fb.role === 'Penguji' && fb.text?.trim());

    // --- Statistics Calculations ---
    const totalWords = paperContent.reduce((acc: number, curr: any) => {
        // ... (existing calc)
        const text = curr.content?.replace(/<[^>]*>/g, '') || '';
        return acc + text.split(/\s+/).length;
    }, 0);
    const readTime = Math.ceil(totalWords / 200);
    const dateSubmitted = new Date(data.date || Date.now());
    const dateGraded = new Date(data.date || Date.now());

    return (
        <div className="min-h-screen bg-[#FAFAFA] text-slate-800 font-sans">

            {/* Title Enforcement Modal */}
            {showTitleModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-8 text-center animate-in fade-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Perbarui Judul</h2>
                        <p className="text-gray-600 mb-6">
                            Mohon perbarui <strong>Judul Karya Tulis</strong> Anda untuk keperluan administrasi dan laporan akhir.
                        </p>

                        <form onSubmit={handleUpdateTitle} className="space-y-4">
                            <div>
                                <label className="block text-left text-sm font-medium text-gray-700 mb-1">Judul Karya Tulis</label>
                                <textarea
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none"
                                    rows={3}
                                    placeholder="Masukkan judul lengkap di sini..."
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isTitleSaving || !newTitle.trim()}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isTitleSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-8 md:py-12">

                {/* Navbar / Header Navigation */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-b border-slate-100 pb-6">
                    <div>
                        <button
                            onClick={() => navigate('/assignments')}
                            className="group flex items-center gap-2 text-slate-400 hover:text-slate-800 transition-colors mb-2 text-sm font-medium"
                        >
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            Kembali
                        </button>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">{data.title}</h1>
                            <button
                                onClick={() => {
                                    setNewTitle(data.title || '');
                                    setShowTitleModal(true);
                                }}
                                className="text-slate-300 hover:text-slate-600 transition-colors p-1.5 rounded-full hover:bg-slate-100 mt-1"
                                title="Perbaiki Judul"
                            >
                                <Edit2 size={20} />
                            </button>
                        </div>
                        <p className="text-slate-500 mt-1 flex items-center gap-2 text-sm">
                            <span className="uppercase tracking-wider font-semibold text-xs text-slate-400">{data.subject || 'AKADEMIK'}</span>
                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                            <span>Hasil Studi</span>
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => window.print()}
                            className="hidden md:flex items-center gap-2 px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all text-sm font-medium shadow-sm print:hidden"
                        >
                            <Printer size={16} /> Print Hasil
                        </button>
                    </div>
                </div>

                <div className="grid lg:grid-cols-12 gap-10">

                    {/* --- LEFT COLUMN (Summary & Stats) --- */}
                    <div className="lg:col-span-4 space-y-8">

                        {/* 1. Score Card (Minimalist) */}
                        <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-[0_2px_20px_rgb(0,0,0,0.02)] text-center relative overflow-hidden">
                            {/* Subtle decorative circle */}
                            <div className={`absolute top-0 right-0 w-24 h-24 opacity-10 rounded-bl-full ${isPass ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>

                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Nilai Akhir</p>

                            <div className="relative inline-flex items-center justify-center mb-6">
                                <span className={`text-7xl font-bold tracking-tighter ${isPass ? 'text-slate-800' : 'text-rose-600'}`}>
                                    {finalScore}
                                </span>
                            </div>

                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide ${isPass ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                                {isPass ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                                {isPass ? 'Lulus' : 'Belum Lulus'}
                            </div>
                        </div>

                        {/* 2. Paper Statistics (Clean Widgets) */}
                        <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-1">Statistik Dokumen</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.01)]">
                                    <div className="text-slate-400 mb-2"><AlignLeft size={18} /></div>
                                    <p className="text-2xl font-bold text-slate-700">{totalWords}</p>
                                    <p className="text-xs text-slate-400 font-medium mt-1">Total Kata</p>
                                </div>
                                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.01)]">
                                    <div className="text-slate-400 mb-2"><Timer size={18} /></div>
                                    <p className="text-2xl font-bold text-slate-700">{readTime}m</p>
                                    <p className="text-xs text-slate-400 font-medium mt-1">Waktu Baca</p>
                                </div>
                            </div>
                        </div>

                        {/* 3. Timeline (Clean List) */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_20px_rgb(0,0,0,0.02)]">
                            <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <TrendingUp size={16} className="text-slate-400" />
                                Timeline Tugas
                            </h3>
                            <div className="relative space-y-8 pl-1">
                                {/* Line */}
                                <div className="absolute top-3 bottom-3 left-[15px] w-px bg-slate-100"></div>

                                <div className="relative flex gap-4">
                                    <div className="w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center relative z-10 text-slate-300">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                                    </div>
                                    <div className="pt-1">
                                        <p className="text-xs font-bold text-slate-400 uppercase">Terkirim</p>
                                        <p className="text-sm font-medium text-slate-600 mt-0.5">{dateSubmitted.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                    </div>
                                </div>

                                <div className="relative flex gap-4">
                                    <div className="w-7 h-7 rounded-full bg-white border border-indigo-500 flex items-center justify-center relative z-10 text-indigo-500 shadow-sm">
                                        <CheckSquare size={12} />
                                    </div>
                                    <div className="pt-1">
                                        <p className="text-xs font-bold text-indigo-600 uppercase">Selesai Dinilai</p>
                                        <p className="text-sm font-medium text-slate-800 mt-0.5">{dateGraded.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 4. Examiner Note (Clean) */}
                        {examinerFeedback && (
                            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                                        <MessageCircle size={14} />
                                    </div>
                                    <span className="text-xs font-bold text-slate-500 uppercase">Catatan Penguji</span>
                                </div>
                                <p className="text-sm text-slate-600 leading-relaxed italic">"{examinerFeedback.text}"</p>
                                <p className="text-xs text-slate-400 font-medium mt-3 text-right">— {examinerFeedback.author}</p>
                            </div>
                        )}

                    </div>

                    {/* --- RIGHT COLUMN (Content Viewer) --- */}
                    <div className="lg:col-span-8">
                        <div className="bg-white rounded-2xl shadow-[0_4px_30px_rgb(0,0,0,0.03)] border border-slate-100 h-[800px] flex flex-col overflow-hidden sticky top-6">

                            {/* Viewer Tabs */}
                            <div className="flex border-b border-slate-100">
                                <button
                                    onClick={() => setActiveTab('chapters')}
                                    className={`flex-1 py-5 text-sm font-bold flex items-center justify-center gap-2 transition-colors relative ${activeTab === 'chapters'
                                        ? 'text-slate-800 bg-white'
                                        : 'text-slate-400 hover:text-slate-600 bg-slate-50/50'
                                        }`}
                                >
                                    <BookOpen size={16} /> Isi Paper
                                    {activeTab === 'chapters' && <div className="absolute top-0 inset-x-0 h-0.5 bg-slate-800"></div>}
                                </button>
                                <button
                                    onClick={() => setActiveTab('pdf')}
                                    className={`flex-1 py-5 text-sm font-bold flex items-center justify-center gap-2 transition-colors relative ${activeTab === 'pdf'
                                        ? 'text-slate-800 bg-white'
                                        : 'text-slate-400 hover:text-slate-600 bg-slate-50/50'
                                        }`}
                                >
                                    <FileText size={16} /> Dokumen PDF
                                    {activeTab === 'pdf' && <div className="absolute top-0 inset-x-0 h-0.5 bg-slate-800"></div>}
                                </button>
                            </div>

                            {/* Viewer Content */}
                            <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">

                                {activeTab === 'chapters' ? (
                                    <>
                                        {/* Chapter List (Clean Sidebar) */}
                                        <div className="md:w-72 border-r border-slate-100 bg-[#FAFAFA] overflow-y-auto">
                                            <div className="p-4 space-y-1">
                                                {paperContent.map((chapter: any, index: number) => (
                                                    <button
                                                        key={index}
                                                        onClick={() => setActiveChapter(index)}
                                                        className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all duration-200 ${activeChapter === index
                                                            ? 'bg-white text-slate-800 font-semibold shadow-sm border border-slate-200/60'
                                                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[10px] font-mono text-slate-400 opacity-70">{(index + 1).toString().padStart(2, '0')}</span>
                                                            <span className="truncate">{chapter.title || `Bab ${index + 1}`}</span>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Chapter Content (Typography Focus) */}
                                        <div className="flex-1 p-8 md:p-12 overflow-y-auto bg-white">
                                            {paperContent.length > 0 && paperContent[activeChapter] ? (
                                                <div className="max-w-2xl mx-auto">
                                                    <div className="mb-8">
                                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 block">Chapter {activeChapter + 1}</span>
                                                        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">
                                                            {paperContent[activeChapter].title}
                                                        </h2>
                                                    </div>

                                                    {paperContent[activeChapter].content ? (
                                                        <div
                                                            className="prose prose-slate prose-lg max-w-none 
                                                                prose-headings:text-slate-900 prose-headings:font-bold
                                                                prose-p:text-slate-600 prose-p:leading-8
                                                                prose-strong:text-slate-800 
                                                                prose-li:text-slate-600"
                                                            dangerouslySetInnerHTML={{ __html: paperContent[activeChapter].content }}
                                                        />
                                                    ) : (
                                                        <div className="text-center py-20 opacity-40">
                                                            <p>Konten kosong.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="h-full flex flex-col items-center justify-center text-slate-300">
                                                    <BookOpen size={64} strokeWidth={1} className="mb-4 text-slate-100" />
                                                    <p>Pilih bab untuk membaca</p>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    /* PDF Preview (Maximized) */
                                    <div className="flex-1 flex flex-col bg-slate-50 relative">
                                        {data.finalFileUrl ? (
                                            <div className="flex-1 flex flex-col h-full relative z-10">
                                                <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                                                            <File size={16} />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-800">{data.finalFileName}</p>
                                                            <p className="text-xs text-slate-400">PDF Document</p>
                                                        </div>
                                                    </div>
                                                    <a
                                                        href={data.finalFileUrl.startsWith('http') ? data.finalFileUrl : `http://localhost:3001${data.finalFileUrl}`}
                                                        download
                                                        target="_blank"
                                                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-700 transition-colors shadow-sm"
                                                    >
                                                        <Download size={14} /> Download
                                                    </a>
                                                </div>
                                                <div className="flex-1 bg-slate-200 relative">
                                                    <iframe
                                                        src={`${data.finalFileUrl.startsWith('http') ? data.finalFileUrl : `http://localhost:3001${data.finalFileUrl}`}#toolbar=0`}
                                                        className="absolute inset-0 w-full h-full"
                                                        title="PDF Preview"
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400">
                                                <FileText size={48} strokeWidth={1} className="mb-4 text-slate-200" />
                                                <p>Dokumen tidak tersedia</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Results;