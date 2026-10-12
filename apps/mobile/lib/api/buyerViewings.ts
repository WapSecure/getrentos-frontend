import type { VideoCallJoin } from '@getrentos/shared';
import { apiFetch } from './client';
import type { Paginated } from './buyer';

export type BuyerViewingDisplayStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export const BUYER_VIEWING_STATUS_LABEL: Record<BuyerViewingDisplayStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const BUYER_VIEWING_STATUS_TONE: Record<
  BuyerViewingDisplayStatus,
  'warning' | 'info' | 'success' | 'danger'
> = {
  pending: 'warning',
  confirmed: 'info',
  completed: 'success',
  cancelled: 'danger',
};

export interface BuyerViewing {
  id: string;
  listingId: string;
  propertyId: string;
  propertyTitle: string;
  requestedDate: string;
  requestedTime: string;
  /** The viewing time as an ISO instant: show this, in local time. */
  scheduledAt?: string;
  status: BuyerViewingDisplayStatus;
  /** 'video': a live video call the seller hosts. */
  mode?: 'in_person' | 'video';
  notes?: string;
}

export const buyerViewingsApi = {
  list: (page = 1, pageSize = 20) =>
    apiFetch<Paginated<BuyerViewing>>(`/buyer/viewings?page=${page}&pageSize=${pageSize}`),

  create: (
    listingId: string,
    scheduledAt: string,
    notes?: string,
    mode: 'IN_PERSON' | 'VIDEO' = 'IN_PERSON'
  ) =>
    apiFetch<BuyerViewing>('/buyer/viewings', {
      method: 'POST',
      body: { listingId, scheduledAt, notes, mode },
    }),

  /** A personal link into a confirmed video viewing, from 15 minutes before it. */
  joinVideoCall: (id: string) =>
    apiFetch<VideoCallJoin>(`/buyer/viewings/${id}/video-call`, { method: 'POST' }),

  cancel: (id: string) =>
    apiFetch<BuyerViewing>(`/buyer/viewings/${id}`, {
      method: 'PATCH',
      body: { status: 'CANCELLED' },
    }),
};
