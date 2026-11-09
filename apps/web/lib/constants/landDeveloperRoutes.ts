import { ROUTES } from '@sureground/shared';

export const LAND_DEVELOPER_ROUTES = {
  portfolio: (propertyId?: string) =>
    propertyId
      ? `${ROUTES.OWNER_LAND}?property=${encodeURIComponent(propertyId)}`
      : ROUTES.OWNER_LAND,
  layout: (propertyId: string) => `${ROUTES.OWNER_LAND}/${encodeURIComponent(propertyId)}/layout`,
  analytics: (propertyId: string) =>
    `${ROUTES.OWNER_LAND}/${encodeURIComponent(propertyId)}/analytics`,
  authority: (propertyId: string) =>
    `${ROUTES.OWNER_LAND}/${encodeURIComponent(propertyId)}/authority`,
  purchases: (propertyId?: string) =>
    propertyId
      ? `${ROUTES.OWNER_LAND}/purchases?property=${encodeURIComponent(propertyId)}`
      : `${ROUTES.OWNER_LAND}/purchases`,
  purchase: (purchaseId: string) =>
    `${ROUTES.OWNER_LAND}/purchases/${encodeURIComponent(purchaseId)}`,
  transactionMilestones: (txId: string, propertyId?: string) =>
    `${ROUTES.OWNER_LAND}/transactions/${encodeURIComponent(txId)}${
      propertyId ? `?property=${encodeURIComponent(propertyId)}` : ''
    }`,
} as const;

// A plain string for nav matching.
export const OWNER_LAND_SALES_ROUTE = `${ROUTES.OWNER_LAND}/purchases`;
