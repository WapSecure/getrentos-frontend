import { apiFetch } from './client';
import type { BadgeTone } from '@sureground/ui-native';

/**
 * Legal cases: eviction, rent and debt recovery, injunctions, title disputes.
 *
 * A case moves OPEN → FILED → DECIDED → CLOSED, or leaves as WITHDRAWN. A
 * possession claim rests on the tenancy's notice ladder, and the server refuses
 * to file one before the notices have run out, so its refusal is shown as is.
 */

export type LegalCaseKind =
  | 'EVICTION'
  | 'RENT_RECOVERY'
  | 'INJUNCTION'
  | 'TITLE_DISPUTE'
  | 'DEBT_RECOVERY'
  | 'OTHER';
export type LegalCaseStatus = 'OPEN' | 'FILED' | 'DECIDED' | 'CLOSED' | 'WITHDRAWN';
export type LegalCaseOutcome = 'WON' | 'LOST' | 'SETTLED' | 'DISCONTINUED';
export type EnforcementMethod = 'BAILIFF' | 'POLICE' | 'NONE';
export type HearingOutcome = 'ADJOURNED' | 'HEARD' | 'NOT_REACHED' | 'DECIDED';

export interface LegalCaseHearing {
  id: string;
  scheduledFor: string;
  /** Null while the sitting is still expected. */
  heldAt: string | null;
  outcome: HearingOutcome | null;
  purpose: string | null;
  notes: string | null;
}

export interface LegalCase {
  id: string;
  kind: LegalCaseKind;
  kindLabel: string;
  status: LegalCaseStatus;
  description: string;
  propertyId: string;
  property: { id: string; title: string; address: string; city: string; state: string };
  leaseId: string | null;
  unitName: string | null;
  tenantId: string | null;
  tenantName: string | null;
  court: string | null;
  suitNumber: string | null;
  filedAt: string | null;
  outcome: LegalCaseOutcome | null;
  outcomeAt: string | null;
  outcomeNotes: string | null;
  enforcementMethod: EnforcementMethod | null;
  enforcementAt: string | null;
  enforcementNotes: string | null;
  advocateName: string | null;
  advocateFirm: string | null;
  advocateContact: string | null;
  advocateFeeAgreement: string | null;
  advocateInstructedAt: string | null;
  openedById: string;
  openedByName: string | null;
  closedAt: string | null;
  createdAt: string;
  hearings: LegalCaseHearing[];
  nextHearingAt: string | null;
  /** Null when the case is not about possession. */
  ladderReadyToFile: boolean | null;
  outstanding: { action: string; detail: string }[];
  costs: {
    totalAmount: number;
    items: { id: string; amount: number; note: string | null; incurredAt: string }[];
  };
}

export const LEGAL_STATUS: Record<LegalCaseStatus, { label: string; tone: BadgeTone }> = {
  OPEN: { label: 'Open', tone: 'neutral' },
  FILED: { label: 'Filed', tone: 'info' },
  // A decision usually starts work (enforcement), so it does not read as done.
  DECIDED: { label: 'Decided', tone: 'warning' },
  CLOSED: { label: 'Closed', tone: 'success' },
  WITHDRAWN: { label: 'Withdrawn', tone: 'neutral' },
};

export const CASE_KINDS: { value: LegalCaseKind; label: string }[] = [
  { value: 'EVICTION', label: 'Eviction' },
  { value: 'RENT_RECOVERY', label: 'Rent recovery' },
  { value: 'INJUNCTION', label: 'Injunction' },
  { value: 'TITLE_DISPUTE', label: 'Title dispute' },
  { value: 'DEBT_RECOVERY', label: 'Debt recovery' },
  { value: 'OTHER', label: 'Other' },
];

export const OUTCOMES: { value: LegalCaseOutcome; label: string }[] = [
  { value: 'WON', label: 'Won' },
  { value: 'LOST', label: 'Lost' },
  { value: 'SETTLED', label: 'Settled' },
  { value: 'DISCONTINUED', label: 'Discontinued' },
];

export const ENFORCEMENT: { value: EnforcementMethod; label: string }[] = [
  { value: 'BAILIFF', label: 'Court bailiff' },
  { value: 'POLICE', label: 'Police assistance' },
  { value: 'NONE', label: 'Not needed' },
];

export const HEARING_RESULTS: { value: HearingOutcome; label: string }[] = [
  { value: 'HEARD', label: 'Heard' },
  { value: 'ADJOURNED', label: 'Adjourned' },
  { value: 'NOT_REACHED', label: 'Not reached' },
  { value: 'DECIDED', label: 'Decided' },
];

export const MIN_DESCRIPTION = 10;

export const isDone = (c: LegalCase) => c.status === 'CLOSED' || c.status === 'WITHDRAWN';

const notReadyToFile = (c: LegalCase) =>
  c.outstanding.some((o) => o.action === 'Not ready to file');

/** A case with no next step: blocked from filing, filed with no date, or decided and not enforced. */
export const needsAttention = (c: LegalCase) =>
  notReadyToFile(c) || (c.status === 'FILED' && c.nextHearingAt === null) || c.status === 'DECIDED';

/** The short "what is next" line for the list. */
export function nextLine(
  c: LegalCase,
  fmt: (iso: string) => string
): {
  text: string;
  warn: boolean;
} {
  if (notReadyToFile(c)) return { text: 'Cannot file yet', warn: true };
  if (c.nextHearingAt) return { text: `Next sitting ${fmt(c.nextHearingAt)}`, warn: false };
  if (c.status === 'FILED') return { text: 'Nothing scheduled', warn: true };
  if (c.status === 'DECIDED') {
    return c.enforcementAt
      ? { text: 'Enforced, ready to close', warn: true }
      : { text: 'Awaiting enforcement', warn: true };
  }
  if (c.status === 'OPEN') return { text: 'Not filed', warn: false };
  return { text: LEGAL_STATUS[c.status].label, warn: false };
}

export const nextHearing = (c: LegalCase) =>
  c.hearings
    .filter((h) => h.heldAt === null)
    .sort((a, b) => Date.parse(a.scheduledFor) - Date.parse(b.scheduledFor))[0];

export type PrimaryAction =
  | { kind: 'none' }
  | { kind: 'blocked'; title: string; why: string }
  | { kind: 'file' }
  | { kind: 'schedule' }
  | { kind: 'record'; hearing: LegalCaseHearing }
  | { kind: 'enforce' };

/** The one next thing to do on a case, chosen by its state. */
export function primaryAction(c: LegalCase): PrimaryAction {
  if (isDone(c)) return { kind: 'none' };
  if (c.status === 'OPEN') {
    if (c.kind === 'EVICTION' && c.leaseId === null) {
      return {
        kind: 'blocked',
        title: 'Cannot be filed',
        why: 'This case names no tenancy, so there is no notice record to check. A possession claim needs those notices.',
      };
    }
    if (c.ladderReadyToFile === false) {
      return {
        kind: 'blocked',
        title: 'Not ready to file',
        why: 'The notice to quit and the notice of intention to recover must both be served and run out first. Filing early is a common way to lose the case outright.',
      };
    }
    return { kind: 'file' };
  }
  if (c.status === 'FILED') {
    const h = nextHearing(c);
    return h ? { kind: 'record', hearing: h } : { kind: 'schedule' };
  }
  // Recording enforcement leaves the case DECIDED; closing it is then the owner's call.
  if (c.status === 'DECIDED') return c.enforcementAt ? { kind: 'none' } : { kind: 'enforce' };
  return { kind: 'none' };
}

export type TimelineEntry = {
  at: string;
  title: string;
  detail?: string;
  tone: 'neutral' | 'good' | 'warn';
  /** Still ahead, such as a scheduled sitting. */
  upcoming?: boolean;
};

const lower = (s: string | null | undefined) => s?.replace(/_/g, ' ').toLowerCase();
const OUTCOME_LABEL = Object.fromEntries(OUTCOMES.map((o) => [o.value, o.label])) as Record<
  LegalCaseOutcome,
  string
>;

/** What has happened on the case, oldest first; a future sitting lands last. */
export function timelineFor(c: LegalCase, now = Date.now()): TimelineEntry[] {
  const entries: TimelineEntry[] = [
    { at: c.createdAt, title: 'Case opened', detail: c.description, tone: 'neutral' },
  ];
  if (c.filedAt) {
    entries.push({
      at: c.filedAt,
      title: 'Filed in court',
      detail: [c.court, c.suitNumber].filter(Boolean).join(' · '),
      tone: 'neutral',
    });
  }
  for (const h of c.hearings) {
    entries.push(
      h.heldAt
        ? {
            at: h.heldAt,
            title: `Sitting ${lower(h.outcome) ?? 'held'}`,
            detail: h.notes ?? h.purpose ?? undefined,
            tone: h.outcome === 'ADJOURNED' ? 'warn' : 'good',
          }
        : {
            at: h.scheduledFor,
            title: 'Hearing scheduled',
            detail: h.purpose ?? undefined,
            tone: 'neutral',
          }
    );
  }
  if (c.outcomeAt) {
    entries.push({
      at: c.outcomeAt,
      title: `Decided: ${c.outcome ? OUTCOME_LABEL[c.outcome] : 'recorded'}`,
      detail: c.outcomeNotes ?? undefined,
      tone: c.outcome === 'WON' ? 'good' : 'warn',
    });
  }
  if (c.advocateInstructedAt) {
    entries.push({
      at: c.advocateInstructedAt,
      title: `Counsel instructed: ${c.advocateName ?? ''}`.trim(),
      detail: [c.advocateFirm, c.advocateFeeAgreement].filter(Boolean).join(' · ') || undefined,
      tone: 'neutral',
    });
  }
  if (c.enforcementAt) {
    entries.push({
      at: c.enforcementAt,
      title: `Enforcement: ${lower(c.enforcementMethod) ?? 'recorded'}`,
      detail: c.enforcementNotes ?? undefined,
      tone: 'neutral',
    });
  }
  if (c.closedAt) {
    entries.push({
      at: c.closedAt,
      title: c.status === 'WITHDRAWN' ? 'Withdrawn' : 'Case closed',
      tone: 'neutral',
    });
  }
  return entries
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at))
    .map((e) => (Date.parse(e.at) > now ? { ...e, upcoming: true } : e));
}

/** Why the open-a-case form cannot be sent yet, or null. */
export function openBlocker(input: {
  kind: LegalCaseKind;
  leaseId: string;
  propertyId: string;
  description: string;
}): string | null {
  if (input.kind === 'EVICTION' && !input.leaseId) {
    return 'An eviction needs the tenancy its notices were served on.';
  }
  if (!input.leaseId && !input.propertyId) return 'Choose the tenancy or the property.';
  if (input.description.trim().length < MIN_DESCRIPTION) {
    return `Describe the matter in at least ${MIN_DESCRIPTION} characters.`;
  }
  return null;
}

export interface OpenCaseInput {
  kind: LegalCaseKind;
  propertyId: string;
  leaseId?: string;
  description: string;
}

const base = '/landlord/legal-cases';
const patch = <T>(path: string, body: unknown) =>
  apiFetch<T>(`${base}${path}`, { method: 'PATCH', body });

export const legalCasesApi = {
  list: (limit = 50) =>
    apiFetch<{ cases: LegalCase[]; limit: number; truncated: boolean }>(`${base}?limit=${limit}`),
  get: (id: string) => apiFetch<LegalCase>(`${base}/${id}`),
  open: (input: OpenCaseInput) => apiFetch<LegalCase>(base, { method: 'POST', body: input }),
  file: (id: string, input: { court: string; suitNumber: string }) =>
    patch<LegalCase>(`/${id}/file`, input),
  decide: (id: string, input: { outcome: LegalCaseOutcome; notes?: string; decidedAt?: string }) =>
    patch<LegalCase>(`/${id}/decide`, input),
  enforce: (id: string, input: { method: EnforcementMethod; notes?: string }) =>
    patch<LegalCase>(`/${id}/enforce`, input),
  advocate: (
    id: string,
    input: { name: string; firm?: string; contact?: string; feeAgreement?: string }
  ) => patch<LegalCase>(`/${id}/advocate`, input),
  cost: (id: string, input: { amount: number; note: string; incurredAt?: string }) =>
    apiFetch<LegalCase>(`${base}/${id}/costs`, { method: 'POST', body: input }),
  close: (id: string, notes?: string) => patch<LegalCase>(`/${id}/close`, { notes }),
  withdraw: (id: string, reason: string) => patch<LegalCase>(`/${id}/withdraw`, { reason }),
  scheduleHearing: (id: string, input: { scheduledFor: string; purpose?: string }) =>
    apiFetch<LegalCase>(`${base}/${id}/hearings`, { method: 'POST', body: input }),
  recordHearing: (
    id: string,
    hearingId: string,
    input: { heldAt: string; outcome: HearingOutcome; notes?: string; adjournNextFor?: string }
  ) => patch<LegalCase>(`/${id}/hearings/${hearingId}`, input),
};
