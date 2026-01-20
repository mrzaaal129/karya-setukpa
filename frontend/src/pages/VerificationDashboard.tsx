import React, { useEffect, useState } from 'react';
import { paperService } from '../services/paperService';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, AlertTriangle, FileText, Download } from 'lucide-react';

interface PendingPaper {
    id: string;
    title: string;
    subject: string;
    consistencyScore: number | null;
    consistencyStatus: string;
    updatedAt: string;
    finalFileUrl: string | null;
    User: {
        id: string;
        name: string;
        nosis: string;
        batchId: string | null;
    };
}

const VerificationDashboard: React.FC = () => {
    const [papers, setPapers] = useState<PendingPaper[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPapers();
    }, []);

    const fetchPapers = async () => {
        try {
            const data = await paperService.getPendingVerificationPapers();
            setPapers(data);
        } catch (error) {
            console.error(error);
            toast.error('Gagal mengambil data verifikasi');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (id: string, status: 'VERIFIED' | 'REJECTED') => {
        if (!confirm(`Apakah Anda yakin ingin ${status === 'VERIFIED' ? 'MENYETUJUI' : 'MENOLAK'} naskah ini?`)) return;

        try {
            await paperService.verifyPaper(id, status);
            toast.success(`Naskah berhasil ${status === 'VERIFIED' ? 'diverifikasi' : 'ditolak'}`);
            fetchPapers(); // Refresh list
        } catch (error) {
            console.error(error);
            toast.error('Gagal memproses verifikasi');
        }
    };

    const getScoreColor = (score: number | null) => {
        if (score === null) return 'text-gray-500';
        if (score >= 90) return 'text-green-600 font-bold';
        if (score >= 70) return 'text-yellow-600 font-bold';
        return 'text-red-600 font-bold';
    };

    if (loading) return <div className="p-8 text-center">Loading verification data...</div>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <FileText className="w-8 h-8 text-indigo-600" />
                Verifikasi Integritas Naskah
            </h1>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                {papers.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                        <p>Tidak ada naskah yang perlu diverifikasi saat ini.</p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-4 border-b font-semibold text-gray-600">Siswa</th>
                                <th className="p-4 border-b font-semibold text-gray-600">Judul Naskah</th>
                                <th className="p-4 border-b font-semibold text-gray-600 text-center">Skor Konsistensi</th>
                                <th className="p-4 border-b font-semibold text-gray-600 text-center">Aksi File</th>
                                <th className="p-4 border-b font-semibold text-gray-600 text-center">Keputusan</th>
                            </tr>
                        </thead>
                        <tbody>
                            {papers.map((paper) => (
                                <tr key={paper.id} className="hover:bg-gray-50">
                                    <td className="p-4 border-b">
                                        <div className="font-medium text-gray-900">{paper.User.name}</div>
                                        <div className="text-sm text-gray-500">{paper.User.nosis}</div>
                                    </td>
                                    <td className="p-4 border-b max-w-xs truncate" title={paper.title}>
                                        <div className="font-medium text-gray-900">{paper.subject}</div>
                                        <div className="text-sm text-gray-500 truncate">{paper.title}</div>
                                    </td>
                                    <td className="p-4 border-b text-center">
                                        <div className={`text-lg ${getScoreColor(paper.consistencyScore)}`}>
                                            {paper.consistencyScore !== null ? `${paper.consistencyScore}%` : 'N/A'}
                                        </div>
                                        {paper.consistencyScore !== null && paper.consistencyScore < 70 && (
                                            <div className="text-xs text-red-500 mt-1 flex items-center justify-center gap-1">
                                                <AlertTriangle size={12} /> Suspicious
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4 border-b text-center">
                                        {paper.finalFileUrl && (
                                            <a
                                                href={`http://localhost:5000${paper.finalFileUrl}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1 text-blue-600 hover:underline text-sm"
                                            >
                                                <Download size={14} /> Download Upload
                                            </a>
                                        )}
                                    </td>
                                    <td className="p-4 border-b text-center">
                                        <div className="flex justify-center gap-2">
                                            <button
                                                onClick={() => handleVerify(paper.id, 'VERIFIED')}
                                                className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm font-medium transition-colors"
                                            >
                                                <CheckCircle size={16} /> ACC
                                            </button>
                                            <button
                                                onClick={() => handleVerify(paper.id, 'REJECTED')}
                                                className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm font-medium transition-colors"
                                            >
                                                <XCircle size={16} /> Tolak
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default VerificationDashboard;
