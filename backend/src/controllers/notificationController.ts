import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import prisma from '../config/database.js';

// Get all notifications for current user
export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const { limit = '50', offset = '0' } = req.query;

        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit as string),
            skip: parseInt(offset as string),
        });

        res.json({ notifications });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get unread notification count
export const getUnreadCount = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId;

        const count = await prisma.notification.count({
            where: {
                userId,
                read: false,
            },
        });

        res.json({ count });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Mark notification as read
export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const { id } = req.params;

        const notification = await prisma.notification.findFirst({
            where: {
                id,
                userId,
            },
        });

        if (!notification) {
            res.status(404).json({ error: 'Notification not found' });
            return;
        }

        const updated = await prisma.notification.update({
            where: { id },
            data: { read: true },
        });

        res.json({ notification: updated });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Mark all notifications as read
export const markAllAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId;

        await prisma.notification.updateMany({
            where: {
                userId,
                read: false,
            },
            data: { read: true },
        });

        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Mark all as read error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Helper function to create notification
export const createNotification = async (
    userId: string,
    type: string,
    title: string,
    message: string,
    relatedId?: string
): Promise<void> => {
    try {
        await prisma.notification.create({
            data: {
                id: crypto.randomUUID(),
                userId,
                type: type as any,
                title,
                message,
                relatedId,
            },
        });
    } catch (error) {
        console.error('Create notification error:', error);
    }
};
