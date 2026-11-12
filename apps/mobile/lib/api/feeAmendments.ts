import type { BadgeTone } from '@sureground/ui-native';
import { apiFetch } from './client';
import { APP_TIME_ZONE } from '../format';

/**
 * BD-2: a fee in a signed agreement changes only by a proposal the other side accepts. Who may do what
 * comes from the API; never derive it here.
 */

export type ManagementFeeType = 'PERCENTAGE' | 'FLAT';
export type FeeAmendmentSide = 'OWNER' | 'MANAGER' | 'SUREGROUND';
export type FeeAmendmentStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'WITHDRAWN' | 'EXPIRED';

export const FEE_AMENDMENT_STATUS: Record<FeeAmendmentStatus, { label: string; tone: BadgeTone }> =
  {
    PENDING: { label: 'Waiting for an answer', tone: 'warning' },
    ACCEPTED: { label: 'Agreed', tone: 'success' },
    DECLINED: { label: 'Declined', tone: 'danger' },
    WITHDRAWN: { label: 'Withdrawn', tone: 'neutral' },
    EXPIRED: { label: 'Lapsed', tone: 'neutral' },
  };

export const FEE_TYPES: { value: ManagementFeeType; label: string }[] = [
  { value: 'PERCENTAGE', label: 'Percentage of rent' },
  { value: 'FLAT', label: 'Flat amount' },
];

export interface FeeTerms {
  type: ManagementFeeType;
  value: number;
  /** "8%" or "₦50,000", worded by the API. */
  label: string;
}

export interface FeeAmendment {
  id: string;
  mandateId: string;
  propertyId: string;
  propertyTitle: string | null;
  ownerName: string | null;
  managerName: string | null;
  managerIsSureground: boolean;
  proposedById: string;
  proposedByName: string | null;
  proposerSide: FeeAmendmentSide;
  from: FeeTerms;
  to: FeeTerms;
  reason: string;
  /** A Lagos date, YYYY-MM-DD. */
  effectiveFrom: string;
  expiresAt: string;
  status: FeeAmendmentStatus;
  decidedById: string | null;
  decidedByName: string | null;
  decidedAt: string | null;
  decisionNote: string | null;
  createdAt: string;
  quorum: { ownersRequired: number; ownersAccepted: number; managerAccepted: boolean };
  permissions: { canAccept: boolean; canDecline: boolean; canWithdraw: boolean };
}

export interface MandateVersion {
  version: number;
  fee: FeeTerms | null;
  effectiveFrom: string;
  amendmentId: string | null;
  createdAt: string;
}

export interface FeeAmendmentOverview {
  mandateId: string;
  managerIsSureground: boolean;
  currentFee: FeeTerms | null;
  canPropose: boolean;
  proposeBlockedReason: string | null;
  /** The first of a month at least 14 days away, YYYY-MM-DD. */
  earliestEffectiveFrom: string;
  maxPercentage: number;
  /** Managed only: the published tier rates. */
  allowedPercentages: number[] | null;
  pending: FeeAmendment | null;
  history: FeeAmendment[];
  versions: MandateVersion[];
}

export interface ProposeFeeAmendmentInput {
  type: ManagementFeeType;
  value: number;
  reason: string;
  effectiveFrom: string;
}

export const FEE_REASON_MIN = 10;
const MONTHS_AHEAD = 12;

/** A Lagos calendar day, "1 December 2026". */
export function formatLagosDay(value: string | null | undefined): string {
  if (!value) return '';
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00+01:00`)
    : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: APP_TIME_ZONE,
  });
}

/** Today as a Lagos date, YYYY-MM-DD. */
export function lagosToday(now = new Date()): string {
  return now.toLocaleDateString('en-CA', { timeZone: APP_TIME_ZONE });
}

function dayBefore(day: string): string {
  const date = new Date(`${day}T12:00:00+01:00`);
  date.setUTCDate(date.getUTCDate() - 1);
  return formatLagosDay(date.toISOString());
}

/**
 * The fee in force today, and an agreed change that has not started yet. The agreement's fee moves on
 * acceptance, so `currentFee` alone would announce the new fee early; the versions say what applies when.
 */
export function feeHeadline(
  data: Pick<FeeAmendmentOverview, 'currentFee' | 'versions'>,
  today = lagosToday()
): string {
  const upcoming = data.versions
    .filter((v) => v.effectiveFrom > today && v.fee)
    .sort((a, b) => a.version - b.version)[0];
  const inForce = data.versions
    .filter((v) => v.effectiveFrom <= today)
    .sort((a, b) => b.version - a.version)[0];
  if (upcoming?.fee) {
    // Before version 1's date, version 1 applies, as the statements read it.
    const now = inForce ?? [...data.versions].sort((a, b) => a.version - b.version)[0];
    if (now?.fee && now.version !== upcoming.version) {
      return `Fee: ${now.fee.label} until ${dayBefore(upcoming.effectiveFrom)}, then ${upcoming.fee.label} from ${formatLagosDay(upcoming.effectiveFrom)}`;
    }
  }
  if (inForce?.fee) return `Agreed fee: ${inForce.fee.label}`;
  return data.currentFee
    ? `Agreed fee: ${data.currentFee.label}`
    : 'No fee recorded on this agreement.';
}

/** The first day of each month from `earliest`, the only days a new fee may start on. */
export function effectiveDateOptions(earliest: string): { value: string; label: string }[] {
  const [year, month] = earliest.split('-').map(Number);
  return Array.from({ length: MONTHS_AHEAD }, (_, i) => {
    const y = year + Math.floor((month - 1 + i) / 12);
    const m = ((month - 1 + i) % 12) + 1;
    const value = `${y}-${String(m).padStart(2, '0')}-01`;
    return { value, label: formatLagosDay(value) };
  });
}

export function proposerLabel(amendment: FeeAmendment): string {
  if (amendment.proposerSide === 'SUREGROUND') return 'Sureground';
  if (amendment.proposerSide === 'MANAGER') {
    return amendment.managerName ?? amendment.proposedByName ?? 'The manager';
  }
  return amendment.proposedByName ?? 'The owner';
}

/** Why the new fee is not acceptable, or null. Empty input is not an error yet. */
export function feeValueError(
  raw: string,
  type: ManagementFeeType,
  maxPercentage: number
): string | null {
  if (raw === '') return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return 'Enter a fee of zero or more.';
  if (type === 'PERCENTAGE' && n > maxPercentage)
    return `A percentage fee cannot be more than ${maxPercentage}%.`;
  if (type === 'FLAT' && !Number.isInteger(n)) return 'Enter a whole naira amount.';
  return null;
}

export const feeAmendmentsApi = {
  overview: (mandateId: string) =>
    apiFetch<FeeAmendmentOverview>(`/management-mandates/${mandateId}/fee-amendments`),
  propose: (mandateId: string, input: ProposeFeeAmendmentInput) =>
    apiFetch<FeeAmendment>(`/management-mandates/${mandateId}/fee-amendments`, {
      method: 'POST',
      body: input,
    }),
  /** Step-up is asked for by the API and handled by `apiFetch`: it changes future money. */
  accept: (id: string) =>
    apiFetch<FeeAmendment>(`/management-mandates/fee-amendments/${id}/accept`, {
      method: 'POST',
    }),
  decline: (id: string, note?: string) =>
    apiFetch<FeeAmendment>(`/management-mandates/fee-amendments/${id}/decline`, {
      method: 'POST',
      body: { note: note || undefined },
    }),
  withdraw: (id: string) =>
    apiFetch<FeeAmendment>(`/management-mandates/fee-amendments/${id}/withdraw`, {
      method: 'POST',
    }),
};
