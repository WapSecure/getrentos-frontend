import { authFetch, safeCall, type ApiResponse } from '@sureground/shared';

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
  | 'MISSING_AT_GATEWAY'
  | 'TRANSFER_UNKNOWN'
  | 'TRANSFER_MISSING_AT_GATEWAY'
  | 'DUPLICATE_PAYOUT'
  | 'REVERSED_AFTER_CONFIRMATION';

// Amounts are whole naira.
export type PaymentProvider = 'PAYSTACK' | 'MONNIFY';

export interface CollectionLine {
  kind: CollectionLineKind;
  product: CollectionProduct | null;
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
    transfersOut?: number;
    matched: number;
    exceptions: number;
  };
  // UNKNOWN is a reference no product knows.
  byProduct: Record<string, { count: number; amount: number }>;
  byProvider?: Partial<Record<PaymentProvider, { count: number; amount: number; fees: number }>>;
  settlements?: {
    provider: PaymentProvider;
    id: string;
    status: string;
    amount: number;
    fees: number;
    settledAt: string | null;
  }[];
  exceptions: CollectionLine[];
  refunds: { reference: string; product: CollectionProduct | null; amount: number }[];
  // In naira.
  transfersOut?: { count: number; amount: number; failed: number; balance: number | null };
}

export const adminCollectionsReconciliationService = {
  // Lagos days, YYYY-MM-DD, both included; at most 31 days.
  report(from: string, to: string): Promise<ApiResponse<CollectionsReport>> {
    return safeCall(() =>
      authFetch<CollectionsReport>(
        `/admin/collections-reconciliation?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
      )
    );
  },
};
