import { ApiError } from '@sureground/shared';
import type { LandDiligenceCheck, LandDiligenceChecklistStatus, LandRiskBand } from '@/types/land';

const DAY_MS = 24 * 60 * 60 * 1000;

export const landQueryKeys = {
  diligenceRoot: ['admin', 'land', 'diligence'] as const,
  queue: (params: object) => ['admin', 'land', 'diligence', 'queue', params] as const,
  case: (propertyId: string) => ['admin', 'land', 'diligence', 'case', propertyId] as const,
  caseSection: (propertyId: string, section: string) =>
    ['admin', 'land', 'diligence', 'case', propertyId, section] as const,
  purchasesRoot: ['admin', 'land', 'purchases'] as const,
  purchases: (params: object) => ['admin', 'land', 'purchases', 'list', params] as const,
  purchase: (purchaseId: string) => ['admin', 'land', 'purchases', 'detail', purchaseId] as const,
  disputesRoot: ['admin', 'land', 'disputes'] as const,
  disputes: (params: object) => ['admin', 'land', 'disputes', 'list', params] as const,
  dispute: (disputeId: string) => ['admin', 'land', 'disputes', 'detail', disputeId] as const,
  authorityRoot: ['admin', 'land', 'authority'] as const,
  authorityQueue: (status: string) => ['admin', 'land', 'authority', 'queue', status] as const,
  authority: (authorityId: string) =>
    ['admin', 'land', 'authority', 'detail', authorityId] as const,
  watchRoot: ['admin', 'land', 'watch'] as const,
  watchInspections: (status: string) => ['admin', 'land', 'watch', 'inspections', status] as const,
  watchInspection: (id: string) => ['admin', 'land', 'watch', 'inspection', id] as const,
  watchIncidents: ['admin', 'land', 'watch', 'incidents'] as const,
  watchSubscriptions: ['admin', 'land', 'watch', 'subscriptions'] as const,
  fraudRoot: ['admin', 'land', 'fraud'] as const,
  fraudParcel: (propertyId: string) => ['admin', 'land', 'fraud', propertyId] as const,
};

export { humaniseEnum } from '@sureground/shared';

export interface SlaState {
  label: string;
  tone: 'overdue' | 'soon' | 'ok' | 'none';
}

// The API's own overdue flag wins (it only applies to cases still in review).
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

// Same thresholds as the API's risk model.
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

// Mirrors the API's refusal rules for check decisions.
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
  stale: boolean;
  status: number | null;
  blockers: string[];
}

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

export const isRefundableTermination = (status: string) =>
  status === 'REVOKED' || status === 'CANCELLED';

export const bpsToPercent = (bps: number) => `${Number((bps / 100).toFixed(2))}%`;
