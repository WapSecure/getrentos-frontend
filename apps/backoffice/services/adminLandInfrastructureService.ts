import { authFetch, safeCall } from '@getrentos/shared';

export interface AdminEstateCommitmentUpdate {
  status: string;
  note: string;
  byRole: 'DEVELOPER' | 'BUYER' | 'STAFF';
  byName: string;
  hasEvidence: boolean;
  documentId?: string;
  at: string;
}

export interface AdminEstateCommitment {
  id: string;
  estate: string;
  kindLabel: string;
  title: string;
  description: string;
  status: 'DELIVERED' | 'DISPUTED';
  targetDate?: string;
  deliveredAt?: string;
  evidenceCount: number;
  updates?: AdminEstateCommitmentUpdate[];
}

export interface AdminEstateChangeOrder {
  id: string;
  estate: string;
  commitment: string;
  kind: 'DATE_CHANGE' | 'SCOPE_CHANGE' | 'WITHDRAWAL';
  reason: string;
  newTargetDate?: string;
  newDescription?: string;
  acknowledged: number;
  objections: string[];
  respondBy: string;
}

export interface AdminInfrastructureQueue {
  commitments: AdminEstateCommitment[];
  changeOrders: AdminEstateChangeOrder[];
}

export const landInfrastructureKeys = {
  queue: ['admin', 'land', 'infrastructure'] as const,
};

const post = (path: string, body: unknown) =>
  safeCall(() =>
    authFetch<AdminInfrastructureQueue>(`/admin/land/infrastructure/${path}`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  );

/** Delivery claims to check and contested change orders (`verifications.review` / `.approve`). */
export const adminLandInfrastructureService = {
  queue: () => safeCall(() => authFetch<AdminInfrastructureQueue>('/admin/land/infrastructure')),
  verify: (commitmentId: string, note: string) =>
    post(`commitments/${encodeURIComponent(commitmentId)}/verify`, { reason: note.trim() }),
  reject: (commitmentId: string, note: string) =>
    post(`commitments/${encodeURIComponent(commitmentId)}/reject`, { reason: note.trim() }),
  decide: (changeOrderId: string, decision: 'APPLY' | 'REJECT', note: string) =>
    post(`change-orders/${encodeURIComponent(changeOrderId)}/decide`, {
      decision,
      note: note.trim(),
    }),
};
