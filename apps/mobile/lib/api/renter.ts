import { apiFetch } from './client';
import type { RenterProperty } from './properties';

export interface RenterDashboardStats {
  savedPropertiesCount: number;
  activeApplicationsCount: number;
  unreadMessagesCount: number;
  upcomingViewingsCount: number;
}

export interface MoveInChecklistItem {
  key: string;
  title: string;
  description: string;
  required: boolean;
  completed: boolean;
}

export const renterApi = {
  dashboardStats: () => apiFetch<RenterDashboardStats>('/renter/dashboard/stats'),

  moveInChecklist: () => apiFetch<MoveInChecklistItem[]>('/renter/dashboard/move-in-checklist'),

  toggleMoveInChecklistItem: (key: string) =>
    apiFetch<MoveInChecklistItem>(`/renter/dashboard/move-in-checklist/${key}/toggle`, {
      method: 'PATCH',
    }),

  moveOutChecklist: () => apiFetch<MoveInChecklistItem[]>('/renter/dashboard/move-out-checklist'),

  toggleMoveOutChecklistItem: (key: string) =>
    apiFetch<MoveInChecklistItem>(`/renter/dashboard/move-out-checklist/${key}/toggle`, {
      method: 'PATCH',
    }),

  recommendations: () => apiFetch<RenterProperty[]>('/renter/recommendations'),
};
