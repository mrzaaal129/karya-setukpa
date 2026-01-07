import React, { useState, useEffect } from 'react';
import { ChapterSchedule, PaperStructure } from '../types';
import { CalendarIcon, ClockIcon, LockIcon, UnlockIcon, CheckCircleIcon } from './icons';

interface ChapterScheduleManagerProps {
    assignmentId: string;
    templateStructure: PaperStructure[];
    schedules: ChapterSchedule[];
    onSchedulesChange: (schedules: ChapterSchedule[]) => void;
}

const ChapterScheduleManager: React.FC<ChapterScheduleManagerProps> = ({
    assignmentId,
    templateStructure,
    schedules,
    onSchedulesChange
}) => {
    const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
    const [tempSchedule, setTempSchedule] = useState<Partial<ChapterSchedule>>({});

    // Initialize schedules for all chapters if not exists
    useEffect(() => {
        const existingChapterIds = new Set(schedules.map(s => s.chapterId));
        const newSchedules: ChapterSchedule[] = [];

        templateStructure.forEach((chapter, index) => {
            if (!existingChapterIds.has(chapter.id)) {
                newSchedules.push({
                    id: `schedule-${Date.now()}-${index}`,
                    assignmentId,
                    chapterId: chapter.id,
                    chapterTitle: chapter.title,
                    chapterOrder: index + 1,
                    isOpen: false,
                    isManuallyOpened: false,
                    isManuallyClosed: false,
                });
            }
        });

        if (newSchedules.length > 0) {
            onSchedulesChange([...schedules, ...newSchedules]);
        }
    }, [templateStructure, schedules, assignmentId, onSchedulesChange]);

    const getScheduleForChapter = (chapterId: string): ChapterSchedule | undefined => {
        return schedules.find(s => s.chapterId === chapterId);
    };

    const isChapterOpen = (schedule: ChapterSchedule): boolean => {
        if (schedule.isManuallyOpened) return true;
        if (schedule.isManuallyClosed) return false;

        if (!schedule.openDate) return false;

        const now = new Date();
        const openDate = new Date(schedule.openDate);
        const closeDate = schedule.closeDate ? new Date(schedule.closeDate) : null;

        return now >= openDate && (!closeDate || now <= closeDate);
    };

    const handleToggleManualOpen = (chapterId: string) => {
        const updatedSchedules = schedules.map(s => {
            if (s.chapterId === chapterId) {
                return {
                    ...s,
                    isManuallyOpened: !s.isManuallyOpened,
                    isManuallyClosed: false,
                    isOpen: !s.isManuallyOpened,
                };
            }
            return s;
        });
        onSchedulesChange(updatedSchedules);
    };

    const handleToggleManualClose = (chapterId: string) => {
        const updatedSchedules = schedules.map(s => {
            if (s.chapterId === chapterId) {
                return {
                    ...s,
                    isManuallyClosed: !s.isManuallyClosed,
                    isManuallyOpened: false,
                    isOpen: !s.isManuallyClosed,
                };
            }
            return s;
        });
        onSchedulesChange(updatedSchedules);
    };

    const handleEditSchedule = (chapterId: string) => {
        const schedule = getScheduleForChapter(chapterId);
        if (schedule) {
            setEditingChapterId(chapterId);
            setTempSchedule({
                openDate: schedule.openDate,
                closeDate: schedule.closeDate,
            });
        }
    };

    const handleSaveSchedule = () => {
        if (!editingChapterId) return;

        const updatedSchedules = schedules.map(s => {
            if (s.chapterId === editingChapterId) {
                return {
                    ...s,
                    openDate: tempSchedule.openDate,
                    closeDate: tempSchedule.closeDate,
                    updatedAt: new Date().toISOString(),
                };
            }
            return s;
        });

        onSchedulesChange(updatedSchedules);
        setEditingChapterId(null);
        setTempSchedule({});
    };

    const handleCancelEdit = () => {
        setEditingChapterId(null);
        setTempSchedule({});
    };

    const getDaysUntil = (dateString?: string): number | null => {
        if (!dateString) return null;
        const targetDate = new Date(dateString);
        const now = new Date();
        const diffTime = targetDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    return (
        <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-bold text-blue-900 mb-2">📅 Jadwal Pembukaan Bab</h3>
                <p className="text-sm text-blue-700">
                    Atur kapan setiap bab dibuka untuk siswa. Anda dapat mengatur tanggal otomatis atau membuka/menutup secara manual.
                </p>
            </div>

            {templateStructure.map((chapter, index) => {
                const schedule = getScheduleForChapter(chapter.id);
                if (!schedule) return null;

                const isOpen = isChapterOpen(schedule);
                const isEditing = editingChapterId === chapter.id;
                const daysUntilOpen = getDaysUntil(schedule.openDate);
                const daysUntilClose = getDaysUntil(schedule.closeDate);

                return (
                    <div
                        key={chapter.id}
                        className={`border-2 rounded-lg p-4 ${isOpen
                            ? 'border-green-300 bg-green-50'
                            : 'border-gray-300 bg-white'
                            }`}
                    >
                        {/* Chapter Header */}
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-lg font-bold text-gray-900">
                                        {index + 1}. {chapter.title}
                                    </span>
                                    {isOpen ? (
                                        <span className="px-2 py-0.5 text-xs font-bold bg-green-500 text-white rounded-full flex items-center gap-1">
                                            <UnlockIcon className="w-3 h-3" />
                                            TERBUKA
                                        </span>
                                    ) : (
                                        <span className="px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full flex items-center gap-1">
                                            <LockIcon className="w-3 h-3" />
                                            TERKUNCI
                                        </span>
                                    )}
                                    {schedule.isManuallyOpened && (
                                        <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                                            Manual Override
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-600">Min: {chapter.minWords} kata</p>
                            </div>
                        </div>

                        {/* Schedule Info */}
                        {!isEditing ? (
                            <div className="space-y-2 mb-3">
                                <div className="flex items-center gap-2 text-sm">
                                    <CalendarIcon className="w-4 h-4 text-gray-500" />
                                    <span className="font-semibold text-gray-700">Dibuka:</span>
                                    {schedule.openDate ? (
                                        <span className="text-gray-900">
                                            {new Date(schedule.openDate).toLocaleString('id-ID')}
                                            {daysUntilOpen !== null && daysUntilOpen > 0 && (
                                                <span className="ml-2 text-blue-600">({daysUntilOpen} hari lagi)</span>
                                            )}
                                        </span>
                                    ) : (
                                        <span className="text-gray-400 italic">Belum diatur</span>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 text-sm">
                                    <ClockIcon className="w-4 h-4 text-gray-500" />
                                    <span className="font-semibold text-gray-700">Ditutup:</span>
                                    {schedule.closeDate ? (
                                        <span className="text-gray-900">
                                            {new Date(schedule.closeDate).toLocaleString('id-ID')}
                                            {daysUntilClose !== null && daysUntilClose > 0 && (
                                                <span className="ml-2 text-orange-600">({daysUntilClose} hari lagi)</span>
                                            )}
                                        </span>
                                    ) : (
                                        <span className="text-gray-400 italic">Tidak ada deadline</span>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3 mb-3 bg-gray-50 p-3 rounded border border-gray-200">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Tanggal Dibuka *
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={tempSchedule.openDate || ''}
                                        onChange={(e) => setTempSchedule({ ...tempSchedule, openDate: e.target.value })}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Tutup
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={tempSchedule.closeDate || ''}
                                        onChange={(e) => setTempSchedule({ ...tempSchedule, closeDate: e.target.value })}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Kosongkan jika tidak ada deadline</p>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            {!isEditing ? (
                                <>
                                    <button
                                        onClick={() => handleEditSchedule(chapter.id)}
                                        className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
                                    >
                                        📅 Atur Jadwal
                                    </button>
                                    <button
                                        onClick={() => handleToggleManualOpen(chapter.id)}
                                        className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${schedule.isManuallyOpened
                                            ? 'text-orange-700 bg-orange-100 hover:bg-orange-200'
                                            : 'text-green-700 bg-green-100 hover:bg-green-200'
                                            }`}
                                    >
                                        {schedule.isManuallyOpened ? '🔒 Tutup Paksa' : '🔓 Buka Paksa'}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={handleSaveSchedule}
                                        className="px-3 py-1.5 text-xs font-semibold text-white bg-green-600 rounded hover:bg-green-700 transition-colors flex items-center gap-1"
                                    >
                                        <CheckCircleIcon className="w-3 h-3" />
                                        Simpan
                                    </button>
                                    <button
                                        onClick={handleCancelEdit}
                                        className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                                    >
                                        Batal
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ChapterScheduleManager;
