export const PURCHASE_ROUTES = {
  buyerWorkspace: (txId: string) => `/buyer/transactions/${encodeURIComponent(txId)}`,
  representingWorkspace: (txId: string) => `/representing/transactions/${encodeURIComponent(txId)}`,
  buyerDepositDispute: (id: string) => `/buyer/disputes/${encodeURIComponent(id)}`,
  /** The same thread, for the seller. */
  ownerDepositDispute: (id: string) => `/owner/disputes/${encodeURIComponent(id)}`,
  landDispute: (id: string) => `/land/disputes/${encodeURIComponent(id)}`,
  BUYER_REPRESENTATIVES: '/buyer/representatives',
  REPRESENTING: '/representing',
} as const;
