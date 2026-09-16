import { apiFetch } from './client';
import type { RenterProperty } from './properties';

export type RecentlyViewedProperty = RenterProperty & { viewedAt: string };

export const recentlyViewedApi = {
  list: () => apiFetch<RecentlyViewedProperty[]>('/renter/recently-viewed'),
  record: (listingId: string) =>
    apiFetch<{ recorded: boolean }>(`/renter/recently-viewed/${listingId}`, { method: 'POST' }),
};
