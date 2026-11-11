import { authFetch, safeCall } from '@/lib/apiHelpers';
import type { ForeignBankAccountInput } from '@sureground/shared';

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

/** Where statement payouts go: the Nigerian account (landlord/settings/payout) or an account abroad. */
export const ownerPayoutService = {
  getPreference: () => safeCall(() => authFetch<PayoutPreference>('/owner/payout-preference')),
  updatePreference: (data: {
    method: PayoutMethod;
    foreignAccountId?: string;
    fallbackToNgAccount?: boolean;
  }) =>
    safeCall(() =>
      authFetch<PayoutPreference>('/owner/payout-preference', {
        method: 'PUT',
        body: JSON.stringify(data),
      })
    ),
  listForeignAccounts: () =>
    safeCall(() => authFetch<ForeignBankAccount[]>('/owner/foreign-bank-accounts')),
  addForeignAccount: (data: ForeignBankAccountInput) =>
    safeCall(() =>
      authFetch<ForeignBankAccount>('/owner/foreign-bank-accounts', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    ),
  removeForeignAccount: (id: string) =>
    safeCall(() => authFetch<void>(`/owner/foreign-bank-accounts/${id}`, { method: 'DELETE' })),
};
