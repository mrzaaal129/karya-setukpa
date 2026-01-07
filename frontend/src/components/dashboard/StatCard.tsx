import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: number | string;
    icon: LucideIcon;
    color?: 'blue' | 'green' | 'yellow' | 'purple' | 'indigo' | 'amber' | 'emerald' | 'rose' | 'teal';
    trend?: {
        value: number;
        isPositive: boolean;
    };
    description?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color = 'blue', trend, description }) => {
    // Single Unified Theme: White Background, Navy Text, Gradient Accents
    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="group relative rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 bg-white border border-gray-100 overflow-hidden"
        >
            {/* Elegant Background Gradient Mesh */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-900/5 to-transparent rounded-bl-[100px] -mr-8 -mt-8 z-0 transition-transform duration-500 group-hover:scale-110" />

            {/* LARGE WATERMARK LOGO */}
            {/* This meets the user's request for a better background logo design */}
            <div className="absolute -bottom-6 -right-6 z-0 opacity-[0.03] group-hover:opacity-[0.07] transition-all duration-500 transform rotate-12 group-hover:rotate-0 group-hover:scale-110">
                <Icon size={180} className="text-[#1E3A8A]" />
            </div>

            <div className="relative z-10 flex justify-between items-start">
                <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 font-sans">
                        {title}
                    </h3>
                    <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-3xl font-extrabold text-[#1E3A8A] tracking-tight">
                            {value}
                        </span>
                    </div>
                    {description && (
                        <p className="text-xs text-gray-500 mt-1 font-medium border-l-2 border-blue-900/20 pl-2">
                            {description}
                        </p>
                    )}
                </div>

                {/* Foreground Icon Badge */}
                <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1E3A8A] to-[#112255] shadow-lg shadow-blue-900/20 group-hover:scale-110 transition-transform duration-300">
                    <Icon size={20} className="text-white" />
                </div>
            </div>

            {trend && (
                <div className="relative z-10 mt-4 flex items-center text-xs font-semibold bg-gray-50/50 w-fit px-2 py-1 rounded-lg border border-gray-100">
                    <span className={`mr-1 ${trend.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {trend.isPositive ? '↑' : '↓'} {trend.value}%
                    </span>
                    <span className="text-gray-400">vs bulan lalu</span>
                </div>
            )}
        </motion.div>
    );
};

export default StatCard;
