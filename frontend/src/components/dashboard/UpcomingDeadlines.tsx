import React from 'react';
import { Clock, Calendar, ArrowRight, AlertCircle, BookOpen } from 'lucide-react';

interface Deadline {
    assignmentTitle: string;
    chapterTitle: string;
    deadline: string;
    daysLeft: number;
}

interface UpcomingDeadlinesProps {
    deadlines: Deadline[];
}

const UpcomingDeadlines: React.FC<UpcomingDeadlinesProps> = ({ deadlines }) => {
    return (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 h-fit font-sans">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                    <Clock size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-800 leading-tight">Timeline Tugas</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Pantau deadline terbaru</p>
                </div>
            </div>

            <div className="space-y-4">
                {deadlines.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Clock className="text-gray-300" size={32} />
                        </div>
                        <p className="text-gray-500 text-sm font-medium">Semua tugas aman!</p>
                        <p className="text-gray-400 text-xs mt-1">Tidak ada deadline dalam waktu dekat.</p>
                    </div>
                ) : (
                    deadlines.map((deadline, index) => {
                        const isUrgent = deadline.daysLeft < 3;
                        const isSoon = deadline.daysLeft >= 3 && deadline.daysLeft < 7;

                        return (
                            <div
                                key={index}
                                className="group bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className={`px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1
                                        ${deadline.daysLeft < 0 ? 'bg-gray-100 text-gray-500' :
                                            isUrgent ? 'bg-red-50 text-red-600' :
                                                isSoon ? 'bg-amber-50 text-amber-600' :
                                                    'bg-emerald-50 text-emerald-600'}
                                    `}>
                                        <AlertCircle size={10} />
                                        {deadline.daysLeft < 0 ? 'SELESAI' : `${deadline.daysLeft} HARI LAGI`}
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <h4 className="font-bold text-gray-800 text-sm mb-1 group-hover:text-blue-600 transition-colors">
                                        {deadline.chapterTitle}
                                    </h4>
                                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                        <BookOpen size={12} />
                                        <span className="truncate max-w-[180px]">{deadline.assignmentTitle}</span>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-gray-50 flex items-center justify-between">
                                    <span className="text-xs text-gray-400 font-medium">
                                        {new Date(deadline.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                    </span>
                                    {deadline.daysLeft >= 0 && (
                                        <button className="text-blue-600 text-xs font-bold flex items-center gap-1 hover:gap-2 transition-all">
                                            Kerjakan <ArrowRight size={12} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default UpcomingDeadlines;
