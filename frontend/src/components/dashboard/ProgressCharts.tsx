import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { Activity, PieChart as PieChartIcon } from 'lucide-react';

interface ProgressChartsProps {
    weeklyData?: Array<{ day: string; words: number }>;
    statusData?: Array<{ name: string; value: number }>;
}

// Global brand colors - aligned with Setukpa theme but modernized
const COLORS = {
    primary: '#4F46E5', // Indigo 600
    primaryLight: '#818CF8', // Indigo 400
    secondary: '#8B5CF6', // Violet 500
    success: '#10B981', // Emerald 500
    warning: '#F59E0B', // Amber 500
    slate: '#64748B', // Slate 500
    background: '#F8FAFC' // Slate 50
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white px-4 py-3 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] border border-gray-100 ring-1 ring-gray-50"
            >
                <p className="font-semibold text-gray-700 text-sm mb-1">{label}</p>
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-6 rounded-full bg-indigo-500"></div>
                    <p className="text-xl font-bold text-gray-900">
                        {payload[0].value} <span className="text-xs font-medium text-gray-400">kata</span>
                    </p>
                </div>
            </motion.div>
        );
    }
    return null;
};

const ProgressCharts: React.FC<ProgressChartsProps> = ({ weeklyData, statusData }) => {
    // 1. Prepare Data
    const rawWeeklyData = (weeklyData && weeklyData.length > 0) ? weeklyData : [
        { day: 'Sen', words: 0 },
        { day: 'Sel', words: 0 },
        { day: 'Rab', words: 0 },
        { day: 'Kam', words: 0 },
        { day: 'Jum', words: 0 },
        { day: 'Sab', words: 0 },
        { day: 'Min', words: 0 }
    ];

    // Determine max value to set background height
    const maxVal = Math.max(...rawWeeklyData.map(d => d.words));
    const backgroundHeight = maxVal > 0 ? maxVal * 1.2 : 100;

    // Merge for one data source
    const chartData = rawWeeklyData.map(d => ({
        ...d,
        background: backgroundHeight,
    }));

    const defaultStatusData = statusData && statusData.length > 0 && statusData.some(d => d.value > 0) ? statusData : [
        { name: 'Aktif', value: 0 },
        { name: 'Revisi', value: 0 },
        { name: 'Selesai', value: 0 }
    ];

    // Status colors
    const pieColors = [COLORS.primary, COLORS.warning, COLORS.success];
    const totalTasks = defaultStatusData.reduce((acc, curr) => acc + curr.value, 0);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Activity */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100/50"
            >
                <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-100/50 text-indigo-600">
                            <Activity size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 text-lg">Aktivitas Mingguan</h3>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">Produktivitas menulis 7 hari terakhir</p>
                        </div>
                    </div>
                </div>

                <div className="h-[240px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} barSize={28} barGap={-28}>
                            <XAxis
                                dataKey="day"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 500 }}
                                dy={10}
                            />
                            <YAxis hide />
                            <Tooltip
                                content={<CustomTooltip />}
                                cursor={{ fill: 'transparent' }}
                            />
                            {/* 1. Background Bar (Rendered First = Behind) */}
                            <Bar
                                dataKey="background"
                                fill="#F1F5F9"
                                radius={[8, 8, 8, 8]}
                                xAxisId={0}
                                isAnimationActive={false}
                            />
                            {/* 2. Actual Data Bar (Rendered Second = On Top) */}
                            <Bar
                                dataKey="words"
                                radius={[8, 8, 8, 8]}
                                xAxisId={0}
                                animationDuration={1000}
                                animationBegin={200}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill="url(#barGradient)"
                                        className="hover:opacity-90 transition-opacity cursor-pointer"
                                    />
                                ))}
                            </Bar>
                            <defs>
                                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#6366F1" />
                                    <stop offset="100%" stopColor="#4F46E5" />
                                </linearGradient>
                            </defs>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            {/* Status Overview */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100/50"
            >
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100/50 text-emerald-600">
                            <PieChartIcon size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 text-lg">Status Tugas</h3>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">Ringkasan keseluruhan</p>
                        </div>
                    </div>
                    {totalTasks > 0 && (
                        <span className="px-3 py-1 rounded-full bg-gray-50 text-xs font-semibold text-gray-600 border border-gray-100">
                            {totalTasks} Total
                        </span>
                    )}
                </div>

                <div className="relative h-[240px] flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={defaultStatusData}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={90}
                                paddingAngle={5}
                                dataKey="value"
                                cornerRadius={6}
                            >
                                {defaultStatusData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={pieColors[index % pieColors.length]}
                                        strokeWidth={0}
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -5px rgba(0,0,0,0.1)' }}
                                itemStyle={{ fontWeight: 600, color: '#374151' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>

                    {/* Center Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-3xl font-bold text-gray-800">{totalTasks}</span>
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-widest mt-1">Tugas</span>
                    </div>
                </div>

                <div className="flex justify-center gap-6 mt-2">
                    {defaultStatusData.map((item, index) => (
                        <div key={item.name} className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded-full shadow-sm"
                                style={{ backgroundColor: pieColors[index % pieColors.length] }}
                            />
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">{item.name}</span>
                                <span className="text-sm font-bold text-gray-700">{item.value}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

export default ProgressCharts;
