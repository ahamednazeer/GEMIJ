import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../types';

const prisma = new PrismaClient();

/**
 * Get notifications for the authenticated user
 */
export const getNotifications = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { limit = 20, unreadOnly = false } = req.query;

        const where: any = {
            userId: req.user!.id
        };

        if (unreadOnly === 'true') {
            where.isRead = false;
        }

        const notifications = await prisma.notification.findMany({
            where,
            take: Number(limit),
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                submission: {
                    select: {
                        id: true,
                        title: true,
                        status: true
                    }
                }
            }
        });

        const unreadCount = await prisma.notification.count({
            where: {
                userId: req.user!.id,
                isRead: false
            }
        });

        return res.json({
            success: true,
            data: notifications,
            unreadCount
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

/**
 * Mark a notification as read
 */
export const markAsRead = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { notificationId } = req.params;

        const notification = await prisma.notification.findUnique({
            where: { id: notificationId }
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                error: 'Notification not found'
            });
        }

        if (notification.userId !== req.user!.id) {
            return res.status(403).json({
                success: false,
                error: 'Unauthorized'
            });
        }

        const updatedNotification = await prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true }
        });

        return res.json({
            success: true,
            data: updatedNotification
        });
    } catch (error) {
        console.error('Mark as read error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (req: AuthenticatedRequest, res: Response) => {
    try {
        await prisma.notification.updateMany({
            where: {
                userId: req.user!.id,
                isRead: false
            },
            data: {
                isRead: true
            }
        });

        return res.json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        console.error('Mark all as read error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

/**
 * Create a notification
 */
export const createNotification = async (
    userId: string,
    type: string,
    title: string,
    message: string,
    submissionId?: string
) => {
    try {
        const notification = await prisma.notification.create({
            data: {
                userId,
                type,
                title,
                message,
                submissionId
            }
        });

        return notification;
    } catch (error) {
        console.error('Create notification error:', error);
        throw error;
    }
};

/**
 * Delete a notification
 */
export const deleteNotification = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { notificationId } = req.params;

        const notification = await prisma.notification.findUnique({
            where: { id: notificationId }
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                error: 'Notification not found'
            });
        }

        if (notification.userId !== req.user!.id) {
            return res.status(403).json({
                success: false,
                error: 'Unauthorized'
            });
        }

        await prisma.notification.delete({
            where: { id: notificationId }
        });

        return res.json({
            success: true,
            message: 'Notification deleted'
        });
    } catch (error) {
        console.error('Delete notification error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};
