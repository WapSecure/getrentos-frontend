import { authFetch, safeCall, type ApiResponse } from '@/lib/apiHelpers';

/**
 * `managing()` is the client switcher: every mandate the caller manages, including ones not yet
 * live or just ended.
 */

/** Mirrors the backend's `MandateScope`. */
export const MANDATE_SCOPES = ['RENT', 'MAINTENANCE', 'LISTINGS', 'LEGAL', 'COMPLIANCE'] as const;
export type MandateScope = (typeof MANDATE_SCOPES)[number];

export const MANDATE_SCOPE_LABELS: Record<MandateScope, string> = {
  RENT: 'Collect rent and run the tenancy',
  MAINTENANCE: 'Repairs, vendors and inspections',
  LISTINGS: 'Advertise and let the property',
  LEGAL: 'Instruct and run proceedings',
  COMPLIANCE: 'Statutory notices and documents',
};

/** Same lowercase as the capability chips beside them. */
export const MANDATE_SCOPE_CHIP: Record<MandateScope, string> = {
  RENT: 'rent',
  MAINTENANCE: 'maintenance',
  LISTINGS: 'listings',
  LEGAL: 'legal',
  COMPLIANCE: 'compliance',
};

/** Mirrors the backend's `MandateStatus`. */
export const MANDATE_STATUSES = [
  'DRAFT',
  'PENDING_OWNER',
  'PENDING_OPS',
  'ACTIVE',
  'SUSPENDED',
  'TERMINATED',
  'EXPIRED',
  'REJECTED',
] as const;
export type MandateStatus = (typeof MANDATE_STATUSES)[number];

export const MANDATE_STATUS_LABELS: Record<MandateStatus, string> = {
  DRAFT: 'Draft',
  PENDING_OWNER: "Waiting for the owner's signature",
  PENDING_OPS: 'Waiting for Sureground to verify',
  ACTIVE: 'Active',
  SUSPENDED: 'Suspended',
  TERMINATED: 'Ended',
  EXPIRED: 'Expired',
  REJECTED: 'Refused',
};

/** What the scope lets the API do today, so a screen can say "this mandate grants nothing yet". */
export interface MandateCapabilities {
  canList: boolean;
  canManage: boolean;
  canTransact: boolean;
}

/**
 * Computed by the API from its guard rules; never derive these client-side or they drift into 403s.
 * Distinct from `capabilities`, which is about the property.
 */
export interface MandateViewerPermissions {
  canSubmit: boolean;
  canSign: boolean;
  canVerify: boolean;
  canReject: boolean;
  canSuspend: boolean;
  canResume: boolean;
  canServeNotice: boolean;
  canTerminate: boolean;
  canRequestTermination: boolean;
  canApproveTermination: boolean;
  canConfirmHandover: boolean;
}

export type ServicingTier = 'COLLECT_ONLY' | 'COLLECT_MAINTAIN' | 'FULL_MANAGEMENT';

export interface ManagedTierCard {
  tier: ServicingTier;
  name: string;
  feePct: number;
  lettingCommissionPct: number;
  renewalCommissionPct: number;
  scope: MandateScope[];
  summary: string;
  includes: string[];
}

export interface ManagementMandateDto {
  id: string;
  propertyId: string;
  propertyTitle?: string | null;
  ownerId: string;
  ownerName?: string | null;
  managerOrganizationId: string | null;
  managerOrganizationName?: string | null;
  managerIsSureground: boolean;
  deliveryPartnerOrganizationId?: string | null;
  deliveryPartnerName?: string | null;
  servicingTier: ServicingTier | null;
  managerUserId: string | null;
  managerName?: string | null;
  /** The most a manager may spend without owner sign-off (whole naira); null = no cap. */
  maintenanceApprovalCap: number | null;
  scope: MandateScope[];
  capabilities: MandateCapabilities;
  permissions: MandateViewerPermissions;
  feeConfigId: string | null;
  startAt: string | null;
  endAt: string | null;
  noticePeriodDays: number;
  status: MandateStatus;
  agreementDocumentId: string | null;
  poaDocumentId: string | null;
  signedByOwnerAt: string | null;
  signedByManagerAt: string | null;
  submittedById: string | null;
  decidedById: string | null;
  decidedAt: string | null;
  decisionNote: string | null;
  activatedAt: string | null;
  noticeServedAt: string | null;
  terminatedById: string | null;
  terminatedAt: string | null;
  terminationReason: string | null;
  handoverAt: string | null;
  createdAt: string;
  updatedAt: string;
  effective: boolean;
}

export const TERMINATION_REQUEST_STATUSES = ['PENDING', 'APPROVED', 'CANCELLED'] as const;
export type TerminationRequestStatus = (typeof TERMINATION_REQUEST_STATUSES)[number];

export interface MandateTerminationRequestDto {
  id: string;
  mandateId: string;
  requestedById: string;
  requestedByName: string | null;
  reason: string;
  status: TerminationRequestStatus;
  decidedById: string | null;
  decidedByName: string | null;
  decidedAt: string | null;
  decisionNote: string | null;
  createdAt: string;
}

export interface CreateMandateInput {
  propertyId: string;
  /** A third-party firm. Mutually exclusive with `managerIsSureground`. */
  managerOrganizationId?: string | null;
  managerIsSureground?: boolean;
  managerUserId?: string | null;
  scope: MandateScope[];
  feeConfigId?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  noticePeriodDays?: number;
}

export function managing(): Promise<ApiResponse<ManagementMandateDto[]>> {
  return safeCall(() => authFetch<ManagementMandateDto[]>('/management-mandates/managing'));
}

export function mine(): Promise<ApiResponse<ManagementMandateDto[]>> {
  return safeCall(() => authFetch<ManagementMandateDto[]>('/management-mandates/mine'));
}

export function managedFeeCard(): Promise<ApiResponse<ManagedTierCard[]>> {
  return safeCall(() => authFetch<ManagedTierCard[]>('/management-mandates/managed/fee-card'));
}

export interface ManagedSlaTarget {
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  responseTargetMinutes: number;
  resolutionTargetMinutes: number;
  escalationTargetMinutes: number;
  emergencyRoutingEnabled: boolean;
}

export function managedSla(): Promise<ApiResponse<ManagedSlaTarget[]>> {
  return safeCall(() => authFetch<ManagedSlaTarget[]>('/management-mandates/managed/sla'));
}

/** Worked out from real jobs. Null = unmeasured. */
export interface FirmMaintenance {
  resolvedJobs: number;
  openJobs: number;
  averageResolutionDays: number | null;
  slaOnTimeRate: number | null;
}

export interface VettedFirm {
  id: string;
  name: string;
  since: string;
  /** 1-based rank, best first. See the directory's ordering. */
  rank: number;
  teamSize: number;
  activeEngagements: number;
  endedEngagements: number;
  ownerEndedEngagements: number;
  maintenance: FirmMaintenance;
  /** Inputs that do not exist yet, named rather than guessed (e.g. 'MAINTENANCE_ACTIVITY'). */
  missing: string[];
}

export function vettedFirms(): Promise<ApiResponse<VettedFirm[]>> {
  return safeCall(() => authFetch<VettedFirm[]>('/management-mandates/firms'));
}

/** Notice-in-lieu. */
export interface ManagedBreakFee {
  amount: number;
  waived: boolean;
  reason: string;
}

export function managedBreakFee(id: string): Promise<ApiResponse<ManagedBreakFee>> {
  return safeCall(() => authFetch<ManagedBreakFee>(`/management-mandates/${id}/break-fee`));
}

export function forProperty(propertyId: string): Promise<ApiResponse<ManagementMandateDto[]>> {
  return safeCall(() =>
    authFetch<ManagementMandateDto[]>(`/management-mandates/property/${propertyId}`)
  );
}

export function get(id: string): Promise<ApiResponse<ManagementMandateDto>> {
  return safeCall(() => authFetch<ManagementMandateDto>(`/management-mandates/${id}`));
}

export function create(input: CreateMandateInput): Promise<ApiResponse<ManagementMandateDto>> {
  return safeCall(() =>
    authFetch<ManagementMandateDto>('/management-mandates', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  );
}

export function submit(id: string): Promise<ApiResponse<ManagementMandateDto>> {
  return safeCall(() =>
    authFetch<ManagementMandateDto>(`/management-mandates/${id}/submit`, { method: 'POST' })
  );
}

/** The second signature moves the mandate to `PENDING_OPS`; the backend decides that. */
export function sign(
  id: string,
  input: { agreementDocumentId?: string | null; poaDocumentId?: string | null } = {}
): Promise<ApiResponse<ManagementMandateDto>> {
  return safeCall(() =>
    authFetch<ManagementMandateDto>(`/management-mandates/${id}/sign`, {
      method: 'POST',
      body: JSON.stringify(input),
    })
  );
}

/**
 * Takes no body: the backend records when the notice clock started. Not a termination, which stops
 * a manager back-dating notice.
 */
export function serveNotice(id: string): Promise<ApiResponse<ManagementMandateDto>> {
  return safeCall(() =>
    authFetch<ManagementMandateDto>(`/management-mandates/${id}/notice`, { method: 'POST' })
  );
}

export function terminate(
  id: string,
  reason: string,
  options: { force?: boolean } = {}
): Promise<ApiResponse<ManagementMandateDto>> {
  return safeCall(() =>
    authFetch<ManagementMandateDto>(`/management-mandates/${id}/terminate`, {
      method: 'POST',
      body: JSON.stringify({ reason, force: options.force }),
    })
  );
}

export function suspend(id: string, reason: string): Promise<ApiResponse<ManagementMandateDto>> {
  return safeCall(() =>
    authFetch<ManagementMandateDto>(`/management-mandates/${id}/suspend`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
  );
}

/** No body: the agreement is unchanged. */
export function resume(id: string): Promise<ApiResponse<ManagementMandateDto>> {
  return safeCall(() =>
    authFetch<ManagementMandateDto>(`/management-mandates/${id}/resume`, { method: 'POST' })
  );
}

/**
 * Separate from terminating: the two are days apart, and that gap is where keys, balances and open
 * work orders go missing.
 */
export function recordHandover(id: string): Promise<ApiResponse<ManagementMandateDto>> {
  return safeCall(() =>
    authFetch<ManagementMandateDto>(`/management-mandates/${id}/handover`, { method: 'POST' })
  );
}

export function pendingTerminationRequests(
  id: string
): Promise<ApiResponse<MandateTerminationRequestDto[]>> {
  return safeCall(() =>
    authFetch<MandateTerminationRequestDto[]>(`/management-mandates/${id}/termination-requests`)
  );
}

/**
 * Not a termination: with Sureground as manager a second staff member must approve; for a
 * third-party firm the backend may apply it directly.
 */
export function requestTermination(
  id: string,
  reason: string
): Promise<ApiResponse<MandateTerminationRequestDto>> {
  return safeCall(() =>
    authFetch<MandateTerminationRequestDto>(`/management-mandates/${id}/termination-requests`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
  );
}

/**
 * The checker half of maker/checker: must be a different staff member, and skipping a Sureground
 * notice period needs `force` plus a note.
 */
export function approveTermination(
  id: string,
  input: { force?: boolean; decisionNote?: string } = {}
): Promise<ApiResponse<MandateTerminationRequestDto>> {
  return safeCall(() =>
    authFetch<MandateTerminationRequestDto>(
      `/management-mandates/${id}/termination-requests/approve`,
      { method: 'POST', body: JSON.stringify(input) }
    )
  );
}

/** Its requester, or the owner, while it is still only a request. */
export function cancelTermination(
  id: string,
  input: { force?: boolean; decisionNote?: string } = {}
): Promise<ApiResponse<MandateTerminationRequestDto>> {
  return safeCall(() =>
    authFetch<MandateTerminationRequestDto>(
      `/management-mandates/${id}/termination-requests/cancel`,
      { method: 'POST', body: JSON.stringify(input) }
    )
  );
}

/**
 * A past `endAt` means the engagement is over whatever the stored status says, as the backend reads
 * it.
 */
export function isLive(mandate: ManagementMandateDto): boolean {
  if (mandate.status !== 'ACTIVE') return false;
  if (mandate.endAt && new Date(mandate.endAt).getTime() <= Date.now()) return false;
  return true;
}

/** Ended, expired or past its end date. */
export function hasEnded(mandate: ManagementMandateDto): boolean {
  if (mandate.status === 'TERMINATED' || mandate.status === 'EXPIRED') return true;
  return (
    mandate.status === 'ACTIVE' &&
    !!mandate.endAt &&
    new Date(mandate.endAt).getTime() <= Date.now()
  );
}

export function endedOn(mandate: ManagementMandateDto): string | null {
  return mandate.terminatedAt ?? mandate.endAt ?? null;
}

export function grantsNothing(mandate: ManagementMandateDto): boolean {
  const { canList, canManage, canTransact } = mandate.capabilities;
  return !canList && !canManage && !canTransact;
}

export function noticeSummary(mandate: ManagementMandateDto): string {
  if (mandate.status === 'TERMINATED')
    return mandate.terminatedAt ? `Ended ${formatDay(mandate.terminatedAt)}` : 'Ended';
  if (mandate.status === 'EXPIRED')
    return mandate.endAt ? `Expired ${formatDay(mandate.endAt)}` : 'Expired';
  const noticeEnds = noticeEndsAt(mandate);
  if (noticeEnds) return `Notice served, ends ${formatDay(noticeEnds)}`;
  if (!mandate.endAt) {
    return mandate.noticePeriodDays > 0
      ? `Rolling, ${mandate.noticePeriodDays} days' notice`
      : 'Rolling, no notice period agreed';
  }
  return `Ends ${formatDay(mandate.endAt)}`;
}

/**
 * The notice clock plus the agreed period, as the API counts it. Null while no notice has been
 * served.
 */
export function noticeEndsAt(
  mandate: Pick<ManagementMandateDto, 'noticeServedAt' | 'noticePeriodDays'>
): string | null {
  if (!mandate.noticeServedAt) return null;
  const served = new Date(mandate.noticeServedAt).getTime();
  if (Number.isNaN(served)) return null;
  return new Date(served + mandate.noticePeriodDays * 24 * 60 * 60 * 1000).toISOString();
}

export function formatDay(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Africa/Lagos',
  });
}
