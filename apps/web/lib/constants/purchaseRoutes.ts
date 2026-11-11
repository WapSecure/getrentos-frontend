// Purchases of any kind (built home or land resale): the workspace and the people acting for a buyer.
export const PURCHASE_ROUTES = {
  buyerWorkspace: (txId: string) => `/buyer/transactions/${encodeURIComponent(txId)}`,
  representingWorkspace: (txId: string) => `/representing/transactions/${encodeURIComponent(txId)}`,
  BUYER_REPRESENTATIVES: '/buyer/representatives',
  REPRESENTING: '/representing',
} as const;
