/** A condition precedent on a plot purchase (blueprint §9.3). */
export interface LandClosingCondition {
  key: string;
  label: string;
  status: 'PENDING' | 'DELIVERED' | 'SATISFIED' | 'WAIVED' | 'FAILED';
  deadline?: string;
  /** Past its deadline unmet, or failed: the buyer may cancel in full. */
  failed: boolean;
  /** Why it was satisfied at the start. */
  basis?: string;
  remedy: string;
  /** The developer delivers it and the buyer confirms it. */
  deliveredByDeveloper: boolean;
  deliveredAt?: string;
  deliveredNote?: string;
  documentId?: string;
  decidedAt?: string;
  note?: string;
}

/** One line of the closing checklist (§9.4). */
export interface LandClosingChecklistItem {
  key: string;
  label: string;
  state: 'DONE' | 'OPEN' | 'BLOCKED';
  detail?: string;
}

/** A title perfection step (§9.5): submission and approval are separate. */
export interface LandPerfectionStep {
  key: string;
  label: string;
  owner: 'DEVELOPER' | 'BUYER_LAWYER' | 'GETRENTOS';
  status: 'NOT_STARTED' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'NOT_APPLICABLE';
  dueDate?: string;
  submittedAt?: string;
  submissionReference?: string;
  approvedAt?: string;
  approvalReference?: string;
  documentId?: string;
  note?: string;
  /** 0 on time, 1 late, 2 escalated to staff. */
  escalationLevel: number;
}

export interface LandPerfection {
  status: 'OPEN' | 'EXCEPTION' | 'PERFECTED';
  professionalName?: string;
  professionalFirm?: string;
  professionalContact?: string;
  openedAt: string;
  perfectedAt?: string;
  finalInstrumentReference?: string;
  legalReview?: string;
  steps: LandPerfectionStep[];
  blockers: string[];
}

export interface LandClosingFields {
  perfection?: LandPerfection | null;
  conditions?: LandClosingCondition[];
  closingChecklist?: LandClosingChecklistItem[];
  /** A failed condition lets the buyer cancel with everything paid refunded. */
  canCancelInFull?: boolean;
}
