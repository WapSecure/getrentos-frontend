import type { Href } from 'expo-router';
import type { PurchaseSummary } from '@sureground/shared';

export const purchaseWorkspaceHref = (
  purchase: Pick<PurchaseSummary, 'role' | 'transactionId'>
): string =>
  `/(app)/purchase-workspace/${encodeURIComponent(purchase.transactionId)}${
    purchase.role === 'REPRESENTATIVE' ? '?role=representative' : ''
  }`;

export const asHref = (path: string) => path as Href;
