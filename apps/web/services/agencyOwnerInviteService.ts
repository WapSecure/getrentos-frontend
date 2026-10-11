import { authFetch, safeCall, type ApiResponse } from '@/lib/apiHelpers';

export type AgencyOwnerInviteStatus = 'PENDING' | 'CLAIMED' | 'REVOKED' | 'EXPIRED';

export interface AgencyOwnerInvite {
  id: string;
  email: string;
  name: string | null;
  note: string | null;
  status: AgencyOwnerInviteStatus;
  hasAccount: boolean;
  claimedAt: string | null;
  expiresAt: string;
  createdAt: string;
}

export interface AgencyOwnerInviteClaimInfo {
  organizationName: string;
  email: string;
  status: AgencyOwnerInviteStatus;
  expired: boolean;
}

export const agencyOwnerInviteService = {
  list(): Promise<ApiResponse<AgencyOwnerInvite[]>> {
    return safeCall(() => authFetch<AgencyOwnerInvite[]>('/agency/owner-invites'));
  },

  invite(input: {
    email: string;
    name?: string;
    note?: string;
  }): Promise<ApiResponse<AgencyOwnerInvite>> {
    return safeCall(() =>
      authFetch<AgencyOwnerInvite>('/agency/owner-invites', {
        method: 'POST',
        body: JSON.stringify(input),
      })
    );
  },

  revoke(id: string): Promise<ApiResponse<AgencyOwnerInvite>> {
    return safeCall(() =>
      authFetch<AgencyOwnerInvite>(`/agency/owner-invites/${id}/revoke`, { method: 'POST' })
    );
  },

  claimInfo(token: string): Promise<ApiResponse<AgencyOwnerInviteClaimInfo>> {
    return safeCall(() =>
      authFetch<AgencyOwnerInviteClaimInfo>(
        `/agency/owner-invites/claim/${encodeURIComponent(token)}`
      )
    );
  },

  claim(token: string): Promise<ApiResponse<{ organizationName: string }>> {
    return safeCall(() =>
      authFetch<{ organizationName: string }>(
        `/agency/owner-invites/claim/${encodeURIComponent(token)}`,
        { method: 'POST' }
      )
    );
  },
};
