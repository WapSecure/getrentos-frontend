import { authFetch, safeCall, toQuery, type Paginated } from '@/lib/apiHelpers';

/**
 * Sale-proceeds payouts for anyone who sells on the marketplace — Property
 * Owners, Realtors and Agents all sell through the same seller API, so they
 * share one payout account and one list of payouts.
 */
export interface SellerPayoutAccount {
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  verified: boolean;
}

export type SellerPayoutStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED';

export interface SellerSalePayout {
  transactionId: string;
  amount: number;
  payoutStatus: SellerPayoutStatus;
  paidAt?: string;
  propertyTitle?: string;
  releasedAt?: string;
}

export const sellerPayoutService = {
  getAccount: () =>
    safeCall(() => authFetch<SellerPayoutAccount>('/marketplace/seller/payout-account')),
  updateAccount: (data: { bankCode: string; accountNumber: string }) =>
    safeCall(() =>
      authFetch<SellerPayoutAccount>('/marketplace/seller/payout-account', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    ),
  listSalePayouts: (params: { page?: number; pageSize?: number } = {}) =>
    safeCall(() =>
      authFetch<Paginated<SellerSalePayout>>(`/marketplace/seller/payouts${toQuery(params)}`)
    ),
};
