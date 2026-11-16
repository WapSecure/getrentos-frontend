import type { Href } from 'expo-router';
import type { PurchaseSummary } from '@sureground/shared';

export const purchaseWorkspaceHref = (
  purchase: Pick<PurchaseSummary, 'role' | 'transactionId'>
): string =>
  `/(app)/purchase-workspace/${encodeURIComponent(purchase.transactionId)}${
    purchase.role === 'REPRESENTATIVE' ? '?role=representative' : ''
  }`;

/** A deposit dispute's thread, for its buyer or seller. */
export const depositDisputeHref = (disputeId: string): string =>
  `/(app)/dispute/${encodeURIComponent(disputeId)}`;

export const asHref = (path: string) => path as Href;
