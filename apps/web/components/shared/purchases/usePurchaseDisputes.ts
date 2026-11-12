'use client';

import { useQuery } from '@tanstack/react-query';
import { unwrap } from '@/lib/apiHelpers';
import { transactionWorkspaceKeys } from '@/lib/queryKeys';
import { landDisputeKeys, landDisputeService } from '@/services/landDisputeService';
import { transactionWorkspaceService } from '@/services/transactionWorkspaceService';
import type { LandDispute } from '@/types/landDispute';
import type {
  SaleDispute,
  TransactionWorkspace,
  WorkspaceMilestone,
} from '@/types/transactionWorkspace';

const ACTIVE_SALE_DISPUTE = new Set<SaleDispute['status']>(['OPEN', 'UNDER_REVIEW', 'ESCALATED']);
/** The money statuses in which Sureground still holds a deposit that can be disputed. */
const DISPUTABLE_MONEY = new Set(['PROTECTED', 'RELEASE_REQUESTED']);

export interface PurchaseDisputes {
  /** Steps the buyer disputed with the seller (a step flag, not a case Sureground decides). */
  milestones: WorkspaceMilestone[];
  /** Deposit disputes on this sale, decided by Sureground. */
  sale: SaleDispute[];
  /** Land cases on this plot that the viewer raised or is party to (land resale only). */
  land: LandDispute[];
  /** The buyer or seller can put the held deposit into dispute now. */
  canDisputeDeposit: boolean;
  /** The buyer can open a land case on this plot. */
  canReportLand: boolean;
}

/**
 * Every dispute that touches one purchase, from the existing dispute routes: deposit disputes
 * (`/marketplace/disputes`), land cases (`/land/disputes`) and disputed steps on the workspace.
 */
export const usePurchaseDisputes = (data: TransactionWorkspace | undefined): PurchaseDisputes => {
  const role = data?.viewer.role;
  const isParty = role === 'BUYER' || role === 'SELLER';
  const isLand = data?.plan === 'LAND_RESALE';

  // Only the buyer and the seller are parties to a deposit dispute; a representative is refused.
  const saleQuery = useQuery({
    queryKey: transactionWorkspaceKeys.saleDisputes,
    queryFn: () => unwrap(transactionWorkspaceService.saleDisputes()),
    enabled: Boolean(data) && isParty,
  });
  const landQuery = useQuery({
    queryKey: landDisputeKeys.mine,
    queryFn: () => unwrap(landDisputeService.mine()),
    enabled: Boolean(data) && isLand,
  });

  if (!data) {
    return { milestones: [], sale: [], land: [], canDisputeDeposit: false, canReportLand: false };
  }
  const sale = (saleQuery.data?.items ?? []).filter((d) => d.transactionId === data.transactionId);
  const land = (landQuery.data ?? []).filter((d) => d.propertyId === data.propertyId);
  return {
    milestones: data.milestones.filter((m) => m.status === 'DISPUTED'),
    sale,
    land,
    // Wait for the list, so a second dispute is never offered while one is active.
    canDisputeDeposit:
      isParty &&
      saleQuery.isSuccess &&
      DISPUTABLE_MONEY.has(data.statuses.moneyStatus.code) &&
      !sale.some((d) => ACTIVE_SALE_DISPUTE.has(d.status)),
    canReportLand: isLand && role === 'BUYER',
  };
};
