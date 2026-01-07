
import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

const dataSubmission = [
    { name: 'Sen', value: 12 },
    { name: 'Sel', value: 19 },
    { name: 'Rab', value: 8 },
    { name: 'Kam', value: 24 },
    { name: 'Jum', value: 15 },
    { name: 'Sab', value: 5 },
    { name: 'Min', value: 2 },
];

const dataGrades = [
    { name: 'A (Sangat Baik)', value: 35, color: '#10B981' }, // Emerald
    { name: 'B (Baik)', value: 45, color: '#3B82F6' }, // Blue
    { name: 'C (Cukup)', value: 15, color: '#F59E0B' }, // Amber
    { name: 'D (Kurang)', value: 5, color: '#EF4444' }, // Red
];

export const SubmissionChart = () => {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dataSubmission} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.3} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94A3B8', fontSize: 12 }}
                    dy={10}
                />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94A3B8', fontSize: 12 }}
                />
                <Tooltip
                    cursor={{ fill: '#F1F5F9' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar
                    dataKey="value"
                    fill="url(#colorBar)"
                    radius={[6, 6, 0, 0]}
                    barSize={32}
                />
            </BarChart>
        </ResponsiveContainer>
    );
};

export const GradeDistributionChart = () => {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={dataGrades}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                >
                    {dataGrades.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                    ))}
                </Pie>
                <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                {/* Custom Legend logic can be handled in parent or here if simple */}
            </PieChart>
        </ResponsiveContainer>
    );
};
