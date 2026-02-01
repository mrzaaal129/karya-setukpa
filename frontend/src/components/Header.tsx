import React, { useState } from 'react';
import NotificationDropdown from './NotificationDropdown';
import { useUser } from '../contexts/UserContext';
import { UserRole } from '../types';
import ProfileSettingsModal from './ProfileSettingsModal';
import { getInitials, getAvatarColor, getPhotoUrl } from '../utils/avatar';
import { LogoutIcon, MenuIcon } from './icons';

interface HeaderProps {
  onOpenMobileSidebar?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenMobileSidebar }) => {
  const { currentUser } = useUser();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Logout handler
  const handleLogout = () => {
    if (window.confirm('Apakah Anda yakin ingin keluar?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/#/login';
    }
  };

  const titleMap: Record<UserRole, string> = {
    [UserRole.Siswa]: 'Dashboard Siswa',
    [UserRole.Admin]: 'Dashboard Admin',
    [UserRole.SuperAdmin]: 'Dashboard Super Admin',
    [UserRole.Penguji]: 'Dashboard Penguji',
    [UserRole.Pembimbing]: 'Dashboard Pembimbing',
    [UserRole.Helper]: 'Mode Bayangan',
  };

  const photoUrl = getPhotoUrl(currentUser?.photoUrl);
  const initials = getInitials(currentUser?.name);
  const avatarColor = getAvatarColor(currentUser?.id || currentUser?.name);

  return (
    <header className="flex items-center justify-between h-20 px-6 bg-white border-b border-gray-200">
      <div className="flex items-center gap-3 md:gap-2">
        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 -ml-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          onClick={onOpenMobileSidebar}
          aria-label="Open Menu"
        >
          <MenuIcon className="w-6 h-6" />
        </button>

        <h2 className="text-xl font-semibold text-gray-800 truncate max-w-[200px] md:max-w-none">{titleMap[currentUser.role]}</h2>
      </div>

      <div className="flex items-center space-x-3 md:space-x-4">
        {/* Logout Button (Visible on all devices for easier access) */}
        <button
          onClick={handleLogout}
          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
          title="Keluar / Logout"
        >
          <LogoutIcon className="w-6 h-6" />
        </button>

        <NotificationDropdown />

        <div
          className="flex items-center cursor-pointer p-1 hover:bg-gray-50 rounded-lg transition"
          onClick={() => setIsProfileOpen(true)}
          title="Klik untuk edit profil"
        >
          {photoUrl && !imgError ? (
            <img
              className="h-10 w-10 rounded-full object-cover border border-gray-200"
              src={photoUrl}
              alt="User avatar"
              onError={() => setImgError(true)}
            />
          ) : (
            <div
              className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm border border-gray-200"
              style={{ backgroundColor: avatarColor }}
            >
              {initials}
            </div>
          )}
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
