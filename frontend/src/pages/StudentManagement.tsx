import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { UserRole } from '../types';
import { SearchIcon, UserGroupIcon } from '../components/icons';
import { PlusCircle, Edit, Trash2, Upload, Download, RefreshCw, Key, XCircle, CheckCircle } from 'lucide-react';

interface Batch {
    id: string;
    name: string;
}

interface User {
    id: string;
    nosis: string;
    name: string;
    email?: string;
    batchId?: string;
}

const StudentManagement: React.FC = () => {
    const [students, setStudents] = useState<User[]>([]);
    const [batches, setBatches] = useState<Batch[]>([]);
    const [selectedBatch, setSelectedBatch] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modals State
    const [showImportModal, setShowImportModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    // Form Data State
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const [newStudent, setNewStudent] = useState({ nosis: '', name: '', email: '', password: 'password123' });
    const [editingStudent, setEditingStudent] = useState<User | null>(null);
    const [editForm, setEditForm] = useState({ nosis: '', name: '', email: '' });

    useEffect(() => {
        fetchBatches();
    }, []);

    useEffect(() => {
        if (selectedBatch) {
            fetchStudents(selectedBatch);
        }
    }, [selectedBatch]);

    const fetchBatches = async () => {
        try {
            const response = await api.get('/batches');
            const batchesData = response.data.batches || [];
            setBatches(batchesData);
            if (batchesData.length > 0) {
                setSelectedBatch(batchesData[0].id);
            }
        } catch (error) {
            console.error('Failed to fetch batches:', error);
        }
    };

    const fetchStudents = async (batchId: string) => {
        setLoading(true);
        try {
            const response = await api.get(`/users?role=SISWA&batchId=${batchId}`);
            setStudents(response.data.users || []);
        } catch (error) {
            console.error('Failed to fetch students:', error);
        } finally {
            setLoading(false);
        }
    };

    // --- Handlers ---

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.nosis.includes(searchTerm)
    );

    const handleImport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!importFile || !selectedBatch) return;

        setImporting(true);
        const formData = new FormData();
        formData.append('file', importFile);
        formData.append('batchId', selectedBatch);

        try {
            await api.post('/users-import/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Import berhasil!');
            setShowImportModal(false);
            setImportFile(null);
            fetchStudents(selectedBatch);
        } catch (error) {
            console.error('Import failed:', error);
            alert('Import gagal. Pastikan format CSV benar.');
        } finally {
            setImporting(false);
        }
    };

    const downloadTemplate = async () => {
        try {
            const response = await api.get('/users-import/template', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'template_siswa.csv');
            document.body.appendChild(link);
            link.click();
        } catch (error) {
            console.error('Failed to download template:', error);
        }
    };

    const resetPasswords = async () => {
        if (!window.confirm('PERINGATAN: Apakah Anda yakin ingin mereset password SEMUA siswa di angkatan ini ke default (password123)? Tindakan ini tidak dapat dibatalkan.')) return;

        try {
            await api.post('/users-import/reset-password', { batchId: selectedBatch });
            alert('Password semua siswa di angkatan ini berhasil direset.');
        } catch (error) {
            console.error('Failed to reset passwords:', error);
            alert('Gagal mereset password.');
        }
    };

    const handleAddStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBatch) {
            alert('Silakan pilih angkatan terlebih dahulu.');
            return;
        }

        try {
            const payload = {
                ...newStudent,
                email: newStudent.email || undefined,
                role: 'SISWA',
                batchId: selectedBatch
            };

            await api.post('/users', payload);
            alert('Siswa berhasil ditambahkan!');
            setShowAddModal(false);
            setNewStudent({ nosis: '', name: '', email: '', password: 'password123' });
            fetchStudents(selectedBatch);
        } catch (error: any) {
            console.error('Failed to add student:', error);
            const errorMessage = error.response?.data?.error || 'Gagal menambahkan siswa.';
            alert(errorMessage);
        }
    };

    const handleResetSingle = async (userId: string, userName: string) => {
        if (!window.confirm(`Reset password untuk siswa "${userName}" ke default (password123)?`)) return;
        try {
            await api.patch(`/users/${userId}`, { password: 'password123' });
            alert(`Password untuk ${userName} berhasil direset.`);
        } catch (error) {
            console.error('Failed to reset password:', error);
            alert('Gagal mereset password.');
        }
    };

    const handleDelete = async (userId: string, userName: string) => {
        if (!window.confirm(`Apakah Anda yakin ingin menghapus siswa "${userName}"? Data yang dihapus tidak dapat dikembalikan.`)) return;
        try {
            await api.delete(`/users/${userId}`);
            alert(`Siswa ${userName} berhasil dihapus.`);
            fetchStudents(selectedBatch);
        } catch (error) {
            console.error('Failed to delete student:', error);
            alert('Gagal menghapus siswa.');
        }
    };

    useEffect(() => {
        if (editingStudent) {
            setEditForm({
                nosis: editingStudent.nosis,
                name: editingStudent.name,
                email: editingStudent.email || ''
            });
        }
    }, [editingStudent]);

    const openEditModal = (student: User) => {
        setEditingStudent(student);
        setShowEditModal(true);
    };

    const handleUpdateStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingStudent) return;

        try {
            await api.patch(`/users/${editingStudent.id}`, {
                ...editForm,
                email: editForm.email || null
            });
            alert('Data siswa berhasil diperbarui!');
            setShowEditModal(false);
            setEditingStudent(null);
            fetchStudents(selectedBatch);
        } catch (error: any) {
            console.error('Failed to update student:', error);
            const errorMessage = error.response?.data?.error || 'Gagal memperbarui data siswa.';
            alert(errorMessage);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Manajemen Siswa</h1>
                    <p className="text-gray-500 mt-1">Kelola data siswa, import CSV, dan reset password.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {batches.length === 0 ? (
                        <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-medium border border-red-100 flex items-center">
                            <XCircle className="w-5 h-5 mr-2" />
                            Belum ada angkatan aktif
                        </div>
                    ) : (
                        <div className="relative">
                            <select
                                value={selectedBatch}
                                onChange={(e) => setSelectedBatch(e.target.value)}
                                className="appearance-none bg-white border border-gray-300 text-gray-700 py-2.5 pl-4 pr-10 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium min-w-[200px]"
                            >
                                {batches.map(batch => (
                                    <option key={batch.id} value={batch.id}>{batch.name}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Action Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="relative w-full md:w-96">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Cari berdasarkan Nama atau NOSIS..."
                        value={searchTerm}
                        onChange={handleSearch}
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out sm:text-sm"
                    />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                    <button
                        onClick={resetPasswords}
                        disabled={batches.length === 0 || students.length === 0}
                        className="flex items-center justify-center px-4 py-2.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 border border-red-200 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Reset password semua siswa di angkatan ini"
                    >
                        <RefreshCw className="w-5 h-5 mr-2" />
                        <span className="hidden sm:inline">Reset Semua</span>
                    </button>

                    <button
                        onClick={() => setShowImportModal(true)}
                        disabled={batches.length === 0}
                        className="flex items-center justify-center px-4 py-2.5 bg-white text-gray-700 rounded-lg hover:bg-gray-50 border border-gray-300 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                        <Upload className="w-5 h-5 mr-2" />
                        Import CSV
                    </button>

                    <button
                        onClick={() => setShowAddModal(true)}
                        disabled={batches.length === 0}
                        className="flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                        <PlusCircle className="w-5 h-5 mr-2" />
                        Tambah Siswa
                    </button>
                </div>
            </div>

            {/* Students Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    NOSIS
                                </th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Nama Lengkap
                                </th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Email
                                </th>
                                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Aksi
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center">
                                        <div className="flex justify-center items-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                            <span className="ml-3 text-gray-500 font-medium">Memuat data siswa...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredStudents.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <UserGroupIcon className="w-12 h-12 text-gray-300 mb-3" />
                                            <p className="text-lg font-medium text-gray-900">Tidak ada data siswa</p>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {searchTerm ? 'Tidak ditemukan siswa dengan kata kunci tersebut.' : 'Belum ada siswa di angkatan ini.'}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredStudents.map((student) => (
                                    <tr key={student.id} className="hover:bg-gray-50 transition-colors duration-150">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {student.nosis}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{student.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">{student.email || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleResetSingle(student.id, student.name)}
                                                    title="Reset Password"
                                                    className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                                                >
                                                    <Key size={18} />
                                                </button>
                                                <button
                                                    onClick={() => openEditModal(student)}
                                                    title="Edit"
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(student.id, student.name)}
                                                    title="Delete"
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                        Menampilkan {filteredStudents.length} dari {students.length} siswa
                    </span>
                </div>
            </div>

            {/* Import Modal */}
            {showImportModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full transform transition-all scale-100">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Import Data Siswa</h2>
                            <button onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-gray-500">
                                <span className="sr-only">Close</span>
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
                            <p className="text-sm text-blue-800 mb-3">
                                Gunakan template CSV yang telah disediakan untuk memastikan format data benar.
                            </p>
                            <button
                                onClick={downloadTemplate}
                                className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-semibold"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Download Template CSV
                            </button>
                        </div>

                        <form onSubmit={handleImport}>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Upload File CSV</label>
                                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-400 transition-colors cursor-pointer bg-gray-50">
                                    <div className="space-y-1 text-center">
                                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                        <div className="flex text-sm text-gray-600">
                                            <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                                                <span>Upload a file</span>
                                                <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".csv" onChange={(e) => setImportFile(e.target.files ? e.target.files[0] : null)} />
                                            </label>
                                            <p className="pl-1">or drag and drop</p>
                                        </div>
                                        <p className="text-xs text-gray-500">CSV up to 10MB</p>
                                        {importFile && (
                                            <p className="text-sm text-green-600 font-medium mt-2">
                                                Selected: {importFile.name}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowImportModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={!importFile || importing}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 flex items-center"
                                >
                                    {importing ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Mengimport...
                                        </>
                                    ) : 'Import Data'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Student Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Tambah Siswa Manual</h2>
                        <form onSubmit={handleAddStudent}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">NOSIS <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        required
                                        value={newStudent.nosis}
                                        onChange={(e) => setNewStudent({ ...newStudent, nosis: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Contoh: 2024001"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        required
                                        value={newStudent.name}
                                        onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Nama Lengkap Siswa"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-gray-400 text-xs">(Opsional)</span></label>
                                    <input
                                        type="email"
                                        name="email_student_new"
                                        autoComplete="off"
                                        value={newStudent.email}
                                        onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="email@contoh.com"
                                    />
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Password Default</label>
                                    <div className="flex items-center justify-between">
                                        <code className="text-sm font-mono text-gray-800 bg-white px-2 py-1 rounded border border-gray-200">password123</code>
                                        <span className="text-xs text-gray-400">Otomatis diset</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                                >
                                    Simpan Siswa
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Student Modal */}
            {showEditModal && editingStudent && (
                <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Edit Data Siswa</h2>
                        <form onSubmit={handleUpdateStudent}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">NOSIS <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        required
                                        value={editForm.nosis}
                                        onChange={(e) => setEditForm({ ...editForm, nosis: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-100 cursor-not-allowed"
                                        readOnly // NOSIS usually shouldn't be changed easily as it's an ID
                                        title="NOSIS tidak dapat diubah"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        required
                                        value={editForm.name}
                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-gray-400 text-xs">(Opsional)</span></label>
                                    <input
                                        type="email"
                                        value={editForm.email}
                                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                                >
                                    Simpan Perubahan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentManagement;
