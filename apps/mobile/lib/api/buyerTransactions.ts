import { apiFetch } from './client';
import type { Paginated } from './buyer';

// deposit → held → released, with frozen (a dispute is open) and refunded as
// terminal branches. The enum also has VERIFICATION_PENDING / SETTLEMENT_PENDING
// / DISPUTED, but no service ever writes them (a dispute sets FROZEN), so they
// are not surfaced (DEF-240).
export type BuyerEscrowStatus =
  | 'deposit_pending'
  | 'funds_held'
  | 'released'
  | 'frozen'
  | 'refunded';

export const BUYER_ESCROW_STATUS_LABEL: Record<BuyerEscrowStatus, string> = {
  deposit_pending: 'Deposit pending',
  funds_held: 'Funds held',
  released: 'Released',
  frozen: 'Frozen',
  refunded: 'Refunded',
};

export const BUYER_ESCROW_STATUS_TONE: Record<
  BuyerEscrowStatus,
  'warning' | 'info' | 'success' | 'danger'
> = {
  deposit_pending: 'warning',
  funds_held: 'info',
  released: 'success',
  frozen: 'danger',
  refunded: 'danger',
};

export interface BuyerTransaction {
  id: string;
  offerId: string;
  propertyId: string;
  propertyTitle: string;
  ownerName: string;
  purchasePrice: number;
  escrowStatus: BuyerEscrowStatus;
  milestones?: { label: string; completed: boolean }[];
  activityLog?: { id: string; actor: string; action: string; timestamp: string }[];
  disputeReason?: string;
  createdAt: string;
  releasedAt?: string;
  authorizationUrl?: string;
  reference?: string;
}

export const buyerTransactionsApi = {
  list: (page = 1, pageSize = 20) =>
    apiFetch<Paginated<BuyerTransaction>>(`/buyer/transactions?page=${page}&pageSize=${pageSize}`),

  deposit: (id: string) =>
    apiFetch<BuyerTransaction>(`/buyer/transactions/${id}/deposit`, { method: 'POST' }),

  release: (id: string) =>
    apiFetch<BuyerTransaction>(`/buyer/transactions/${id}/release`, { method: 'POST' }),

  refund: (id: string) =>
    apiFetch<BuyerTransaction>(`/buyer/transactions/${id}/refund`, { method: 'POST' }),
};
