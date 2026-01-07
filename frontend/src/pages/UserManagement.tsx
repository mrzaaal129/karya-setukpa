
import React, { useState, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { User, UserRole } from '../types';
import { mockUsers } from '../services/mockData';
import { SearchIcon } from '../components/icons';
import { PlusCircle, Edit, Trash2, Upload, Key, Unlock } from 'lucide-react';
import api from '../services/api';
import UserModal from '../components/UserModal';

const roleMap: { [key: string]: UserRole } = {
    'siswa': UserRole.Siswa,
    'pembimbing': UserRole.Pembimbing,
    'penguji': UserRole.Penguji,
    'admin': UserRole.Admin,
};

const titleMap: { [key in UserRole]?: string } = {
    [UserRole.Siswa]: 'Siswa/Peserta',
    [UserRole.Pembimbing]: 'Pembimbing',
    [UserRole.Penguji]: 'Penguji',
    [UserRole.Admin]: 'Admin',
};

const singularRoleMap: { [key in UserRole]?: string } = {
    [UserRole.Siswa]: 'Siswa',
    [UserRole.Pembimbing]: 'Pembimbing',
    [UserRole.Penguji]: 'Penguji',
    [UserRole.Admin]: 'Admin',
};


const UserManagement: React.FC = () => {
    const { roleParam = 'siswa' } = useParams<{ roleParam: string }>();
    const currentRole = roleMap[roleParam] || UserRole.Siswa;

    const [users, setUsers] = useState<User[]>(mockUsers.filter(u => u.role !== UserRole.SuperAdmin));
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const filteredUsers = useMemo(() => {
        let tempUsers = users.filter(user => user.role === currentRole);

        if (searchTerm) {
            tempUsers = tempUsers.filter(user =>
                user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.id.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        return tempUsers;
    }, [users, searchTerm, currentRole]);

    const handleFileImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            const lines = text.split('\n').filter(line => line.trim() !== '');
            const newUsers: User[] = [];

            lines.forEach((line, index) => {
                const [id, name] = line.split(',').map(item => item.trim());
                if (id && name) {
                    // FIX: Add 'nosis' property to the new user object to match the User type.
                    const nosis = currentRole === UserRole.Siswa ? '' : 'N/A';
                    newUsers.push({ id, nosis, name, role: currentRole });
                } else {
                    console.warn(`Skipping invalid CSV line ${index + 1}: ${line}`);
                }
            });

            if (newUsers.length > 0) {
                setUsers(prev => [...newUsers, ...prev]);
                alert(`${newUsers.length} pengguna berhasil diimpor!`);
            } else {
                alert('Tidak ada pengguna valid yang ditemukan dalam file CSV. Pastikan formatnya adalah id,name');
            }
        };

        reader.onerror = () => {
            alert('Gagal membaca file.');
        };

        reader.readAsText(file);
        // Reset file input to allow re-uploading the same file
        event.target.value = '';
    };

    const handleAddUser = () => {
        setEditingUser(null);
        setIsModalOpen(true);
    };

    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleDeleteUser = (userId: string) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus pengguna ini? Tindakan ini tidak dapat dibatalkan.')) {
            setUsers(users.filter(user => user.id !== userId));
        }
    };

    const handleResetPassword = (userName: string) => {
        if (window.confirm(`Apakah Anda yakin ingin mereset password untuk ${userName}? Password akan diatur ke default.`)) {
            alert(`Password untuk ${userName} telah berhasil direset.`);
        }
    };

    const handleSaveUser = (userToSave: User) => {
        if (editingUser) { // Editing existing user
            // FIX: Update the entire user object instead of just the name to ensure all changes are saved.
            setUsers(users.map(u => u.id === userToSave.id ? userToSave : u));
        } else { // Adding new user
            setUsers([{ ...userToSave, role: currentRole }, ...users]);
        }
        setIsModalOpen(false);
    };


    return (
        <div className="space-y-6">
            <UserModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveUser}
                user={editingUser}
                roleName={singularRoleMap[currentRole] || 'Pengguna'}
            />
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".csv"
                onChange={handleFileImport}
            />
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Manajemen {titleMap[currentRole]}</h1>
                    <p className="mt-1 text-gray-600">Tambah, edit, atau hapus pengguna untuk peran {titleMap[currentRole]}.</p>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <button
                        onClick={handleFileImportClick}
                        className="w-full md:w-auto px-4 py-2.5 font-semibold text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center space-x-2"
                        title="Format CSV: id,name"
                    >
                        <Upload className="h-5 w-5" />
                        <span>Import CSV</span>
                    </button>
                    <button
                        onClick={handleAddUser}
                        className="w-full md:w-auto px-4 py-2.5 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                    >
                        <PlusCircle className="h-5 w-5" />
                        <span>Tambah {singularRoleMap[currentRole]}</span>
                    </button>
                </div>
            </div>

            <div className="relative w-full md:w-1/3">
                <input
                    type="text"
                    placeholder={`Cari nama atau ID ${singularRoleMap[currentRole]}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-5 w-5 text-gray-400" />
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Nama</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">User ID</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <img className="h-10 w-10 rounded-full" src={`https://i.pravatar.cc/100?u=${user.id}`} alt={`${user.name}'s avatar`} />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{user.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-2">
                                            {currentRole === UserRole.Siswa && (
                                                <button
                                                    onClick={async () => {
                                                        if (window.confirm(`Reset pelanggaran untuk ${user.name}? Editor akan terbuka kembali.`)) {
                                                            try {
                                                                await api.delete(`/violations/reset/${user.id}`);
                                                                alert("Pelanggaran berhasil direset!");
                                                            } catch (e) {
                                                                alert("Gagal mereset pelanggaran.");
                                                                console.error(e);
                                                            }
                                                        }
                                                    }}
                                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                    title="Reset Pelanggaran / Buka Kunci Editor"
                                                >
                                                    <Unlock size={18} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleResetPassword(user.name)}
                                                className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                                                title="Reset Password"
                                            >
                                                <Key size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleEditUser(user)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(user.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredUsers.length === 0 && (
                    <div className="text-center py-12">
                        <h3 className="text-lg font-semibold text-gray-800">Tidak Ada Pengguna Ditemukan</h3>
                        <p className="text-gray-500 mt-2">Tidak ada pengguna untuk peran '{titleMap[currentRole]}' atau coba ubah kata kunci pencarian Anda.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserManagement;