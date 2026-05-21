import { create } from 'zustand';
import { notificationsApi, type Notification } from '../api/notifications';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  fetchNotifications: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await notificationsApi.list();
      const notifications = response.data;
      const unreadCount = notifications.filter(n => !n.is_read).length;
      set({ notifications, unreadCount, isLoading: false });
    } catch (err: any) {
      set({ error: 'Failed to fetch notifications', isLoading: false });
    }
  },
  markAsRead: async (id) => {
    try {
      await notificationsApi.markAsRead(id);
      const updated = get().notifications.map(n => 
        n.id === id ? { ...n, is_read: true } : n
      );
      const unreadCount = updated.filter(n => !n.is_read).length;
      set({ notifications: updated, unreadCount });
    } catch (err: any) {
      console.error('Failed to mark notification as read:', err);
    }
  },
  markAllAsRead: async () => {
    try {
      const unread = get().notifications.filter(n => !n.is_read);
      await Promise.all(unread.map(n => notificationsApi.markAsRead(n.id)));
      const updated = get().notifications.map(n => ({ ...n, is_read: true }));
      set({ notifications: updated, unreadCount: 0 });
    } catch (err: any) {
      console.error('Failed to mark all as read:', err);
    }
  },
}));
