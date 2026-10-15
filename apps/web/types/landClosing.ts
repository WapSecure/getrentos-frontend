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

export interface LandClosingFields {
  conditions?: LandClosingCondition[];
  closingChecklist?: LandClosingChecklistItem[];
  /** A failed condition lets the buyer cancel with everything paid refunded. */
  canCancelInFull?: boolean;
}
