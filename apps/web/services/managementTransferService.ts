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
  cancel: (id: string): Promise<ApiResponse<ManagementTransfer>> =>
    safeCall(() =>
      authFetch<ManagementTransfer>(`/management-transfers/${id}/cancel`, { method: 'POST' })
    ),
};
