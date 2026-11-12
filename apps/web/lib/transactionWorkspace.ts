import type { PurchaseSummary } from '@/types/transactionWorkspace';
import { PURCHASE_ROUTES } from './constants/purchaseRoutes';

// The pure purchase workspace helpers live in @sureground/shared (web and mobile); only the web's
// routes stay here.

/** The buyer opens their own workspace; a representative opens the one they see for the buyer. */
export const purchaseWorkspaceHref = (purchase: Pick<PurchaseSummary, 'role' | 'transactionId'>) =>
  purchase.role === 'REPRESENTATIVE'
    ? PURCHASE_ROUTES.representingWorkspace(purchase.transactionId)
    : PURCHASE_ROUTES.buyerWorkspace(purchase.transactionId);
