import { authFetch, safeCall, type ApiResponse } from '@getrentos/shared';

/**
 * Property authority claims — the officer's side.
 *
 * Approving one lets someone publish (and optionally move money on) a property
 * they do not own, so this reuses the verification permission model rather than
 * inventing a parallel one. The two capabilities are granted explicitly and
 * separately, and every decision is audited.
 */

export type AuthorityStatus = 'PENDING' | 'ACTIVE' | 'REJECTED' | 'REVOKED' | 'EXPIRED';

export interface PropertyAuthorityClaim {
  id: string;
  propertyId: string;
  userId: string;
  userEmail?: string | null;
  relationship: string;
  status: AuthorityStatus;
  canList: boolean;
  canManage: boolean;
  canTransact: boolean;
  note?: string | null;
  requestedById: string;
  decidedById?: string | null;
  decidedAt?: string | null;
  decisionNote?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  /** Whether the publication gate would count this claim right now. */
  effective: boolean;
}

export const AUTHORITY_STATUSES: AuthorityStatus[] = [
  'PENDING',
  'ACTIVE',
  'REJECTED',
  'REVOKED',
  'EXPIRED',
];

export const propertyAuthorityService = {
  async list(
    query: { status?: string; propertyId?: string; userId?: string } = {}
  ): Promise<ApiResponse<PropertyAuthorityClaim[]>> {
    const params = new URLSearchParams();
    if (query.status) params.set('status', query.status);
    if (query.propertyId) params.set('propertyId', query.propertyId);
    if (query.userId) params.set('userId', query.userId);
    const suffix = params.toString() ? `?${params.toString()}` : '';
    return safeCall(() =>
      authFetch<PropertyAuthorityClaim[]>(`/admin/property-authorities${suffix}`)
    );
  },

  /**
   * Grant the mandate. `canList` is required by the API; `canManage` is the
   * separate permission to run the tenancy, and `canTransact` the separate
   * permission to act on money — so a manager can be trusted to run a property
   * without being trusted with its payouts.
   */
  async approve(
    id: string,
    input: {
      canList: boolean;
      canManage?: boolean;
      canTransact?: boolean;
      expiresInDays?: number;
      note?: string;
    }
  ): Promise<ApiResponse<PropertyAuthorityClaim>> {
    return safeCall(() =>
      authFetch<PropertyAuthorityClaim>(`/admin/property-authorities/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify(input),
      })
    );
  },

  async reject(id: string, reason: string): Promise<ApiResponse<PropertyAuthorityClaim>> {
    return safeCall(() =>
      authFetch<PropertyAuthorityClaim>(`/admin/property-authorities/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      })
    );
  },

  /**
   * Revoke takes effect immediately for the publication gate — the evidence
   * simply stops counting.
   */
  async revoke(id: string, reason: string): Promise<ApiResponse<PropertyAuthorityClaim>> {
    return safeCall(() =>
      authFetch<PropertyAuthorityClaim>(`/admin/property-authorities/${id}/revoke`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      })
    );
  },
};
