import { authFetch, safeCall, type ApiResponse } from '@/lib/apiHelpers';

/** A disputed or unfinished matter on the property the owner sees before changing manager. */
export interface TransferOpenItem {
  kind:
    | 'LEGAL_CASE'
    | 'STATEMENT_DISPUTE'
    | 'DEPOSIT_DEDUCTION'
    | 'FROZEN_RENT'
    | 'OPEN_MAINTENANCE'
    | 'TERMINATION_REQUEST';
  id: string;
  label: string;
}

export interface TransferPreview {
  propertyId: string;
  propertyName: string;
  running: {
    mandateId: string;
    manager: string;
    managerIsGetRentos: boolean;
    scope: string[];
    noticePeriodDays: number;
    noticeServedAt: string | null;
    noticeEndsAt: string;
  }[];
  openItems: TransferOpenItem[];
  openTransferId: string | null;
}

export interface ManagementTransfer {
  id: string;
  propertyId: string;
  propertyName: string;
  status: 'OPEN' | 'SWITCHED' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
  effectiveAt: string;
  reason: string | null;
  outgoing: { mandateId: string; manager: string; status: string } | null;
  incoming: { manager: string; mandateId: string | null; status: string | null; ready: boolean };
  acknowledgedItems: TransferOpenItem[];
  switchLog: { step: string; ok: boolean; note: string }[];
  createdAt: string;
  switchedAt: string | null;
  cancelledAt: string | null;
}

export interface RequestTransferInput {
  propertyId: string;
  fromMandateId?: string;
  incomingOrganizationId?: string;
  incomingIsGetRentos?: boolean;
  effectiveAt: string;
  reason?: string;
  acknowledgeOpenItems?: boolean;
}

export type DepositTreatment = 'HANDED_TO_INCOMING' | 'RETURNED_TO_TENANT' | 'PAID_TO_GETRENTOS';

export interface HandoverSnapshot {
  asOf: string;
  property: { id: string; name: string; address: string };
  outgoing: string | null;
  incoming: string;
  leases: {
    leaseId: string;
    unit: string;
    tenant: string;
    rent: number;
    rentPeriod: string | null;
    start: string;
    end: string;
    arrears: number;
    heldForOwner: number;
    credit: number;
    deposit: { id: string; amount: number; status: string; heldByGetRentos: boolean } | null;
  }[];
  totals: {
    arrears: number;
    heldForOwner: number;
    credit: number;
    depositsWithGetRentos: number;
    depositsOutside: number;
  };
  ownerMoney: { heldByGetRentos: number; heldByOutgoingFirm: number | null };
  openWork: { id: string; category: string; description: string; status: string }[];
  documents: { id: string; type: string; name: string | null }[];
  inspections: { id: string; type: string; status: string; date: string | null }[];
  openItems: TransferOpenItem[];
}

export interface Handover {
  transferId: string;
  status: ManagementTransfer['status'];
  required: { outgoing: boolean; incoming: boolean };
  viewer?: { isOwner: boolean; isOutgoing: boolean; isIncoming: boolean };
  pack: {
    hash: string;
    generatedAt: string;
    snapshot: HandoverSnapshot;
    depositAttestations:
      | {
          depositHoldId: string;
          amount: number;
          treatment: DepositTreatment;
          note: string | null;
        }[]
      | null;
    keysDeclaration: string | null;
    outgoingSignedAt: string | null;
    ownerSignedAt: string | null;
    incomingSignedAt: string | null;
    disputeReason: string | null;
    disputedAt: string | null;
    disputeResolution: string | null;
    resolvedAt: string | null;
  } | null;
}

export const managementTransferService = {
  preview: (propertyId: string): Promise<ApiResponse<TransferPreview>> =>
    safeCall(() =>
      authFetch<TransferPreview>(
        `/management-transfers/preview?propertyId=${encodeURIComponent(propertyId)}`
      )
    ),
  /** Asks the owner to confirm it's them (handled by authFetch) before scheduling. */
  request: (input: RequestTransferInput): Promise<ApiResponse<ManagementTransfer>> =>
    safeCall(() =>
      authFetch<ManagementTransfer>('/management-transfers', {
        method: 'POST',
        body: JSON.stringify(input),
      })
    ),
  mine: (): Promise<ApiResponse<ManagementTransfer[]>> =>
    safeCall(() => authFetch<ManagementTransfer[]>('/management-transfers')),
  managing: (): Promise<ApiResponse<ManagementTransfer[]>> =>
    safeCall(() => authFetch<ManagementTransfer[]>('/management-transfers/managing')),
  handover: (id: string): Promise<ApiResponse<Handover>> =>
    safeCall(() => authFetch<Handover>(`/management-transfers/${id}/handover`)),
  exportHandover: (id: string): Promise<ApiResponse<unknown>> =>
    safeCall(() => authFetch<unknown>(`/management-transfers/${id}/handover/export`)),
  signOutgoing: (
    id: string,
    input: {
      hash: string;
      keysDeclaration: string;
      deposits: { depositHoldId: string; treatment: DepositTreatment; note?: string }[];
    }
  ): Promise<ApiResponse<Handover>> =>
    safeCall(() =>
      authFetch<Handover>(`/management-transfers/${id}/handover/sign-outgoing`, {
        method: 'POST',
        body: JSON.stringify(input),
      })
    ),
  sign: (id: string, side: 'owner' | 'incoming', hash: string): Promise<ApiResponse<Handover>> =>
    safeCall(() =>
      authFetch<Handover>(`/management-transfers/${id}/handover/sign-${side}`, {
        method: 'POST',
        body: JSON.stringify({ hash }),
      })
    ),
  dispute: (id: string, reason: string): Promise<ApiResponse<Handover>> =>
    safeCall(() =>
      authFetch<Handover>(`/management-transfers/${id}/handover/dispute`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      })
    ),
  cancel: (id: string): Promise<ApiResponse<ManagementTransfer>> =>
    safeCall(() =>
      authFetch<ManagementTransfer>(`/management-transfers/${id}/cancel`, { method: 'POST' })
    ),
};
