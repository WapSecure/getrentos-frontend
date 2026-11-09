import { apiFetch } from './client';
import type { Paginated } from './properties';
import type { PayoutSentTo } from '@sureground/shared';

/**
 * Where sale proceeds go. Owners, realtors and agents all sell through the
 * marketplace seller API, so they share one payout account and one list.
 */
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

/**
 * Common Nigerian banks with their Paystack codes, so most people tap rather
 * than look a code up. "Other bank" still takes any code; the API resolves the
 * account against the bank either way and says so if it doesn't match.
 */
export const COMMON_BANKS = [
  { code: '058', name: 'GTBank' },
  { code: '044', name: 'Access' },
  { code: '057', name: 'Zenith' },
  { code: '011', name: 'First Bank' },
  { code: '033', name: 'UBA' },
  { code: '070', name: 'Fidelity' },
  { code: '232', name: 'Sterling' },
  { code: '035', name: 'Wema' },
  { code: '50211', name: 'Kuda' },
  { code: '999992', name: 'OPay' },
  { code: '50515', name: 'Moniepoint' },
] as const;

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
