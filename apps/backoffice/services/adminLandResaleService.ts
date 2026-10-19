import { authFetch, safeCall } from '@getrentos/shared';

/** A condition precedent on a land resale (§9.3); mirrors the backend DTO. */
export interface LandResaleCondition {
  key: string;
  label: string;
  status: 'PENDING' | 'DELIVERED' | 'SATISFIED' | 'WAIVED' | 'FAILED';
  deadline?: string;
  failed: boolean;
  basis?: string;
  remedy: string;
  deliveredByDeveloper: boolean;
  deliveredAt?: string;
  deliveredNote?: string;
  documentId?: string;
  decidedAt?: string;
  note?: string;
}

export interface LandResaleQueueItem {
  transactionId: string;
  propertyId: string;
  propertyTitle: string;
  buyerName: string;
  sellerName: string;
  amount: number;
  escrowStatus: string;
  openConditions: number;
  failedConditions: number;
  awaitingBuyer: number;
  nextDeadline?: string;
  createdAt: string;
}

export const landResaleKeys = {
  queue: ['admin', 'land', 'resales', 'conditions'] as const,
  conditions: (txId: string) => ['admin', 'land', 'resales', txId, 'conditions'] as const,
};

const conditionsPath = (txId: string) =>
  `/admin/land/transactions/${encodeURIComponent(txId)}/conditions`;

/** Reading needs `sales.view`; deciding a condition needs `verifications.approve`. */
export const adminLandResaleService = {
  queue: () => safeCall(() => authFetch<LandResaleQueueItem[]>('/admin/land/resales/conditions')),
  conditions: (txId: string) =>
    safeCall(() => authFetch<LandResaleCondition[]>(conditionsPath(txId))),
  decide: (txId: string, key: string, status: 'SATISFIED' | 'FAILED', note: string) =>
    safeCall(() =>
      authFetch<LandResaleCondition[]>(
        `${conditionsPath(txId)}/${encodeURIComponent(key)}/decide`,
        {
          method: 'POST',
          body: JSON.stringify({ status, note }),
        }
      )
    ),
};
