import React, { useState, useEffect } from 'react';
import { ChapterSchedule } from '../types';
import api from '../services/api';

interface ChapterManagementModalProps {
    assignmentId: string;
    assignmentTitle: string;
    onClose: () => void;
}

const ChapterManagementModal: React.FC<ChapterManagementModalProps> = ({
    assignmentId,
    assignmentTitle,
    onClose,
}) => {
    const [chapters, setChapters] = useState<ChapterSchedule[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<{ id: string; openDate: string; closeDate: string } | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchChapters();
    }, [assignmentId]);

    // Helper helpers
    const formatForInput = (isoString?: string) => {
        if (!isoString) return '';
        const d = new Date(isoString);
        // Adjust for local timezone for input value
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 16);
    };

    const handleEditClick = (chapter: ChapterSchedule) => {
        setEditingSchedule({
            id: chapter.id!,
            openDate: formatForInput(chapter.openDate),
            closeDate: formatForInput(chapter.closeDate)
        });
    };

    const handleSaveSchedule = async (chapterId: string) => {
        if (!editingSchedule) return;

        // Validation for Bab III issue
        const start = new Date(editingSchedule.openDate);
        if (editingSchedule.closeDate) {
            const end = new Date(editingSchedule.closeDate);
            if (end <= start) {
                alert('❌ Tanggal Tutup (Deadline) harus setelah Tanggal Buka! \nPastikan jam juga diatur dengan benar.');
                return;
            }
        }

        try {
            setIsSaving(true);
            const payload = {
                openDate: new Date(editingSchedule.openDate).toISOString(),
                closeDate: editingSchedule.closeDate ? new Date(editingSchedule.closeDate).toISOString() : null
            };

            await api.put(`/assignments/chapters/${chapterId}`, payload);

            setChapters(prev => prev.map(ch =>
                ch.id === chapterId ? { ...ch, ...payload } : ch
            ));
            setEditingSchedule(null);
            alert('✅ Jadwal berhasil diperbarui!');
        } catch (err) {
            console.error('Update schedule error:', err);
            alert('❌ Gagal update jadwal');
        } finally {
            setIsSaving(false);
        }
    };

    const fetchChapters = async () => {
        try {
            setIsLoading(true);
            // Fetch Assignment to get Template details + Schedules
            const response = await api.get(`/assignments/${assignmentId}`);
            const data = response.data.assignment || response.data;

            const existingSchedules = data.ChapterSchedule || [];
            let combinedChapters: ChapterSchedule[] = [];

            // Sync with Template (ALL PAGES)
            if (data.PaperTemplate && data.PaperTemplate.pages) {
                const contentPages = Array.isArray(data.PaperTemplate.pages)
                    ? data.PaperTemplate.pages.filter((p: any) => p.structure && Array.isArray(p.structure) && p.structure.length > 0)
                    : [];

                if (contentPages.length > 0) {
                    contentPages.forEach((page: any) => {
                        page.structure.forEach((chapter: any) => {
                            const existing = existingSchedules.find((s: any) =>
                                s.chapterName === chapter.title ||
                                (s.chapterId && s.chapterId === chapter.id)
                            );

                            combinedChapters.push({
                                id: existing?.id, // ID only if exists
                                chapterId: chapter.id,
                                chapterTitle: chapter.title,
                                chapterName: chapter.title, // Legacy compatibility
                                isOpen: existing?.isOpen ?? false,
                                openDate: existing?.openDate,
                                closeDate: existing?.closeDate,
                            });
                        });
                    });
                } else {
                    // Fallback if no structure found
                    combinedChapters = existingSchedules;
                }
            } else {
                combinedChapters = existingSchedules;
            }

            // Helper to parse Roman Numerals
            const getRomanValue = (str: string) => {
                const map: Record<string, number> = {
                    'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5,
                    'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10
                };
                const match = str.match(/\b(I|II|III|IV|V|VI|VII|VIII|IX|X)\b/i);
                return match ? map[match[0].toUpperCase()] : 999;
            };

            // Sort
            combinedChapters.sort((a: any, b: any) => {
                const valA = getRomanValue(a.chapterTitle || a.chapterName || '');
                const valB = getRomanValue(b.chapterTitle || b.chapterName || '');
                if (valA !== valB) return valA - valB;
                return (a.chapterTitle || '').localeCompare(b.chapterTitle || '');
            });

            setChapters(combinedChapters);
        } catch (err: any) {
            console.error('Fetch chapters error:', err);
            setError('Gagal memuat data chapter');
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleChapter = async (chapter: ChapterSchedule) => {
        try {
            setIsSaving(true);
            const newStatus = !chapter.isOpen;

            // Logic: "Buka Paksa" (Force Open)
            const payload: any = { isOpen: newStatus };
            if (newStatus && chapter.openDate) {
                const now = new Date();
                const start = new Date(chapter.openDate);
                if (start > now) {
                    payload.openDate = now.toISOString();
                }
            }

            if (chapter.id) {
                // Existing Schedule -> Update directly
                await api.put(`/assignments/chapters/${chapter.id}`, payload);
                // Update local state
                setChapters(prev =>
                    prev.map(ch =>
                        ch.id === chapter.id ? {
                            ...ch,
                            isOpen: newStatus,
                            openDate: payload.openDate || ch.openDate
                        } : ch
                    )
                );
            } else {
                // New Chapter (from Template) -> Create via Bulk Endpoint
                // We need to send array of schedules to /assignments/:id/schedules
                const newSchedulePayload = {
                    chapterId: chapter.chapterId,
                    chapterTitle: chapter.chapterTitle,
                    isOpen: newStatus,
                    // If opening, ensure date is valid. If closing, default is fine.
                    openDate: payload.openDate || new Date().toISOString(),
                    closeDate: chapter.closeDate || null
                };

                const response = await api.put(`/assignments/${assignmentId}/schedules`, {
                    chapterSchedules: [newSchedulePayload]
                });

                // The response returns "schedules: []", presumably the created ones.
                // Or we can just refresh the list to get the new ID.
                fetchChapters();
            }

        } catch (err: any) {
            console.error('Toggle chapter error:', err);
            alert('❌ Gagal mengubah status chapter');
        } finally {
            setIsSaving(false);
        }
    };


    const handleBulkAction = async (action: 'open-all' | 'close-all') => {
        const confirmMessage = action === 'open-all'
            ? 'Apakah Anda yakin ingin membuka SEMUA chapter?'
            : 'Apakah Anda yakin ingin menutup SEMUA chapter?';

        if (!confirm(confirmMessage)) return;

        try {
            setIsSaving(true);
            const response = await api.put(`/assignments/${assignmentId}/chapters/bulk`, {
                action,
            });
            setChapters(response.data.chapters || []);
            alert(`✅ Berhasil ${action === 'open-all' ? 'membuka' : 'menutup'} semua chapter!`);
        } catch (err: any) {
            console.error('Bulk action error:', err);
            alert('❌ Gagal melakukan bulk action');
        } finally {
            setIsSaving(false);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">Kelola Chapter</h2>
                            <p className="text-sm text-gray-600 mt-1">{assignmentTitle}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {isLoading ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <p className="mt-2 text-gray-600">Memuat data chapter...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12">
                            <p className="text-red-600">{error}</p>
                            <button
                                onClick={fetchChapters}
                                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Coba Lagi
                            </button>
                        </div>
                    ) : chapters.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-600">Tidak ada chapter schedule untuk assignment ini.</p>
                            <p className="text-sm text-gray-500 mt-2">
                                Chapter schedule dibuat saat assignment menggunakan template dengan chapter scheduling.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Bulk Actions */}
                            <div className="flex gap-2 pb-4 border-b border-gray-200">
                                <button
                                    onClick={() => handleBulkAction('open-all')}
                                    disabled={isSaving}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                    </svg>
                                    Buka Semua
                                </button>
                                <button
                                    onClick={() => handleBulkAction('close-all')}
                                    disabled={isSaving}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    Tutup Semua
                                </button>
                            </div>

                            {/* Chapter List */}
                            <div className="space-y-3">
                                {chapters.map((chapter, index) => (
                                    <div
                                        key={chapter.id}
                                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm font-medium text-gray-500">
                                                        #{index + 1}
                                                    </span>
                                                    <h3 className="text-lg font-semibold text-gray-800">
                                                        {chapter.chapterTitle}
                                                    </h3>
                                                    <span
                                                        className={`px-2 py-1 text-xs font-semibold rounded-full ${chapter.isOpen
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-red-100 text-red-700'
                                                            }`}
                                                    >
                                                        {chapter.isOpen ? 'Terbuka' : 'Tertutup'}
                                                    </span>
                                                </div>
                                                <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-gray-600">
                                                    <div>
                                                        <span className="font-medium">Buka:</span>{' '}
                                                        {formatDate(chapter.openDate)}
                                                    </div>
                                                    <div>
                                                        <span className="font-medium">Tutup:</span>{' '}
                                                        {formatDate(chapter.closeDate)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <button
                                                    onClick={() => handleToggleChapter(chapter)}
                                                    disabled={isSaving}
                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${chapter.isOpen ? 'bg-green-600' : 'bg-gray-300'
                                                        }`}
                                                    title={chapter.isOpen ? 'Klik untuk tutup' : 'Klik untuk buka'}
                                                >
                                                    <span
                                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${chapter.isOpen ? 'translate-x-6' : 'translate-x-1'
                                                            }`}
                                                    />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600">
                            Total {chapters.length} chapter | {chapters.filter(c => c.isOpen).length} terbuka
                        </p>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChapterManagementModal;
