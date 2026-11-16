import { contactRequestBody } from '@sureground/shared';
import { authFetch, safeCall, type ApiResponse } from '@/lib/apiHelpers';

export type AgencyOwnerInviteStatus = 'PENDING' | 'CLAIMED' | 'REVOKED' | 'EXPIRED';

export interface AgencyOwnerInvite {
  id: string;
  email: string;
  phoneMasked?: string | null;
  name: string | null;
  note: string | null;
  status: AgencyOwnerInviteStatus;
  hasAccount: boolean;
  claimedAt: string | null;
  expiresAt: string;
  createdAt: string;
  deliveredBy?: ('EMAIL' | 'IN_APP')[];
}

export interface AgencyOwnerInviteClaimInfo {
  organizationName: string;
  email: string;
  phoneMasked?: string | null;
  status: AgencyOwnerInviteStatus;
  expired: boolean;
}

export const agencyOwnerInviteService = {
  list(): Promise<ApiResponse<AgencyOwnerInvite[]>> {
    return safeCall(() => authFetch<AgencyOwnerInvite[]>('/agency/owner-invites'));
  },

  /** `contact` is their phone number or email; an email goes as `email`, which older servers accept. */
  invite({
    contact,
    ...input
  }: {
    contact: string;
    name?: string;
    note?: string;
  }): Promise<ApiResponse<AgencyOwnerInvite>> {
    return safeCall(() =>
      authFetch<AgencyOwnerInvite>('/agency/owner-invites', {
        method: 'POST',
        body: JSON.stringify({ ...(contactRequestBody(contact) ?? { contact }), ...input }),
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
