import { withStepUpSummary } from '@sureground/shared';
import { authFetch, safeCall, type Paginated } from '@/lib/apiHelpers';
import type { LandMilestone } from '@/types/landBuyer';
import type {
  SaleDispute,
  TransactionWorkspace,
  WorkspaceViewerRole,
} from '@/types/transactionWorkspace';

// Neutral routes for any sale (built home or land resale); they work wherever land is switched off.
const WORKSPACE_BASE: Record<WorkspaceViewerRole, string> = {
  BUYER: '/buyer/transactions',
  SELLER: '/seller/transactions',
  REPRESENTATIVE: '/representing/transactions',
};

const post = <T>(path: string, body?: unknown) =>
  authFetch<T>(path, {
    method: 'POST',
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

const step = (txId: string, key: string) =>
  `/buyer/transactions/${encodeURIComponent(txId)}/milestones/${encodeURIComponent(key)}`;

export const transactionWorkspaceService = {
  /** 404 for anyone but the party asked for; a representative needs VIEW (403 otherwise). */
  get: (role: WorkspaceViewerRole, txId: string) =>
    safeCall(() =>
      authFetch<TransactionWorkspace>(
        `${WORKSPACE_BASE[role]}/${encodeURIComponent(txId)}/workspace`
      )
    ),

  /** Re-authenticates: the handover also stands for the deposit release. */
  confirmMilestone: (txId: string, key: string, label: string) =>
    safeCall(() =>
      withStepUpSummary(`Confirm “${label}” on this purchase`, () =>
        post<LandMilestone>(`${step(txId, key)}/confirm`)
      )
    ),

  disputeMilestone: (txId: string, key: string, reason: string) =>
    safeCall(() => post<LandMilestone>(`${step(txId, key)}/dispute`, { reason: reason.trim() })),

  /** Deposit disputes I raised or am the subject of (buyer or seller only; newest first). */
  saleDisputes: () =>
    safeCall(() => authFetch<Paginated<SaleDispute>>('/marketplace/disputes?pageSize=100')),

  /** Puts the held deposit on hold until Sureground decides; the buyer or the seller may raise it. */
  disputeDeposit: (txId: string, input: { title: string; description: string }) =>
    safeCall(() =>
      post<SaleDispute>(`/marketplace/transactions/${encodeURIComponent(txId)}/dispute`, {
        title: input.title.trim(),
        category: 'ESCROW',
        description: input.description.trim(),
      })
    ),
};
