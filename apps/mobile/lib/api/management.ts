import { apiFetch, apiUpload, toQuery } from './client';
import { appendFile, type PickedFile } from './documents';
import type { Paginated } from './properties';
import type { BadgeTone } from '@getrentos/ui-native';

/**
 * The property-control screens a landlord and an owner share with the web:
 * the activity log, questions to a manager, spend approvals, deposits and
 * condition inspections. Every route here is role-agnostic on the API (it
 * answers for whatever the caller controls), so both portals use one client.
 */

/* ----------------------------- activity log ---------------------------- */

export type ActivityActorKind = 'MANAGER' | 'GETRENTOS' | 'TENANT' | 'SYSTEM' | 'OTHER';

export const ACTOR_KIND_LABEL: Record<ActivityActorKind, string> = {
  MANAGER: 'Manager',
  GETRENTOS: 'GetRentos',
  TENANT: 'Tenant',
  SYSTEM: 'Automatic',
  OTHER: 'Other',
};

export const ACTOR_KIND_TONE: Record<ActivityActorKind, BadgeTone> = {
  MANAGER: 'info',
  GETRENTOS: 'success',
  TENANT: 'neutral',
  SYSTEM: 'neutral',
  OTHER: 'neutral',
};

export interface ActivityItem {
  id: string;
  at: string;
  action: string;
  label: string;
  important: boolean;
  actorKind: ActivityActorKind;
  actor: string;
  propertyId: string | null;
  propertyTitle: string;
}

export interface ActivityPage {
  items: ActivityItem[];
  nextBefore: string | null;
  properties: { id: string; title: string }[];
}

export type ActivityWho = 'managers' | 'everyone';

/* ------------------------------- queries ------------------------------- */

export type QueryCategory = 'STATEMENT' | 'RENT' | 'MAINTENANCE' | 'TENANT' | 'LEGAL' | 'GENERAL';
export type QueryStatus = 'OPEN' | 'ANSWERED' | 'RESOLVED';
export type QuerySide = 'OWNER' | 'MANAGER';

export const QUERY_CATEGORY_LABEL: Record<QueryCategory, string> = {
  STATEMENT: 'Statement',
  RENT: 'Rent',
  MAINTENANCE: 'Maintenance',
  TENANT: 'Tenant',
  LEGAL: 'Legal',
  GENERAL: 'General',
};

export interface QuerySummary {
  id: string;
  subject: string;
  category: QueryCategory;
  status: QueryStatus;
  propertyId: string;
  propertyTitle: string;
  ownerName: string | null;
  manager: string;
  viewerSide: QuerySide;
  lastActivityAt: string;
  lastMessage: { side: QuerySide; preview: string } | null;
  messageCount: number;
  createdAt: string;
  firstResponseDueAt: string;
  firstResponseAt: string | null;
  answeredInHours: number | null;
  late: boolean;
}

export interface QueryThread extends QuerySummary {
  resolvedAt: string | null;
  messages: {
    id: string;
    side: QuerySide;
    author: string;
    onBehalfOf: string | null;
    body: string;
    at: string;
  }[];
}

/** The badge reads from the viewer's side: an open thread is waiting on the manager. */
export function queryStatusBadge(q: QuerySummary): { label: string; tone: BadgeTone } {
  if (q.status === 'RESOLVED') return { label: 'Resolved', tone: 'neutral' };
  if (q.status === 'ANSWERED') {
    return {
      label: q.viewerSide === 'OWNER' ? 'Answered' : 'Waiting on the owner',
      tone: 'info',
    };
  }
  return {
    label: q.viewerSide === 'OWNER' ? 'Waiting on manager' : 'Waiting on you',
    tone: 'warning',
  };
}

/** How the first-reply promise stands, in words. `fmt` renders the due time. */
export function querySlaText(q: QuerySummary, fmt: (iso: string) => string): string {
  if (q.firstResponseAt) {
    const h = q.answeredInHours ?? 0;
    const took = h < 1 ? 'under an hour' : `${h} hour${h === 1 ? '' : 's'}`;
    return `${q.late ? 'Answered late' : 'Answered'} in ${took}`;
  }
  if (q.late) return 'No reply yet: overdue';
  return `Reply due by ${fmt(q.firstResponseDueAt)}`;
}

/* ------------------------------- mandates ------------------------------ */

export type MandateStatus =
  | 'DRAFT'
  | 'PENDING_OWNER'
  | 'PENDING_OPS'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'TERMINATED'
  | 'EXPIRED'
  | 'REJECTED';

/** The owner's side of a management engagement: just what these screens need. */
export interface OwnerMandate {
  id: string;
  propertyId: string;
  propertyTitle?: string | null;
  managerName?: string | null;
  managerOrganizationName?: string | null;
  /** The most a manager may spend without owner sign-off (whole naira); null = no cap. */
  maintenanceApprovalCap: number | null;
  status: MandateStatus;
}

/* ---------------------------- spend approvals -------------------------- */

export type SpendApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type SpendApprovalRole = 'owner' | 'requester';

export const SPEND_APPROVAL_LABEL: Record<SpendApprovalStatus, string> = {
  PENDING: 'Awaiting you',
  APPROVED: 'Approved',
  REJECTED: 'Declined',
  CANCELLED: 'Cancelled',
};

export const SPEND_APPROVAL_TONE: Record<SpendApprovalStatus, BadgeTone> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'neutral',
  CANCELLED: 'neutral',
};

export interface SpendApproval {
  id: string;
  propertyId: string;
  propertyTitle: string | null;
  mandateId: string | null;
  requestedByName: string | null;
  category: string;
  amount: number;
  incurredAt: string;
  note: string | null;
  status: SpendApprovalStatus;
  decisionNote: string | null;
  decidedAt: string | null;
  createdAt: string;
}

/** A mandate held for co-owner quorum, waiting on the signed-in co-owner. */
export interface AwaitingCountersign {
  id: string;
  relationship: string;
  propertyReferenceCode?: string | null;
  note?: string | null;
  awaitingCountersign?: boolean;
  countersignApproved?: number;
  countersignRequired?: number;
}

/* ------------------------------- deposits ------------------------------ */

export type DepositStatus = 'HELD' | 'PARTIALLY_RETURNED' | 'RETURNED';
export type DeductionStatus = 'PROPOSED' | 'APPROVED' | 'REJECTED';

export const DEPOSIT_STATUS_LABEL: Record<DepositStatus, string> = {
  HELD: 'Held',
  PARTIALLY_RETURNED: 'Partly returned',
  RETURNED: 'Returned',
};

export const DEPOSIT_STATUS_TONE: Record<DepositStatus, BadgeTone> = {
  HELD: 'info',
  PARTIALLY_RETURNED: 'warning',
  RETURNED: 'success',
};

export const DEDUCTION_STATUS_LABEL: Record<DeductionStatus, string> = {
  PROPOSED: 'Awaiting owner',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

export const DEDUCTION_STATUS_TONE: Record<DeductionStatus, BadgeTone> = {
  PROPOSED: 'warning',
  APPROVED: 'success',
  REJECTED: 'neutral',
};

export interface DepositDeduction {
  id: string;
  amount: number;
  reason: string;
  status: DeductionStatus;
  inspectionId: string | null;
  decidedAt: string | null;
  decisionNote: string | null;
  tenantDisputedAt: string | null;
  tenantDisputeReason: string | null;
  disputeAnsweredAt: string | null;
  disputeAnswer: string | null;
  createdAt: string;
}

export interface DepositListItem {
  id: string;
  leaseId: string;
  propertyId: string;
  propertyTitle: string | null;
  amount: number;
  status: DepositStatus;
  heldByGetRentos: boolean;
  returnable: number;
  createdAt: string;
}

export interface DepositHold extends DepositListItem {
  takenAt: string;
  returnedAt: string | null;
  returnedAmount: number | null;
  deductions: DepositDeduction[];
  summary: {
    held: number;
    approvedDeductions: number;
    proposedDeductions: number;
    returnable: number;
  };
}

/** A tenant's objection the owner has not answered yet. */
export const disputeOpen = (d: DepositDeduction) => !!d.tenantDisputedAt && !d.disputeAnsweredAt;

/** Why the deposit can't be returned yet, or null when it can. */
export function returnBlocker(deposit: DepositHold): string | null {
  if (deposit.status === 'RETURNED') return null;
  if (deposit.deductions.some((d) => d.status === 'PROPOSED'))
    return 'Decide the proposed deductions before returning the deposit.';
  if (deposit.deductions.some(disputeOpen))
    return "Answer the tenant's dispute before returning the deposit.";
  return null;
}

/* ------------------------------ inspections ---------------------------- */

export type InspectionType = 'MOVE_IN' | 'MOVE_OUT' | 'ROUTINE';
export type InspectionStatus = 'DRAFT' | 'COMPLETED' | 'SHARED';
export type InspectionCondition = 'GOOD' | 'FAIR' | 'POOR' | 'DAMAGED';

export const INSPECTION_TYPES: InspectionType[] = ['MOVE_IN', 'MOVE_OUT', 'ROUTINE'];
export const INSPECTION_CONDITIONS: InspectionCondition[] = ['GOOD', 'FAIR', 'POOR', 'DAMAGED'];

export const INSPECTION_TYPE_LABEL: Record<InspectionType, string> = {
  MOVE_IN: 'Move-in',
  MOVE_OUT: 'Move-out',
  ROUTINE: 'Routine',
};

export const INSPECTION_STATUS_LABEL: Record<InspectionStatus, string> = {
  DRAFT: 'Draft',
  COMPLETED: 'Completed',
  SHARED: 'Shared with owner',
};

export const INSPECTION_STATUS_TONE: Record<InspectionStatus, BadgeTone> = {
  DRAFT: 'neutral',
  COMPLETED: 'success',
  SHARED: 'info',
};

export const CONDITION_LABEL: Record<InspectionCondition, string> = {
  GOOD: 'Good',
  FAIR: 'Fair',
  POOR: 'Poor',
  DAMAGED: 'Damaged',
};

export const CONDITION_TONE: Record<InspectionCondition, BadgeTone> = {
  GOOD: 'success',
  FAIR: 'info',
  POOR: 'warning',
  DAMAGED: 'danger',
};

export interface InspectionPhoto {
  id: string;
  name: string;
  caption: string | null;
  /** Short-lived signed URL; refetched with the inspection. */
  url: string;
}

export interface InspectionItem {
  id: string;
  area: string;
  condition: InspectionCondition;
  notes: string | null;
  estimatedCost: number | null;
  photos: InspectionPhoto[];
}

export interface InspectionListItem {
  id: string;
  propertyId: string;
  propertyTitle: string | null;
  leaseId: string | null;
  type: InspectionType;
  status: InspectionStatus;
  scheduledFor: string | null;
  conductedAt: string | null;
  itemCount: number;
  estimatedRemedialCost: number;
  createdAt: string;
}

export interface InspectionDetail extends InspectionListItem {
  summaryNotes: string | null;
  /** A manager under a mandate may release the report to the owner; never the owner. */
  canShareWithOwner: boolean;
  sharedAt: string | null;
  conductedByName: string | null;
  items: InspectionItem[];
  summary: {
    itemCount: number;
    conditionCounts: Record<InspectionCondition, number>;
    estimatedRemedialCost: number;
    hasRemedialFindings: boolean;
  };
  tenantAcknowledgedAt?: string | null;
  tenantComment?: string | null;
}

/* --------------------------------- api --------------------------------- */

export const managementApi = {
  activity: (input: { propertyId?: string; who: ActivityWho; before?: string | null }) =>
    apiFetch<ActivityPage>(
      `/owner-activity${toQuery({ who: input.who, propertyId: input.propertyId, before: input.before })}`
    ),

  queries: (as: 'owner' | 'manager') => apiFetch<QuerySummary[]>(`/owner-queries?as=${as}`),
  query: (id: string) => apiFetch<QueryThread>(`/owner-queries/${id}`),
  askQuery: (input: {
    propertyId: string;
    category: QueryCategory;
    subject: string;
    body: string;
  }) => apiFetch<QueryThread>('/owner-queries', { method: 'POST', body: input }),
  replyQuery: (id: string, body: string) =>
    apiFetch<QueryThread>(`/owner-queries/${id}/messages`, { method: 'POST', body: { body } }),
  resolveQuery: (id: string) =>
    apiFetch<QueryThread>(`/owner-queries/${id}/resolve`, { method: 'POST' }),
  reopenQuery: (id: string) =>
    apiFetch<QueryThread>(`/owner-queries/${id}/reopen`, { method: 'POST' }),

  myMandates: () => apiFetch<OwnerMandate[]>('/management-mandates/mine'),

  spendApprovals: (role: SpendApprovalRole, page = 1, pageSize = 20) =>
    apiFetch<Paginated<SpendApproval>>(
      `/landlord/spend-approvals${toQuery({ role, page, pageSize })}`
    ),
  approveSpend: (id: string) =>
    apiFetch<SpendApproval>(`/landlord/spend-approvals/${id}/approve`, { method: 'POST' }),
  rejectSpend: (id: string, reason: string) =>
    apiFetch<SpendApproval>(`/landlord/spend-approvals/${id}/reject`, {
      method: 'POST',
      body: { reason },
    }),
  setMandateCap: (mandateId: string, cap: number | null) =>
    apiFetch<void>(`/landlord/spend-approvals/mandate/${mandateId}/cap`, {
      method: 'PUT',
      body: { cap },
    }),

  awaitingCountersign: () =>
    apiFetch<AwaitingCountersign[]>('/property-authorities/awaiting-countersignature'),
  countersign: (id: string) =>
    apiFetch<AwaitingCountersign>(`/property-authorities/${id}/countersign`, { method: 'POST' }),
  declineCountersign: (id: string, reason?: string) =>
    apiFetch<AwaitingCountersign>(`/property-authorities/${id}/countersign/decline`, {
      method: 'POST',
      body: { reason },
    }),

  deposits: (status?: DepositStatus, page = 1, pageSize = 20) =>
    apiFetch<Paginated<DepositListItem>>(`/deposits${toQuery({ status, page, pageSize })}`),
  deposit: (id: string) => apiFetch<DepositHold>(`/deposits/${id}`),
  createDeposit: (input: { leaseId: string; amount?: number }) =>
    apiFetch<DepositHold>('/deposits', { method: 'POST', body: input }),
  proposeDeduction: (id: string, input: { amount: number; reason: string }) =>
    apiFetch<DepositHold>(`/deposits/${id}/deductions`, { method: 'POST', body: input }),
  approveDeduction: (id: string, deductionId: string, note?: string) =>
    apiFetch<DepositHold>(`/deposits/${id}/deductions/${deductionId}/approve`, {
      method: 'POST',
      body: note ? { note } : {},
    }),
  rejectDeduction: (id: string, deductionId: string, reason: string) =>
    apiFetch<DepositHold>(`/deposits/${id}/deductions/${deductionId}/reject`, {
      method: 'POST',
      body: { reason },
    }),
  answerDispute: (id: string, deductionId: string, input: { answer: string; withdraw: boolean }) =>
    apiFetch<DepositHold>(`/deposits/${id}/deductions/${deductionId}/answer-dispute`, {
      method: 'POST',
      body: input,
    }),
  returnDeposit: (id: string) =>
    apiFetch<DepositHold>(`/deposits/${id}/return`, { method: 'POST' }),

  inspections: (status?: InspectionStatus, page = 1, pageSize = 20) =>
    apiFetch<Paginated<InspectionListItem>>(`/inspections${toQuery({ status, page, pageSize })}`),
  inspection: (id: string) => apiFetch<InspectionDetail>(`/inspections/${id}`),
  createInspection: (input: {
    propertyId: string;
    type: InspectionType;
    scheduledFor?: string;
    summaryNotes?: string;
  }) => apiFetch<InspectionDetail>('/inspections', { method: 'POST', body: input }),
  addInspectionItem: (
    id: string,
    input: { area: string; condition: InspectionCondition; notes?: string; estimatedCost?: number }
  ) => apiFetch<InspectionDetail>(`/inspections/${id}/items`, { method: 'POST', body: input }),
  addInspectionPhoto: (id: string, itemId: string, file: PickedFile) => {
    const form = new FormData();
    appendFile(form, 'file', file);
    return apiUpload<InspectionDetail>(`/inspections/${id}/items/${itemId}/photos`, form);
  },
  completeInspection: (id: string) =>
    apiFetch<InspectionDetail>(`/inspections/${id}/complete`, { method: 'POST' }),
  shareInspection: (id: string) =>
    apiFetch<InspectionDetail>(`/inspections/${id}/share`, { method: 'POST' }),
};
