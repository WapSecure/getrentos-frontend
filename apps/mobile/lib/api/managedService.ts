import { apiFetch } from './client';
import type { BadgeTone } from '@getrentos/ui-native';

/**
 * Getting a property managed: by GetRentos (an intake: request, site visit,
 * proposal, acceptance signs the mandate) or by a vetted firm (a mandate the
 * firm accepts and GetRentos verifies). Either way it is an ordinary mandate.
 */

export type ServicingTier = 'COLLECT_ONLY' | 'COLLECT_MAINTAIN' | 'FULL_MANAGEMENT';

export const TIER_LABEL: Record<ServicingTier, string> = {
  COLLECT_ONLY: 'Collect',
  COLLECT_MAINTAIN: 'Collect + Maintain',
  FULL_MANAGEMENT: 'Full management',
};

export interface ManagedTierCard {
  tier: ServicingTier;
  name: string;
  feePct: number;
  lettingCommissionPct: number;
  renewalCommissionPct: number;
  summary: string;
  includes: string[];
}

export interface ManagedSlaTarget {
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  responseTargetMinutes: number;
  resolutionTargetMinutes: number;
  emergencyRoutingEnabled: boolean;
}

export const PRIORITY_LABEL: Record<ManagedSlaTarget['priority'], string> = {
  URGENT: 'Urgent',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
};

export interface VettedFirm {
  id: string;
  name: string;
  since: string;
  rank: number;
  teamSize: number;
  activeEngagements: number;
  maintenance: {
    resolvedJobs: number;
    openJobs: number;
    averageResolutionDays: number | null;
    slaOnTimeRate: number | null;
  };
}

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
  PENDING_OWNER: { label: 'Awaiting your signature', tone: 'warning' },
  PENDING_OPS: { label: 'With GetRentos for review', tone: 'warning' },
  ACTIVE: { label: 'Managed by GetRentos', tone: 'success' },
  SUSPENDED: { label: 'Paused', tone: 'warning' },
  TERMINATED: { label: 'Ended', tone: 'neutral' },
  EXPIRED: { label: 'Expired', tone: 'neutral' },
  REJECTED: { label: 'Declined', tone: 'danger' },
};

export interface Mandate {
  id: string;
  propertyId: string;
  managerIsGetRentos: boolean;
  managerOrganizationName?: string | null;
  managerName?: string | null;
  deliveryPartnerName?: string | null;
  servicingTier: ServicingTier | null;
  noticePeriodDays: number;
  noticeServedAt: string | null;
  handoverAt: string | null;
  /** Set once the engagement went live; a cancelled request never has one. */
  activatedAt: string | null;
  status: MandateStatus;
  createdAt: string;
}

export type IntakeStatus =
  | 'SUBMITTED'
  | 'ASSESSMENT_SCHEDULED'
  | 'ASSESSED'
  | 'PROPOSED'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'WITHDRAWN';

export const OPEN_INTAKE: IntakeStatus[] = [
  'SUBMITTED',
  'ASSESSMENT_SCHEDULED',
  'ASSESSED',
  'PROPOSED',
];

export const INTAKE_STEPS: { status: IntakeStatus; label: string }[] = [
  { status: 'SUBMITTED', label: 'Requested' },
  { status: 'ASSESSMENT_SCHEDULED', label: 'Visit booked' },
  { status: 'ASSESSED', label: 'Assessed' },
  { status: 'PROPOSED', label: 'Proposal' },
  { status: 'ACCEPTED', label: 'Accepted' },
];

export type PropertyClass =
  | 'SINGLE_HOME'
  | 'BLOCK_OF_FLATS'
  | 'ESTATE_UNITS'
  | 'MIXED_USE'
  | 'COMMERCIAL';

export const PROPERTY_CLASSES: { value: PropertyClass; label: string }[] = [
  { value: 'SINGLE_HOME', label: 'A single home' },
  { value: 'BLOCK_OF_FLATS', label: 'A block of flats' },
  { value: 'ESTATE_UNITS', label: 'Units in an estate' },
  { value: 'MIXED_USE', label: 'Mixed use' },
  { value: 'COMMERCIAL', label: 'Commercial' },
];

export const SERVICE_NEEDS = [
  'Find tenants',
  'Collect rent',
  'Chase arrears',
  'Repairs and upkeep',
  'Service charge',
  'Legal notices',
  'Vacant property care',
];

export interface ManagedIntake {
  id: string;
  status: IntakeStatus;
  proposalExpired: boolean;
  propertyId: string;
  propertyTitle: string;
  requestedTier: ServicingTier;
  indicativeFeePct: number;
  indicativeMonthlyFee: number | null;
  assessorName: string | null;
  assessmentScheduledFor: string | null;
  findings: string | null;
  proposal: {
    tierName: string;
    feePct: number | null;
    lettingCommissionPct: number | null;
    renewalCommissionPct: number | null;
    includes: string[];
    exclusions: string | null;
    note: string | null;
    expiresAt: string | null;
  } | null;
  acceptedAt: string | null;
  declinedReason: string | null;
  createdAt: string;
}

export interface IntakeInput {
  propertyId: string;
  requestedTier: ServicingTier;
  propertyClass: PropertyClass;
  unitCount: number;
  occupiedUnits: number;
  annualRentRoll?: number;
  serviceNeeds?: string[];
  ownerNotes?: string;
}

export interface BreakFee {
  amount: number;
  waived: boolean;
  reason: string;
}

/** The shortest reason the API accepts for ending or withdrawing an engagement. */
export const END_REASON_MIN = 10;

const ENDED: MandateStatus[] = ['TERMINATED', 'EXPIRED', 'REJECTED'];
const PENDING: MandateStatus[] = ['PENDING_OWNER', 'PENDING_OPS', 'DRAFT'];

export const isLive = (m: Mandate) => !ENDED.includes(m.status);
/**
 * Ended after running, with the handover not confirmed yet. A request that was
 * cancelled before it went live ended too, but there is nothing to hand over.
 */
export const isWindingDown = (m: Mandate) =>
  m.status === 'TERMINATED' && !m.handoverAt && !!m.activatedAt;
export const isPendingMandate = (m: Mandate) => PENDING.includes(m.status);

/** Where one property stands, from the owner's newest mandate and newest request on it. */
export type PropertyState =
  | { kind: 'getrentos'; mandate: Mandate; settingUp: ManagedIntake | null }
  | { kind: 'firm'; mandate: Mandate; openIntake: ManagedIntake | null }
  | { kind: 'winding-down'; mandate: Mandate }
  | { kind: 'requested'; intake: ManagedIntake }
  | { kind: 'none'; declined: ManagedIntake | null };

/** Both lists come newest first, so the first match per property is the current one. */
export function propertyState(
  propertyId: string,
  mandates: Mandate[],
  intakes: ManagedIntake[]
): PropertyState {
  const mandate = mandates.find((m) => m.propertyId === propertyId);
  const intake = intakes.find((i) => i.propertyId === propertyId) ?? null;
  const openIntake = intake && OPEN_INTAKE.includes(intake.status) ? intake : null;

  if (mandate && isLive(mandate)) {
    if (mandate.managerIsGetRentos) {
      const settingUp =
        mandate.status !== 'ACTIVE' && intake?.status === 'ACCEPTED' ? intake : null;
      return { kind: 'getrentos', mandate, settingUp };
    }
    return { kind: 'firm', mandate, openIntake };
  }
  if (mandate && isWindingDown(mandate)) return { kind: 'winding-down', mandate };
  if (openIntake) return { kind: 'requested', intake: openIntake };
  return { kind: 'none', declined: intake?.status === 'DECLINED' ? intake : null };
}

/** Properties a firm could be appointed to: nothing live or winding down on them. */
export function openForFirm(propertyIds: string[], mandates: Mandate[]) {
  return propertyIds.filter((id) => {
    const s = propertyState(id, mandates, []);
    return s.kind === 'none' || s.kind === 'requested';
  });
}

/** Minutes as an owner reads them: "1 hour", "2 days". */
export function humanizeMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 1440) {
    const h = Math.round(minutes / 60);
    return `${h} ${h === 1 ? 'hour' : 'hours'}`;
  }
  const d = Math.round(minutes / 1440);
  return `${d} ${d === 1 ? 'day' : 'days'}`;
}

/** When a served notice runs out, or null while none is served. */
export function noticeEndsAt(m: Pick<Mandate, 'noticeServedAt' | 'noticePeriodDays'>) {
  if (!m.noticeServedAt) return null;
  const served = Date.parse(m.noticeServedAt);
  return Number.isNaN(served)
    ? null
    : new Date(served + m.noticePeriodDays * 86_400_000).toISOString();
}

/** Indicative monthly fee from a yearly rent roll, or null without one. */
export const indicativeMonthly = (annualRent: number, feePct: number) =>
  annualRent > 0 ? Math.round((annualRent / 12) * (feePct / 100)) : null;

/** Why the request cannot be sent yet, or null. */
export function intakeBlocker(units: string, occupied: string): string | null {
  const u = Number(units);
  const o = Number(occupied);
  if (!Number.isInteger(u) || u < 1) return 'Give the number of units, at least 1.';
  if (!Number.isInteger(o) || o < 0) return 'Give how many are occupied now.';
  if (o > u) return 'Occupied units can’t be more than units.';
  return null;
}

export const managedApi = {
  feeCard: () => apiFetch<ManagedTierCard[]>('/management-mandates/managed/fee-card'),
  sla: () => apiFetch<ManagedSlaTarget[]>('/management-mandates/managed/sla'),
  firms: () => apiFetch<VettedFirm[]>('/management-mandates/firms'),
  mandates: () => apiFetch<Mandate[]>('/management-mandates/mine'),
  intakes: () => apiFetch<ManagedIntake[]>('/managed/intakes/mine'),
  submitIntake: (input: IntakeInput) =>
    apiFetch<ManagedIntake>('/managed/intakes', { method: 'POST', body: input }),
  withdrawIntake: (id: string) =>
    apiFetch<ManagedIntake>(`/managed/intakes/${id}/withdraw`, { method: 'POST' }),
  acceptProposal: (id: string) =>
    apiFetch<ManagedIntake>(`/managed/intakes/${id}/accept`, {
      method: 'POST',
      body: { agree: true },
    }),
  breakFee: (mandateId: string) =>
    apiFetch<BreakFee>(`/management-mandates/${mandateId}/break-fee`),
  terminate: (mandateId: string, reason: string) =>
    apiFetch<Mandate>(`/management-mandates/${mandateId}/terminate`, {
      method: 'POST',
      body: { reason },
    }),
  recordHandover: (mandateId: string) =>
    apiFetch<Mandate>(`/management-mandates/${mandateId}/handover`, { method: 'POST' }),
  /** Create the engagement with the firm, then send it to them. */
  appointFirm: async (firmId: string, propertyId: string) => {
    const created = await apiFetch<Mandate>('/management-mandates', {
      method: 'POST',
      body: { propertyId, managerOrganizationId: firmId, scope: ['RENT', 'MAINTENANCE'] },
    });
    return apiFetch<Mandate>(`/management-mandates/${created.id}/submit`, { method: 'POST' });
  },
};
