import { authFetch, safeCall, type ApiResponse } from '@sureground/shared';

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

  // canManage and canTransact are separate grants, so a manager can run a property without being trusted with its payouts.
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

  // Takes effect immediately for the publication gate.
  async revoke(id: string, reason: string): Promise<ApiResponse<PropertyAuthorityClaim>> {
    return safeCall(() =>
      authFetch<PropertyAuthorityClaim>(`/admin/property-authorities/${id}/revoke`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      })
    );
  },
};
