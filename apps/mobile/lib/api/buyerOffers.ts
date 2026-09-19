import { apiFetch } from './client';
import type { Paginated } from './buyer';

export type BuyerOfferStatus =
  | 'submitted'
  | 'countered'
  | 'accepted'
  | 'rejected'
  | 'withdrawn'
  | 'expired'
  | 'closed';

export const BUYER_OFFER_STATUS_LABEL: Record<BuyerOfferStatus, string> = {
  submitted: 'Submitted',
  countered: 'Countered',
  accepted: 'Accepted',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
  expired: 'Expired',
  closed: 'Closed',
};

export const BUYER_OFFER_STATUS_TONE: Record<
  BuyerOfferStatus,
  'warning' | 'info' | 'success' | 'danger' | 'neutral'
> = {
  submitted: 'info',
  countered: 'warning',
  accepted: 'success',
  rejected: 'danger',
  withdrawn: 'neutral',
  expired: 'neutral',
  closed: 'neutral',
};

export type BuyerFinancingType = 'cash' | 'mortgage' | 'installment';

export interface BuyerOffer {
  id: string;
  listingId: string;
  propertyId: string;
  propertyTitle: string;
  ownerName: string;
  offerAmount: number;
  askingPrice: number;
  financingType: string;
  depositAmount?: number;
  message?: string;
  status: BuyerOfferStatus;
  submittedAt: string;
}

export interface BuyerOfferThreadMessage {
  id: string;
  offerId: string;
  senderId: string;
  senderName: string;
  type: string;
  amount?: number;
  text?: string;
  timestamp: string;
}

export interface CreateOfferInput {
  listingId: string;
  amount: number;
  depositAmount?: number;
  financingType?: BuyerFinancingType;
  message?: string;
}

export const buyerOffersApi = {
  list: (page = 1, pageSize = 20) =>
    apiFetch<Paginated<BuyerOffer>>(`/buyer/offers?page=${page}&pageSize=${pageSize}`),

  create: (input: CreateOfferInput) =>
    apiFetch<BuyerOffer>('/buyer/offers', { method: 'POST', body: input }),

  withdraw: (id: string) =>
    apiFetch<BuyerOffer>(`/buyer/offers/${id}/withdraw`, { method: 'POST' }),

  counter: (id: string, amount: number, message?: string) =>
    apiFetch<BuyerOffer>(`/buyer/offers/${id}/counter`, {
      method: 'POST',
      body: { amount, message },
    }),

  accept: (id: string) => apiFetch<BuyerOffer>(`/buyer/offers/${id}/accept`, { method: 'POST' }),

  thread: (id: string) => apiFetch<BuyerOfferThreadMessage[]>(`/buyer/offers/${id}/thread`),
};
