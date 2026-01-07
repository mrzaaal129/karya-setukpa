import React from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp } from 'lucide-react';

interface DailyGoalsProps {
    targetWords: number;
    currentWords: number;
    streak: number;
}

const DailyGoals: React.FC<DailyGoalsProps> = ({ targetWords = 200, currentWords = 0, streak = 0 }) => {
    const percentage = Math.min((currentWords / targetWords) * 100, 100);

    return (
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl shadow-lg shadow-indigo-200/40 p-5 text-white">
            {/* Subtle texture */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>

            <div className="flex items-center gap-3 relative z-10 mb-3">
                <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm shadow-inner border border-white/10">
                    <Target size={18} className="text-white" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-white tracking-wide">Target Harian</h3>
                    <p className="text-[10px] text-indigo-100/90 font-medium">Capai targetmu</p>
                </div>
            </div>

            <div className="relative z-10 my-2">
                <div className="flex items-end gap-1.5 mb-2">
                    <span className="text-2xl font-black tracking-tight">{currentWords}</span>
                    <span className="text-xs text-indigo-100 mb-1 font-medium opacity-80">/ {targetWords} kata</span>
                </div>

                <div className="w-full bg-black/20 rounded-full h-2 overflow-hidden shadow-inner">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.6)]"
                    />
                </div>
            </div>

            <div className="relative z-10 pt-3 border-t border-white/10 flex justify-between items-center">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/5">
                    <TrendingUp size={14} className="text-amber-300" />
                    <span className="text-[11px] font-semibold text-white">{streak} Hari Streak</span>
                </div>
                <span className="text-xs font-bold text-white">{percentage.toFixed(0)}% Selesai</span>
            </div>
        </div>
    );
};

export default DailyGoals;
