import { apiFetch } from './client';

/** Account-wide saved state shared by every public marketplace surface. */
export const marketSavedApi = {
  ids: () => apiFetch<string[]>('/marketplace/saved-listing-ids'),
  save: (listingId: string) =>
    apiFetch<{ saved: boolean }>(`/marketplace/listings/${listingId}/save`, { method: 'POST' }),
  unsave: (listingId: string) =>
    apiFetch<{ saved: boolean }>(`/marketplace/listings/${listingId}/save`, { method: 'DELETE' }),
};
