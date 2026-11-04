import type { BadgeTone } from '@getrentos/ui-native';
import { apiFetch } from './client';

/**
 * The agency workspace: staff of a property-management firm acting for their
 * clients. Every engagement is a mandate; a manager works on one client's
 * property at a time (custody), and what they may do is decided by the API
 * (`permissions`, `capabilities`), never worked out here.
 */

export const MANDATE_SCOPES = ['RENT', 'MAINTENANCE', 'LISTINGS', 'LEGAL', 'COMPLIANCE'] as const;
export type MandateScope = (typeof MANDATE_SCOPES)[number];

export const SCOPE_LABEL: Record<MandateScope, string> = {
  RENT: 'Collect rent and run the tenancy',
  MAINTENANCE: 'Repairs, vendors and inspections',
  LISTINGS: 'Advertise and let the property',
  LEGAL: 'Instruct and run proceedings',
  COMPLIANCE: 'Statutory notices and documents',
};

export type MandateStatus =
  | 'DRAFT'
  | 'PENDING_OWNER'
  | 'PENDING_OPS'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'TERMINATED'
  | 'EXPIRED'
  | 'REJECTED';

export const MANDATE_STATUS: Record<MandateStatus, { label: string; tone: BadgeTone }> = {
  DRAFT: { label: 'Draft', tone: 'neutral' },
  PENDING_OWNER: { label: 'Waiting for the owner’s signature', tone: 'info' },
  PENDING_OPS: { label: 'Waiting for GetRentos to verify', tone: 'info' },
  ACTIVE: { label: 'Active', tone: 'success' },
  SUSPENDED: { label: 'Suspended', tone: 'warning' },
  TERMINATED: { label: 'Ended', tone: 'neutral' },
  EXPIRED: { label: 'Expired', tone: 'neutral' },
  REJECTED: { label: 'Refused', tone: 'danger' },
};

export interface MandatePermissions {
  canSubmit: boolean;
  canSign: boolean;
  canSuspend: boolean;
  canResume: boolean;
  canServeNotice: boolean;
  canTerminate: boolean;
  canRequestTermination: boolean;
  canConfirmHandover: boolean;
}

export interface Mandate {
  id: string;
  propertyId: string;
  propertyTitle?: string | null;
  ownerId: string;
  ownerName?: string | null;
  managerOrganizationName?: string | null;
  managerIsGetRentos: boolean;
  managerName?: string | null;
  scope: MandateScope[];
  capabilities: { canList: boolean; canManage: boolean; canTransact: boolean };
  permissions: MandatePermissions;
  startAt: string | null;
  endAt: string | null;
  noticePeriodDays: number;
  status: MandateStatus;
  agreementDocumentId: string | null;
  poaDocumentId: string | null;
  signedByOwnerAt: string | null;
  signedByManagerAt: string | null;
  submittedById: string | null;
  decidedAt: string | null;
  decisionNote: string | null;
  activatedAt: string | null;
  noticeServedAt: string | null;
  terminatedAt: string | null;
  terminationReason: string | null;
  handoverAt: string | null;
  createdAt: string;
}

/** Operative right now: active, and not past an agreed end date. */
export function isLive(m: Mandate, now = Date.now()): boolean {
  if (m.status !== 'ACTIVE') return false;
  return !(m.endAt && Date.parse(m.endAt) <= now);
}

/** Over for good: ended, expired, or active but past its end date. */
export function hasEnded(m: Mandate, now = Date.now()): boolean {
  if (m.status === 'TERMINATED' || m.status === 'EXPIRED') return true;
  return m.status === 'ACTIVE' && !!m.endAt && Date.parse(m.endAt) <= now;
}

export const endedOn = (m: Mandate) => m.terminatedAt ?? m.endAt ?? null;

/** The scope grants nothing enforceable yet, which explains an empty portfolio. */
export const grantsNothing = (m: Mandate) =>
  !m.capabilities.canList && !m.capabilities.canManage && !m.capabilities.canTransact;

/** A day in Lagos time, as web shows it: "4 Nov 2026". */
export const formatDay = (iso: string | null | undefined) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'Africa/Lagos',
      });
};

export function noticeEndsAt(m: Pick<Mandate, 'noticeServedAt' | 'noticePeriodDays'>) {
  if (!m.noticeServedAt) return null;
  const served = Date.parse(m.noticeServedAt);
  return Number.isNaN(served)
    ? null
    : new Date(served + m.noticePeriodDays * 86_400_000).toISOString();
}

/** How the engagement ends, in plain words. */
export function noticeSummary(m: Mandate): string {
  if (m.status === 'TERMINATED')
    return m.terminatedAt ? `Ended ${formatDay(m.terminatedAt)}` : 'Ended';
  if (m.status === 'EXPIRED') return m.endAt ? `Expired ${formatDay(m.endAt)}` : 'Expired';
  const ends = noticeEndsAt(m);
  if (ends) return `Notice served, ends ${formatDay(ends)}`;
  if (!m.endAt) {
    return m.noticePeriodDays > 0
      ? `Rolling, ${m.noticePeriodDays} days' notice`
      : 'Rolling, no notice period agreed';
  }
  return `Ends ${formatDay(m.endAt)}`;
}

export const managerLabel = (m: Mandate) =>
  m.managerIsGetRentos
    ? 'GetRentos is the manager'
    : (m.managerOrganizationName ?? m.managerName ?? 'Manager');

/**
 * Which client is selected, from what was stored and what the manager holds.
 * A stored choice counts only while the mandate is still theirs (live or not,
 * so the bar can say why it can't be acted under). With nothing stored, one
 * live mandate is chosen for them; with several, none is, so choosing comes
 * first.
 */
export function resolveSelection(
  stored: string | null,
  mandates: Mandate[],
  now = Date.now()
): string | null {
  if (stored && mandates.some((m) => m.id === stored)) return stored;
  const live = mandates.filter((m) => isLive(m, now));
  return live.length === 1 ? live[0].id : null;
}

/** Clients, one per owner, sorted by name, with their engagements. */
export function groupByOwner(mandates: Mandate[], now = Date.now()) {
  const byOwner = new Map<string, { ownerId: string; ownerName: string; mandates: Mandate[] }>();
  for (const m of mandates) {
    const g = byOwner.get(m.ownerId) ?? {
      ownerId: m.ownerId,
      ownerName: m.ownerName ?? 'Owner',
      mandates: [],
    };
    g.mandates.push(m);
    byOwner.set(m.ownerId, g);
  }
  return [...byOwner.values()]
    .map((g) => ({ ...g, live: g.mandates.filter((m) => isLive(m, now)).length }))
    .sort((a, b) => a.ownerName.localeCompare(b.ownerName));
}

/* ------------------------------ mandate actions ------------------------------ */

export type MandateAction =
  | 'submit'
  | 'sign'
  | 'notice'
  | 'suspend'
  | 'resume'
  | 'handover'
  | 'request-termination'
  | 'terminate';

/** Reasons the API asks for must be at least this long. */
export const REASON_MIN = 10;

export const ACTION_COPY: Record<
  MandateAction,
  {
    label: string;
    confirm?: { title: string; body?: string; prompt?: string };
    destructive?: boolean;
  }
> = {
  submit: { label: 'Send to the owner' },
  sign: { label: 'Sign' },
  notice: {
    label: 'Serve notice',
    confirm: {
      title: 'Serve notice?',
      body: 'The notice period starts now and runs its agreed length. It cannot be back-dated.',
    },
  },
  suspend: {
    label: 'Pause',
    confirm: { title: 'Pause this engagement?', prompt: 'What needs resolving?' },
  },
  resume: { label: 'Resume' },
  handover: { label: 'Record handover' },
  'request-termination': {
    label: 'Ask GetRentos to end it',
    confirm: {
      title: 'Ask GetRentos to end this engagement?',
      prompt: 'Why should this engagement end?',
    },
  },
  terminate: {
    label: 'End engagement',
    destructive: true,
    confirm: {
      title: 'End this engagement?',
      prompt: 'Why is this ending early, or before notice has run?',
    },
  },
};

/** The actions this viewer may take now, in the order web shows them. */
export function availableActions(m: Mandate): MandateAction[] {
  const p = m.permissions;
  const out: MandateAction[] = [];
  if (p.canSubmit) out.push('submit');
  if (p.canSign) out.push('sign');
  if (p.canServeNotice && !m.noticeServedAt) out.push('notice');
  if (p.canSuspend) out.push('suspend');
  if (p.canResume) out.push('resume');
  if (p.canConfirmHandover) out.push('handover');
  if (p.canRequestTermination) out.push('request-termination');
  if (p.canTerminate) out.push('terminate');
  return out;
}

export const ACTION_DONE: Record<MandateAction, string> = {
  submit: 'Sent to the owner to sign.',
  sign: 'Signed.',
  notice: 'Notice served.',
  suspend: 'Engagement paused.',
  resume: 'Engagement resumed.',
  handover: 'Handover recorded.',
  'request-termination': 'Request sent to GetRentos.',
  terminate: 'Engagement ended.',
};

/* --------------------------------- other data -------------------------------- */

export interface AgencyDashboard {
  firmName: string;
  clients: { active: number; pending: number; endedLast90Days: number };
  portfolio: {
    properties: number;
    units: number;
    occupiedUnits: number;
    occupancyRate: number | null;
  };
  rentThisMonth: { due: number; collected: number; collectionRate: number | null };
  arrears: {
    total: number;
    charges: number;
    aging: { days0to30: number; days31to60: number; days61to90: number; days90plus: number };
  };
  maintenance: { open: number; slaBreached: number; resolvedThisMonth: number };
  team: { active: number };
  commissionsThisMonth: number;
}

export interface AttentionItem {
  key: string;
  severity: 'urgent' | 'soon' | 'info';
  title: string;
  detail?: string;
  link?: { path: string; label: string };
}

export interface OwnerInvite {
  id: string;
  email: string;
  name: string | null;
  status: 'PENDING' | 'CLAIMED' | 'REVOKED' | 'EXPIRED';
  hasAccount: boolean;
  expiresAt: string;
  createdAt: string;
}

export const INVITE_STATUS: Record<OwnerInvite['status'], { label: string; tone: BadgeTone }> = {
  PENDING: { label: 'Invited', tone: 'info' },
  CLAIMED: { label: 'Joined', tone: 'success' },
  REVOKED: { label: 'Withdrawn', tone: 'neutral' },
  EXPIRED: { label: 'Expired', tone: 'warning' },
};

export type ClientStage = 'LEAD' | 'ONBOARDING' | 'ACTIVE' | 'DORMANT';
export const CLIENT_STAGES: { value: ClientStage; label: string }[] = [
  { value: 'LEAD', label: 'Lead' },
  { value: 'ONBOARDING', label: 'Onboarding' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'DORMANT', label: 'Dormant' },
];

export interface AgencyClient {
  ownerId: string;
  ownerName: string;
  email: string | null;
  phone: string | null;
  companyName: string | null;
  verificationStatus: string | null;
  trustScore: number | null;
  stage: ClientStage;
  properties: { propertyId: string; title: string; mandateStatus: MandateStatus }[];
  notes: { id: string; content: string; authorName: string | null; createdAt: string }[];
}

export const ENTRY_TYPE_LABEL: Record<string, string> = {
  RENT_RECEIVED: 'Rent received',
  DUES_RECEIVED: 'Dues received',
  EXPENSE_PAID: 'Expense paid',
  MANAGEMENT_FEE: 'Management fee',
  PAYOUT_TO_OWNER: 'Paid to owner',
  ADJUSTMENT: 'Adjustment',
};

export interface ClientMoney {
  balance: number | null;
  reconciledBalance: number;
  inSync: boolean;
  protection: { schemeName: string; coverageAmount: number | null } | null;
  entries: {
    occurredAt: string;
    entryType: string;
    propertyTitle: string | null;
    amount: number;
    balanceAfter: number;
  }[];
}

export interface ManagedProperty {
  mandateId: string;
  propertyId: string;
  title: string;
  propertyType: string;
  address: string;
  city: string;
}

export interface AgencyTransfer {
  id: string;
  propertyName: string;
  status: 'OPEN' | 'SWITCHED' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
  effectiveAt: string;
  outgoing: { manager: string } | null;
  incoming: { manager: string; mandateId: string | null };
}

export interface TerminationRequest {
  id: string;
  requestedByName: string | null;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'CANCELLED';
  decidedByName: string | null;
  decidedAt: string | null;
  decisionNote: string | null;
  createdAt: string;
}

export const TERMINATION_REQUEST_LABEL: Record<TerminationRequest['status'], string> = {
  PENDING: 'Awaiting a second approver',
  APPROVED: 'Approved',
  CANCELLED: 'Withdrawn',
};

const mandatePath = (id: string) => `/management-mandates/${encodeURIComponent(id)}`;

export const agencyApi = {
  managing: () => apiFetch<Mandate[]>('/management-mandates/managing'),
  mandate: (id: string) => apiFetch<Mandate>(mandatePath(id)),
  terminationRequests: (id: string) =>
    apiFetch<TerminationRequest[]>(`${mandatePath(id)}/termination-requests`),
  act: (id: string, action: MandateAction, reason?: string) => {
    const path = action === 'request-termination' ? 'termination-requests' : action;
    const body = action === 'sign' ? {} : reason !== undefined ? { reason } : undefined;
    return apiFetch<Mandate | TerminationRequest>(`${mandatePath(id)}/${path}`, {
      method: 'POST',
      ...(body !== undefined ? { body } : {}),
    });
  },
  dashboard: () => apiFetch<AgencyDashboard>('/agency/dashboard'),
  attention: () => apiFetch<{ items: AttentionItem[] }>('/agency/assistant/attention'),
  managedProperties: () => apiFetch<ManagedProperty[]>('/property-authorities/managed'),
  ownerInvites: () => apiFetch<OwnerInvite[]>('/agency/owner-invites'),
  inviteOwner: (input: { email: string; name?: string; note?: string }) =>
    apiFetch<OwnerInvite>('/agency/owner-invites', { method: 'POST', body: input }),
  revokeOwnerInvite: (id: string) =>
    apiFetch<OwnerInvite>(`/agency/owner-invites/${id}/revoke`, { method: 'POST' }),
  client: (ownerId: string) => apiFetch<AgencyClient>(`/agency/clients/${ownerId}`),
  setClientStage: (ownerId: string, stage: ClientStage) =>
    apiFetch<AgencyClient>(`/agency/clients/${ownerId}/stage`, { method: 'PUT', body: { stage } }),
  addClientNote: (ownerId: string, content: string) =>
    apiFetch<AgencyClient>(`/agency/clients/${ownerId}/notes`, {
      method: 'POST',
      body: { content },
    }),
  clientMoney: (ownerId: string) => apiFetch<ClientMoney>(`/agency/owners/${ownerId}/client-money`),
  transfers: () => apiFetch<AgencyTransfer[]>('/management-transfers/managing'),
  teamMembers: () => apiFetch<unknown[]>('/agency/team/members'),
};
