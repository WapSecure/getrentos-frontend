import type { VideoCallJoin } from '@getrentos/shared';
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
  /** 'video': a live video call at scheduledAt, hosted by the landlord. */
  mode: 'in_person' | 'video';
  requestedAt: string;
  scheduledAt?: string;
  notes?: string;
}

export const viewingsApi = {
  list: () => apiFetch<ViewingRequest[]>('/renter/viewing-requests'),

  create: (propertyId: string, notes?: string, mode: 'IN_PERSON' | 'VIDEO' = 'IN_PERSON') =>
    apiFetch<ViewingRequest>('/renter/viewing-requests', {
      method: 'POST',
      body: { propertyId, notes: notes || undefined, mode },
    }),

  /** A personal link into a confirmed video viewing, from 15 minutes before it. */
  joinVideoCall: (id: string) =>
    apiFetch<VideoCallJoin>(`/renter/viewing-requests/${id}/video-call`, { method: 'POST' }),

  /** Whether video viewings can be booked (the call service is configured). */
  videoCallsAvailable: () => apiFetch<{ available: boolean }>('/video-calls/availability'),
};
