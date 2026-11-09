import { apiFetch } from './client';
import type { Paginated } from './properties';
import type { OwnerOffer, OwnerOfferThreadMessage } from './owner';

export type OfferSide = 'owner' | 'landlord';

export const asOfferSide = (value: unknown): OfferSide =>
  value === 'landlord' ? 'landlord' : 'owner';

export function sellerOffers(side: OfferSide) {
  const base = `/${side}/offers`;
  return {
    keys: {
      list: [side, 'offers'] as const,
      thread: (id: string) => [side, 'offers', id, 'thread'] as const,
      /** Under `list`, so any offer action that refreshes the list refreshes this too. */
      compare: [side, 'offers', 'compare'] as const,
    },
    list: (page = 1, pageSize = 50) =>
      apiFetch<Paginated<OwnerOffer>>(`${base}?page=${page}&pageSize=${pageSize}`),
    thread: (id: string) => apiFetch<OwnerOfferThreadMessage[]>(`${base}/${id}/thread`),
    accept: (id: string) => apiFetch<unknown>(`${base}/${id}/accept`, { method: 'POST' }),
    reject: (id: string) => apiFetch<unknown>(`${base}/${id}/reject`, { method: 'POST' }),
    counter: (id: string, amount: number, message?: string) =>
      apiFetch<unknown>(`${base}/${id}/counter`, { method: 'POST', body: { amount, message } }),
    compare: () => apiFetch<OfferComparison>('/seller/offers/compare'),
  };
}

export interface ComparedOffer {
  offerId: string;
  buyerName: string;
  label: string;
  amount: string;
  pricePosition: string;
  originalAmount: string | null;
  yourCounter: string | null;
  /** Who moved last: "yours" means the seller can respond. */
  turn: 'yours' | 'buyer' | 'new';
  deposit: string | null;
  financing: string;
  financingNote: string;
  documents: string[];
  buyer: {
    verified: boolean;
    trustScore: number;
    completedPurchases: number;
    withdrawnOffersLastYear: number;
  };
  expiry: string;
  counterOption: { amount: string; basis: string } | null;
  standsOut: string;
  counterReasoning: string | null;
}

export interface OfferComparison {
  listings: {
    listingId: string;
    property: string;
    asking: string;
    daysListed: number | null;
    market: string | null;
    /** Another offer was already accepted: these cannot be taken while that sale stands. */
    saleInProgress?: string | null;
    overview: string;
    offers: ComparedOffer[];
  }[];
  source: 'ai' | 'heuristic';
  disclaimer: string;
}
