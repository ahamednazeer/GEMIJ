import axios from 'axios';
import { Notification } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const notificationService = {
    /**
     * Get notifications for the authenticated user
     */
    async getNotifications(limit: number = 20, unreadOnly: boolean = false) {
        const response = await api.get('/notifications', {
            params: { limit, unreadOnly }
        });
        return {
            notifications: response.data.data as Notification[],
            unreadCount: response.data.unreadCount as number
        };
    },

    /**
     * Mark a notification as read
     */
    async markAsRead(notificationId: string) {
        const response = await api.put(`/notifications/${notificationId}/read`);
        return response.data.data as Notification;
    },

    /**
     * Mark all notifications as read
     */
    async markAllAsRead() {
        const response = await api.put('/notifications/read-all');
        return response.data;
    },

    /**
     * Delete a notification
     */
    async deleteNotification(notificationId: string) {
        const response = await api.delete(`/notifications/${notificationId}`);
        return response.data;
    }
};
