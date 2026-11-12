import { apiFetch } from './client';
import type { Paginated } from './properties';
import type { NormalisedForeignBankAccount, PayoutSentTo } from '@sureground/shared';

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
  /** Why the last transfer did not complete, while FAILED. */
  failureReason?: string | null;
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

// Where statement payouts go: the Nigerian account, or an account abroad once a licensed partner is
// live (web's ownerPayoutService). Every change goes through step-up.

export type PayoutMethod = 'NG_ACCOUNT' | 'FOREIGN_ACCOUNT';

/** Account numbers and IBANs come back masked. */
export interface ForeignBankAccount {
  id: string;
  accountHolderName: string;
  country: string;
  currency: string;
  bankName: string | null;
  iban: string | null;
  accountNumber: string | null;
  sortCode: string | null;
  routingNumber: string | null;
  transitNumber: string | null;
  institutionNumber: string | null;
  swiftBic: string | null;
  verifiedAt: string | null;
  createdAt: string;
}

export interface PayoutPreference {
  method: PayoutMethod;
  fallbackToNgAccount: boolean;
  ngAccount: { bankName: string; accountNumber: string; accountName: string } | null;
  foreignAccount: ForeignBankAccount | null;
  /** False until a licensed foreign payout partner is live. */
  foreignPayoutsAvailable: boolean;
  nextPayout: {
    state: 'NG_ACCOUNT' | 'FOREIGN_ACCOUNT' | 'FOREIGN_PAYOUT_PENDING_PARTNER';
    fellBackFromForeign: boolean;
  };
  updatedAt: string | null;
}

export const ownerPayoutApi = {
  preference: () => apiFetch<PayoutPreference>('/owner/payout-preference'),
  updatePreference: (input: {
    method: PayoutMethod;
    foreignAccountId?: string;
    fallbackToNgAccount?: boolean;
  }) => apiFetch<PayoutPreference>('/owner/payout-preference', { method: 'PUT', body: input }),
  foreignAccounts: () => apiFetch<ForeignBankAccount[]>('/owner/foreign-bank-accounts'),
  addForeignAccount: (input: NormalisedForeignBankAccount) =>
    apiFetch<ForeignBankAccount>('/owner/foreign-bank-accounts', { method: 'POST', body: input }),
  removeForeignAccount: (id: string) =>
    apiFetch<void>(`/owner/foreign-bank-accounts/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};
