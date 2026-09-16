import { apiFetch } from './client';

export const VIEWING_STATUSES = ['requested', 'confirmed', 'completed', 'cancelled'] as const;
export type ViewingStatus = (typeof VIEWING_STATUSES)[number];

export const VIEWING_STATUS_LABEL: Record<ViewingStatus, string> = {
  requested: 'Requested',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const VIEWING_STATUS_TONE: Record<
  ViewingStatus,
  'warning' | 'success' | 'neutral' | 'danger'
> = {
  requested: 'warning',
  confirmed: 'success',
  completed: 'neutral',
  cancelled: 'danger',
};

export interface ViewingRequest {
  id: string;
  propertyId: string;
  propertyName: string;
  unitId?: string;
  status: ViewingStatus;
  requestedAt: string;
  scheduledAt?: string;
  notes?: string;
}

export const viewingsApi = {
  list: () => apiFetch<ViewingRequest[]>('/renter/viewing-requests'),

  create: (propertyId: string, notes?: string) =>
    apiFetch<ViewingRequest>('/renter/viewing-requests', {
      method: 'POST',
      body: { propertyId, notes: notes || undefined },
    }),
};
