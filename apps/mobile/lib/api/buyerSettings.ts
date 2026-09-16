import { apiFetch } from './client';
import type { Paginated } from './buyer';

export interface BuyerPaymentMethod {
  bankName: string;
  accountNumber: string;
  accountName: string;
  verified: boolean;
}

export interface BuyerNotificationPreference {
  id: string;
  email: boolean;
  push: boolean;
}

export const BUYER_NOTIFICATION_CATEGORY_LABEL: Record<string, string> = {
  offers: 'Offers',
  escrow: 'Escrow updates',
  viewings: 'Viewings',
  messages: 'Messages',
  saved: 'Saved listing alerts',
};

export interface BuyerSearchPreferences {
  minBudget: number;
  maxBudget: number;
  preferredTypes: string[];
  preferredLocations: string;
  notifyOnMatch: boolean;
}

export interface BuyerNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export const buyerSettingsApi = {
  getPaymentMethod: () => apiFetch<BuyerPaymentMethod>('/buyer/settings/payment-method'),

  updatePaymentMethod: (input: {
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
  }) =>
    apiFetch<BuyerPaymentMethod>('/buyer/settings/payment-method', { method: 'PUT', body: input }),

  getNotificationPreferences: () =>
    apiFetch<BuyerNotificationPreference[]>('/buyer/settings/notifications'),

  updateNotificationPreferences: (preferences: BuyerNotificationPreference[]) =>
    apiFetch<BuyerNotificationPreference[]>('/buyer/settings/notifications', {
      method: 'PUT',
      body: { preferences },
    }),

  getSearchPreferences: () =>
    apiFetch<BuyerSearchPreferences>('/buyer/settings/search-preferences'),

  updateSearchPreferences: (input: Partial<BuyerSearchPreferences>) =>
    apiFetch<BuyerSearchPreferences>('/buyer/settings/search-preferences', {
      method: 'PUT',
      body: input,
    }),

  notifications: (page = 1, pageSize = 30) =>
    apiFetch<Paginated<BuyerNotification>>(
      `/buyer/notifications?page=${page}&pageSize=${pageSize}`
    ),

  readNotification: (id: string) =>
    apiFetch<void>(`/buyer/notifications/${id}/read`, { method: 'PATCH' }),

  readAllNotifications: () => apiFetch<void>('/buyer/notifications/read-all', { method: 'POST' }),
};
