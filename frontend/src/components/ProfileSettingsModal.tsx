import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { XIcon, CameraIcon, SaveIcon } from './icons';
import api from '../services/api';
import toast from 'react-hot-toast';

interface ProfileSettingsModalProps {
    onClose: () => void;
}

const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({ onClose }) => {
    const { currentUser, login } = useAuth(); // We might need a way to refresh user data in context without login
    const [name, setName] = useState(currentUser?.name || '');
    // Fix: Ignore hardcoded default email if present
    const initialEmail = currentUser?.email === 'admin@polri.go.id' ? '' : (currentUser?.email || '');
    const [email, setEmail] = useState(initialEmail);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [photo, setPhoto] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(currentUser?.photoUrl ? `http://localhost:3001${currentUser.photoUrl}` : null);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPhoto(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password && password !== confirmPassword) {
            toast.error('Password baru tidak cocok');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('name', name);
            if (email) formData.append('email', email);
            if (password) formData.append('password', password);
            if (photo) formData.append('photo', photo);

            const response = await api.put('/users/profile', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const updatedUser = response.data.user;

            // Update local storage and reload to refresh context (a bit hacky but works for now)
            // Ideally AuthContext should expose an 'updateUser' method
            localStorage.setItem('user', JSON.stringify(updatedUser));

            toast.success('Profil berhasil diperbarui! Silakan refresh halaman jika data belum berubah.');
            onClose();
            window.location.reload();
        } catch (error) {
            console.error(error);
            toast.error('Gagal memperbarui profil');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800">Edit Profil</h3>
                    <button onClick={onClose} aria-label="Close modal" className="p-1 hover:bg-gray-100 rounded-full transition">
                        <XIcon className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Photo Upload */}
                    <div className="flex flex-col items-center gap-4 mb-6">
                        <div className="relative group">
                            <img
                                src={previewUrl || `https://i.pravatar.cc/150?u=${currentUser?.id}`}
                                alt="Profile"
                                className="w-24 h-24 rounded-full object-cover border-4 border-gray-50"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                aria-label="Change profile photo"
                                className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition shadow-md"
                            >
                                <CameraIcon className="w-4 h-4" />
                            </button>
                            <input
                                type="file"
                                id="photo-upload"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                        </div>
                        <label htmlFor="photo-upload" className="text-xs text-gray-500 cursor-pointer">Klik ikon kamera untuk mengganti foto</label>
                    </div>

                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email (Opsional)</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                            placeholder="Masukkan email Anda"
                        />
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Ganti Password (Kosongkan jika tidak ingin mengubah)</p>
                        <div className="space-y-3">
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password Baru</label>
                                <input
                                    type="password"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    placeholder="Min. 6 karakter"
                                />
                            </div>
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password</label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    placeholder="Ulangi password baru"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-6 bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Menyimpan...' : (
                            <>
                                <SaveIcon className="w-5 h-5" /> Simpan Perubahan
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ProfileSettingsModal;
