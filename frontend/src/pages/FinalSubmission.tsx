
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useUser } from '../contexts/UserContext';
import { Upload, FileText, CheckCircle, AlertCircle, Clock, ChevronLeft, Trash2, ListChecks, ShieldAlert, BadgeCheck, FileCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';

const FinalSubmission: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { currentUser } = useUser();
    const [paper, setPaper] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [dragging, setDragging] = useState(false);

    useEffect(() => {
        fetchPaper();
    }, [id]);

    const fetchPaper = async () => {
        try {
            const response = await api.get(`/papers/${id}`);
            // Fix: Backend returns { paper: ... } wrapper
            const data = response.data.paper || response.data;
            setPaper(data);
        } catch (error) {
            console.error('Error fetching paper:', error);
            toast.error('Gagal mengambil data paper');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        handleUploadProcess(file);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleUploadProcess(file);
    };

    const handleUploadProcess = async (file: File) => {
        if (file.size > 10 * 1024 * 1024) {
            toast.error('Ukuran file maksimal 10MB');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        try {
            await api.post(`/papers/${id}/upload-final`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            toast.success('File berhasil diupload!');
            fetchPaper();
        } catch (error) {
            console.error('Error uploading:', error);
            toast.error('Gagal mengupload file');
        } finally {
            setUploading(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center min-h-screen bg-slate-50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    );

    if (!paper) return <div>Paper tidak ditemukan</div>;

    // Parse structure to check individual chapters
    let structure: any[] = [];
    try {
        structure = typeof paper.structure === 'string'
            ? JSON.parse(paper.structure)
            : paper.structure || [];
    } catch (e) {
        structure = [];
    }

    // Determine strict approval (Global flag + All Chapters check)
    // TRUST THE CHAPTERS: If all chapters are APPROVED, then it IS approved.
    const hasStructure = structure.length > 0;
    const unapprovedChapters = structure.filter((ch: any) => ch.status !== 'APPROVED');

    // Valid if: Has chapters AND No unapproved chapters
    const isStrictlyApproved = hasStructure && unapprovedChapters.length === 0;

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans">
            {/* Navigation Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center">
                    <button
                        onClick={() => navigate(`/student/paper/${id}`)}
                        className="group flex items-center text-slate-500 hover:text-slate-900 transition-colors"
                    >
                        <div className="p-1.5 rounded-full group-hover:bg-slate-100 transition-colors mr-2">
                            <ChevronLeft size={20} />
                        </div>
                        <span className="font-medium">Kembali ke Editor</span>
                    </button>
                </div>
            </div>

            <main className="max-w-6xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                    {/* Left Column: Context & Requirements */}
                    <div className="lg:col-span-4 space-y-8">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-3">Dokumen Final</h1>
                            <p className="text-slate-500 leading-relaxed">
                                Tahap akhir pengumpulan karya tulis. Pastikan dokumen Anda telah memenuhi semua standar yang ditetapkan sebelum diserahkan ke Penguji.
                            </p>
                        </div>

                        {/* Checklist Card */}
                        <div className="bg-white rounded-2xl p-6 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-slate-100">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                    <ListChecks size={20} />
                                </div>
                                <h3 className="font-bold text-slate-800">Checklist Kelengkapan</h3>
                            </div>
                            <ul className="space-y-4">
                                {[
                                    'Semua Bab telah disetujui Pembimbing',
                                    'Format file PDF atau DOCX',
                                    'Ukuran file maksimal 10MB',
                                    'Draft telah bebas plagiasi',
                                    'Lembar pengesahan telah ditandatangani'
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                                        <div className={`mt-0.5 flex-shrink-0 ${isStrictlyApproved ? 'text-indigo-600' : 'text-slate-300'}`}>
                                            <BadgeCheck size={16} />
                                        </div>
                                        <span className={isStrictlyApproved ? 'text-slate-700' : 'text-slate-400'}>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Right Column: Interaction Area */}
                    <div className="lg:col-span-8 space-y-6">

                        {!isStrictlyApproved && (
                            <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 flex gap-4">
                                <div className="flex-shrink-0 pt-1">
                                    <AlertCircle className="text-amber-600" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-amber-900 mb-1">Akses Upload Terkunci</h3>
                                    <p className="text-amber-800 mb-4 opacity-90">
                                        Anda belum menyelesaikan revisi konten. Dapatkan status <b>APPROVED</b> pada semua bab untuk membuka akses upload final.
                                    </p>
                                    {unapprovedChapters.length > 0 && (
                                        <div className="bg-white/50 rounded-xl p-4 border border-amber-200/50">
                                            <p className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-2">Menunggu Persetujuan:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {unapprovedChapters.map((ch: any, idx: number) => (
                                                    <span key={idx} className="px-3 py-1 bg-white rounded-full text-xs font-medium text-amber-800 shadow-sm border border-amber-100">
                                                        {ch.title}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {isStrictlyApproved && (
                            <>
                                {/* Upload Zone / File Display */}
                                {paper.finalFileUrl ? (
                                    <div className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden">
                                        {/* Header Status */}
                                        <div className={`px-8 py-6 border-b ${paper.finalApprovalStatus === 'APPROVED' ? 'bg-emerald-50 border-emerald-100' :
                                            paper.finalApprovalStatus === 'REVISION' ? 'bg-rose-50 border-rose-100' :
                                                'bg-slate-50 border-slate-100'
                                            }`}>
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="text-xs font-bold uppercase tracking-wider opacity-60 mb-1">Status Dokumen</p>
                                                    <div className="flex items-center gap-2">
                                                        {paper.finalApprovalStatus === 'APPROVED' && (
                                                            <><CheckCircle className="text-emerald-600" size={20} /><span className="text-xl font-bold text-emerald-700">Disetujui Pembimbing</span></>
                                                        )}
                                                        {paper.finalApprovalStatus === 'REVISION' && (
                                                            <><ShieldAlert className="text-rose-600" size={20} /><span className="text-xl font-bold text-rose-700">Perlu Revisi</span></>
                                                        )}
                                                        {(!paper.finalApprovalStatus || paper.finalApprovalStatus === 'SUBMITTED') && (
                                                            <><Clock className="text-blue-600" size={20} /><span className="text-xl font-bold text-blue-700">Menunggu Review</span></>
                                                        )}
                                                    </div>
                                                </div>

                                                {paper.finalApprovalStatus !== 'APPROVED' && (
                                                    <button
                                                        onClick={async () => {
                                                            if (!confirm('Hapus dokumen ini dan upload ulang?')) return;
                                                            setUploading(true);
                                                            try {
                                                                await api.delete(`/papers/${id}/final-upload`);
                                                                toast.success('Dokumen dihapus');
                                                                fetchPaper();
                                                            } catch (e) {
                                                                toast.error('Gagal menghapus');
                                                                setUploading(false);
                                                            }
                                                        }}
                                                        className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 hover:text-red-600 hover:border-red-200 transition shadow-sm"
                                                    >
                                                        Hapus & Upload Ulang
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* File Details */}
                                        <div className="p-8">
                                            <div className="flex items-start gap-5">
                                                <div className="p-4 bg-indigo-50 rounded-xl text-indigo-600">
                                                    <FileText size={32} strokeWidth={1.5} />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="text-lg font-bold text-slate-800 mb-1 break-all">{paper.finalFileName}</h4>
                                                    <p className="text-sm text-slate-500 mb-4">
                                                        Diupload pada {new Date(paper.finalUploadedAt).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}
                                                    </p>

                                                    <a href={paper.finalFileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800">
                                                        Download File <FileCheck size={14} />
                                                    </a>
                                                </div>
                                            </div>

                                            {/* Feedback Display - Persistent */}
                                            {paper.finalFeedback && (
                                                <div className={`mt-8 pt-6 border-t animate-in fade-in slide-in-from-bottom-4 duration-500
                                                    ${paper.finalApprovalStatus === 'REVISION' ? 'border-rose-100' : 'border-slate-100'}
                                                `}>
                                                    <h5 className={`flex items-center gap-2 text-sm font-bold uppercase tracking-wider mb-4
                                                        ${paper.finalApprovalStatus === 'REVISION' ? 'text-rose-500' : 'text-slate-400'}
                                                    `}>
                                                        <ShieldAlert size={14}/> Catatan Pembimbing
                                                    </h5>
                                                    <div className={`rounded-xl p-6 border relative
                                                        ${paper.finalApprovalStatus === 'REVISION'
                                                            ? 'bg-rose-50/50 border-rose-100'
                                                            : 'bg-slate-50 border-slate-100'}
                                                    `}>
                                                        <div className={`absolute -left-1 top-6 w-1 h-8 rounded-r-full
                                                            ${paper.finalApprovalStatus === 'REVISION' ? 'bg-rose-400' : 'bg-slate-400'}
                                                        `}></div>
                                                        <p className="text-slate-700 leading-relaxed font-serif text-lg italic pl-2">
                                                            "{paper.finalFeedback}"
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                                        onDragLeave={() => setDragging(false)}
                                        onDrop={handleDrop}
                                        className={`relative group bg-white rounded-3xl border-2 border-dashed transition-all duration-300 ease-out cursor-pointer overflow-hidden
                                            ${dragging ? 'border-indigo-500 bg-indigo-50/30 scale-[1.01]' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}
                                        `}
                                    >
                                        <input
                                            type="file"
                                            accept=".pdf,.docx"
                                            onChange={handleFileUpload}
                                            disabled={uploading}
                                            className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                                        />

                                        <div className="px-10 py-20 text-center">
                                            <div className={`mx-auto w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:bg-indigo-100`}>
                                                <Upload className="text-indigo-600" size={32} strokeWidth={2} />
                                            </div>

                                            <h3 className="text-2xl font-bold text-slate-800 mb-2">Upload Dokumen Final</h3>
                                            <p className="text-slate-500 text-lg mb-8 max-w-sm mx-auto">
                                                Drag & drop file Anda di sini, atau klik untuk menjelajah.
                                            </p>

                                            <div className="inline-flex items-center gap-3 px-4 py-2 bg-slate-100 rounded-full text-xs font-medium text-slate-600">
                                                <span className="flex items-center gap-1"><FileText size={12} /> PDF/DOCX</span>
                                                <div className="w-1 h-1 rounded-full bg-slate-400"></div>
                                                <span>Max 10MB</span>
                                            </div>
                                        </div>

                                        {/* Loading Overlay */}
                                        {uploading && (
                                            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
                                                <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                                                <p className="text-indigo-900 font-bold animate-pulse">Mengupload...</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default FinalSubmission;

