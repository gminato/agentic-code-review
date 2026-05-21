import { apiClient } from './client';

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  link?: string | null;
  is_read: boolean;
  created_at: string;
}

export const notificationsApi = {
  list: () => 
    apiClient.get<Notification[]>('/notifications/'),
  markAsRead: (id: number) => 
    apiClient.post<{ message: string }>(`/notifications/${id}/read`),
};
