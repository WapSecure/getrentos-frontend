import { authFetch, safeCall, type ApiResponse } from '@getrentos/shared';

export interface AdminManagementTransfer {
  id: string;
  propertyId: string;
  propertyName: string;
  status: 'OPEN' | 'SWITCHED' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
  effectiveAt: string;
  reason: string | null;
  outgoing: { mandateId: string; manager: string; status: string } | null;
  incoming: { manager: string; mandateId: string | null; status: string | null; ready: boolean };
  acknowledgedItems: { kind: string; id: string; label: string }[];
  switchLog: { step: string; ok: boolean; note: string }[];
  createdAt: string;
  switchedAt: string | null;
}

export interface AdminHandover {
  transferId: string;
  status: AdminManagementTransfer['status'];
  required: { outgoing: boolean; incoming: boolean };
  viewer?: { isOwner: boolean; isOutgoing: boolean; isIncoming: boolean };
  pack: {
    hash: string;
    snapshot: {
      outgoing: string | null;
      incoming: string;
      totals: {
        arrears: number;
        heldForOwner: number;
        credit: number;
        depositsWithGetRentos: number;
        depositsOutside: number;
      };
      leases: {
        leaseId: string;
        tenant: string;
        unit: string;
        deposit: { id: string; amount: number; heldByGetRentos: boolean } | null;
      }[];
    };
    keysDeclaration: string | null;
    depositAttestations:
      | { depositHoldId: string; amount: number; treatment: string; note: string | null }[]
      | null;
    outgoingSignedAt: string | null;
    ownerSignedAt: string | null;
    incomingSignedAt: string | null;
    disputeReason: string | null;
    disputeResolution: string | null;
  } | null;
}

export const adminManagementTransfersService = {
  handover: (id: string): Promise<ApiResponse<AdminHandover>> =>
    safeCall(() => authFetch<AdminHandover>(`/management-transfers/${id}/handover`)),
  resolve: (id: string, resolution: string): Promise<ApiResponse<AdminHandover>> =>
    safeCall(() =>
      authFetch<AdminHandover>(`/admin/management-transfers/${id}/handover/resolve`, {
        method: 'POST',
        body: JSON.stringify({ resolution }),
      })
    ),
  signIncoming: (id: string, hash: string): Promise<ApiResponse<AdminHandover>> =>
    safeCall(() =>
      authFetch<AdminHandover>(`/management-transfers/${id}/handover/sign-incoming`, {
        method: 'POST',
        body: JSON.stringify({ hash }),
      })
    ),
  signOutgoing: (
    id: string,
    input: {
      hash: string;
      keysDeclaration: string;
      deposits: { depositHoldId: string; treatment: string; note?: string }[];
    }
  ): Promise<ApiResponse<AdminHandover>> =>
    safeCall(() =>
      authFetch<AdminHandover>(`/management-transfers/${id}/handover/sign-outgoing`, {
        method: 'POST',
        body: JSON.stringify(input),
      })
    ),
  list: (): Promise<ApiResponse<AdminManagementTransfer[]>> =>
    safeCall(() => authFetch<AdminManagementTransfer[]>('/admin/management-transfers')),
  switchNow: (id: string): Promise<ApiResponse<AdminManagementTransfer>> =>
    safeCall(() =>
      authFetch<AdminManagementTransfer>(`/admin/management-transfers/${id}/switch`, {
        method: 'POST',
      })
    ),
};
