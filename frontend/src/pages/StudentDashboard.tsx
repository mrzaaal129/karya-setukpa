import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import WelcomeBanner from '../components/dashboard/WelcomeBanner';
import StatCard from '../components/dashboard/StatCard';
import ProgressCharts from '../components/dashboard/ProgressCharts';
import ScheduleCalendar from '../components/dashboard/ScheduleCalendar';
import AnnouncementPanel from '../components/dashboard/AnnouncementPanel';
import ActivityFeed from '../components/dashboard/ActivityFeed';

import ProgressChecklist from '../components/dashboard/ProgressChecklist';
import DailyGoals from '../components/dashboard/DailyGoals';
import QuickChat from '../components/dashboard/QuickChat';
import { BookOpen, Award, Clock, TrendingUp } from 'lucide-react';
import api from '../services/api';
import { differenceInDays, format } from 'date-fns';
import { id } from 'date-fns/locale';

const StudentDashboard: React.FC = () => {
    const { currentUser } = useUser();
    const [assignments, setAssignments] = useState<any[]>([]);
    const [activities, setActivities] = useState<any[]>([]);
    const [papers, setPapers] = useState<any[]>([]);
    const [stats, setStats] = useState({
        overview: {
            totalSKS: 0,
            ipk: 0,
            rank: '-',
            studyHours: 0,
            completedTasks: 0,
            activeAssignments: 0
        },
        progress: {
            totalWords: 0,
            targetWords: 15000,
            percentComplete: 0,
            weeklyData: [],
            statusData: [],
            streak: 0
        }
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch Assignments for Calendar
                const assignmentsRes = await api.get('/assignments');
                if (assignmentsRes.data && assignmentsRes.data.assignments) {
                    setAssignments(assignmentsRes.data.assignments);
                }

                // Fetch Student Stats
                const statsRes = await api.get('/dashboard/student/stats');
                if (statsRes.data) {
                    const rawStats = statsRes.data;

                    // Transform dailyActivity (number[]) to weeklyData (object[])
                    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']; // Sunday to Saturday
                    const today = new Date().getDay();
                    const weeklyData = (rawStats.progress.dailyActivity || [0, 0, 0, 0, 0, 0, 0]).map((count: number, index: number) => {
                        // dailyActivity usually comes as last 7 days. 
                        // Assuming backend sends [day-6, day-5, ..., today]
                        // We need to map them to day names.
                        // Let's simplified: just map backwards from today.
                        const d = new Date();
                        d.setDate(d.getDate() - (6 - index));
                        return {
                            day: days[d.getDay()],
                            words: count
                        };
                    });

                    // Construct statusData
                    const statusData = [
                        { name: 'Selesai', value: rawStats.overview.completedTasks || 0 },
                        { name: 'Aktif', value: rawStats.overview.activeAssignments || 0 },
                        { name: 'Revisi', value: 0 } // Placeholder or fetch real if available
                    ];

                    setStats({
                        ...rawStats,
                        progress: {
                            ...rawStats.progress,
                            weeklyData,
                            statusData
                        }
                    });
                }

                /* 
                // Activity Feed Removed to save Server Load
                const activitiesRes = await api.get('/dashboard/student/activity-feed');
                if (activitiesRes.data) {
                    setActivities(activitiesRes.data);
                }
                */

                // Fetch Student Papers to check progress
                const papersRes = await api.get('/papers');
                if (papersRes.data && papersRes.data.papers) {
                    setPapers(papersRes.data.papers);
                }

            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    // Transform Assignments AND Chapter Schedules to Calendar Deadlines
    const calendarDeadlines = assignments.flatMap(a => {
        const items = [];

        // 1. Main Assignment Deadline
        if (a.deadline) {
            items.push({
                date: new Date(a.deadline),
                title: a.title,
                chapter: 'Pengumpulan Akhir', // Context
                daysLeft: differenceInDays(new Date(a.deadline), new Date()),
                assignmentTitle: a.title,
                chapterTitle: 'Final Submission',
                deadline: a.deadline
            });
        }

        // 2. Chapter Deadlines (Timeline Bab)
        if (a.ChapterSchedule && Array.isArray(a.ChapterSchedule)) {
            a.ChapterSchedule.forEach((ch: any) => {
                if (ch.closeDate) {
                    items.push({
                        date: new Date(ch.closeDate),
                        title: ch.chapterTitle || `Bab ${ch.chapterId}`, // Fallback if title missing
                        chapter: a.title, // Context is the Assignment Name
                        daysLeft: differenceInDays(new Date(ch.closeDate), new Date()),
                        assignmentTitle: a.title,
                        chapterTitle: ch.chapterTitle,
                        deadline: ch.closeDate,
                        startDate: ch.openDate ? new Date(ch.openDate) : undefined,
                        chapterId: ch.chapterId
                    });
                }
            });
        }

        return items;
    });

    // Filter for upcoming deadlines list (e.g., positive days left)
    const upcomingDeadlinesList = calendarDeadlines
        .filter(d => d.daysLeft >= -30) // Show last month + future
        .sort((a, b) => a.daysLeft - b.daysLeft)
        .slice(0, 5);

    // Derive chapters from the paper structure for the Checklist
    // Use the actual paper structure with per-chapter status
    const activeAssignment = assignments.find(a => a.status !== 'COMPLETED') || assignments[0];
    const currentPaper = papers.find(p => p.assignmentId === activeAssignment?.id);

    // DEBUG: Log data to see what's happening
    console.log('=== DEBUG Progress Checklist ===');
    console.log('Papers count:', papers.length);
    console.log('Active Assignment:', activeAssignment?.id, activeAssignment?.title);
    console.log('Current Paper:', currentPaper?.id);
    console.log('Paper Structure:', currentPaper?.structure);
    console.log('Is Array:', Array.isArray(currentPaper?.structure));

    // Build chapters from paper structure (the actual source of truth)
    const chapters = (() => {
        if (!currentPaper || !currentPaper.structure || !Array.isArray(currentPaper.structure)) {
            console.log('FALLBACK: Using ChapterSchedule because structure is not valid');
            // Fallback to ChapterSchedule if no paper structure
            return (activeAssignment?.ChapterSchedule?.map((ch: any, index: number) => ({
                title: ch.chapterTitle || `Bab ${index + 1}`,
                progress: 0,
                status: 'DRAFT' as const
            })) || []);
        }

        console.log('=== CHAPTER STATUS DETAILS ===');
        // Use paper structure which contains the real per-chapter status
        return currentPaper.structure.map((section: any, index: number) => {
            // Chapter status - check feedbackHistory for latest status if direct status is undefined
            let status = section.status;

            // If status is undefined or DRAFT, check feedbackHistory for more recent status
            if (!status || status === 'DRAFT' || status === 'OPEN') {
                if (section.feedbackHistory && Array.isArray(section.feedbackHistory) && section.feedbackHistory.length > 0) {
                    // Get the last item in feedbackHistory (most recent)
                    const lastFeedback = section.feedbackHistory[section.feedbackHistory.length - 1];
                    if (lastFeedback && lastFeedback.status) {
                        status = lastFeedback.status;
                    }
                }
            }

            // Default to DRAFT if still no status
            if (!status) status = 'DRAFT';

            const contentLength = section.content ? section.content.replace(/<[^>]*>/g, '').trim().length : 0;

            console.log(`Chapter ${index + 1} (${section.title}): status=${status}, feedbackHistory=${section.feedbackHistory?.length || 0} items, contentLength=${contentLength}`);

            // Calculate progress based on status
            let progress = 0;
            if (status === 'APPROVED') {
                progress = 100;
            } else if (status === 'REVISION') {
                progress = 75;
            } else if (status === 'SUBMITTED' || status === 'REVIEW') {
                progress = 50;
            } else if (contentLength > 0) {
                // Has some content
                progress = Math.min(25 + Math.floor(contentLength / 100), 40); // 25-40% for draft with content
            }

            return {
                title: section.title || `BAB ${toRoman(index + 1)}`,
                progress: progress,
                status: status
            };
        });
    })().sort((a: any, b: any) => {
        // Natural sort for "BAB I", "BAB II", etc.
        return a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' });
    });

    // Helper function for Roman numerals
    function toRoman(num: number): string {
        const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
        return romanNumerals[num - 1] || String(num);
    }


    // INTEGRATION: Transform Assignments to Board Cards
    const dashboardAnnouncements: any[] = assignments.flatMap(a => {
        const items: any[] = [];
        const isCompleted = a.status === 'COMPLETED';

        // 1. Main Assignment Card
        items.push({
            id: `assign-${a.id}`,
            title: a.title,
            subject: a.subject || 'Tugas Akhir',
            type: 'TUGAS',
            rawDeadline: a.deadline, // For sorting
            deadline: a.deadline ? format(new Date(a.deadline), 'd MMM yyyy', { locale: id }) : '-',
            status: isCompleted ? 'Selesai' : 'Belum Dikumpul',
            priority: 'High',
            description: a.description || 'Segera lengkapi tugas ini sebelum tenggat waktu.',
            date: a.createdAt ? format(new Date(a.createdAt), 'd MMM', { locale: id }) : '-'
        });

        // 2. Active Chapter Cards (Only if open and not passed)
        if (a.ChapterSchedule && Array.isArray(a.ChapterSchedule)) {
            a.ChapterSchedule.forEach((ch: any) => {
                const isOpen = ch.openDate && new Date(ch.openDate) <= new Date();
                const isClosed = ch.closeDate && new Date(ch.closeDate) < new Date();

                if (isOpen && !isClosed) {
                    items.push({
                        id: `ch-${ch.chapterId}-${a.id}`,
                        title: `Pengumpulan ${ch.chapterTitle || `Bab ${ch.chapterId}`}`,
                        subject: a.title,
                        type: 'TUGAS',
                        rawDeadline: ch.closeDate, // For sorting
                        deadline: format(new Date(ch.closeDate), 'd MMM HH:mm', { locale: id }),
                        status: 'Menunggu',
                        priority: 'Normal',
                        description: `Silakan upload progress untuk ${ch.chapterTitle}.`,
                        date: format(new Date(ch.openDate), 'd MMM', { locale: id })
                    });
                }
            });
        }

        return items;
    }).sort((a, b) => {
        // Sort by Deadline (Upcoming first)
        const dateA = a.rawDeadline ? new Date(a.rawDeadline).getTime() : Infinity;
        const dateB = b.rawDeadline ? new Date(b.rawDeadline).getTime() : Infinity;

        if (dateA !== dateB) return dateA - dateB;

        // Secondary Sort: Title (e.g. Bab 1 vs Bab 2)
        return a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' });
    });

    return (
        <div className="min-h-screen bg-gray-50 pb-12 font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">

                {/* Header Section */}
                <div className="mb-6 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900 hidden">Dashboard Siswa</h1>
                </div>

                {/* Welcome Banner */}
                <WelcomeBanner userName={currentUser?.name || 'Siswa'} />

                {/* Stats Cards - Matches Mockup "Navy Blue & Gold" theme */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 -mt-16 relative z-10 px-2 leading-tight">
                    <StatCard
                        title="Tugas Selesai"
                        value={stats.overview.completedTasks ?? 0}
                        icon={BookOpen}
                        description="Assignment Completed"
                    />
                    <StatCard
                        title="Tugas Aktif"
                        value={stats.overview.activeAssignments ?? 0}
                        icon={Award}
                        description="Sedang Dikerjakan"
                    />
                    <StatCard
                        title="Jam Belajar"
                        value={stats.overview.studyHours ?? 0}
                        icon={Clock}
                        description="Minggu Ini"
                    />
                    <StatCard
                        title="Ranking"
                        value={stats.overview.rank || '-'}
                        icon={TrendingUp}
                        description="Di Angkatan"
                    />
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8 pb-12">
                    {/* Left Column: Progress & Checklists */}
                    <div className="lg:col-span-2 space-y-8">
                        <ProgressCharts
                            weeklyData={stats.progress.weeklyData ?? []}
                            statusData={stats.progress.statusData ?? []}
                        />

                        {/* Announcement Board (Pinterest Style) - Connected to Real Data */}
                        <AnnouncementPanel announcements={dashboardAnnouncements} />

                        {/* Progress Checklist (Moved from Sidebar) */}
                        <ProgressChecklist assignments={activeAssignment ? [{
                            id: activeAssignment.id,
                            title: activeAssignment.title,
                            chapters: chapters
                        }] : []} />
                    </div>

                    {/* Right Column: Deadlines & Goals */}
                    <div className="space-y-8">
                        {/* Daily Goals (Top) */}
                        <DailyGoals
                            currentWords={stats.progress.totalWords}
                            targetWords={stats.progress.targetWords}
                            streak={stats.progress.streak}
                        />

                        {/* Schedule Calendar (Moved here) */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800 mb-6">Jadwal Akademik</h3>
                            <ScheduleCalendar deadlines={calendarDeadlines} />
                        </div>







                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 shadow-md text-white">
                            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                                <Award className="text-yellow-300" size={20} />
                                Tips Hari Ini
                            </h3>
                            <p className="text-indigo-50 leading-relaxed font-medium mb-4">
                                "Menulis karya ilmiah bukan sekadar merangkai kata, tapi menyusun logika berpikir yang sistematis. Jangan lupa cantumkan sumber referensi!"
                            </p>
                            <div className="flex items-center gap-2 text-xs text-indigo-200">
                                <span className="bg-white/20 px-2 py-1 rounded-lg">#SemangatMenulis</span>
                                <span className="bg-white/20 px-2 py-1 rounded-lg">#SetukpaPolri</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;