import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

import {
    HomeIcon, DocumentTextIcon, ChartBarIcon, LogoutIcon, UserGroupIcon,
    CogIcon, ShieldExclamationIcon, AcademicCapIcon, ClipboardCheckIcon,
    PlusCircleIcon, TemplateIcon, ChevronLeftIcon, ChevronRightIcon
} from './icons';
import { useUser } from '../contexts/UserContext';
import { UserRole } from '../types';

const Sidebar: React.FC = () => {
    const { currentUser } = useUser();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const toggleSidebar = () => setIsCollapsed(!isCollapsed);

    const NavItem = ({ to, icon: Icon, label, end = false }: { to: string, icon: any, label: string, end?: boolean }) => (
        <NavLink
            to={to}
            end={end}
            className={({ isActive }) =>
                `flex items-center px-3 py-3 mb-1.5 transition-all duration-300 rounded-xl group relative overflow-hidden ${isActive
                    ? 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30'
                    : 'text-gray-500 hover:bg-blue-50 hover:text-blue-600'
                } ${isCollapsed ? 'justify-center' : ''}`
            }
            title={isCollapsed ? label : ''}
        >
            <Icon className={`h-6 w-6 flex-shrink-0 ${isCollapsed ? '' : 'mr-3'} transition-all duration-200 ${isCollapsed ? 'mx-auto' : ''}`} />
            <span className={`font-semibold text-sm whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
                {label}
            </span>
            {isCollapsed && (
                <div className="absolute left-16 top-1/2 transform -translate-y-1/2 px-3 py-1.5 bg-white text-gray-800 text-xs font-bold rounded-lg shadow-xl border border-gray-100 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity duration-200">
                    {label}
                    <div className="absolute left-0 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rotate-45 border-l border-b border-gray-100"></div>
                </div>
            )}
        </NavLink>
    );

    const SectionHeader = ({ label }: { label: string }) => (
        !isCollapsed ? (
            <div className="px-3 pt-6 pb-2 text-[11px] uppercase text-gray-400 font-bold tracking-widest transition-all duration-200">
                {label}
            </div>
        ) : (
            <div className="h-4"></div> // Spacer when collapsed
        )
    );

    const renderNavLinks = () => {
        switch (currentUser.role) {
            case UserRole.Siswa:
                return (
                    <>
                        <NavItem to="/" icon={HomeIcon} label="Dashboard" end />
                        <NavItem to="/assignments" icon={DocumentTextIcon} label="Tugas Makalah" />
                        <NavItem to="/grades" icon={ChartBarIcon} label="Nilai & Hasil" />
                    </>
                );
            case UserRole.Admin:
                return (
                    <>
                        <NavItem to="/" icon={HomeIcon} label="Dashboard" end />
                        <NavItem to="/admin/assignments" icon={DocumentTextIcon} label="Kelola Tugas" />
                        <NavItem to="/monitoring" icon={ShieldExclamationIcon} label="Monitoring" />
                        <NavItem to="/violations" icon={ShieldExclamationIcon} label="Pelanggaran Siswa" />
                        <SectionHeader label="Manajemen" />
                        <NavItem to="/admin/advisors" icon={UserGroupIcon} label="Pembimbing" />
                        <NavItem to="/admin/examiners" icon={ClipboardCheckIcon} label="Penguji" />
                    </>
                );
            case UserRole.Helper:
                return (
                    <>
                        <SectionHeader label="Menu Bayangan" />
                        <NavItem to="/" icon={ChartBarIcon} label="Mode Bayangan 👻" />
                    </>
                );
            case UserRole.SuperAdmin:
                return (
                    <>
                        <NavItem to="/" icon={HomeIcon} label="Dashboard Global" end />
                        <NavItem to="/super-admin/assignments" icon={DocumentTextIcon} label="Kelola Tugas" />

                        <SectionHeader label="Manajemen" />
                        <NavItem to="/users/siswa" icon={AcademicCapIcon} label="Siswa" />
                        <NavItem to="/batches" icon={UserGroupIcon} label="Angkatan" />
                        <NavItem to="/admin/advisors" icon={UserGroupIcon} label="Pembimbing" />
                        <NavItem to="/admin/examiners" icon={ClipboardCheckIcon} label="Penguji" />
                        <NavItem to="/super-admin/advisor-assignment" icon={UserGroupIcon} label="Penugasan Pembimbing" />
                        <NavItem to="/super-admin/examiner-assignment" icon={ClipboardCheckIcon} label="Penugasan Penguji" />
                        <NavItem to="/super-admin/verification" icon={ShieldExclamationIcon} label="Verifikasi Integritas" />
                        <NavItem to="/violations" icon={ShieldExclamationIcon} label="Pelanggaran Siswa" />
                        <NavItem to="/users/admin" icon={ShieldExclamationIcon} label="Admin" />

                        <SectionHeader label="Sistem" />
                        <NavItem to="/templates" icon={TemplateIcon} label="Template" />
                        <NavItem to="/reports" icon={ChartBarIcon} label="Laporan" />
                        <NavItem to="/settings" icon={CogIcon} label="Pengaturan" />
                    </>
                );
            case UserRole.Pembimbing:
                return (
                    <>
                        <NavItem to="/" icon={HomeIcon} label="Dashboard" end />
                        {/* Fix: changed /bimbingan to /advisor/dashboard as defined in App.tsx */}
                        <NavItem to="/advisor/students" icon={AcademicCapIcon} label="Siswa Bimbingan" />
                    </>
                );
            case UserRole.Penguji:
                return (
                    <>
                        <NavItem to="/examiner/dashboard" icon={HomeIcon} label="Dashboard" end />
                        <NavItem to="/examiner/students" icon={ClipboardCheckIcon} label="Daftar Makalah" />
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <div
            className={`${isCollapsed ? 'w-24' : 'w-72'
                } hidden md:flex flex-col bg-white text-gray-600 transition-all duration-300 ease-in-out relative shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-50 border-r border-gray-100`}
        >
            {/* Header / Logo */}
            <div className="flex items-center justify-center h-24 relative z-20">
                <div className={`flex items-center gap-3 transition-all duration-300 ${isCollapsed ? 'justify-center' : 'px-6 w-full'}`}>
                    {/* Logo Icon */}
                    <div className="relative flex-shrink-0 w-12 h-12 flex items-center justify-center">
                        <img
                            src="/logo_setukpa.png"
                            alt="Logo Setukpa"
                            className="w-full h-full object-contain"
                        />
                    </div>

                    {/* Logo Text */}
                    <div className={`flex flex-col transition-all duration-300 overflow-hidden ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                        <span className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 tracking-tight leading-none font-sans">SETUKPA</span>
                        <span className="text-[10px] font-bold text-gray-400 tracking-[0.2em] uppercase leading-none mt-1.5">Digital System</span>
                    </div>
                </div>
            </div>

            {/* Toggle Button */}
            {/* Toggle Button */}
            <button
                onClick={toggleSidebar}
                aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                className="absolute -right-3 top-28 bg-white text-gray-400 hover:text-blue-600 p-1.5 rounded-full shadow-md hover:shadow-lg transition-all duration-200 z-50 border border-gray-100 group"
            >
                {isCollapsed ?
                    <ChevronRightIcon className="w-4 h-4 group-hover:scale-110 transition-transform" /> :
                    <ChevronLeftIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                }
            </button>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto no-scrollbar">
                {renderNavLinks()}
            </nav>


            {/* Footer / Logout */}
            <div className="p-4 mt-auto border-t border-gray-50 bg-gray-50/50">
                <button
                    onClick={() => {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        window.location.href = '/#/login';
                    }}
                    className={`w-full flex items-center px-3 py-3 text-gray-500 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all duration-200 group ${isCollapsed ? 'justify-center' : ''}`}
                    title="Logout"
                    aria-label="Logout"
                >
                    <LogoutIcon className={`h-6 w-6 flex-shrink-0 ${isCollapsed ? '' : 'mr-3'} transition-colors`} />
                    <span className={`font-semibold text-sm whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
                        Logout
                    </span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;