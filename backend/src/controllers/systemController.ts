
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import prisma from '../config/database.js';
import crypto from 'crypto';

const SETTINGS_KEY = 'global_settings';

// Helper to get or create settings
const getOrCreateSettings = async () => {
    return await prisma.systemSetting.upsert({
        where: { key: SETTINGS_KEY },
        update: {},
        create: { key: SETTINGS_KEY }
    });
};

export const getSystemSettings = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const settings = await getOrCreateSettings();
        res.json(settings);
    } catch (error) {
        console.error('Get system settings error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateSystemSettings = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { isSystemOpen, passingGrade, violationThreshold, announcement, submissionDeadline, integrityTolerance } = req.body;

        // Ensure settings exist first
        await getOrCreateSettings();

        const updatedSettings = await prisma.systemSetting.update({
            where: { key: SETTINGS_KEY },
            data: {
                isSystemOpen,
                passingGrade,
                violationThreshold,
                announcement,
                submissionDeadline,
                integrityTolerance,
                enableCopyPasteProtection: req.body.enableCopyPasteProtection,
                enableViolationDetection: req.body.enableViolationDetection
            }
        });

        res.json(updatedSettings);
    } catch (error) {
        console.error('Update system settings error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const broadcastAnnouncement = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { announcement } = req.body;

        if (!announcement) {
            res.status(400).json({ error: 'Announcement content is required' });
            return;
        }

        // 1. Create Announcement Record (History)
        const newAnnouncement = await prisma.announcement.create({
            data: {
                content: announcement,
                target: req.body.target || 'ALL', // Assuming target is passed in body
                createdBy: req.user?.userId,
                isActive: true
            }
        });

        // 2. Update System Settings (Active Banner)
        await getOrCreateSettings();
        const updatedSettings = await prisma.systemSetting.update({
            where: { key: SETTINGS_KEY },
            data: { announcement }
        });

        // 3. Find Target Users
        const whereClause = (req.body.target && req.body.target !== 'ALL')
            ? { role: req.body.target }
            : { role: 'SISWA' }; // Default to SISWA if ALL (or handle ALL differently if needed)

        // If ALL, maybe we want all users? For now let's stick to SISWA as primary target 
        // or expand if broadcastTarget is truly dynamic in frontend.
        // Frontend sends: 'ALL', 'SISWA', 'PEMBIMBING', 'PENGUJI'

        let userFilter: any = {};
        if (req.body.target && req.body.target !== 'ALL') {
            userFilter = { role: req.body.target };
        } else {
            // For 'ALL', we usually aim for Students + maybe others. 
            // Let's target everyone for ALL? Or just Students? 
            // Existing logic targeted 'SISWA'. Let's expand if needed, but safe default is SISWA.
            // If ALL is sent, let's include verified users? 
            // For safety, let's keep it 'SISWA' for ALL for now to match previous behavior, 
            // OR removed the filter to get all users provided they are active?
            // Let's trust the filter.
            userFilter = {}; // ALL users
        }

        const recipients = await prisma.user.findMany({
            where: userFilter,
            select: { id: true }
        });

        // 4. Create Notifications
        if (recipients.length > 0) {
            const notifications = recipients.map(user => ({
                id: crypto.randomUUID(),
                userId: user.id,
                type: 'SYSTEM',
                title: 'Pengumuman Sistem',
                message: announcement,
                read: false,
                relatedId: newAnnouncement.id, // Link to history
                createdAt: new Date()
            }));

            await prisma.notification.createMany({
                data: notifications as any
            });

            console.log(`📢 Broadcast sent to ${recipients.length} users.`);
        }

        res.json({
            success: true,
            message: `Berhasil mengirim pengumuman ke ${recipients.length} pengguna.`,
            settings: updatedSettings,
            announcement: newAnnouncement
        });

    } catch (error) {
        console.error('Broadcast error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const retractAnnouncement = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // 1. Update System Settings to clear announcement
        await getOrCreateSettings();
        const updatedSettings = await prisma.systemSetting.update({
            where: { key: SETTINGS_KEY },
            data: { announcement: null } // Clear the announcement
        });

        // Optional: We could also delete recent 'SYSTEM' notifications if we wanted to be aggressive,
        // but keeping history is usually better. The main goal is to remove the active banner.

        res.json({
            success: true,
            message: 'Pengumuman berhasil ditarik. Banner akan hilang dari dashboard siswa.',
            settings: updatedSettings
        });

    } catch (error) {
        console.error('Retract error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getAnnouncements = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const announcements = await prisma.announcement.findMany({
            orderBy: { createdAt: 'desc' },
            include: { Admin: { select: { name: true } } }
        });
        res.json(announcements);
    } catch (error) {
        console.error('Get announcements error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteAnnouncement = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        // Delete related notifications first (or let Prisma cascade if configured, but manual is safer here)
        await prisma.notification.deleteMany({
            where: { relatedId: id }
        });

        await prisma.announcement.delete({ where: { id } });
        res.json({ success: true, message: 'Pengumuman dan notifikasi terkait dihapus' });
    } catch (error) {
        console.error('Delete announcement error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

