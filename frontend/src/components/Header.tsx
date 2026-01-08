import React, { useState } from 'react';
import NotificationDropdown from './NotificationDropdown';
import { useUser } from '../contexts/UserContext';
import { UserRole } from '../types';
import ProfileSettingsModal from './ProfileSettingsModal';
import { API_URL } from '../services/api';

const Header: React.FC = () => {
  const { currentUser } = useUser();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const titleMap: Record<UserRole, string> = {
    [UserRole.Siswa]: 'Dashboard Siswa',
    [UserRole.Admin]: 'Dashboard Admin',
    [UserRole.SuperAdmin]: 'Dashboard Super Admin',
    [UserRole.Penguji]: 'Dashboard Penguji',
    [UserRole.Pembimbing]: 'Dashboard Pembimbing',
  };

  const getPhotoUrl = (user: any) => {
    if (user.photoUrl) {
      return `${API_URL.replace('/api', '')}${user.photoUrl}`; // Ensure backend URL is correct
    }
    return `https://i.pravatar.cc/100?u=${user.id}`;
  };

  return (
    <header className="flex items-center justify-between h-20 px-6 bg-white border-b border-gray-200">
      <div className="flex items-center">
        <h2 className="text-xl font-semibold text-gray-800">{titleMap[currentUser.role]}</h2>
      </div>

      <div className="flex items-center space-x-4">
        <NotificationDropdown />

        <div
          className="flex items-center cursor-pointer p-1 hover:bg-gray-50 rounded-lg transition"
          onClick={() => setIsProfileOpen(true)}
          title="Klik untuk edit profil"
        >
          <img
            className="h-10 w-10 rounded-full object-cover border border-gray-200"
            src={getPhotoUrl(currentUser)}
            alt="User avatar"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null; // Prevent infinite loop
              target.src = `https://i.pravatar.cc/100?u=${currentUser.id}`;
            }}
          />
          <div className="ml-3 hidden md:block text-left">
            <p className="text-sm font-semibold text-gray-800">{currentUser.name}</p>
            <p className="text-xs text-gray-500">{currentUser.role}</p>
          </div>
        </div>
      </div>

      {isProfileOpen && (
        <ProfileSettingsModal onClose={() => setIsProfileOpen(false)} />
      )}
    </header>
  );
};

export default Header;
