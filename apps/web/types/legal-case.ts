/**
 * An eviction is a `kind`, not its own system. The case points at its tenancy, whose notice ladder
 * owns notice periods.
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

export interface LegalCaseOutstanding {
  action: string;
  detail: string;
}

export interface LegalCaseCost {
  id: string;
  /** Whole Naira, like every Expense. */
  amount: number;
  note: string | null;
  incurredAt: string;
}

/** The same expenses that reach the owner's statement. */
export interface LegalCaseCosts {
  /** Whole Naira. */
  totalAmount: number;
  items: LegalCaseCost[];
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

  /** Null until counsel is engaged. */
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
  /** Derived on the server from the hearings. */
  nextHearingAt: string | null;

  /** Null for a case that is not about possession. */
  ladderReadyToFile: boolean | null;

  outstanding: LegalCaseOutstanding[];

  /** Carried to the owner's account. */
  costs: LegalCaseCosts;
}
