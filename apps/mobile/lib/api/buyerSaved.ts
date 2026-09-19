import { apiFetch } from './client';
import type { BuyerListing, Paginated } from './buyer';

export const buyerSavedApi = {
  list: (page = 1, pageSize = 50) =>
    apiFetch<Paginated<BuyerListing>>(`/buyer/saved?page=${page}&pageSize=${pageSize}`),

  save: (listingId: string) =>
    apiFetch<{ saved: boolean; listingId: string }>(`/buyer/saved/${listingId}`, {
      method: 'POST',
    }),

  unsave: (listingId: string) => apiFetch<void>(`/buyer/saved/${listingId}`, { method: 'DELETE' }),
};
