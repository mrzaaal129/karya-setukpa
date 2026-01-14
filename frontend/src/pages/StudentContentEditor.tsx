import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Editor } from '@tinymce/tinymce-react';
import api from '../services/api';
import { Save, CheckCircle, Clock, Lock, FileText, ChevronRight, AlertTriangle, Download, Send, MessageSquare, X, Edit2 } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { useSystem } from '../contexts/SystemContext'; // Import useSystem
import ViolationHistoryModal from '../components/ViolationHistoryModal'; // Import Modal

interface Chapter {
    id: string; // This might be the template structure ID or generated ID
    title: string;
    minWords: number;
    content?: string;
    status: 'LOCKED' | 'OPEN' | 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REVISION';
    startDate?: string;
    endDate?: string;
    feedback?: string;
    feedbackHistory?: { status: string; feedback: string; updatedAt: string | Date; updatedBy: string }[];
    wordCount?: number;
}

const StudentContentEditor: React.FC = () => {
    const { id } = useParams<{ id: string }>(); // Paper ID
    const navigate = useNavigate();
    const editorRef = useRef<any>(null);
    const [editorInstance, setEditorInstance] = useState<any>(null); // Track editor instance for effects

    const [paper, setPaper] = useState<any>(null);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);
    const [content, setContent] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [wordCount, setWordCount] = useState(0);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [showFeedbackPanel, setShowFeedbackPanel] = useState(true); // Default open if revision

    // Feature Switch: Allow HELPER to bypass all protections
    // We need to fetch current user context to know role
    // Assuming context provides it, or we decode token. 
    // For now, let's assume we can check role from storage or context.
    // Ideally use useAuth() context if available.
    // Let's rely on localStorage or similar for immediate check if context not easily available here.
    const userRole = JSON.parse(localStorage.getItem('user') || '{}').role;
    const isHelper = userRole === 'HELPER';

    // System Settings Enforcement
    // If HELPER, we FORCE disable protections
    const { violationThreshold, enableCopyPasteProtection: systemEnableCPP, enableViolationDetection: systemEnableVD, loading: systemLoading } = useSystem();

    const enableCopyPasteProtection = isHelper ? false : systemEnableCPP;
    const enableViolationDetection = isHelper ? false : systemEnableVD;

    const [violationCount, setViolationCount] = useState(0);
    const [isViolationLocked, setIsViolationLocked] = useState(false);
    const [violationHistory, setViolationHistory] = useState<any[]>([]);
    const [showViolationModal, setShowViolationModal] = useState(false);

    // Title Enforcement State
    const [showTitleModal, setShowTitleModal] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [isTitleSaving, setIsTitleSaving] = useState(false);

    useEffect(() => {
        fetchViolations();
    }, []);

    // Check title on paper load
    useEffect(() => {
        if (paper) {
            // Check if title is default or empty
            // Default usually matches Assignment Title if auto-generated, or "Untitled Paper"
            const assignmentTitle = paper.Assignment?.title || '';
            const currentTitle = paper.title || '';

            const isDefaultTitle =
                !currentTitle ||
                currentTitle.trim() === '' ||
                currentTitle === 'Untitled Paper' ||
                (assignmentTitle && currentTitle.trim().toLowerCase() === assignmentTitle.trim().toLowerCase());

            if (isDefaultTitle) {
                setShowTitleModal(true);
                setNewTitle(currentTitle);
            }
        }
    }, [paper]);

    const fetchViolations = async () => {
        try {
            const res = await api.get('/violations/my');
            const data = res.data;
            setViolationHistory(data);

            // Fix: Only count UNRESOLVED violations for the lock mechanism
            const activeViolations = data.filter((v: any) => !v.resolved);
            setViolationCount(activeViolations.length);

            // Only check lock if system settings are loaded
            if (!systemLoading && activeViolations.length >= violationThreshold) {
                setIsViolationLocked(true);
                setShowViolationModal(true);
            }
        } catch (error) {
            console.error("Failed to fetch violations:", error);
        }
    };

    // Additional effect to check lock when systemLoading finishes
    useEffect(() => {
        if (!systemLoading && violationCount >= violationThreshold && violationThreshold > 0) {
            setIsViolationLocked(true);
        }
    }, [systemLoading, violationCount, violationThreshold]);

    useEffect(() => {
        fetchPaper();
    }, [id]);

    // Violation Detection
    // Old Violation Detection Block Removed - Replaced by logic with enableViolationDetection check below
    // Remove old useEffect block if it exists or ensure it's replaced by the one above
    // The previous chunk replaced the handleViolation definition AND the useEffect following it (which was the load content one? No wait)

    // START CHECK: The target content for the first chunk covers handleViolation definition down to the start of the next useEffect.
    // The Violation Detection useEffect (lines 49-77 in original view) is BEFORE handleViolation (lines 79-108).
    // I need to be careful. Code structure:
    // 1. useEffect (fetchPaper)
    // 2. useEffect (Violation Detection) -> Lines 49-77
    // 3. handleViolation definition -> Lines 79-108

    // My first chunk TargetContent started at handleViolation. So I missed updating the useEffect BEFORE it.
    // I need to update the useEffect at lines 49-77 as well.
    // Or I can delete the old useEffect and put the new one after handleViolation (cleaner).

    // Let's Retry the chunks.


    const handleViolation = useCallback(async (reason: string) => {
        // Prevent violations if system is still loading settings
        if (systemLoading) return;

        // Optimistic update (safe because we strictly add)
        const newCount = violationCount + 1;
        setViolationCount(newCount);

        // Save to Database
        try {
            const res = await api.post('/violations', {
                type: reason,
                description: `Violation detected in Editor.`
            });
            // Update history with new record
            setViolationHistory(prev => [res.data, ...prev]);
        } catch (error) {
            console.error("Failed to save violation:", error);
        }

        // Show Modal
        setShowViolationModal(true);

        if (newCount >= violationThreshold) {
            setIsViolationLocked(true);
        }
    }, [violationCount, violationThreshold, systemLoading]);

    // 2. Violation Detection Effect
    useEffect(() => {
        // Condition:
        // 1. Violation locked? Don't track more.
        // 2. Chapters empty? Don't track.
        // 3. FEATURE SWITCH: enableViolationDetection must be TRUE.
        if (isViolationLocked || chapters.length === 0 || !enableViolationDetection) return;

        console.log("🛡️ Violation Detection ACTIVE for Chapter:", activeChapterIndex);

        const handleVisibilityChange = () => {
            if (document.hidden) {
                console.log("👀 Tab hidden detected!");
                handleViolation("Tab disembunyikan / Pindah Aplikasi");
            }
        };

        const handleBlur = () => {
            // Check if focus moved to an iframe (like TinyMCE)
            if (document.activeElement && document.activeElement.tagName === 'IFRAME') {
                console.log("Variabel focus moved to iframe - Ignoring violation.");
                return;
            }

            console.log("💨 Window blur detected!");
            handleViolation("Focus hilang dari browser");
        };

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = '';
        }

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("blur", handleBlur);
        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            console.log("🛡️ Removing Violation Listeners");
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("blur", handleBlur);
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [isViolationLocked, activeChapterIndex, chapters.length, handleViolation, enableViolationDetection]);


    // Dynamic Copy/Paste Protection Effect
    useEffect(() => {
        if (!editorInstance) return;

        const handleKeydown = (e: any) => {
            if ((e.ctrlKey || e.metaKey) && (['c', 'v', 'x', 'a'].includes(e.key.toLowerCase()))) {
                e.preventDefault();
                e.stopPropagation();
                toast.error('Fitur Copy/Paste/Select All dinonaktifkan oleh Admin', { id: 'cp-protect-key' });
                handleViolation("Percobaan Copy/Paste (Keyboard)");
            }
        };

        const handleCutCopyPaste = (e: any) => {
            e.preventDefault();
            e.stopPropagation();
            toast.error('Fitur Copy/Paste dinonaktifkan', { id: 'cp-protect-mouse' });
            handleViolation("Percobaan Copy/Paste (Menu/Mouse)");
        };

        const handleContextMenu = (e: any) => {
            e.preventDefault();
            toast.error('Klik Kanan dinonaktifkan', { id: 'context-protect' });
        };

        // This handles "Paste as Plain Text" or native browser pastes that slip through
        const handlePastePreProcess = (e: any) => {
            e.preventDefault();
            e.content = '';
            handleViolation("Percobaan Paste Paksa");
        };

        if (enableCopyPasteProtection) {
            console.log("🛡️ Enabling Copy/Paste Protection");
            editorInstance.on('keydown', handleKeydown);
            editorInstance.on('cut copy paste', handleCutCopyPaste);
            editorInstance.on('contextmenu', handleContextMenu);
            editorInstance.on('PastePreProcess', handlePastePreProcess);
        } else {
            console.log("🔓 Disabling Copy/Paste Protection");
            editorInstance.off('keydown', handleKeydown);
            editorInstance.off('cut copy paste', handleCutCopyPaste);
            editorInstance.off('contextmenu', handleContextMenu);
            editorInstance.off('PastePreProcess', handlePastePreProcess);
        }

        return () => {
            editorInstance.off('keydown', handleKeydown);
            editorInstance.off('cut copy paste', handleCutCopyPaste);
            editorInstance.off('contextmenu', handleContextMenu);
            editorInstance.off('PastePreProcess', handlePastePreProcess);
        };
    }, [editorInstance, enableCopyPasteProtection, handleViolation]);


    // Dynamic Copy/Paste Protection Effect
    useEffect(() => {
        if (!editorInstance) return;

        const handleKeydown = (e: any) => {
            if ((e.ctrlKey || e.metaKey) && (['c', 'v', 'x', 'a'].includes(e.key.toLowerCase()))) {
                e.preventDefault();
                e.stopPropagation();
                toast.error('Fitur Copy/Paste/Select All dinonaktifkan oleh Admin', { id: 'cp-protect-key' });
                handleViolation("Percobaan Copy/Paste (Keyboard)");
            }
        };

        const handleCutCopyPaste = (e: any) => {
            e.preventDefault();
            e.stopPropagation();
            toast.error('Fitur Copy/Paste dinonaktifkan', { id: 'cp-protect-mouse' });
            handleViolation("Percobaan Copy/Paste (Menu/Mouse)");
        };

        const handleContextMenu = (e: any) => {
            e.preventDefault();
            toast.error('Klik Kanan dinonaktifkan', { id: 'context-protect' });
        };

        // This handles "Paste as Plain Text" or native browser pastes that slip through
        const handlePastePreProcess = (e: any) => {
            e.preventDefault();
            e.content = '';
            handleViolation("Percobaan Paste Paksa");
        };

        if (enableCopyPasteProtection) {
            console.log("🛡️ Enabling Copy/Paste Protection");
            editorInstance.on('keydown', handleKeydown);
            editorInstance.on('cut copy paste', handleCutCopyPaste);
            editorInstance.on('contextmenu', handleContextMenu);
            editorInstance.on('PastePreProcess', handlePastePreProcess);
        } else {
            console.log("🔓 Disabling Copy/Paste Protection");
            editorInstance.off('keydown', handleKeydown);
            editorInstance.off('cut copy paste', handleCutCopyPaste);
            editorInstance.off('contextmenu', handleContextMenu);
            editorInstance.off('PastePreProcess', handlePastePreProcess);
        }

        return () => {
            editorInstance.off('keydown', handleKeydown);
            editorInstance.off('cut copy paste', handleCutCopyPaste);
            editorInstance.off('contextmenu', handleContextMenu);
            editorInstance.off('PastePreProcess', handlePastePreProcess);
        };
    }, [editorInstance, enableCopyPasteProtection, handleViolation]);

    useEffect(() => {
        // When active chapter changes, load its content
        if (chapters.length > 0 && chapters[activeChapterIndex]) {
            const chapterContent = chapters[activeChapterIndex].content || '';
            setContent(chapterContent);

            // Calculate initial word count
            if (chapterContent) {
                const text = chapterContent.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
                const words = text.trim().split(/\s+/).filter(word => word.length > 0);
                setWordCount(words.length);
            } else {
                setWordCount(0);
            }
        }
    }, [activeChapterIndex, chapters]);

    const fetchPaper = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/papers/${id}`);
            // Log to debug exact structure
            console.log('API Response:', response.data);

            // Backend returns { paper: { ... } }, so we need to extract it
            const paperData = response.data.paper || response.data;

            setPaper(paperData);

            // Merge structure with schedules and existing content
            // Logic:
            // 1. Get structure from paper.structure (which initially copies template)
            // 2. Get schedules from Paper > Assignment > ChapterSchedule
            // 3. Determine status (LOCKED vs OPEN) based on dates

            let structure = paperData.structure || [];

            // Ensure structure is an array (handle double-serialized JSON strings)
            if (typeof structure === 'string') {
                try {
                    structure = JSON.parse(structure);
                } catch (e) {
                    console.error("Failed to parse paper structure string:", e);
                    structure = [];
                }
            }

            const schedules = paperData.Assignment?.ChapterSchedule || [];
            const now = new Date();

            if (!Array.isArray(structure)) {
                // Should not happen if parsing worked, but safe fallback
                structure = [];
            }

            const mergedChapters = structure.map((ch: any) => {
                // Try to find schedule by ID first, then by normalized Title
                const schedule = schedules.find((s: any) =>
                    (ch.id && s.chapterId === ch.id) ||
                    (s.chapterTitle && ch.title && s.chapterTitle.trim().toLowerCase() === ch.title.trim().toLowerCase())
                );

                let status: Chapter['status'] = 'LOCKED'; // Default strict
                let startStr = '';
                let endStr = '';

                if (schedule) {
                    // Start Date Logic: Schedule > Assignment > Now
                    const rawStart = schedule.startDate || schedule.openDate || paperData.Assignment?.activationDate;
                    const rawEnd = schedule.endDate || schedule.closeDate || paperData.Assignment?.deadline;

                    // If we have valid dates, check them
                    if (rawStart && rawEnd) {
                        const start = new Date(rawStart);
                        const end = new Date(rawEnd);
                        startStr = rawStart;
                        endStr = rawEnd;

                        // 1. Admin Force Close (Master Switch OFF)
                        if (schedule.isOpen === false) {
                            status = 'LOCKED';
                        }
                        // 2. Check Range
                        else {
                            if (now >= start && now <= end) {
                                status = 'OPEN';
                            } else {
                                status = 'LOCKED';
                            }
                        }
                    } else {
                        // If no dates even after fallback? Open if isOpen is true
                        if (schedule.isOpen === false) {
                            status = 'LOCKED';
                        } else {
                            status = 'OPEN';
                        }
                    }
                } else {
                    // No specific schedule found?
                    // Fallback to Assignment Dates directly
                    const rawStart = paperData.Assignment?.activationDate;
                    const rawEnd = paperData.Assignment?.deadline;

                    if (rawStart && rawEnd) {
                        const start = new Date(rawStart);
                        const end = new Date(rawEnd);
                        startStr = rawStart;
                        endStr = rawEnd;

                        if (now >= start && now <= end) {
                            status = 'OPEN';
                        } else {
                            status = 'LOCKED';
                        }
                    } else {
                        // No schedule AND no assignment dates? Default Open.
                        status = 'OPEN';
                    }
                }

                // Internal status override (e.g. SUBMITTED)
                if (ch.status) {
                    // Standard override logic
                    // Allow REVISION/APPROVED even if schedule is closed (LOCKED)
                    if (status === 'LOCKED' && ch.status !== 'APPROVED' && ch.status !== 'REVISION') {
                        // Window closed takes precedence unless Approved or Revision
                    } else {
                        status = ch.status === 'LOCKED' ? status : ch.status;
                    }
                }

                // If OPEN and has content -> DRAFT
                if (status === 'OPEN' && ch.content && ch.content.length > 0) {
                    status = 'DRAFT';
                }

                return {
                    ...ch,
                    status,
                    startDate: startStr,
                    endDate: endStr
                };
            });

            setChapters(mergedChapters);

        } catch (error: any) {
            console.error('Error fetching paper:', error);
            if (error.response && error.response.status === 404) {
                setPaper(null); // Explicitly set null to indicate not found
                toast.error('Paper tidak ditemukan.');
            } else {
                toast.error('Gagal mengambil data paper');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleEditorChange = (content: string, editor: any) => {
        setContent(content);

        // Get word count with fallback
        try {
            if (editor && editor.plugins && editor.plugins.wordcount) {
                const count = editor.plugins.wordcount.body.getWordCount();
                setWordCount(count);
            } else {
                // Fallback: count words manually
                const text = content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
                const words = text.trim().split(/\s+/).filter(word => word.length > 0);
                setWordCount(words.length);
            }
        } catch (error) {
            console.error('Error getting word count:', error);
            // Fallback: count words manually
            const text = content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
            const words = text.trim().split(/\s+/).filter(word => word.length > 0);
            setWordCount(words.length);
        }
    };

    const handleSubmitChapter = async () => {
        // Validation: Check for Advisor
        if (!paper?.User?.pembimbingId) {
            toast.error('Gagal: Anda belum memiliki Pembimbing. Hubungi admin untuk assignment pembimbing.', {
                duration: 5000,
                icon: '🚫'
            });
            return;
        }

        // Validation: Min words
        if (activeChapter?.minWords && wordCount < activeChapter.minWords) {
            toast.error(`Jumlah kata belum mencukupi. Minimal ${activeChapter.minWords} kata.`);
            return;
        }

        if (!confirm('Apakah Anda yakin ingin mengirimkan bab ini ke Pembimbing? Anda tidak dapat mengeditnya lagi setelah dikirim.')) {
            return;
        }

        setSaving(true);
        setSaveStatus('idle');
        try {
            const updatedChapters = [...chapters];
            updatedChapters[activeChapterIndex] = {
                ...updatedChapters[activeChapterIndex],
                content: content,
                wordCount: wordCount,
                status: 'SUBMITTED' // Mark as submitted
            };

            setChapters(updatedChapters);

            // Save to backend
            await api.put(`/papers/${id}`, {
                structure: updatedChapters,
                wordCount: updatedChapters.reduce((acc, ch) => acc + (ch.wordCount || 0), 0),
                contentApprovalStatus: 'SUBMITTED'
            });

            toast.success('✅ Bab berhasil dikirim ke Pembimbing!', {
                duration: 4000,
                position: 'top-center'
            });
            setSaveStatus('success');

        } catch (error) {
            console.error('Error submitting:', error);
            setSaveStatus('error');
            toast.error('Gagal mengirim ke pembimbing.');
        } finally {
            setSaving(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setSaveStatus('idle');
        try {
            const updatedChapters = [...chapters];
            updatedChapters[activeChapterIndex] = {
                ...updatedChapters[activeChapterIndex],
                content: content,
                wordCount: wordCount,
                status: 'DRAFT' // Mark as draft on save
            };

            setChapters(updatedChapters); // Optimistic update

            // Save to backend
            await api.put(`/papers/${id}`, {
                structure: updatedChapters,
                wordCount: updatedChapters.reduce((acc, ch) => acc + (ch.wordCount || 0), 0)
            });

            setSaveStatus('success');
            toast.success('✅ Draft berhasil disimpan!', {
                duration: 3000,
                position: 'top-center',
                style: {
                    background: '#10B981',
                    color: '#fff',
                    fontWeight: 'bold',
                    padding: '16px',
                    fontSize: '14px'
                }
            });

            // Auto hide success status after 3 seconds
            setTimeout(() => setSaveStatus('idle'), 3000);
        } catch (error) {
            console.error('Error saving:', error);
            setSaveStatus('error');
            toast.error('❌ Gagal menyimpan draft. Silakan coba lagi.', {
                duration: 4000,
                position: 'top-center',
                style: {
                    background: '#EF4444',
                    color: '#fff',
                    fontWeight: 'bold',
                    padding: '16px',
                    fontSize: '14px'
                }
            });
        } finally {
            setSaving(false);
        }
    };





    const handleDownloadChapter = async (chapter: Chapter, index: number) => {
        try {
            toast.loading('Membuat PDF...', { id: 'pdf-download' });

            const response = await api.get(`/papers/${id}/chapter/${index}/pdf`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${paper?.title || 'paper'}_${chapter.title}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.success('PDF berhasil didownload!', { id: 'pdf-download' });
        } catch (error) {
            console.error('Error downloading PDF:', error);
            toast.error('Gagal download PDF', { id: 'pdf-download' });
        }
    };

    const handleUpdateTitle = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim() || newTitle === 'Untitled Paper') {
            toast.error('Silakan masukkan judul yang valid.');
            return;
        }

        setIsTitleSaving(true);
        try {
            // We reuse the update paper endpoint to just update the title
            await api.put(`/papers/${id}`, { title: newTitle });

            // Update local state
            setPaper((prev: any) => ({ ...prev, title: newTitle }));
            setShowTitleModal(false);
            toast.success('Judul berhasil disimpan!');
        } catch (error) {
            console.error('Failed to update title:', error);
            toast.error('Gagal menyimpan judul.');
        } finally {
            setIsTitleSaving(false);
        }
    };

    const activeChapter = chapters[activeChapterIndex];
    const isLocked = activeChapter?.status === 'LOCKED' && !isHelper;
    // User request: "ketika tugas... diberi nilai... siswa tidak dapat merubahnnya"
    // Check if paper has a grade (from Examiner) or Final Grade (Advisor)
    const isGraded = ((paper?.grade !== null && paper?.grade !== undefined) || (paper?.Grade?.finalScore !== undefined)) && !isHelper;
    const isReadOnly = isLocked || isGraded;

    if (loading) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }

    return (
        <>
            <ViolationHistoryModal
                isOpen={showViolationModal}
                onClose={() => setShowViolationModal(false)}
                violations={violationHistory}
                violationThreshold={violationThreshold}
            />

            {/* Title Enforcement Modal */}
            {showTitleModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-8 text-center animate-in fade-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Selamat Datang!</h2>
                        <p className="text-gray-600 mb-6">
                            Sebelum mulai mengerjakan, silakan masukkan <strong>Judul Karya Tulis</strong> Anda terlebih dahulu.
                            Judul ini akan digunakan untuk keperluan Laporan dan Ujian.
                        </p>

                        <form onSubmit={handleUpdateTitle} className="space-y-4">
                            <div>
                                <label className="block text-left text-sm font-medium text-gray-700 mb-1">Judul Karya Tulis</label>
                                <textarea
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none"
                                    rows={3}
                                    placeholder="Masukkan judul lengkap di sini..."
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isTitleSaving || !newTitle.trim()}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isTitleSaving ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        Menyimpan...
                                    </>
                                ) : (
                                    <>
                                        <Save size={20} />
                                        Simpan Judul & Mulai
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <Toaster />
            <div className="flex h-screen bg-gray-50 overflow-hidden">
                {/* Sidebar */}
                <div className="w-80 bg-white border-r border-gray-200 flex flex-col z-20 shadow-md">
                    <div className="p-4 border-b border-gray-100">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                <FileText size={20} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="font-bold text-gray-800 text-sm leading-tight line-clamp-2">{paper?.title || 'Loading...'}</h1>
                                    <button
                                        onClick={() => {
                                            setNewTitle(paper?.title || '');
                                            setShowTitleModal(true);
                                        }}
                                        className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                                        title="Ubah Judul"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500">Student Paper</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {chapters.map((chapter, index) => (
                            <div
                                key={index}
                                onClick={() => setActiveChapterIndex(index)}
                                className={`p-3 rounded-lg cursor-pointer transition border ${activeChapterIndex === index
                                    ? 'bg-indigo-50 border-indigo-200 shadow-sm'
                                    : 'bg-white border-gray-100 hover:border-indigo-100 hover:shadow-sm'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`text-xs font-bold uppercase tracking-wider ${activeChapterIndex === index ? 'text-indigo-600' : 'text-gray-500'
                                        }`}>
                                        BAB {index + 1}
                                    </span>
                                    {chapter.status === 'LOCKED' && <Lock size={12} className="text-gray-400" />}
                                    {chapter.status === 'APPROVED' && <CheckCircle size={12} className="text-green-500" />}
                                    {chapter.status === 'REVISION' && <AlertTriangle size={12} className="text-orange-500" />}
                                </div>
                                <h4 className={`font-medium text-sm mb-1 ${activeChapterIndex === index ? 'text-indigo-900' : 'text-gray-700'
                                    }`}>
                                    {chapter.title}
                                </h4>
                                <div className="flex justify-between items-center text-xs text-gray-400">
                                    <span>{chapter.wordCount || 0} kata</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${chapter.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                        chapter.status === 'REVISION' ? 'bg-orange-100 text-orange-700' :
                                            chapter.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-700' :
                                                chapter.status === 'LOCKED' ? 'bg-gray-100 text-gray-500' :
                                                    'bg-gray-100 text-gray-600'
                                        }`}>
                                        {chapter.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-4 border-t border-gray-100 bg-gray-50">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-gray-700 py-2"
                        >
                            <ChevronRight className="rotate-180" size={16} />
                            Kembali ke Dashboard
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-w-0 bg-[#F3F2F1]">
                    {/* Header */}
                    <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center shadow-sm z-10">
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">{activeChapter?.title}</h2>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Clock size={12} />
                                <span>Jadwal: {activeChapter?.startDate ? new Date(activeChapter.startDate).toLocaleDateString('id-ID') : '-'} s/d {activeChapter?.endDate ? new Date(activeChapter.endDate).toLocaleDateString('id-ID') : '-'}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => handleDownloadChapter(activeChapter, activeChapterIndex)}
                                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                title="Download PDF"
                            >
                                <Download size={20} />
                            </button>

                            {chapters.length > 0 && chapters.every(ch => ch.status === 'APPROVED') && (
                                <button
                                    onClick={() => navigate(`/student/final-submission/${paper.id}`)}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-sm"
                                >
                                    <CheckCircle size={18} />
                                    Upload Final
                                </button>
                            )}

                            {!isGraded && (
                                <>
                                    <button
                                        onClick={handleSave}
                                        disabled={isReadOnly || saving}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                                    >
                                        <Save size={18} />
                                        {saving ? 'Menyimpan...' : 'Simpan Draft'}
                                    </button>
                                    <button
                                        onClick={activeChapter?.status === 'SUBMITTED' ? async () => {
                                            if (!confirm('Batalkan pengiriman? Status akan kembali menjadi Draft.')) return;

                                            setSaving(true);
                                            try {
                                                const updatedChapters = [...chapters];
                                                updatedChapters[activeChapterIndex] = {
                                                    ...updatedChapters[activeChapterIndex],
                                                    status: 'DRAFT'
                                                };
                                                setChapters(updatedChapters);
                                                await api.put(`/papers/${id}`, {
                                                    structure: updatedChapters,
                                                    wordCount: updatedChapters.reduce((acc, ch) => acc + (ch.wordCount || 0), 0)
                                                });
                                                toast.success('Pengiriman dibatalkan. Status kembali ke Draft.');
                                            } catch (e) {
                                                console.error(e);
                                                toast.error('Gagal membatalkan.');
                                            } finally {
                                                setSaving(false);
                                            }
                                        } : handleSubmitChapter}
                                        disabled={isReadOnly || saving || activeChapter?.status === 'APPROVED'}
                                        className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg transition shadow-sm disabled:opacity-50 disabled:bg-gray-400
                                                                ${activeChapter?.status === 'SUBMITTED'
                                                ? 'bg-red-500 hover:bg-red-600'
                                                : 'bg-indigo-600 hover:bg-indigo-700'}`}
                                        title={activeChapter?.status === 'SUBMITTED' ? "Batalkan pengiriman" : "Kirim ke Pembimbing untuk direview"}
                                    >
                                        <Send size={18} className={activeChapter?.status === 'SUBMITTED' ? "rotate-180" : ""} />
                                        {activeChapter?.status === 'SUBMITTED' ? 'Batalkan Pengiriman' : 'Kirim ke Pembimbing'}
                                    </button>
                                </>
                            )}

                            {isGraded && (
                                <div className="px-3 py-1 bg-gray-100 text-gray-500 rounded text-sm font-medium border border-gray-200 flex items-center gap-1">
                                    <Lock size={14} />
                                    Terkunci (Sudah Dinilai)
                                </div>
                            )}

                            <button
                                onClick={() => setShowFeedbackPanel(!showFeedbackPanel)}
                                className={`p-2 rounded-lg transition-all ${showFeedbackPanel
                                    ? 'bg-blue-100 text-blue-600'
                                    : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
                                title={showFeedbackPanel ? "Sembunyikan Revisi" : "Lihat Revisi & Catatan"}
                            >
                                <MessageSquare size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Split View: Editor + Right Config Panel */}
                    <div className="flex-1 flex overflow-hidden relative">
                        {/* Editor Container */}
                        <div className="flex-1 flex flex-col relative h-full">
                            {(isLocked || (isViolationLocked && !isHelper)) ? (
                                <div className="flex flex-col items-center justify-center p-8 text-center text-gray-500 h-full bg-slate-50">
                                    {isViolationLocked ? (
                                        <>
                                            <div className="p-4 bg-red-100 text-red-600 rounded-full mb-4 animate-pulse">
                                                <AlertTriangle size={48} />
                                            </div>
                                            <h3 className="text-xl font-bold text-red-700 mb-2">AKSES DIKUNCI KARENA PELANGGARAN</h3>
                                            <p className="max-w-md text-red-600 mb-6">
                                                Anda terdeteksi melakukan aktivitas mencurigakan (pindah tab/aplikasi) melebihi batas {violationThreshold} kali.
                                            </p>
                                            <button
                                                onClick={() => window.location.reload()}
                                                className="px-6 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 shadow-lg"
                                            >
                                                Hubungi Pengawas / Refresh
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <Lock size={48} className="mb-4 text-gray-300" />
                                            <h3 className="text-lg font-medium text-gray-700 mb-2">Akses Terkunci</h3>
                                            <p>Bagian ini hanya dapat diedit pada jadwal yang ditentukan.</p>
                                            {activeChapter?.startDate && (
                                                <p className="mt-2 text-sm bg-gray-100 px-3 py-1 rounded-full">
                                                    Jadwal: {new Date(activeChapter.startDate).toLocaleDateString('id-ID')} s/d {new Date(activeChapter.endDate).toLocaleDateString('id-ID')}
                                                </p>
                                            )}
                                        </>
                                    )}
                                </div>
                            ) : (
                                <Editor
                                    tinymceScriptSrc='/tinymce/tinymce.min.js'
                                    licenseKey='gpl'
                                    // Key removed to prevent remounting on setting change
                                    onInit={(evt, editor) => {
                                        editorRef.current = editor;
                                        setEditorInstance(editor);
                                    }}
                                    value={content}
                                    onEditorChange={handleEditorChange}
                                    disabled={isGraded}

                                    init={{
                                        base_url: '/tinymce',
                                        suffix: '.min',
                                        height: "100%",
                                        menubar: true,
                                        toolbar_sticky: true,
                                        plugins: [
                                            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                                            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                                            'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount', 'pagebreak'
                                        ],
                                        toolbar: 'undo redo | fontfamily fontsize | blocks | ' +
                                            'bold italic forecolor | alignleft aligncenter ' +
                                            'alignright alignjustify | bullist numlist outdent indent | ' +
                                            'table | removeformat | help',
                                        font_family_formats: 'Times New Roman=times new roman,times,serif;Arial=arial,helvetica,sans-serif;Verdana=verdana,geneva;Tahoma=tahoma,sans-serif',
                                        font_size_formats: '8pt 10pt 11pt 12pt 14pt 16pt 18pt 24pt 36pt',
                                        content_style: `
                                            html { background-color: #F3F2F1; height: 100%; padding: 20px 0; cursor: text; }
                                            body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; margin: 0 auto 2rem auto; padding: 2.54cm !important; width: 210mm !important; max-width: 210mm !important; min-height: 297mm; background-color: white; box-shadow: 0 4px 8px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06); overflow-x: hidden; }
                                            ::-webkit-scrollbar { width: 10px; }
                                            ::-webkit-scrollbar-track { background: #E0E0E0; }
                                            ::-webkit-scrollbar-thumb { background: #BDBDBD; border-radius: 5px; }
                                            ::-webkit-scrollbar-thumb:hover { background: #9E9E9E; }
                                        `,
                                        setup: (editor) => {
                                            editor.on('init', () => {
                                                const doc = editor.getDoc();
                                                doc.documentElement.addEventListener('click', (e: any) => {
                                                    if (e.target === doc.documentElement) { editor.focus(); }
                                                });

                                                // Copy/Paste Protection Logic
                                                if (enableCopyPasteProtection) {
                                                    // Block Keyboard Shortcuts
                                                    editor.on('keydown', (e: any) => {
                                                        if ((e.ctrlKey || e.metaKey) && (['c', 'v', 'x', 'a'].includes(e.key.toLowerCase()))) {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            toast.error('Fitur Copy/Paste/Select All dinonaktifkan oleh Admin', { id: 'cp-protect' });
                                                            handleViolation("Percobaan Copy/Paste (Keyboard)");
                                                        }
                                                    });

                                                    // Block Menu Actions
                                                    editor.on('cut copy paste', (e: any) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        toast.error('Fitur Copy/Paste dinonaktifkan', { id: 'cp-protect' });
                                                        handleViolation("Percobaan Copy/Paste (Menu/Mouse)");
                                                    });

                                                    // Block Context Menu
                                                    editor.on('contextmenu', (e: any) => {
                                                        e.preventDefault();
                                                        toast.error('Klik Kanan dinonaktifkan', { id: 'context-protect' });
                                                    });

                                                    // Extra layer: Paste Preprocess (for edge cases)
                                                    editor.on('PastePreProcess', (e: any) => {
                                                        e.preventDefault();
                                                        e.content = ''; // Clear content
                                                        handleViolation("Percobaan Paste Paksa");
                                                    });
                                                }
                                            });
                                        }
                                    }}
                                />
                            )}
                        </div>

                        {/* Right Sidebar - Feedback & History */}
                        {showFeedbackPanel && (
                            <div className="w-80 bg-white border-l border-gray-200 shadow-xl z-20 flex flex-col h-full right-0 top-0 overflow-hidden">
                                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                    <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                        <MessageSquare size={16} />
                                        Catatan & Revisi
                                    </h3>
                                    <button onClick={() => setShowFeedbackPanel(false)} className="text-gray-400 hover:text-gray-600">
                                        <X size={18} />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                                    {(activeChapter?.status === 'REVISION' || paper?.contentApprovalStatus === 'REVISION') ? (
                                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 shadow-sm">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="p-1.5 bg-orange-100 rounded-lg text-orange-600">
                                                    <AlertTriangle size={18} />
                                                </div>
                                                <span className="font-bold text-orange-900 text-sm">Perlu Revisi</span>
                                                <span className="text-[10px] ml-auto font-bold px-2 py-0.5 bg-white text-orange-600 rounded-full border border-orange-100">Wajib</span>
                                            </div>
                                            <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                                                {activeChapter?.feedback || paper?.contentFeedback || 'Silakan perbaiki bab ini sesuai arahan.'}
                                            </div>
                                            <div className="mt-3 pt-3 border-t border-orange-200/50 flex items-center gap-1.5 text-xs text-orange-700 font-medium">
                                                <Clock size={12} /> Segera perbaiki
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-400">
                                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <CheckCircle size={24} className="text-gray-300" />
                                            </div>
                                            <p className="text-sm">Tidak ada revisi aktif saat ini.</p>
                                        </div>
                                    )}

                                    {activeChapter?.feedbackHistory && activeChapter.feedbackHistory.length > 0 && (
                                        <div>
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Riwayat</h4>
                                            <div className="space-y-4">
                                                {[...activeChapter.feedbackHistory].reverse().map((item, idx) => (
                                                    <div key={idx} className="flex gap-3 text-sm relative">
                                                        {idx !== activeChapter.feedbackHistory!.length - 1 && (
                                                            <div className="absolute left-[5px] top-2 bottom-[-16px] w-px bg-gray-200"></div>
                                                        )}
                                                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5 z-10 ${item.status === 'APPROVED' ? 'bg-green-500 ring-4 ring-green-50' : 'bg-orange-400 ring-4 ring-orange-50'}`}></div>
                                                        <div className="flex-1 pb-1">
                                                            <div className="flex justify-between items-start mb-1">
                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                                    {item.status === 'APPROVED' ? 'DISETUJUI' : 'REVISI'}
                                                                </span>
                                                                <span className="text-[10px] text-gray-400">
                                                                    {new Date(item.updatedAt).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}
                                                                </span>
                                                            </div>
                                                            <div className="bg-gray-50 rounded-lg p-3 text-gray-600 text-sm border border-gray-100">
                                                                {item.feedback || '-'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default StudentContentEditor;
