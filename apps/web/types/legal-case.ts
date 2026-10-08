/**
 * Legal cases: recovery, injunction, title dispute, and eviction.
 *
 * This replaces the eviction-only surface. An eviction is now a `kind` rather
 * than its own system, because a matter that reaches court needs hearings, an
 * outcome and enforcement whether it is about possession or about money.
 *
 * Two fields that used to be here are deliberately gone: `noticeIssuedAt` and
 * `cureDeadline`. The old eviction flow computed a cure deadline from a number
 * someone typed, with no basis recorded. The tenancy's notice ladder owns that
 * now — it resolves the period, records where the number came from, and refuses
 * to invent one — so a case points at its tenancy instead of carrying a second
 * answer to when a notice ran.
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
  /** Null means it is still expected. */
  heldAt: string | null;
  outcome: HearingOutcome | null;
  purpose: string | null;
  notes: string | null;
}

/** Something still to do on a case, with the reason it is outstanding. */
export interface LegalCaseOutstanding {
  action: string;
  detail: string;
}

export interface LegalCase {
  id: string;
  kind: LegalCaseKind;
  kindLabel: string;
  status: LegalCaseStatus;
  description: string;

  propertyId: string;
  property: { id: string; title: string; address: string; city: string; state: string };
  /** The tenancy, which is where the notice ladder lives. */
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

  /** The advocate instructed on the owner's behalf. Null until counsel is engaged. */
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
  /** Derived on the server from the hearings, so it cannot disagree with them. */
  nextHearingAt: string | null;

  /**
   * Whether the notice ladder would let a possession claim be filed today.
   * Null for a case that is not about possession — the question does not apply.
   */
  ladderReadyToFile: boolean | null;

  outstanding: LegalCaseOutstanding[];
}
