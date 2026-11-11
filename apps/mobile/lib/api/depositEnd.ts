import type { BadgeTone } from '@sureground/ui-native';
import { apiFetch, apiUpload } from './client';
import { appendFile, type PickedFile } from './documents';

/** D-6 end of tenancy: move-out, a claim within 14 days, the tenant's answer within 7, then settlement. */

/** Mirrors the backend's `DepositEndStage`. */
export type DepositEndStage =
  | 'TENANCY'
  | 'AWAITING_CLAIM'
  | 'AWAITING_TENANT'
  | 'IN_MEDIATION'
  | 'SETTLED';

export const DEPOSIT_END_STAGE: Record<DepositEndStage, { label: string; tone: BadgeTone }> = {
  TENANCY: { label: 'Tenancy running', tone: 'info' },
  AWAITING_CLAIM: { label: 'Claim window open', tone: 'warning' },
  AWAITING_TENANT: { label: 'Waiting for the tenant', tone: 'warning' },
  IN_MEDIATION: { label: 'With Sureground to decide', tone: 'warning' },
  SETTLED: { label: 'Settled', tone: 'success' },
};

export type DepositRefundStatus = 'NOT_NEEDED' | 'REFUNDED' | 'CONFIRMING' | 'NEEDS_FINANCE';

export const DEPOSIT_REFUND_STATUS_LABEL: Record<DepositRefundStatus, string> = {
  NOT_NEEDED: 'Nothing to refund',
  REFUNDED: 'Refund sent',
  CONFIRMING: 'Refund being confirmed',
  NEEDS_FINANCE: 'Refund with finance',
};

export type SettledHow = 'NO_CLAIM' | 'TENANT_ACCEPTED' | 'NO_RESPONSE' | 'MEDIATION';

export const SETTLED_HOW_TEXT: Record<SettledHow, string> = {
  NO_CLAIM: 'No deductions were claimed within 14 days of move-out.',
  TENANT_ACCEPTED: 'The tenant accepted the claim.',
  NO_RESPONSE: 'The tenant did not respond within 7 days, so the claim counts as accepted.',
  MEDIATION: 'Sureground decided the dispute.',
};

export interface DepositEvidenceFile {
  name: string;
  mimeType: string | null;
  url: string;
}

export interface DepositClaimItem {
  id: string;
  reason: string;
  amount: number;
  inspectionId: string | null;
  evidence: DepositEvidenceFile[];
}

export interface DepositClaim {
  id: string;
  amount: number;
  status: 'AWAITING_TENANT' | 'ACCEPTED' | 'DISPUTED' | 'DECIDED';
  respondBy: string;
  respondedAt: string | null;
  acceptedByDefault: boolean;
  disputeReason: string | null;
  decidedAmount: number | null;
  decidedAt: string | null;
  resolution: string | null;
  createdAt: string;
  items: DepositClaimItem[];
}

/** The deposit in the end-of-tenancy flow, as the landlord and the tenant see it. */
export interface DepositEndView {
  holdId: string;
  leaseId: string;
  propertyTitle: string | null;
  unitName: string | null;
  tenantName: string | null;
  amount: number;
  heldBySureground: boolean;
  /** Received through Sureground: only this can be claimed or refunded. */
  funded: number;
  endStage: DepositEndStage;
  moveOutAt: string | null;
  claimBy: string | null;
  claim: DepositClaim | null;
  settlement: {
    landlordAmount: number;
    refundAmount: number;
    refundStatus: DepositRefundStatus | null;
    settledHow: SettledHow | null;
    settledAt: string | null;
  } | null;
}

export interface DepositClaimItemInput {
  reason: string;
  amount: number;
  evidenceKeys?: string[];
}

/** The API's limits, so the button only lights up for a claim it will take. */
export const CLAIM_REASON_MIN = 10;
export const DISPUTE_REASON_MIN = 10;
export const CLAIM_MAX_ITEMS = 20;
export const CLAIM_MAX_FILES = 10;

export interface ClaimDraftItem {
  key: string;
  reason: string;
  /** Raw digits from the number field. */
  amount: string;
  files: PickedFile[];
}

export const claimTotal = (items: Pick<ClaimDraftItem, 'amount'>[]) =>
  items.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

/** Why the claim cannot be sent yet, or null when it can. */
export function claimBlocker(items: ClaimDraftItem[], funded: number): string | null {
  if (items.length === 0) return 'Add at least one deduction.';
  for (const [i, item] of items.entries()) {
    const n = items.length > 1 ? ` ${i + 1}` : '';
    if (!(Number(item.amount) > 0)) return `Give an amount for deduction${n}.`;
    if (item.reason.trim().length < CLAIM_REASON_MIN)
      return `Say what deduction${n} is for, in at least ${CLAIM_REASON_MIN} characters.`;
    if (item.files.length === 0) return `Add a photo, receipt or quote for deduction${n}.`;
  }
  if (claimTotal(items) > funded)
    return 'The deductions add up to more than the deposit held by Sureground.';
  return null;
}

/** The settlement as one sentence, from the landlord's or the tenant's side. */
export function settlementText(
  view: DepositEndView,
  side: 'landlord' | 'tenant',
  naira: (n: number) => string
) {
  const s = view.settlement;
  if (!s) return null;
  const how = s.settledHow ? `${SETTLED_HOW_TEXT[s.settledHow]} ` : '';
  const refund = s.refundStatus
    ? ` (${DEPOSIT_REFUND_STATUS_LABEL[s.refundStatus].toLowerCase()})`
    : '';
  if (side === 'landlord') {
    return `${how}${naira(s.landlordAmount)} added to your balance, ${naira(s.refundAmount)} refunded to the tenant${refund}.`;
  }
  const toLandlord = s.landlordAmount > 0 ? `, ${naira(s.landlordAmount)} to your landlord` : '';
  return `${how}${naira(s.refundAmount)} refunded to you${refund}${toLandlord}.`;
}

/** Whether the tenancy has ended, which is when the tenant may say they have moved out. */
export function leaseHasEnded(leaseStatus: string, leaseEnd?: string | null, now = Date.now()) {
  if (leaseStatus === 'EXPIRED') return true;
  return leaseEnd ? new Date(leaseEnd).getTime() <= now : false;
}

/** A move-out day from the date field, sent as midday in Lagos so it never slips a day. */
export const moveOutInstant = (day: string) => new Date(`${day}T12:00:00+01:00`).toISOString();

export const depositEndApi = {
  // Landlord, owner or manager.
  view: (depositId: string) => apiFetch<DepositEndView>(`/deposits/${depositId}/end-of-tenancy`),
  recordMoveOut: (depositId: string, moveOutAt?: string) =>
    apiFetch<DepositEndView>(`/deposits/${depositId}/move-out`, {
      method: 'POST',
      body: moveOutAt ? { moveOutAt } : {},
    }),
  uploadEvidence: (depositId: string, file: PickedFile) => {
    const form = new FormData();
    appendFile(form, 'file', file);
    return apiUpload<{ key: string }>(`/deposits/${depositId}/claim-evidence`, form);
  },
  fileClaim: (depositId: string, items: DepositClaimItemInput[]) =>
    apiFetch<DepositEndView>(`/deposits/${depositId}/claim`, { method: 'POST', body: { items } }),

  // Tenant.
  tenantView: (holdId: string) =>
    apiFetch<DepositEndView>(`/renter/deposits/${holdId}/end-of-tenancy`),
  movedOut: (holdId: string) =>
    apiFetch<DepositEndView>(`/renter/deposits/${holdId}/moved-out`, { method: 'POST' }),
  /** Step-up is asked for by the API and handled by `apiFetch`: money moves. */
  acceptClaim: (holdId: string) =>
    apiFetch<DepositEndView>(`/renter/deposits/${holdId}/claim/accept`, { method: 'POST' }),
  disputeClaim: (holdId: string, reason: string) =>
    apiFetch<DepositEndView>(`/renter/deposits/${holdId}/claim/dispute`, {
      method: 'POST',
      body: { reason },
    }),
};
