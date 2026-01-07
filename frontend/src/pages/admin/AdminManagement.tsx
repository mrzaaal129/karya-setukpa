import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { PlusCircle, Edit, Trash2, X, Save, Key, Shield } from 'lucide-react';

interface Admin {
    id: string;
    name: string;
    username: string;
    email?: string;
}

const AdminManagement: React.FC = () => {
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        password: '',
    });
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchAdmins();
    }, []);

    const fetchAdmins = async () => {
        try {
            // Assuming endpoint is /users?role=admin or similar, or specific /admins endpoint
            // Based on UserManagement, it was mock data. Let's try to query /users/admin or similar if it exists
            // or filter from /users if we have a general endpoint.
            // AdvisorManagement used /advisors. Let's assume there might be /admins or we use /users with role filter.
            // Let's rely on what we can infer. If UserManagement was using mock data, maybe backend support isn't fully there?
            // "UserManagement" file import { mockUsers } from '../services/mockData'; implied it was mock.
            // But AdvisorManagement uses api.get('/advisors').
            // I will try `api.get('/users/role/admin')` or similar. If not, I'll fallback to a safe guess or ask user?
            // Wait, previous logs showed UserManagement was using mockUsers.
            // I should double check if there's a backend endpoint for admins.
            // If I look at `App.tsx`, `AdvisorManagement` is under `/admin/advisors`.
            // I'll try to implement with `api.get('/users?role=admin')` as a likely REST pattern or just `/admins`.
            // Using query parameter as supported by userController.ts getAllUsers
            const response = await api.get('/users?role=ADMIN');
            setAdmins(response.data.users);
        } catch (err) {
            console.error('Failed to fetch admins', err);
            // Fallback for demo if needed, but aiming for real implementation
        }
    };

    const handleOpen = (admin?: Admin) => {
        if (admin) {
            setEditingAdmin(admin);
            setFormData({
                name: admin.name,
                username: admin.username || '',
                password: '',
            });
        } else {
            setEditingAdmin(null);
            setFormData({
                name: '',
                username: '',
                password: '',
            });
        }
        setIsModalOpen(true);
        setError(null);
    };

    const handleClose = () => {
        setIsModalOpen(false);
        setEditingAdmin(null);
        setFormData({
            name: '',
            username: '',
            password: '',
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingAdmin) {
                await api.put(`/users/${editingAdmin.id}`, {
                    ...formData,
                    role: 'ADMIN'
                });
            } else {
                // Ensure role is sent as ADMIN
                await api.post('/users', {
                    ...formData,
                    role: 'ADMIN',
                    nosis: formData.username // Using username as nosis/id placeholder if required by backend, or adjust backend
                });
            }
            fetchAdmins();
            handleClose();
        } catch (err: any) {
            setError(err.response?.data?.error || 'An error occurred');
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus admin ini?')) {
            try {
                await api.delete(`/users/${id}`);
                fetchAdmins();
            } catch (err: any) {
                console.error('Failed to delete admin', err);
                alert(err.response?.data?.error || 'Failed to delete admin');
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

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    Manajemen Admin
                </h1>
                <button
                    onClick={() => handleOpen()}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <PlusCircle size={20} />
                    Tambah Admin
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Nama Lengkap</th>
                            <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Username / ID</th>
                            <th className="px-6 py-4 font-semibold text-gray-600 text-sm text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {admins.map((admin) => (
                            <tr key={admin.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                            <Shield size={16} />
                                        </div>
                                        <span className="text-gray-800 font-medium">{admin.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-600 font-mono text-sm">{admin.username}</td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => handleResetPassword(admin.id, admin.name)}
                                            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                                            title="Reset Password"
                                        >
                                            <Key size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleOpen(admin)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Edit"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(admin.id)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {admins.length === 0 && (
                            <tr>
                                <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                                    Belum ada data admin.
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
                                {editingAdmin ? 'Edit Admin' : 'Tambah Admin'}
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

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Username (ID)</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                />
                                <p className="text-xs text-gray-400 mt-1">Digunakan untuk login (NOSIS/NRP).</p>
                            </div>

                            {!editingAdmin && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                    <input
                                        type="password"
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
        </div>
    );
};

export default AdminManagement;
