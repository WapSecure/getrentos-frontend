import { apiFetch } from './client';

export const NOTIFICATION_CATEGORIES = [
  'application',
  'message',
  'payment',
  'maintenance',
  'lease',
  'system',
] as const;
export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

export const NOTIFICATION_CATEGORY_LABEL: Record<NotificationCategory, string> = {
  application: 'Applications',
  message: 'Messages',
  payment: 'Payments',
  maintenance: 'Maintenance',
  lease: 'Lease',
  system: 'Account & system',
};

export const NOTIFICATION_CATEGORY_DESCRIPTION: Record<NotificationCategory, string> = {
  application: 'Status changes on your rental applications',
  message: 'New messages from landlords and agents',
  payment: 'Rent due dates, receipts and payment status',
  maintenance: 'Updates on maintenance requests',
  lease: 'Lease signing, renewals and terms',
  system: 'Security alerts and account changes',
};

export interface NotificationPreference {
  id: string;
  category: NotificationCategory;
  email: boolean;
  push: boolean;
  inApp: boolean;
}

export const notificationPreferencesApi = {
  list: () => apiFetch<NotificationPreference[]>('/renter/notifications/preferences'),

  update: (
    category: NotificationCategory,
    patch: Partial<Pick<NotificationPreference, 'email' | 'push' | 'inApp'>>
  ) =>
    apiFetch<NotificationPreference>(`/renter/notifications/preferences/${category}`, {
      method: 'PATCH',
      body: patch,
    }),
};
