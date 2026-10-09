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
  deliveryPartnerOrganizationId: string | null;
  deliveryPartnerName: string | null;
  status: string;
  createdAt: string;
}

/** A vetted firm a managed engagement can be handed to for local delivery. */
export interface PartnerFirm {
  id: string;
  name: string;
}

export const adminManagedService = {
  /** GetRentos Managed opt-ins awaiting a portfolio manager and activation. */
  listPending(): Promise<ApiResponse<ManagedMandate[]>> {
    return safeCall(() =>
      authFetch<ManagedMandate[]>('/admin/management-mandates/managed-pending')
    );
  },

  /** Vetted firms ops can designate as a delivery partner. */
  listPartnerFirms(): Promise<ApiResponse<PartnerFirm[]>> {
    return safeCall(() => authFetch<PartnerFirm[]>('/admin/management-mandates/partner-firms'));
  },

  /** Assign the portfolio manager (and optionally a delivery partner) and turn the engagement on. */
  activate(
    id: string,
    managerUserId: string,
    deliveryPartnerOrganizationId?: string
  ): Promise<ApiResponse<ManagedMandate>> {
    return safeCall(() =>
      authFetch<ManagedMandate>(`/admin/management-mandates/${id}/activate-managed`, {
        method: 'POST',
        body: JSON.stringify({
          managerUserId,
          ...(deliveryPartnerOrganizationId ? { deliveryPartnerOrganizationId } : {}),
        }),
      })
    );
  },

  /** Assign one manager (and optional delivery partner) to several opt-ins at once. */
  activateBulk(
    mandateIds: string[],
    managerUserId: string,
    deliveryPartnerOrganizationId?: string
  ): Promise<ApiResponse<BulkActivateResult>> {
    return safeCall(() =>
      authFetch<BulkActivateResult>('/admin/management-mandates/activate-managed-bulk', {
        method: 'POST',
        body: JSON.stringify({
          mandateIds,
          managerUserId,
          ...(deliveryPartnerOrganizationId ? { deliveryPartnerOrganizationId } : {}),
        }),
      })
    );
  },

  /** Refuse several opt-ins in one pass, under one shared reason. */
  rejectBulk(mandateIds: string[], reason: string): Promise<ApiResponse<BulkRejectResult>> {
    return safeCall(() =>
      authFetch<BulkRejectResult>('/admin/management-mandates/reject-managed-bulk', {
        method: 'POST',
        body: JSON.stringify({ mandateIds, reason }),
      })
    );
  },
};

/** The outcome of a bulk activation: a partial-success summary. */
export interface BulkActivateResult {
  requested: number;
  activated: number;
  skipped: { id: string; reason: string }[];
}

/** The outcome of a bulk rejection: a partial-success summary. */
export interface BulkRejectResult {
  requested: number;
  rejected: number;
  skipped: { id: string; reason: string }[];
}
