import { apiService, ApiResponse } from './api';
import { withCache, invalidateCache, forceRefresh } from '../utils/cache';

export interface JobAlert {
  id: number;
  user: any;
  message: string;
  isRead: boolean;
  sentAt: string;
}

export interface NotificationsResponse {
  success: boolean;
  count: number;
  notifications: JobAlert[];
}

export const notificationService = {
  async getNotifications(read?: boolean): Promise<ApiResponse<NotificationsResponse>> {
    const cacheKey = read !== undefined ? `notifications-${read}` : 'notifications';
    return withCache(cacheKey, async () => {
      const params = read !== undefined ? `?read=${read}` : '';
      return apiService.get<NotificationsResponse>(`/api/notifications${params}`);
    });
  },

  async getUnreadNotifications(): Promise<ApiResponse<NotificationsResponse>> {
    return withCache('notifications-unread', async () => {
      return apiService.get<NotificationsResponse>('/api/notifications/unread');
    });
  },

  async getNotificationById(id: number): Promise<ApiResponse<{ notification: JobAlert }>> {
    return withCache(`notification-${id}`, async () => {
      return apiService.get<{ notification: JobAlert }>(`/api/notifications/${id}`);
    });
  },

  async markAsRead(id: number): Promise<ApiResponse<{ notification: JobAlert }>> {
    const result = await apiService.put<{ notification: JobAlert }>(`/api/notifications/${id}/read`, {});
    // Invalidate cache when notification is marked as read
    if (result.success) {
      invalidateCache('notifications');
    }
    return result;
  },

  async markAllAsRead(): Promise<ApiResponse<{ markedCount: number }>> {
    const result = await apiService.put<{ markedCount: number }>('/api/notifications/read-all', {});
    // Invalidate cache when all notifications are marked as read
    if (result.success) {
      invalidateCache('notifications');
    }
    return result;
  },

  async deleteNotification(id: number): Promise<ApiResponse<{ message: string }>> {
    const result = await apiService.delete<{ message: string }>(`/api/notifications/${id}`);
    // Invalidate cache when notification is deleted
    if (result.success) {
      invalidateCache('notifications');
    }
    return result;
  },

  // Force refresh methods
  async refreshNotifications(): Promise<ApiResponse<NotificationsResponse>> {
    return forceRefresh('notifications', async () => {
      return apiService.get<NotificationsResponse>('/api/notifications');
    });
  },
};
