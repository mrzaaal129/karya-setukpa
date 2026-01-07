import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, MessageSquare, AlertCircle, FileText, Clock, BellRing, ArrowUpRight } from 'lucide-react';

interface Activity {
    id: string;
    type: 'APPROVAL' | 'REVISION_REQUESTED' | 'COMMENT';
    title: string;
    message: string;
    author: string;
    authorRole: string;
    paperTitle: string;
    timeAgo: string;
}

interface ActivityFeedProps {
    activities: Activity[];
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => {

    // Use real data
    const displayActivities = activities;

    const getStyle = (type: string) => {
        switch (type) {
            case 'APPROVAL':
                return {
                    icon: <CheckCircle2 size={16} className="text-white" />,
                    bg: 'bg-emerald-500',
                    border: 'border-emerald-100',
                    lightBg: 'bg-emerald-50',
                    text: 'text-emerald-700'
                };
            case 'REVISION_REQUESTED':
                return {
                    icon: <AlertCircle size={16} className="text-white" />,
                    bg: 'bg-rose-500',
                    border: 'border-rose-100',
                    lightBg: 'bg-rose-50',
                    text: 'text-rose-700'
                };
            default:
                return {
                    icon: <MessageSquare size={16} className="text-white" />,
                    bg: 'bg-blue-500',
                    border: 'border-blue-100',
                    lightBg: 'bg-blue-50',
                    text: 'text-blue-700'
                };
        }
    };

    return (
        <div className="w-full">
            {/* Component Header (Hidden or Minimal) - Assuming dashboard handles the main title, 
                but adding a small one here just in case, or we can make it part of the flow */}

            <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden p-6 relative">
                {/* Decorative background blur */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mt-10" />

                <div className=" mb-6 flex justify-between items-center relative z-10">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <BellRing size={20} className="text-blue-600" />
                            Aktivitas & Notifikasi
                        </h3>
                        {/* <p className="text-xs text-gray-400 mt-1">Update terbaru dari dosen pembimbing</p>  */}
                    </div>
                    {/* <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full">
                        {displayActivities.length} Baru
                    </span> */}
                </div>

                <div className="relative space-y-0 relative z-10 pl-2">
                    {/* Continuous Vertical Line */}
                    <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-gray-100 -z-0" />

                    {displayActivities.map((activity, index) => {
                        const style = getStyle(activity.type);

                        return (
                            <motion.div
                                key={activity.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="relative flex gap-4 pb-8 last:pb-0 group"
                            >
                                {/* Timeline Node */}
                                <div className={`
                                    relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-md
                                    ${style.bg} ring-4 ring-white transition-transform duration-300 group-hover:scale-110
                                `}>
                                    {style.icon}
                                </div>

                                {/* Content Card */}
                                <div className="flex-1 min-w-0 pt-0.5">
                                    <div className={`
                                        bg-white group-hover:bg-gray-50 border border-gray-100 group-hover:border-blue-100 
                                        rounded-2xl p-4 transition-all duration-300 relative
                                    `}>
                                        {/* Connector Arrow (Optional visual detail) */}
                                        {/* <div className="absolute top-4 -left-1.5 w-3 h-3 bg-white border-l border-b border-gray-100 transform rotate-45 group-hover:bg-gray-50 group-hover:border-blue-100 transition-colors" /> */}

                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-sm text-gray-800 group-hover:text-blue-600 transition-colors">
                                                {activity.title}
                                            </h4>
                                            <span className="text-[10px] font-medium text-gray-400 flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded-full">
                                                <Clock size={10} /> {activity.timeAgo}
                                            </span>
                                        </div>

                                        <p className="text-xs text-gray-500 leading-relaxed mb-3">
                                            "{activity.message}"
                                        </p>

                                        <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-1">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-600">
                                                    {activity.author.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold text-gray-700">{activity.author}</span>
                                                    <span className="text-[9px] text-gray-400">{activity.authorRole}</span>
                                                </div>
                                            </div>

                                            <div className={`px-2 py-1 rounded text-[10px] font-bold ${style.lightBg} ${style.text}`}>
                                                {activity.paperTitle}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default ActivityFeed;
