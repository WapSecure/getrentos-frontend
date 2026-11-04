import { apiFetch } from './client';
import type { BadgeTone } from '@getrentos/ui-native';

/**
 * Changing who manages a property, and the handover pack that follows.
 *
 * The owner schedules the change (the API asks them to confirm it's them, which
 * `apiFetch` handles). The current manager runs the property until the date;
 * then their access ends, the new manager's begins and tenants are told. Each
 * party then signs the same frozen pack (by its hash), or disputes it.
 */

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

export type TransferStatus = 'OPEN' | 'SWITCHED' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';

export const TRANSFER_STATUS: Record<TransferStatus, { label: string; tone: BadgeTone }> = {
  OPEN: { label: 'Scheduled', tone: 'info' },
  SWITCHED: { label: 'Taken effect', tone: 'success' },
  COMPLETED: { label: 'Completed', tone: 'success' },
  CANCELLED: { label: 'Called off', tone: 'neutral' },
  DISPUTED: { label: 'Disputed', tone: 'danger' },
};

export interface ManagementTransfer {
  id: string;
  propertyId: string;
  propertyName: string;
  status: TransferStatus;
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

export interface VettedFirm {
  id: string;
  name: string;
  activeEngagements: number;
}

export type Incoming = { kind: 'GETRENTOS' } | { kind: 'FIRM'; id: string } | { kind: 'SELF' };

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

export const DEPOSIT_TREATMENT_LABEL: Record<DepositTreatment, string> = {
  HANDED_TO_INCOMING: 'Handed to the incoming manager',
  RETURNED_TO_TENANT: 'Returned to the tenant',
  PAID_TO_GETRENTOS: 'Paid to GetRentos',
};

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
  status: TransferStatus;
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

/** Today in Lagos, as `yyyy-MM-dd`. */
export const lagosToday = (now = Date.now()) =>
  new Date(now + 60 * 60_000).toISOString().slice(0, 10);

/** Midnight Lagos time on a chosen date, or now for "straight away". */
export const effectiveAtFor = (when: 'ASAP' | 'DATE', date: string, now = new Date()) =>
  when === 'ASAP' ? now.toISOString() : date ? `${date}T00:00:00+01:00` : '';

/** What still stops the change being scheduled, or null when it can go. */
export function transferBlocker(input: {
  preview: TransferPreview | undefined;
  fromMandateId: string;
  incoming: Incoming;
  effectiveAt: string;
  acknowledged: boolean;
}): string | null {
  const { preview: p, fromMandateId, incoming } = input;
  if (!p) return 'Choose a property.';
  if (p.openTransferId) return 'A change is already scheduled for this property.';
  if (incoming.kind === 'SELF' && !p.running.length) return 'You already manage it yourself.';
  if (p.running.length && !fromMandateId) return 'Choose which engagement ends.';
  if (incoming.kind === 'FIRM' && !incoming.id) return 'Choose the firm that takes over.';
  if (!input.effectiveAt) return 'Choose when the change happens.';
  if (p.openItems.length && !input.acknowledged) return 'Confirm you have seen the open matters.';
  return null;
}

/** Where the sign-off stands, and what this viewer may do now. */
export function handoverActions(h: Handover) {
  const pack = h.pack;
  const v = h.viewer;
  const open = h.status === 'SWITCHED';
  const waitingOnOutgoing = h.required.outgoing && !pack?.outgoingSignedAt;
  return {
    canOutgoing: !!(open && pack && v?.isOutgoing && !pack.outgoingSignedAt),
    canOwner: !!(open && pack && v?.isOwner && !pack.ownerSignedAt && !waitingOnOutgoing),
    canIncoming: !!(open && pack && v?.isIncoming && !pack.incomingSignedAt && !waitingOnOutgoing),
    canDispute: !!(open && pack && (v?.isOwner || v?.isOutgoing || v?.isIncoming)),
  };
}

export const managementTransfersApi = {
  preview: (propertyId: string) =>
    apiFetch<TransferPreview>(
      `/management-transfers/preview?propertyId=${encodeURIComponent(propertyId)}`
    ),
  firms: () => apiFetch<VettedFirm[]>('/management-mandates/firms'),
  request: (input: RequestTransferInput) =>
    apiFetch<ManagementTransfer>('/management-transfers', { method: 'POST', body: input }),
  mine: () => apiFetch<ManagementTransfer[]>('/management-transfers'),
  cancel: (id: string) =>
    apiFetch<ManagementTransfer>(`/management-transfers/${id}/cancel`, { method: 'POST' }),
  handover: (id: string) => apiFetch<Handover>(`/management-transfers/${id}/handover`),
  exportHandover: (id: string) => apiFetch<unknown>(`/management-transfers/${id}/handover/export`),
  signOutgoing: (
    id: string,
    input: {
      hash: string;
      keysDeclaration: string;
      deposits: { depositHoldId: string; treatment: DepositTreatment; note?: string }[];
    }
  ) =>
    apiFetch<Handover>(`/management-transfers/${id}/handover/sign-outgoing`, {
      method: 'POST',
      body: input,
    }),
  sign: (id: string, side: 'owner' | 'incoming', hash: string) =>
    apiFetch<Handover>(`/management-transfers/${id}/handover/sign-${side}`, {
      method: 'POST',
      body: { hash },
    }),
  dispute: (id: string, reason: string) =>
    apiFetch<Handover>(`/management-transfers/${id}/handover/dispute`, {
      method: 'POST',
      body: { reason },
    }),
};
