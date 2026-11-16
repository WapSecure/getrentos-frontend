import type { PurchaseDispute, PurchaseSummary } from '@/types/transactionWorkspace';
import { PURCHASE_ROUTES } from './constants/purchaseRoutes';

export const purchaseWorkspaceHref = (purchase: Pick<PurchaseSummary, 'role' | 'transactionId'>) =>
  purchase.role === 'REPRESENTATIVE'
    ? PURCHASE_ROUTES.representingWorkspace(purchase.transactionId)
    : PURCHASE_ROUTES.buyerWorkspace(purchase.transactionId);

export const purchaseDisputeHref = (dispute: Pick<PurchaseDispute, 'id' | 'kind'>) =>
  dispute.kind === 'DEPOSIT'
    ? PURCHASE_ROUTES.buyerDepositDispute(dispute.id)
    : PURCHASE_ROUTES.landDispute(dispute.id);
