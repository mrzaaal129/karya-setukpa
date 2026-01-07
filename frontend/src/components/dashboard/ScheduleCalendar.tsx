import React, { useState } from 'react';
import Calendar from 'react-calendar';
import { differenceInDays, format, isWithinInterval, isBefore, isAfter } from 'date-fns';
import { id } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Lock, Unlock } from 'lucide-react';
import 'react-calendar/dist/Calendar.css';

interface Deadline {
    date: Date;
    title: string;
    chapter: string;
    daysLeft: number;
    assignmentTitle?: string;
    chapterTitle?: string;
    deadline?: string;
    startDate?: Date;
    chapterId?: number; // Added chapterId
}

interface ScheduleCalendarProps {
    deadlines?: Deadline[];
}

const ScheduleCalendar: React.FC<ScheduleCalendarProps> = ({ deadlines = [] }) => {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    // Sort logic for upcoming (future openings)
    const upcomingOpenings = deadlines
        .filter(d => d.startDate && isAfter(new Date(d.startDate), new Date()))
        .sort((a, b) => (a.startDate && b.startDate) ? a.startDate.getTime() - b.startDate.getTime() : 0)
        .slice(0, 5);

    const getDeadlinesForDate = (date: Date) => {
        return deadlines.filter(d =>
            d.date.toDateString() === date.toDateString() ||
            (d.startDate && d.startDate.toDateString() === date.toDateString())
        );
    };

    const tileClassName = ({ date, view }: any) => {
        if (view === 'month') {
            const dateDeadlines = getDeadlinesForDate(date);
            if (dateDeadlines.length > 0) {
                return 'highlight-event';
            }
        }
        return null;
    };

    const getStatus = (start?: Date, end?: Date, referenceDate: Date = new Date()) => {
        if (!start || !end) return { text: 'Terjadwal', color: 'bg-gray-100 text-gray-600' };

        // Normalize dates to start of day for accurate comparison
        const ref = new Date(referenceDate);
        ref.setHours(0, 0, 0, 0);

        const s = new Date(start);
        s.setHours(0, 0, 0, 0);

        const e = new Date(end);
        e.setHours(23, 59, 59, 999); // End of day for deadline

        if (isWithinInterval(ref, { start: s, end: e })) {
            return { text: 'Terbuka', color: 'bg-green-100 text-green-700' };
        } else if (isBefore(ref, s)) {
            return { text: 'Belum Mulai', color: 'bg-orange-50 text-orange-600' };
        } else {
            return { text: 'Berakhir', color: 'bg-gray-100 text-gray-500' };
        }
    };

    const selectedItems = getDeadlinesForDate(selectedDate);
    const hasSelectedItems = selectedItems.length > 0;

    return (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 font-sans h-full">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-[#1e3a8a] to-[#3b82f6] p-6 text-white flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <CalendarIcon className="w-6 h-6 text-blue-200" />
                        Kalender Akademik
                    </h3>
                </div>
                <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-lg border border-white/20">
                    <span className="text-sm font-semibold">
                        {format(new Date(), 'd MMMM yyyy', { locale: id })}
                    </span>
                </div>
            </div>

            {/* Main Content Vertical Stack */}
            <div className="flex flex-col h-full relative">
                {/* Top: Calendar Widget */}
                <div className="p-4 bg-white">
                    <style>{`
                        .react-calendar {
                            border: none;
                            font-family: 'Inter', sans-serif;
                            width: 100%;
                            background: transparent;
                        }
                        .react-calendar__navigation {
                            margin-bottom: 0.5rem;
                        }
                        .react-calendar__navigation button {
                            min-width: 40px;
                            background: none;
                            font-size: 1rem;
                            font-weight: 700;
                            color: #1f2937;
                            border-radius: 8px;
                        }
                        .react-calendar__navigation button:enabled:hover {
                            background-color: #f3f4f6;
                        }
                        .react-calendar__month-view__weekdays {
                            text-transform: uppercase;
                            font-size: 0.7rem;
                            font-weight: 700;
                            color: #9ca3af;
                            margin-bottom: 0.5rem;
                        }
                        .react-calendar__tile {
                            padding: 0.8rem 0.2rem;
                            font-size: 0.9rem;
                            font-weight: 500;
                            color: #374151;
                            border-radius: 12px;
                            position: relative;
                            transition: all 0.2s;
                        }
                        .react-calendar__tile:enabled:hover {
                            background-color: #f3f4f6;
                        }
                        .react-calendar__tile--now {
                            background: transparent !important;
                            color: #2563eb !important;
                            font-weight: 800;
                        }
                        .react-calendar__tile--active {
                            background: #1e3a8a !important;
                            color: white !important;
                            box-shadow: 0 4px 6px -1px rgba(30, 58, 138, 0.3);
                        }
                        .has-event {
                            background-color: #dbeafe !important;
                            color: #1e40af !important;
                            font-weight: 600;
                        }
                        .has-event:hover {
                            background-color: #bfdbfe !important;
                        }
                        /* FIX: Prevent cursor misalignment */
                        .react-calendar__tile {
                            transform: none !important;
                            margin: 0 !important;
                            z-index: 1;
                        }
                        .react-calendar__tile abbr {
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            width: 100%;
                            height: 100%;
                            pointer-events: none; /* Let clicks pass to button */
                        }
                    `}</style>

                    <Calendar
                        onChange={(value: any) => setSelectedDate(value)}
                        value={selectedDate}
                        tileClassName={({ date, view }: any) => {
                            if (view === 'month') {
                                const hasDeadlines = getDeadlinesForDate(date).length > 0;
                                return hasDeadlines ? 'has-event' : null;
                            }
                            return null;
                        }}
                        prevLabel={<ChevronLeft size={18} className="text-gray-400" />}
                        nextLabel={<ChevronRight size={18} className="text-gray-400" />}
                        prev2Label={null}
                        next2Label={null}
                        prevAriaLabel="Bulan Sebelumnya"
                        nextAriaLabel="Bulan Berikutnya"
                        view="month"
                    />
                </div>

                {/* Date Details Static Card - Below Calendar */}
                <div className="flex-1 bg-gray-50 border-t border-gray-100 p-4 transition-all duration-300 ease-in-out min-h-[180px] flex flex-col">
                    {hasSelectedItems ? (
                        <>
                            <div className="flex justify-between items-center mb-3">
                                <div className="flex items-center gap-2">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                                        {format(selectedDate, 'd MMMM yyyy', { locale: id })}
                                    </h4>
                                    <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                                        {selectedItems.length} Kegiatan
                                    </span>
                                </div>
                                <button
                                    onClick={() => setSelectedDate(new Date())} /* Reset to today or just refresh */
                                    className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded-md transition-colors"
                                    title="Tutup Detail"
                                    aria-label="Tutup Detail"
                                >
                                    <div className="h-4 w-4 flex items-center justify-center font-bold text-xs">x</div>
                                </button>
                            </div>

                            <div className="space-y-2 overflow-y-auto custom-scrollbar pr-1 flex-1 pb-1">
                                {selectedItems.map((item, idx) => {
                                    const status = getStatus(item.startDate, item.date ? new Date(item.date) : undefined);
                                    return (
                                        <div key={idx} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm relative group">
                                            <div className={`absolute top-0 left-0 bottom-0 w-1 rounded-l-xl ${status.color.includes('green') ? 'bg-green-500' : status.color.includes('red') ? 'bg-red-500' : 'bg-blue-500'}`} />

                                            <div className="pl-3">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h3 className="text-xs font-bold text-gray-800 leading-tight">
                                                        {item.title}
                                                    </h3>
                                                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${status.color}`}>
                                                        {status.text}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-gray-500 flex items-center gap-1">
                                                    <Clock size={10} />
                                                    {item.startDate ? format(item.startDate, 'HH:mm', { locale: id }) : '-'} -
                                                    {item.date ? format(item.date, 'HH:mm', { locale: id }) : '-'} WIB
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 text-center space-y-2 opacity-60">
                            <CalendarIcon size={24} />
                            <p className="text-xs">Pilih tanggal untuk melihat detail</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ScheduleCalendar;
