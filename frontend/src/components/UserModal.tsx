
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (user: User) => void;
    user: User | null; // null for adding, user object for editing
    roleName: string;
}

const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, onSave, user, roleName }) => {
    // FIX: Initialize formData with the 'nosis' property to match the 'User' type.
    const [formData, setFormData] = useState<Omit<User, 'role'>>({ id: '', nosis: '', name: '' });
    const [errors, setErrors] = useState({ id: '', name: '' });

    useEffect(() => {
        if (isOpen) {
            if (user) {
                // FIX: Include 'nosis' when setting form data for an existing user.
                setFormData({ id: user.id, name: user.name, nosis: user.nosis });
            } else {
                // FIX: Include 'nosis' when resetting form data for a new user.
                setFormData({ id: '', name: '', nosis: '' });
            }
            setErrors({ id: '', name: '' });
        }
    }, [isOpen, user]);

    if (!isOpen) return null;

    const isEditing = user !== null;
    const title = isEditing ? `Edit Data ${roleName}` : `Tambah ${roleName} Baru`;
    const isSiswa = roleName === 'Siswa';

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (value.trim()) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        let isValid = true;
        const newErrors = { id: '', name: '' };

        if (!formData.id.trim()) {
            newErrors.id = 'User ID tidak boleh kosong.';
            isValid = false;
        }
        if (!formData.name.trim()) {
            newErrors.name = 'Nama lengkap tidak boleh kosong.';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            const dataToSave = { ...formData };
             if (!isSiswa && !isEditing) {
                dataToSave.nosis = 'N/A';
            }
            onSave({ ...dataToSave, role: user?.role as UserRole } as User); // Role is managed by parent
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b">
                        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="id" className="block text-sm font-medium text-gray-700 mb-1">
                                User ID
                            </label>
                            <input
                                type="text"
                                name="id"
                                id="id"
                                value={formData.id}
                                onChange={handleChange}
                                disabled={isEditing}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 ${isEditing ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300'}`}
                                placeholder="Contoh: siswa-2"
                            />
                            {errors.id && <p className="text-xs text-red-600 mt-1">{errors.id}</p>}
                        </div>
                        {isSiswa && (
                            <div>
                                <label htmlFor="nosis" className="block text-sm font-medium text-gray-700 mb-1">
                                    Nosis (Nomor Siswa)
                                </label>
                                <input
                                    type="text"
                                    name="nosis"
                                    id="nosis"
                                    value={formData.nosis}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Contoh: 2024001"
                                />
                            </div>
                        )}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                Nama Lengkap
                            </label>
                            <input
                                type="text"
                                name="name"
                                id="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Contoh: Budi Santoso"
                            />
                             {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
                        </div>
                    </div>
                    <div className="p-4 bg-gray-50 flex justify-end gap-3 rounded-b-lg">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                        >
                            Simpan
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserModal;