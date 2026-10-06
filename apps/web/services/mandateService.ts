import { authFetch, safeCall, type ApiResponse } from '@/lib/apiHelpers';

/**
 * The management mandate — the firm's side.
 *
 * `propertyAuthorityService` covers the *holder's* view: a claim that someone may
 * act for a property. This covers the engagement itself — who appointed whom, for
 * what, for how long, and what it currently permits. The two are different
 * questions and an agency needs both: the authority says "I may touch this
 * building", the mandate says "on whose instruction, and until when".
 *
 * `managing()` is the client switcher. The backend's own summary for that route
 * is "the client switcher", because it returns every mandate the caller manages —
 * as a named operator, as a member of the appointed firm, or as GetRentos staff on
 * a platform mandate — including the ones not yet live, so a manager can see the
 * engagement they are waiting on and the one that just ended.
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
  PENDING_OPS: 'Waiting for GetRentos to verify',
  ACTIVE: 'Active',
  SUSPENDED: 'Suspended',
  TERMINATED: 'Ended',
  EXPIRED: 'Expired',
  REJECTED: 'Refused',
};

/**
 * What the scope actually lets the API do today, rather than what it says on the
 * agreement. Surfaced so a screen can honestly say "this mandate grants nothing
 * yet" instead of showing an empty portfolio with no explanation.
 */
export interface MandateCapabilities {
  canList: boolean;
  canManage: boolean;
  canTransact: boolean;
}

/**
 * What *this caller* may do to this mandate right now.
 *
 * Computed by the API from the same rules its guards enforce, so a button shown
 * here is a button that will work. Distinct from `capabilities` above, which is
 * about the property: a manager with `canManage` on the property may still be
 * unable to pause their own engagement, and an owner with no capabilities at all
 * may be the only one who can.
 *
 * Never derive these client-side. A rule restated here drifts from the one the
 * API enforces, and the drift shows up as a button that answers 403.
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

export interface ManagementMandateDto {
  id: string;
  propertyId: string;
  propertyTitle?: string | null;
  ownerId: string;
  ownerName?: string | null;
  managerOrganizationId: string | null;
  managerOrganizationName?: string | null;
  managerIsGetRentos: boolean;
  managerUserId: string | null;
  managerName?: string | null;
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
  /** True when the mandate is operative right now. */
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
  /** A third-party firm. Mutually exclusive with `managerIsGetRentos`. */
  managerOrganizationId?: string | null;
  /** GetRentos itself as the manager of record. */
  managerIsGetRentos?: boolean;
  managerUserId?: string | null;
  scope: MandateScope[];
  feeConfigId?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  noticePeriodDays?: number;
}

/** Every mandate the caller manages — this is what feeds the client switcher. */
export function managing(): Promise<ApiResponse<ManagementMandateDto[]>> {
  return safeCall(() => authFetch<ManagementMandateDto[]>('/management-mandates/managing'));
}

/** Every mandate on properties the caller owns — the other side of the same list. */
export function mine(): Promise<ApiResponse<ManagementMandateDto[]>> {
  return safeCall(() => authFetch<ManagementMandateDto[]>('/management-mandates/mine'));
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

/** Send a draft to the owner for signature. */
export function submit(id: string): Promise<ApiResponse<ManagementMandateDto>> {
  return safeCall(() =>
    authFetch<ManagementMandateDto>(`/management-mandates/${id}/submit`, { method: 'POST' })
  );
}

/**
 * Sign. The second signature moves the mandate to `PENDING_OPS` on its own — the
 * backend decides that, so the UI never has to.
 */
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
 * Serve notice. Takes no body: the backend records WHEN the notice clock started,
 * and the reason for ending an engagement is given at termination.
 *
 * Not a termination — the mandate keeps running until the notice period has run,
 * which is also what stops a manager back-dating notice by terminating directly.
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

/** Resume a suspended mandate. No body — the agreement is unchanged, so there is nothing to state. */
export function resume(id: string): Promise<ApiResponse<ManagementMandateDto>> {
  return safeCall(() =>
    authFetch<ManagementMandateDto>(`/management-mandates/${id}/resume`, { method: 'POST' })
  );
}

/**
 * Record that the handover pack was exchanged. Separate from terminating because
 * in practice the two are days apart, and that gap is where keys, balances and
 * open work orders go missing.
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
 * Ask to end an engagement.
 *
 * Not a termination: when GetRentos is the manager this needs a second staff
 * member to approve it, so the request is the whole point. Where the manager is a
 * third-party firm the backend decides whether to apply it directly.
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
 * Approve a termination request — the checker half of maker/checker.
 *
 * Takes no request id: an open request is unambiguous. Must be a DIFFERENT staff
 * member from the one who raised it, and when GetRentos is the manager the agreed
 * notice period binds us too, so skipping it needs `force` plus a note.
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

/** Withdraw a request. Its requester, or the owner, while it is still only a request. */
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
 * Whether a mandate is operative right now.
 *
 * Both ends matter. A past `endAt` means the engagement is over regardless of the
 * stored status — the backend reads it that way, and a screen that trusted the
 * status alone would show a lapsed engagement as live.
 */
export function isLive(mandate: ManagementMandateDto): boolean {
  if (mandate.status !== 'ACTIVE') return false;
  if (mandate.endAt && new Date(mandate.endAt).getTime() <= Date.now()) return false;
  return true;
}

/** A scope that grants nothing yet, so a screen can explain the empty portfolio. */
export function grantsNothing(mandate: ManagementMandateDto): boolean {
  const { canList, canManage, canTransact } = mandate.capabilities;
  return !canList && !canManage && !canTransact;
}

/**
 * How the engagement ends, in plain words.
 *
 * The notice period is a number on the agreement and a manager has to give that
 * many days, so it belongs on the screen rather than in a document nobody opens.
 */
export function noticeSummary(mandate: ManagementMandateDto): string {
  if (mandate.status === 'TERMINATED') return 'Ended';
  if (mandate.status === 'EXPIRED') return 'Expired';
  if (!mandate.endAt) {
    return mandate.noticePeriodDays > 0
      ? `Rolling, ${mandate.noticePeriodDays} days' notice`
      : 'Rolling, no notice period agreed';
  }
  return `Ends ${formatDay(mandate.endAt)}`;
}

/** A date as a person reads it, or a dash when there is nothing to read. */
export function formatDay(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
