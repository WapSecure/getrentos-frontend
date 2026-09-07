import { apiFetch } from './client';

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
  dashboardStats: () =>
    apiFetch<RenterDashboardStats>('/renter/dashboard/stats'),

  moveInChecklist: () =>
    apiFetch<MoveInChecklistItem[]>('/renter/dashboard/move-in-checklist'),

  toggleMoveInChecklistItem: (key: string) =>
    apiFetch<MoveInChecklistItem>(`/renter/dashboard/move-in-checklist/${key}/toggle`, {
      method: 'PATCH',
    }),
};
