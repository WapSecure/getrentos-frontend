import { apiFetch } from './client';
import type { Paginated } from './properties';
import type { OwnerOffer, OwnerOfferThreadMessage } from './owner';

/**
 * Purchase offers from the seller's side. An owner and a landlord receive the
 * same offers through the same API shape under their own prefix, so one client
 * (and one pair of screens) serves both.
 */
export type OfferSide = 'owner' | 'landlord';

export const asOfferSide = (value: unknown): OfferSide =>
  value === 'landlord' ? 'landlord' : 'owner';

export function sellerOffers(side: OfferSide) {
  const base = `/${side}/offers`;
  return {
    keys: {
      list: [side, 'offers'] as const,
      thread: (id: string) => [side, 'offers', id, 'thread'] as const,
    },
    list: (page = 1, pageSize = 50) =>
      apiFetch<Paginated<OwnerOffer>>(`${base}?page=${page}&pageSize=${pageSize}`),
    thread: (id: string) => apiFetch<OwnerOfferThreadMessage[]>(`${base}/${id}/thread`),
    accept: (id: string) => apiFetch<unknown>(`${base}/${id}/accept`, { method: 'POST' }),
    reject: (id: string) => apiFetch<unknown>(`${base}/${id}/reject`, { method: 'POST' }),
    counter: (id: string, amount: number, message?: string) =>
      apiFetch<unknown>(`${base}/${id}/counter`, { method: 'POST', body: { amount, message } }),
  };
}
