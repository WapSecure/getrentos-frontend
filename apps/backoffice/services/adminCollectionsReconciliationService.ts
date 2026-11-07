import { authFetch, safeCall, type ApiResponse } from '@getrentos/shared';

export type CollectionProduct =
  | 'RENT'
  | 'RENT_LEGACY'
  | 'ESCROW'
  | 'SHORTLET'
  | 'LAND'
  | 'FLEX'
  | 'DUES'
  | 'VENDOR_TOP_UP'
  | 'SUBSCRIPTION';

export type CollectionLineKind =
  | 'MATCHED'
  | 'AMOUNT_MISMATCH'
  | 'NOT_APPLIED'
  | 'UNKNOWN_REFERENCE'
  | 'MISSING_AT_GATEWAY';

/** One payment that does not line up. Amounts are whole naira. */
export type PaymentProvider = 'PAYSTACK' | 'MONNIFY';

export interface CollectionLine {
  kind: CollectionLineKind;
  product: CollectionProduct | null;
  /** The company that took it. */
  provider?: PaymentProvider;
  reference: string;
  gatewayAmount: number | null;
  bookAmount: number | null;
  inUnmatchedQueue?: boolean;
}

export interface CollectionsReport {
  from: string;
  to: string;
  totals: {
    gatewayIn: number;
    gatewayFees: number;
    refundsOut: number;
    matched: number;
    exceptions: number;
  };
  /** Keyed by product, or UNKNOWN for a reference no product knows. */
  byProduct: Record<string, { count: number; amount: number }>;
  /** Collections and the company's fees, per payment company. */
  byProvider?: Partial<Record<PaymentProvider, { count: number; amount: number; fees: number }>>;
  exceptions: CollectionLine[];
  refunds: { reference: string; product: CollectionProduct | null; amount: number }[];
}

export const adminCollectionsReconciliationService = {
  /** `from` and `to` are Lagos days, YYYY-MM-DD, both included; at most 31 days. */
  report(from: string, to: string): Promise<ApiResponse<CollectionsReport>> {
    return safeCall(() =>
      authFetch<CollectionsReport>(
        `/admin/collections-reconciliation?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
      )
    );
  },
};
