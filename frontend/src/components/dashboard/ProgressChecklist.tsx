import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, LockKeyhole, FileEdit, Timer, AlertOctagon, BookOpen, ChevronRight, BarChart3 } from 'lucide-react';

interface Chapter {
    title: string;
    progress: number;
    status: 'LOCKED' | 'DRAFT' | 'REVIEW' | 'REVISION' | 'APPROVED';
}

interface Assignment {
    id: string;
    title: string;
    chapters: Chapter[];
}

interface ProgressChecklistProps {
    assignments: Assignment[];
}

const ProgressChecklist: React.FC<ProgressChecklistProps> = ({ assignments }) => {

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return {
                    bg: 'bg-emerald-500',
                    lightBg: 'bg-emerald-50',
                    text: 'text-emerald-700',
                    border: 'border-emerald-200',
                    shadow: 'shadow-emerald-200',
                    icon: CheckCircle2,
                    label: 'Selesai'
                };
            case 'REVIEW':
                return {
                    bg: 'bg-blue-500',
                    lightBg: 'bg-blue-50',
                    text: 'text-blue-700',
                    border: 'border-blue-200',
                    shadow: 'shadow-blue-200',
                    icon: Timer,
                    label: 'Review'
                };
            case 'REVISION':
                return {
                    bg: 'bg-rose-500',
                    lightBg: 'bg-rose-50',
                    text: 'text-rose-700',
                    border: 'border-rose-200',
                    shadow: 'shadow-rose-200',
                    icon: AlertOctagon,
                    label: 'Revisi'
                };
            case 'DRAFT':
                return {
                    bg: 'bg-violet-500',
                    lightBg: 'bg-violet-50',
                    text: 'text-violet-700',
                    border: 'border-violet-200',
                    shadow: 'shadow-violet-200',
                    icon: FileEdit,
                    label: 'Draft'
                };
            default:
                return {
                    bg: 'bg-slate-300',
                    lightBg: 'bg-slate-50',
                    text: 'text-slate-400',
                    border: 'border-slate-100',
                    shadow: 'shadow-slate-100',
                    icon: LockKeyhole,
                    label: 'Terkunci'
                };
        }
    };

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-6 px-1">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
                        Progress Pengerjaan
                    </h2>
                    <p className="text-xs text-gray-400 font-medium mt-1">Pantau kelengkapan setiap bab karya tulis Anda</p>
                </div>
            </div>

            {assignments.map((assignment) => (
                <div key={assignment.id} className="bg-white rounded-[24px] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden">
                    {/* Header with Stats - Clean Blue Theme */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 relative overflow-hidden">
                        <div className="relative z-10 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/20 shadow-inner">
                                    <BookOpen size={24} className="text-white" />
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-blue-100 uppercase tracking-widest block mb-1">Karya Tulis Ilmiah</span>
                                    <h3 className="text-lg font-bold text-white tracking-wide leading-tight max-w-md">{assignment.title}</h3>
                                </div>
                            </div>

                            {/* Overall Progress Circle */}
                            <div className="flex items-center gap-3 bg-white/10 px-4 py-2.5 rounded-full border border-white/20 backdrop-blur-sm shadow-sm">
                                <span className="text-xs font-medium text-blue-50">Total Progress</span>
                                <div className="h-4 w-[1px] bg-white/20"></div>
                                <span className="text-sm font-bold text-white">
                                    {Math.round(assignment.chapters.reduce((acc, curr) => acc + curr.progress, 0) / (assignment.chapters.length || 1))}%
                                </span>
                            </div>
                        </div>

                        {/* Soft, Clean Background Decor */}
                        <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
                        <div className="absolute left-0 bottom-0 w-48 h-48 bg-indigo-500/30 rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/2" />
                    </div>

                    {/* Chapters Grid */}
                    <div className="p-6 bg-gray-50/30">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {assignment.chapters.map((chapter, index) => {
                                const config = getStatusConfig(chapter.status);
                                const StatusIcon = config.icon;

                                return (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="group relative bg-white border border-gray-100 rounded-2xl p-4 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 hover:border-blue-100"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`
                                                    w-10 h-10 flex flex-shrink-0 items-center justify-center 
                                                    rounded-xl transition-transform duration-300 group-hover:scale-105
                                                    ${config.lightBg} ${config.text}
                                                `}>
                                                    <StatusIcon size={20} strokeWidth={2} />
                                                </div>
                                                <div>
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                                                        BAB {index + 1}
                                                    </span>
                                                    <h4 className="font-bold text-gray-800 text-sm group-hover:text-blue-600 transition-colors line-clamp-1">
                                                        {chapter.title}
                                                    </h4>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between items-end">
                                                <span className={`
                                                    text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wide
                                                    ${config.text} bg-white border ${config.border}
                                                `}>
                                                    {config.label}
                                                </span>
                                                <span className="text-xs font-bold text-gray-500">{chapter.progress}%</span>
                                            </div>

                                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${chapter.progress}%` }}
                                                    transition={{ duration: 1, ease: "easeOut" }}
                                                    className={`h-full ${config.bg} rounded-full`}
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ProgressChecklist;
