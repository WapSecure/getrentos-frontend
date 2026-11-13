// Purchases of any kind (built home or land resale): the workspace and the people acting for a buyer.
export const PURCHASE_ROUTES = {
  buyerWorkspace: (txId: string) => `/buyer/transactions/${encodeURIComponent(txId)}`,
  representingWorkspace: (txId: string) => `/representing/transactions/${encodeURIComponent(txId)}`,
  /** A deposit dispute's thread, for its buyer. */
  buyerDepositDispute: (id: string) => `/buyer/disputes/${encodeURIComponent(id)}`,
  landDispute: (id: string) => `/land/disputes/${encodeURIComponent(id)}`,
  BUYER_REPRESENTATIVES: '/buyer/representatives',
  REPRESENTING: '/representing',
} as const;
