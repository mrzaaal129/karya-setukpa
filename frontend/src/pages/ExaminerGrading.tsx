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

    useEffect(() => {
        fetchPaper();
    }, [id]);

    const fetchPaper = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/papers/${id}`);
            // Handle wrapped response
            const paperData = response.data.paper || response.data;
            setPaper(paperData);

            if (paperData.grade !== null) {
                setGrade(paperData.grade);
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

    if (loading) return <div>Loading...</div>;
    if (!paper) return <div>Paper tidak ditemukan</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => navigate('/super-admin/examiner-assignment')}
                    className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition"
                >
                    <ArrowLeft size={20} className="mr-2" />
                    Kembali ke Daftar Ujian
                </button>

                <div className="bg-white rounded-lg shadow-sm p-8">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Penilaian Ujian</h1>
                    <p className="text-gray-600 mb-6">
                        Siswa: <span className="font-semibold">{paper.User?.name}</span> | Judul: <span className="italic">{paper.title}</span>
                    </p>

                    <div className="mb-8">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <FileText size={20} /> Dokumen Final
                        </h3>

                        {paper.finalFileUrl ? (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-4 border border-blue-200 bg-blue-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <FileText size={32} className="text-blue-600" />
                                        <div>
                                            <p className="font-bold text-blue-900">{paper.finalFileName}</p>
                                            <p className="text-xs text-blue-700">Size: {(paper.finalFileSize / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                    </div>
                                    <a
                                        href={`${API_URL.replace('/api', '')}${paper.finalFileUrl}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-300 text-blue-700 hover:bg-blue-100 rounded-lg transition"
                                    >
                                        <Download size={18} /> Download
                                    </a>
                                </div>

                                {/* PDF Preview */}
                                {paper.finalFileName?.toLowerCase().endsWith('.pdf') ? (
                                    <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-100">
                                        <div className="p-3 bg-gray-200 text-sm font-semibold text-gray-700 flex justify-between items-center">
                                            <span>Pratinjau Dokumen</span>
                                            <a
                                                href={`${API_URL.replace('/api', '')}${paper.finalFileUrl}`}
                                                target="_blank"
                                                className="text-blue-600 hover:underline text-xs"
                                            >
                                                Buka di Tab Baru ↗
                                            </a>
                                        </div>
                                        <iframe
                                            src={`${API_URL.replace('/api', '')}${paper.finalFileUrl}`}
                                            className="w-full h-[800px] bg-white"
                                            title="PDF Preview"
                                        />
                                    </div>
                                ) : (
                                    <div className="p-6 bg-gray-50 border border-gray-200 border-dashed rounded-lg text-center text-gray-500 italic">
                                        Preview tidak tersedia untuk format file ini. Silakan download untuk membaca.
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
                                Dokumen final belum tersedia. Penilaian tidak dapat dilakukan.
                            </div>
                        )}
                    </div>

                    {paper.finalFileUrl && (
                        <div className="border-t border-gray-200 pt-6">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Star size={20} /> Input Nilai
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Skor Akhir (0-100)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={grade}
                                        onChange={(e) => setGrade(e.target.value === '' ? '' : Number(e.target.value))}
                                        className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-lg font-bold text-blue-900"
                                        placeholder="85"
                                    />
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Catatan Penilaian (Opsional)</label>
                                <textarea
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-24 text-sm"
                                    placeholder="Berikan masukan..."
                                ></textarea>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition disabled:opacity-50 shadow-md font-bold"
                                >
                                    <Save size={18} /> Simpan Nilai
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExaminerGrading;
