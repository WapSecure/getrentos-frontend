import { authFetch, safeCall, type ApiResponse } from '@getrentos/shared';

export type ManagedServicingTier = 'COLLECT_ONLY' | 'COLLECT_MAINTAIN' | 'FULL_MANAGEMENT';

/** The subset of a management mandate the ops activation queue needs. */
export interface ManagedMandate {
  id: string;
  propertyId: string;
  propertyTitle: string | null;
  ownerName: string | null;
  servicingTier: ManagedServicingTier | null;
  managerUserId: string | null;
  managerName: string | null;
  status: string;
  createdAt: string;
}

export const adminManagedService = {
  /** GetRentos Managed opt-ins awaiting a portfolio manager and activation. */
  listPending(): Promise<ApiResponse<ManagedMandate[]>> {
    return safeCall(() =>
      authFetch<ManagedMandate[]>('/admin/management-mandates/managed-pending')
    );
  },

  /** Assign the portfolio manager and turn the engagement on. */
  activate(id: string, managerUserId: string): Promise<ApiResponse<ManagedMandate>> {
    return safeCall(() =>
      authFetch<ManagedMandate>(`/admin/management-mandates/${id}/activate-managed`, {
        method: 'POST',
        body: JSON.stringify({ managerUserId }),
      })
    );
  },
};
