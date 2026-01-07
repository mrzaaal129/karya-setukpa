
import React from 'react';


interface RubricItemProps {
    label: string;
    score: number;
    max: number;
    color?: 'blue' | 'indigo' | 'purple' | 'pink' | 'emerald' | 'amber' | 'rose';
}

const RubricItem: React.FC<RubricItemProps> = ({ label, score, max, color = 'blue' }) => {
    const percentage = (score / max) * 100;

    const colorMap = {
        blue: 'bg-blue-600 text-blue-700',
        indigo: 'bg-indigo-600 text-indigo-700',
        purple: 'bg-purple-600 text-purple-700',
        pink: 'bg-pink-600 text-pink-700',
        emerald: 'bg-emerald-600 text-emerald-700',
        amber: 'bg-amber-600 text-amber-700',
        rose: 'bg-rose-600 text-rose-700',
    };

    const activeColor = colorMap[color] || colorMap['blue'];
    const [bgClass, textClass] = activeColor.split(' ');

    return (
        <div>
            <div className="flex justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">{label}</span>
                <span className={`text-sm font-bold ${textClass}`}>{score}/{max}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner">
                <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${bgClass}`}
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
};

export default RubricItem;