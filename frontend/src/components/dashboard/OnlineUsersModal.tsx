import React from 'react';
import { X, User, Shield, GraduationCap, Clock } from 'lucide-react';

interface OnlineUser {
    id: string;
    name: string;
    role: string;
    photoUrl?: string;
    lastActive: string;
}

interface OnlineUsersModalProps {
    isOpen: boolean;
    onClose: () => void;
    users: {
        siswa: OnlineUser[];
        pembimbing: OnlineUser[];
        penguji: OnlineUser[];
    };
    loading: boolean;
    selectedRole?: 'siswa' | 'pembimbing' | 'penguji' | null;
}

const OnlineUsersModal: React.FC<OnlineUsersModalProps> = ({ isOpen, onClose, users, loading, selectedRole }) => {
    if (!isOpen) return null;

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'SISWA': return <GraduationCap size={18} className="text-emerald-500" />;
            case 'PEMBIMBING': return <User size={18} className="text-blue-500" />;
            case 'PENGUJI': return <Shield size={18} className="text-purple-500" />;
            default: return <User size={18} className="text-gray-500" />;
        }
    };

    const getTitle = () => {
        switch (selectedRole) {
            case 'siswa': return 'Siswa Online';
            case 'pembimbing': return 'Pembimbing Online';
            case 'penguji': return 'Penguji Online';
            default: return 'Pengguna Online';
        }
    };

    const currentList = selectedRole ? users[selectedRole] : [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative animate-slideUp">

                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">{getTitle()}</h3>
                        <p className="text-sm text-gray-500 mt-1">Daftar pengguna aktif dalam 15 menit terakhir</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>

                {/* List */}
                <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : currentList.length === 0 ? (
                        <div className="text-center py-10 text-gray-400">
                            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                <User size={24} className="opacity-50" />
                            </div>
                            <p>Tidak ada pengguna online saat ini.</p>
                        </div>
                    ) : (
                        currentList.map((user) => (
                            <div key={user.id} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100 group">
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                                    {user.photoUrl ? (
                                        <img src={user.photoUrl} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="font-bold text-gray-500 text-sm">{user.name.charAt(0)}</span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-gray-800 truncate">{user.name}</h4>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        {getRoleIcon(user.role)}
                                        <span className="text-xs text-gray-500 font-medium">{timeSince(new Date(user.lastActive))} yang lalu</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
                    <span className="text-xs text-gray-400 flex items-center justify-center gap-1">
                        <Clock size={12} />
                        Data diperbarui secara real-time
                    </span>
                </div>

            </div>
        </div>
    );
};

function timeSince(date: Date) {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " tahun";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " bulan";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " hari";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " jam";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " menit";
    return Math.floor(seconds) + " detik";
}

export default OnlineUsersModal;
