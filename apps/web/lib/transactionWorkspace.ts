import type { PurchaseDispute, PurchaseSummary } from '@/types/transactionWorkspace';
import { PURCHASE_ROUTES } from './constants/purchaseRoutes';

// The pure purchase workspace helpers live in @sureground/shared (web and mobile); only the web's
// routes stay here.

/** The buyer opens their own workspace; a representative opens the one they see for the buyer. */
export const purchaseWorkspaceHref = (purchase: Pick<PurchaseSummary, 'role' | 'transactionId'>) =>
  purchase.role === 'REPRESENTATIVE'
    ? PURCHASE_ROUTES.representingWorkspace(purchase.transactionId)
    : PURCHASE_ROUTES.buyerWorkspace(purchase.transactionId);

/** A deposit dispute opens its thread; a land case opens the land dispute page. */
export const purchaseDisputeHref = (dispute: Pick<PurchaseDispute, 'id' | 'kind'>) =>
  dispute.kind === 'DEPOSIT'
    ? PURCHASE_ROUTES.buyerDepositDispute(dispute.id)
    : PURCHASE_ROUTES.landDispute(dispute.id);
