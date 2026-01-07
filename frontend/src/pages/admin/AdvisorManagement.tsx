import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { PlusCircle, Edit, Trash2, X, Save, Upload, Download, Key } from 'lucide-react';

interface Advisor {
    id: string;
    name: string;
    nrp: string;
    rank: string;
    position: string;
    email: string;
}

const AdvisorManagement: React.FC = () => {
    const [advisors, setAdvisors] = useState<Advisor[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [editingAdvisor, setEditingAdvisor] = useState<Advisor | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        nrp: '',
        rank: '',
        position: '',
        email: '',
        password: '',
    });
    const [importFile, setImportFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [importResult, setImportResult] = useState<any | null>(null);

    useEffect(() => {
        fetchAdvisors();
    }, []);

    const fetchAdvisors = async () => {
        try {
            const response = await api.get('/advisors');
            setAdvisors(response.data);
        } catch (err) {
            console.error('Failed to fetch advisors', err);
        }
    };

    const handleOpen = (advisor?: Advisor) => {
        if (advisor) {
            setEditingAdvisor(advisor);
            setFormData({
                name: advisor.name,
                nrp: advisor.nrp || '',
                rank: advisor.rank || '',
                position: advisor.position || '',
                email: advisor.email || '',
                password: '',
            });
        } else {
            setEditingAdvisor(null);
            setFormData({
                name: '',
                nrp: '',
                rank: '',
                position: '',
                email: '',
                password: '',
            });
        }
        setIsModalOpen(true);
        setError(null);
    };

    const handleClose = () => {
        setIsModalOpen(false);
        setEditingAdvisor(null);
        setFormData({
            name: '',
            nrp: '',
            rank: '',
            position: '',
            email: '',
            password: '',
        });
    };

    const handleImportClose = () => {
        setIsImportModalOpen(false);
        setImportFile(null);
        setImportResult(null);
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingAdvisor) {
                await api.put(`/advisors/${editingAdvisor.id}`, formData);
            } else {
                await api.post('/advisors', formData);
            }
            fetchAdvisors();
            handleClose();
        } catch (err: any) {
            setError(err.response?.data?.error || 'An error occurred');
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this advisor?')) {
            try {
                await api.delete(`/advisors/${id}`);
                fetchAdvisors();
            } catch (err: any) {
                console.error('Failed to delete advisor', err);
                alert(err.response?.data?.error || 'Failed to delete advisor');
            }
        }
    };

    const handleResetPassword = async (id: string, name: string) => {
        if (window.confirm(`Reset password untuk "${name}" ke default (password123)?`)) {
            try {
                await api.patch(`/users/${id}`, { password: 'password123' });
                alert(`Password untuk ${name} berhasil direset.`);
            } catch (err: any) {
                console.error('Failed to reset password', err);
                alert(err.response?.data?.error || 'Gagal mereset password.');
            }
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const response = await api.get('/advisors/template', {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'template_pembimbing.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error('Failed to download template', err);
        }
    };

    const handleImportSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!importFile) {
            setError('Please select a file');
            return;
        }

        const formData = new FormData();
        formData.append('file', importFile);

        try {
            const response = await api.post('/advisors/import', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setImportResult(response.data);
            fetchAdvisors();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Import failed');
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Manajemen Pembimbing</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                        <Upload size={20} />
                        Import CSV
                    </button>
                    <button
                        onClick={() => handleOpen()}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <PlusCircle size={20} />
                        Tambah Pembimbing
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Nama</th>
                            <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Pangkat</th>
                            <th className="px-6 py-4 font-semibold text-gray-600 text-sm">NRP</th>
                            <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Jabatan</th>
                            <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Email</th>
                            <th className="px-6 py-4 font-semibold text-gray-600 text-sm text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {advisors.map((advisor) => (
                            <tr key={advisor.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 text-gray-800">{advisor.name}</td>
                                <td className="px-6 py-4 text-gray-600">{advisor.rank}</td>
                                <td className="px-6 py-4 text-gray-600 font-mono text-sm">{advisor.nrp}</td>
                                <td className="px-6 py-4 text-gray-600">{advisor.position}</td>
                                <td className="px-6 py-4 text-gray-600">{advisor.email}</td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => handleResetPassword(advisor.id, advisor.name)}
                                            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                                            title="Reset Password"
                                        >
                                            <Key size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleOpen(advisor)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Edit"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(advisor.id)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {advisors.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                    Belum ada data pembimbing.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="text-lg font-bold text-gray-800">
                                {editingAdvisor ? 'Edit Pembimbing' : 'Tambah Pembimbing'}
                            </h2>
                            <button
                                onClick={handleClose}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {error && (
                                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">NRP</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                        value={formData.nrp}
                                        onChange={(e) => setFormData({ ...formData, nrp: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Pangkat</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                        value={formData.rank}
                                        onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Jabatan</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                    value={formData.position}
                                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email (Opsional)</label>
                                <input
                                    type="email"
                                    name="email_advisor_new"
                                    autoComplete="off"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="Opsional"
                                />
                            </div>

                            {!editingAdvisor && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                    <input
                                        type="password"
                                        name="password_advisor_new"
                                        autoComplete="new-password"
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="Default: password123"
                                    />
                                </div>
                            )}

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                                >
                                    <Save size={18} />
                                    Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Import Modal */}
            {isImportModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="text-lg font-bold text-gray-800">Import Pembimbing</h2>
                            <button
                                onClick={handleImportClose}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {!importResult ? (
                                <form onSubmit={handleImportSubmit} className="space-y-4">
                                    {error && (
                                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
                                            {error}
                                        </div>
                                    )}

                                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
                                        <p className="mb-2 font-semibold">Format CSV:</p>
                                        <p>nrp, name, rank, position, email</p>
                                        <button
                                            type="button"
                                            onClick={handleDownloadTemplate}
                                            className="mt-2 text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                                        >
                                            <Download size={14} />
                                            Download Template
                                        </button>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Upload File CSV</label>
                                        <input
                                            type="file"
                                            accept=".csv"
                                            onChange={(e) => setImportFile(e.target.files ? e.target.files[0] : null)}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                        />
                                    </div>

                                    <div className="pt-4 flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={handleImportClose}
                                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={!importFile}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Upload size={18} />
                                            Import
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="space-y-4">
                                    <div className="bg-green-50 p-4 rounded-lg border border-green-100 text-green-800">
                                        <h3 className="font-bold text-lg mb-2">Import Selesai!</h3>
                                        <p>Total Data: {importResult.total}</p>
                                        <p>Berhasil: {importResult.success}</p>
                                        <p>Gagal: {importResult.failed}</p>
                                    </div>

                                    {importResult.errors && (
                                        <div className="bg-red-50 p-4 rounded-lg border border-red-100 text-red-800 text-sm max-h-40 overflow-y-auto">
                                            <p className="font-bold mb-2">Error Detail:</p>
                                            <ul className="list-disc list-inside">
                                                {importResult.errors.map((err: any, idx: number) => (
                                                    <li key={idx}>
                                                        Row {idx + 1}: {err.error} ({err.row.name || 'Unknown'})
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    <div className="pt-4 flex justify-end">
                                        <button
                                            onClick={handleImportClose}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                        >
                                            Tutup
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdvisorManagement;
