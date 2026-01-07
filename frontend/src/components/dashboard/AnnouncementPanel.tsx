import React from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle2, FileText, ArrowRight, Upload, Calendar, AlertTriangle, ChevronRight } from 'lucide-react';
import { differenceInDays } from 'date-fns';

import { useNavigate } from 'react-router-dom';

interface Announcement {
    id: string;
    title: string;
    subject: string;
    type: 'TUGAS' | 'PENGUMUMAN' | 'REVISI';
    deadline?: string;
    rawDeadline?: string;
    status?: 'Belum Dikumpul' | 'Menunggu Dinilai' | 'Perlu Revisi' | 'Selesai';
    priority?: 'High' | 'Normal';
    description: string;
}

const MOCK_ANNOUNCEMENTS: Announcement[] = [
    {
        id: '1',
        title: 'Bab 1: Pendahuluan',
        subject: 'Karna Tulis Ilmiah',
        type: 'TUGAS',
        deadline: '24 Jan 2025',
        rawDeadline: '2025-01-24',
        status: 'Belum Dikumpul',
        priority: 'High',
        description: 'Latar belakang masalah dan rumusan tujuan.'
    },
    {
        id: '2',
        title: 'Bab 2: Landasan Teori',
        subject: 'Karna Tulis Ilmiah',
        type: 'TUGAS',
        deadline: '30 Jan 2025',
        rawDeadline: '2025-01-30',
        status: 'Belum Dikumpul',
        priority: 'Normal',
        description: 'Tinjauan pustaka dan kerangka berpikir.'
    },
    {
        id: '3',
        title: 'Revisi Metodologi',
        subject: 'Pembimbingan',
        type: 'REVISI',
        deadline: 'Besok',
        status: 'Perlu Revisi',
        priority: 'High',
        description: 'Perbaiki sampling method sesuai arahan.'
    }
];

interface AnnouncementPanelProps {
    announcements?: any[];
}

const AnnouncementPanel: React.FC<AnnouncementPanelProps> = ({ announcements = [] }) => {
    const navigate = useNavigate();
    // Merge or use mock if empty for demo purposes (BUT if integrated, use real data)
    // To ensure "sorted" look even with mock data if real data is empty:
    const displayData = announcements.length > 0 ? announcements : MOCK_ANNOUNCEMENTS;

    const getDaysLeft = (dateString?: string) => {
        if (!dateString) return null;
        const diff = differenceInDays(new Date(dateString), new Date());
        if (diff < 0) return 'Terlewat';
        if (diff === 0) return 'Hari Ini';
        if (diff === 1) return 'Besok';
        return `${diff} Hari Lagi`;
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'TUGAS': return { bg: 'bg-blue-600', icon: <Upload size={16} /> };
            case 'REVISI': return { bg: 'bg-orange-500', icon: <AlertTriangle size={16} /> };
            default: return { bg: 'bg-indigo-500', icon: <Calendar size={16} /> };
        }
    };

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-6 px-1">
                <div>
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-600 tracking-tight">
                        Agenda & Tugas
                    </h2>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">Timeline pengerjaan bab dan revisi</p>
                </div>
                <button
                    onClick={() => navigate('/assignments')}
                    className="text-xs font-bold text-gray-400 hover:text-blue-600 transition-colors flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-full"
                >
                    Lihat Kalender <ChevronRight size={14} />
                </button>
            </div>

            {/* Horizontal Carousel with Clean Premium Feel */}
            <div className="flex overflow-x-auto pb-8 gap-5 snap-x snap-mandatory scroll-smooth hide-scrollbar -mx-4 px-4">
                {displayData.map((item, index) => {
                    const daysLeft = getDaysLeft(item.rawDeadline);
                    const typeStyle = getTypeColor(item.type);
                    const isUrgent = item.priority === 'High' && (daysLeft === 'Besok' || daysLeft === 'Hari Ini' || daysLeft === 'Terlewat');

                    return (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1, duration: 0.4 }}
                            className={`min-w-[280px] md:min-w-[320px] max-w-[320px] snap-center rounded-[24px] p-1 
                                bg-white border border-gray-100
                                shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] 
                                hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.12)] hover:-translate-y-1 hover:border-blue-100
                                transition-all duration-300 group h-[260px] relative flex flex-col`}
                        >
                            <div className="relative z-10 p-5 h-full flex flex-col justify-between">
                                {/* Top: Badge & Days Left */}
                                <div className="flex justify-between items-start">
                                    <div className={`shadow-md shadow-blue-500/10 text-white p-2.5 rounded-2xl ${typeStyle.bg} flex items-center justify-center`}>
                                        {typeStyle.icon}
                                    </div>

                                    {daysLeft && (
                                        <div className={`px-3 py-1.5 rounded-full text-[10px] font-bold border
                                            ${isUrgent ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                            {daysLeft}
                                        </div>
                                    )}
                                </div>

                                {/* Middle: Content */}
                                <div className="mt-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400">
                                            {item.subject}
                                        </span>
                                        {item.priority === 'High' && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" title="Prioritas Tinggi" />
                                        )}
                                    </div>

                                    <h3 className="text-lg font-bold text-gray-800 leading-snug mb-2 line-clamp-2 min-h-[3.5rem] group-hover:text-blue-600 transition-colors">
                                        {item.title}
                                    </h3>

                                    <p className="text-xs text-gray-500 font-medium leading-relaxed line-clamp-2">
                                        {item.description}
                                    </p>
                                </div>

                                {/* Bottom: Action */}
                                <div className="pt-4 mt-2 border-t border-gray-50 flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-gray-400 font-medium">Deadline</span>
                                        <span className="text-xs font-bold text-gray-700">{item.deadline || '-'}</span>
                                    </div>

                                    <button
                                        onClick={() => navigate('/assignments')}
                                        className={`
                                        pl-4 pr-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2
                                        ${item.status === 'Selesai'
                                                ? 'bg-emerald-50 text-emerald-600 cursor-default'
                                                : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 group-hover:pl-5'}
                                    `}>
                                        {item.status === 'Selesai' ? 'Selesai' : 'Kumpulkan'}
                                        {item.status !== 'Selesai' && <ArrowRight size={14} />}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            <style>{`
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
};

export default AnnouncementPanel;
