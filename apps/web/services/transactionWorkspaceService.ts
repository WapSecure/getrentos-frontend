import { withStepUpSummary } from '@sureground/shared';
import { authFetch, safeCall, type Paginated } from '@/lib/apiHelpers';
import type { LandMilestone } from '@/types/landBuyer';
import type {
  SaleDispute,
  SaleDisputeMessage,
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

  /** One deposit dispute, for its thread (its two parties only). */
  saleDispute: (id: string) =>
    safeCall(() => authFetch<SaleDispute>(`/marketplace/disputes/${encodeURIComponent(id)}`)),

  saleDisputeMessages: (id: string) =>
    safeCall(() =>
      authFetch<SaleDisputeMessage[]>(`/marketplace/disputes/${encodeURIComponent(id)}/messages`)
    ),

  sendSaleDisputeMessage: (id: string, text: string) =>
    safeCall(() =>
      post<SaleDisputeMessage>(`/marketplace/disputes/${encodeURIComponent(id)}/messages`, {
        text: text.trim(),
      })
    ),

  /** Either party, while the dispute is open. Files are kept permanently; returns the dispute with them. */
  addSaleDisputeEvidence: (id: string, file: File, note?: string) => {
    const form = new FormData();
    form.append('file', file);
    if (note?.trim()) form.append('note', note.trim());
    return safeCall(() =>
      authFetch<SaleDispute>(`/marketplace/disputes/${encodeURIComponent(id)}/evidence`, {
        method: 'POST',
        body: form,
      })
    );
  },

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
