import { apiFetch } from './client';
import type { Paginated } from './properties';
import type { PayoutSentTo } from '@sureground/shared';

export interface SellerPayoutAccount {
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  verified: boolean;
  /** While a recent change is on hold; not sent by the API yet, shown once it is. */
  payoutHoldUntil?: string | null;
}

export type SellerPayoutStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED';

export interface SellerSalePayout {
  transactionId: string;
  amount: number;
  payoutStatus: SellerPayoutStatus;
  paidAt?: string;
  propertyTitle?: string;
  releasedAt?: string;
  /** Where it went (bank + last four digits), only when the API can prove it. */
  sentTo?: PayoutSentTo | null;
}

/** "Other bank" still takes any code; the API resolves the account against the bank either way. */
export { COMMON_BANKS } from '@sureground/shared';

export const sellerPayoutApi = {
  account: () => apiFetch<SellerPayoutAccount>('/marketplace/seller/payout-account'),
  updateAccount: (input: { bankCode: string; accountNumber: string }) =>
    apiFetch<SellerPayoutAccount>('/marketplace/seller/payout-account', {
      method: 'POST',
      body: input,
    }),
  payouts: (page = 1, pageSize = 20) =>
    apiFetch<Paginated<SellerSalePayout>>(
      `/marketplace/seller/payouts?page=${page}&pageSize=${pageSize}`
    ),
};
