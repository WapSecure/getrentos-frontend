import { apiFetch } from './client';
import type { Paginated } from './properties';
import type { NotificationCategory } from './notificationPreferences';

/** An action the API attaches to a notification, e.g. "View application". */
export interface NotificationAction {
  label: string;
  url: string;
}

export interface RenterNotification {
  id: string;
  type: NotificationCategory;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  action?: NotificationAction;
}

export const notificationsApi = {
  list: (page = 1, pageSize = 30) =>
    apiFetch<Paginated<RenterNotification>>(
      `/renter/notifications?page=${page}&pageSize=${pageSize}`
    ),

  markRead: (id: string) =>
    apiFetch<RenterNotification>(`/renter/notifications/${id}/read`, { method: 'PATCH' }),

  markAllRead: () => apiFetch<void>('/renter/notifications/read-all', { method: 'POST' }),

  remove: (id: string) => apiFetch<void>(`/renter/notifications/${id}`, { method: 'DELETE' }),

  clearAll: () => apiFetch<void>('/renter/notifications', { method: 'DELETE' }),
};
