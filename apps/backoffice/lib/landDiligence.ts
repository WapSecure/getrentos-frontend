import { ApiError } from '@getrentos/shared';
import type { LandDiligenceCheck, LandDiligenceChecklistStatus, LandRiskBand } from '@/types/land';

/**
 * Pure helpers for the land diligence screens: SLA wording, risk bands, check
 * validation that mirrors the API's own rules, and reading a refusal.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** React Query keys for the land screens; `diligenceRoot` invalidates every diligence query. */
export const landQueryKeys = {
  diligenceRoot: ['admin', 'land', 'diligence'] as const,
  queue: (params: object) => ['admin', 'land', 'diligence', 'queue', params] as const,
  case: (propertyId: string) => ['admin', 'land', 'diligence', 'case', propertyId] as const,
  caseSection: (propertyId: string, section: string) =>
    ['admin', 'land', 'diligence', 'case', propertyId, section] as const,
  purchasesRoot: ['admin', 'land', 'purchases'] as const,
  purchases: (params: object) => ['admin', 'land', 'purchases', 'list', params] as const,
  purchase: (purchaseId: string) => ['admin', 'land', 'purchases', 'detail', purchaseId] as const,
};

/** `sentence-case` for enum values: `GOVERNORS_CONSENT` → "Governors consent". */
export const humaniseEnum = (value: string | null | undefined): string =>
  value
    ? value
        .replaceAll('_', ' ')
        .toLowerCase()
        .replace(/^\w/, (character) => character.toUpperCase())
    : '';

export interface SlaState {
  label: string;
  tone: 'overdue' | 'soon' | 'ok' | 'none';
}

/**
 * How an SLA due date reads in the queue. The API's own `overdue` flag wins
 * (it only applies to cases still in review); otherwise the date is judged
 * against `now`, with anything due inside two days marked as due soon.
 */
export function describeSla(
  slaDueAt: string | null | undefined,
  overdue: boolean | undefined,
  now: Date = new Date()
): SlaState {
  if (!slaDueAt) return { label: 'No clock', tone: 'none' };
  const due = new Date(slaDueAt);
  if (Number.isNaN(due.getTime())) return { label: 'No clock', tone: 'none' };
  const diffDays = Math.round((due.getTime() - now.getTime()) / DAY_MS);
  if (overdue) {
    const late = Math.max(0, -diffDays);
    return {
      label: late === 0 ? 'Overdue today' : `Overdue by ${late} day${late === 1 ? '' : 's'}`,
      tone: 'overdue',
    };
  }
  if (diffDays < 0) return { label: `Was due ${-diffDays}d ago`, tone: 'none' };
  if (diffDays === 0) return { label: 'Due today', tone: 'soon' };
  return {
    label: `Due in ${diffDays} day${diffDays === 1 ? '' : 's'}`,
    tone: diffDays <= 2 ? 'soon' : 'ok',
  };
}

/** Same thresholds as the API's risk model: <25 low, <50 moderate, otherwise high. */
export function riskBandFor(score: number | null | undefined): LandRiskBand | null {
  if (score === null || score === undefined || Number.isNaN(score)) return null;
  if (score < 25) return 'LOW';
  if (score < 50) return 'MODERATE';
  return 'HIGH';
}

export const riskBadgeVariant = (band: LandRiskBand | null) =>
  band === 'HIGH'
    ? 'danger'
    : band === 'MODERATE'
      ? 'warning'
      : band === 'LOW'
        ? 'success'
        : 'neutral';

/**
 * Why a check decision would be refused, before it is sent. Mirrors the API:
 * PASSED on a document-backed check needs a citation first; FLAGGED, or
 * NOT_APPLICABLE on a required check, needs a note. Null when it may go.
 */
export function checkDecisionProblem(
  check: Pick<LandDiligenceCheck, 'label' | 'required' | 'requiresDocument' | 'hasEvidence'>,
  status: LandDiligenceChecklistStatus,
  note: string
): string | null {
  if (status === 'PASSED' && check.requiresDocument && !check.hasEvidence) {
    return `Cite the document "${check.label}" rests on before passing it.`;
  }
  if ((status === 'FLAGGED' || (status === 'NOT_APPLICABLE' && check.required)) && !note.trim()) {
    return 'Say why: a note is required for this decision.';
  }
  return null;
}

export interface LandApiErrorInfo {
  message: string;
  /** The case changed since it was loaded (409): the reviewer must reload. */
  stale: boolean;
  status: number | null;
  /** Approval blockers, when the API sent them. */
  blockers: string[];
}

/** Reads a thrown mutation error into what the screen needs to show. */
export function readLandApiError(error: unknown, fallback: string): LandApiErrorInfo {
  if (error instanceof ApiError) {
    const details = (error.details ?? {}) as { blockers?: unknown };
    const blockers = Array.isArray(details.blockers)
      ? details.blockers.filter((item): item is string => typeof item === 'string')
      : [];
    return {
      message: error.message || fallback,
      stale: error.status === 409,
      status: error.status,
      blockers,
    };
  }
  return {
    message: error instanceof Error && error.message ? error.message : fallback,
    stale: false,
    status: null,
    blockers: [],
  };
}

/** Purchase statuses after which money may be owed back to the buyer. */
export const isRefundableTermination = (status: string) =>
  status === 'REVOKED' || status === 'CANCELLED';

/** Basis points as a percentage label: 1250 → "12.5%". */
export const bpsToPercent = (bps: number) => `${Number((bps / 100).toFixed(2))}%`;
