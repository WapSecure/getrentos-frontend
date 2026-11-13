import { contactRequestBody } from '@sureground/shared';
import { authFetch, safeCall, type ApiResponse } from '@/lib/apiHelpers';

export type AgencyOwnerInviteStatus = 'PENDING' | 'CLAIMED' | 'REVOKED' | 'EXPIRED';

export interface AgencyOwnerInvite {
  id: string;
  /** Empty when the invite went by phone number to an account with no email. */
  email: string;
  /** The owner's number, masked ("+234 803 *** 4567"), when the invite has no email. */
  phoneMasked?: string | null;
  name: string | null;
  note: string | null;
  status: AgencyOwnerInviteStatus;
  hasAccount: boolean;
  claimedAt: string | null;
  expiresAt: string;
  createdAt: string;
  /** Only on a new invite: how it reached them (IN_APP is a notification in their app). */
  deliveredBy?: ('EMAIL' | 'IN_APP')[];
}

export interface AgencyOwnerInviteClaimInfo {
  organizationName: string;
  /** Empty for an invite sent by phone number. */
  email: string;
  /** Set instead of email for a phone invite: the invited number, masked. */
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
