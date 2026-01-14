import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import { cache, cacheKeys, cacheTTL } from '../utils/cache.js';
import logger from '../utils/logger.js';

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        // Try to get from cache first
        const cacheKey = cacheKeys.dashboardStats();
        const cached = await cache.get(cacheKey);
        if (cached) {
            return res.json(cached);
        }

        const totalUsers = await prisma.user.count();
        const activeAssignments = await prisma.assignment.count({
            where: { status: { not: 'COMPLETED' } }
        });

        // Fetch all graded papers to calculate accurate average
        // Simplified query to avoid relation filter issues
        let averageGrade = 0;
        try {
            const gradedPapers = await prisma.paper.findMany({
                where: { grade: { not: null } },
                select: { grade: true }
            });
            averageGrade = gradedPapers.length > 0
                ? Math.round(gradedPapers.reduce((sum, p) => sum + (p.grade ?? 0), 0) / gradedPapers.length)
                : 0;
        } catch (gradeError) {
            console.error('[Dashboard] Error fetching graded papers:', gradeError);
            // Continue with default averageGrade = 0
        }

        // User Request: Count total students who have violations, not total violation events
        const uniqueViolators = await prisma.violation.findMany({
            distinct: ['userId'],
            select: { userId: true }
        });
        const violations = uniqueViolators.length;

        // Count COMPLETED PAPERS (Student Submissions), not just Assignment Schedules
        const completedTasks = await prisma.paper.count({
            where: {
                OR: [
                    { contentApprovalStatus: 'APPROVED' },
                    { finalApprovalStatus: 'APPROVED' },
                    { grade: { not: null } }
                ]
            }
        });

        const pendingReviews = await prisma.paper.count({
            where: {
                OR: [
                    { contentApprovalStatus: 'SUBMITTED' },
                    { contentApprovalStatus: 'UNDER_REVIEW' }
                ]
            }
        }); // Use Papers for reviews too, as Assignments are just containers

        const templates = await prisma.paperTemplate.count();
        const activeStudents = await prisma.user.count({ where: { role: 'SISWA' } });

        // Calculate Online Users (Active in last 5 minutes)
        // We use a short window + client-side heartbeat for "Instant" accuracy
        const activeWindow = new Date(Date.now() - 5 * 60 * 1000); // 5 Minutes

        const onlineStats = {
            siswa: await prisma.user.count({
                where: {
                    role: 'SISWA',
                    updatedAt: { gte: activeWindow }
                }
            }),
            pembimbing: await prisma.user.count({
                where: {
                    role: 'PEMBIMBING',
                    updatedAt: { gte: activeWindow }
                }
            }),
            penguji: await prisma.user.count({
                where: {
                    role: 'PENGUJI',
                    updatedAt: { gte: activeWindow }
                }
            }),
        };

        // NEW: Calculate Pass/Fail status
        const settings = await prisma.systemSetting.findFirst();
        const passingGrade = settings?.passingGrade || 70;

        // Get all final scores - Fetch again with proper scope
        let passedStudents = 0;
        let failedStudents = 0;
        try {
            const allGradedPapers = await prisma.paper.findMany({
                where: { grade: { not: null } },
                select: { grade: true }
            });
            const allGrades = allGradedPapers.map(p => p.grade ?? 0).filter(g => g > 0);
            passedStudents = allGrades.filter(g => g >= passingGrade).length;
            failedStudents = allGrades.filter(g => g < passingGrade).length;
        } catch (gradeStatsError) {
            console.error('[Dashboard] Error calculating pass/fail stats:', gradeStatsError);
        }

        // Return new stats "passed" and "failed"
        // We replace "activeAssignments" in the UI, but keep sending it for compatibility or other uses if needed
        const result = {
            totalUsers,
            activeAssignments,
            passedStudents,
            failedStudents,
            averageGrade,
            violations,
            completedTasks,
            pendingReviews,
            templates,
            activeStudents,
            onlineStats
        };

        // Cache for 1 minute (online stats change frequently)
        await cache.set(cacheKey, result, cacheTTL.SHORT);

        res.json(result);
    } catch (error) {
        logger.error('Error fetching dashboard stats', { error });
        res.status(500).json({
            error: 'Failed to fetch dashboard statistics',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const getOnlineUsers = async (req: Request, res: Response) => {
    try {
        const activeWindow = new Date(Date.now() - 5 * 60 * 1000); // 5 Minutes

        const onlineUsers = await prisma.user.findMany({
            where: {
                updatedAt: { gte: activeWindow }
            },
            select: {
                id: true,
                name: true,
                role: true,
                photoUrl: true,
                updatedAt: true // Use updatedAt as 'lastActive'
            }
        });

        // Group by role
        const grouped = {
            siswa: onlineUsers.filter(u => u.role === 'SISWA').map(u => ({ ...u, lastActive: u.updatedAt })),
            pembimbing: onlineUsers.filter(u => u.role === 'PEMBIMBING').map(u => ({ ...u, lastActive: u.updatedAt })),
            penguji: onlineUsers.filter(u => u.role === 'PENGUJI').map(u => ({ ...u, lastActive: u.updatedAt }))
        };

        res.json(grouped);
    } catch (error) {
        console.error('Error fetching online users:', error);
        res.status(500).json({ error: 'Failed to fetch online users' });
    }
};

export const getDashboardActivities = async (req: Request, res: Response) => {
    try {
        const activities = await prisma.activityLog.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
                User: {
                    select: {
                        name: true,
                        role: true
                    }
                }
            }
        });

        const formattedActivities = activities.map(activity => ({
            id: activity.id,
            user: activity.User.name,
            action: activity.action,
            type: activity.type,
            time: formatTimeAgo(activity.createdAt)
        }));

        res.json(formattedActivities);
    } catch (error) {
        console.error('Error fetching dashboard activities:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard activities' });
    }
};

function formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
        return 'Baru saja';
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} menit yang lalu`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} jam yang lalu`;
    } else {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} hari yang lalu`;
    }
}

export const getStudentDashboardStats = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Get student's papers/assignments with Template details
        const papers = await prisma.paper.findMany({
            where: { userId },
            include: {
                Assignment: {
                    include: {
                        PaperTemplate: true
                    }
                }
            }
        });

        // Calculate real word count from structure content since detailed fields might not be synced
        const totalWords = papers.reduce((sum, p) => {
            let paperWords = 0;
            if (p.structure && Array.isArray(p.structure)) {
                (p.structure as any[]).forEach(section => {
                    if (section && section.content) {
                        // Strip HTML tags and count words
                        const text = section.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                        if (text.length > 0) {
                            paperWords += text.split(' ').length;
                        }
                    }
                });
            }
            // Fallback to stored totalWords if structure calculation yields 0 but stored is > 0
            return sum + (paperWords > 0 ? paperWords : ((p as any).totalWords || 0));
        }, 0);

        // Find total target words from assignments linked to these papers
        const targetWords = papers.reduce((sum, p) => {
            // 1. Try explicit assignment totalWords
            if (p.Assignment?.totalWords && p.Assignment.totalWords > 0) {
                return sum + p.Assignment.totalWords;
            }

            // 2. Try calculating from Template structure
            if (p.Assignment?.PaperTemplate?.pages) {
                try {
                    const pages = p.Assignment.PaperTemplate.pages as any[];
                    let templateMinWords = 0;

                    if (Array.isArray(pages)) {
                        pages.forEach(page => {
                            if (page.structure && Array.isArray(page.structure)) {
                                page.structure.forEach((struct: any) => {
                                    if (struct.minWords) {
                                        templateMinWords += struct.minWords;
                                    }
                                });
                            }
                        });
                    }
                    if (templateMinWords > 0) return sum + templateMinWords;
                } catch (e) {
                    console.error('Error parsing template for word count:', e);
                }
            }

            return sum;
        }, 0);

        // Progress percentage
        const percentComplete = targetWords > 0 ? Math.round((totalWords / targetWords) * 100) : 0;

        // Calculate Daily Activity (Last 7 Days) for the Progress Chart
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentActivities = await prisma.activityLog.findMany({
            where: {
                userId,
                createdAt: { gte: sevenDaysAgo }
            }
        });

        const dailyActivity = [0, 0, 0, 0, 0, 0, 0];
        recentActivities.forEach(act => {
            const dayDiff = Math.floor((new Date().getTime() - new Date(act.createdAt).getTime()) / (1000 * 3600 * 24));
            if (dayDiff >= 0 && dayDiff < 7) {
                const index = 6 - dayDiff;
                dailyActivity[index] += 1;
            }
        });

        const completedPapers = papers.filter(p => p.finalApprovalStatus === 'APPROVED' || p.contentApprovalStatus === 'APPROVED');
        // Calculate Study Hours:
        // 1. From real timer duration (in seconds) stored in papers
        const realTimerSeconds = papers.reduce((sum, p) => sum + (p.timerDuration || 0), 0);
        const realTimerHours = realTimerSeconds / 3600;

        // 2. Heuristic from recent activities (assuming 15 mins per interaction)
        const activityHours = recentActivities.length * 0.25;

        // Total Study Hours
        const localStudyHours = parseFloat((realTimerHours + activityHours).toFixed(1));

        // Real Student Count
        const totalStudents = await prisma.user.count({ where: { role: 'SISWA' } });

        // Simple Rank Placeholder (Real calculation would require a leaderboard system)
        // For now, we show them as distinct from the total.
        const rankDisplay = totalStudents > 0 ? `1/${totalStudents}` : '-';

        const stats = {
            overview: {
                totalSKS: 24,
                ipk: 3.75,
                rank: rankDisplay,
                studyHours: localStudyHours,
                completedTasks: completedPapers.length,
                activeAssignments: papers.length - completedPapers.length
            },
            progress: {
                totalWords,
                targetWords: targetWords || 3000,
                percentComplete,
                dailyActivity
            }
        };

        res.json(stats);
    } catch (error) {
        console.error('Error fetching student stats:', error);
        res.status(500).json({ error: 'Failed to fetch student stats' });
    }
};

export const getStudentActivityFeed = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const activities = await prisma.activityLog.findMany({
            where: { userId },
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: { User: { select: { name: true, role: true } } }
        });

        const formattedActivities = activities.map(activity => ({
            id: activity.id,
            type: activity.type || 'INFO',
            title: activity.action,
            message: activity.metadata ? (activity.metadata as any).details : activity.action,
            author: activity.User.name,
            authorRole: activity.User.role,
            timeAgo: formatTimeAgo(activity.createdAt)
        }));

        res.json(formattedActivities);
    } catch (error) {
        console.error('Error fetching student activities:', error);
        res.status(500).json({ error: 'Failed to fetch activities' });
    }
};

export const getCalendarEvents = async (req: Request, res: Response) => {
    try {
        // Fetch all assignments (deadline is required in schema)
        const assignments = await prisma.assignment.findMany({
            select: {
                id: true,
                title: true,
                deadline: true,
                status: true
            },
            orderBy: {
                deadline: 'asc'
            }
        });

        // Fetch other meaningful dates if needed (e.g. Activity logs that are milestones)
        // For now, focusing on Assignments as requested

        const events = assignments.map(a => ({
            id: a.id,
            title: a.title,
            date: a.deadline, // Keep as Date object or ISO string
            type: 'assignment',
            status: a.status === 'SCHEDULED' || a.status === 'UNDER_REVIEW' ? 'active' : 'inactive'
        }));

        res.json(events);
    } catch (error) {
        console.error('Error fetching calendar events:', error);
        // Fail-safe: Return empty array instead of crashing so UI keeps working
        res.json([]);
    }
};
