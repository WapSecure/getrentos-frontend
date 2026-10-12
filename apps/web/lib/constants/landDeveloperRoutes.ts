import { ROUTES } from '@getrentos/shared';

/**
 * Web-only routes for the owner's land sales tooling: a developer's estate
 * layout, the plot sales desk, and resale conveyance. The land portfolio
 * itself is `ROUTES.OWNER_LAND`.
 */
export const LAND_DEVELOPER_ROUTES = {
  /** The land portfolio, optionally opened on one parcel. */
  portfolio: (propertyId?: string) =>
    propertyId
      ? `${ROUTES.OWNER_LAND}?property=${encodeURIComponent(propertyId)}`
      : ROUTES.OWNER_LAND,
  layout: (propertyId: string) => `${ROUTES.OWNER_LAND}/${encodeURIComponent(propertyId)}/layout`,
  analytics: (propertyId: string) =>
    `${ROUTES.OWNER_LAND}/${encodeURIComponent(propertyId)}/analytics`,
  /** The sales desk; scoped to one parcel's estate when `propertyId` is given. */
  purchases: (propertyId?: string) =>
    propertyId
      ? `${ROUTES.OWNER_LAND}/purchases?property=${encodeURIComponent(propertyId)}`
      : `${ROUTES.OWNER_LAND}/purchases`,
  purchase: (purchaseId: string) =>
    `${ROUTES.OWNER_LAND}/purchases/${encodeURIComponent(purchaseId)}`,
  transactionMilestones: (txId: string) =>
    `${ROUTES.OWNER_LAND}/transactions/${encodeURIComponent(txId)}`,
} as const;

/** The sidebar entry for the sales desk (a plain string for nav matching). */
export const OWNER_LAND_SALES_ROUTE = `${ROUTES.OWNER_LAND}/purchases`;
