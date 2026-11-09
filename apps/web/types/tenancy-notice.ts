/**
 * The register must hold a jurisdiction's period before a notice can be served, so the unconfigured
 * list is the worklist.
 */

/** Derived on the server from the clock, never set here. */
export type NoticeState = 'DRAFT' | 'SERVED' | 'EXPIRED' | 'SUPERSEDED' | 'WITHDRAWN';

/** The steps, in the order they may be taken. */
export type NoticeKind =
  | 'ARREARS_REMINDER'
  | 'DEMAND_LETTER'
  | 'NOTICE_TO_QUIT'
  | 'NOTICE_OF_INTENTION_TO_RECOVER'
  | 'COURT_SUMMONS';

/** Render it next to the number: `MANUAL` is the least certain source. */
export type NoticePeriodSource = 'TABLE' | 'FIRM_OVERRIDE' | 'MANUAL' | 'NOT_APPLICABLE';

export type NoticeServiceMethod = 'HAND_DELIVERY' | 'POST' | 'COURIER' | 'EMAIL' | 'OTHER';

export interface TenancyNotice {
  id: string;
  leaseId: string;
  kind: NoticeKind;
  kindLabel: string;
  rung: number;
  state: NoticeState;

  reason: string;
  /** Whole naira. Null for a notice that is not about an amount. */
  arrearsAmount: number | null;

  jurisdiction: string;
  periodDays: number | null;
  periodSource: NoticePeriodSource;
  periodBasis: string | null;
  periodTableVersion: string | null;

  serviceDate: string | null;
  serviceMethod: NoticeServiceMethod | null;
  servedAt: string | null;
  expiresAt: string | null;
  /** Null when nothing is counting down. */
  daysRemaining: number | null;
  evidenceNote: string | null;

  withdrawnAt: string | null;
  supersededById: string | null;
  createdById: string | null;
  createdByName: string | null;
  createdAt: string;

  property: { id: string; address: string; city: string; state: string } | null;
  tenantName: string | null;
}

export interface NoticePeriodEntry {
  id: string;
  jurisdiction: string;
  kind: NoticeKind;
  kindLabel: string;
  days: number;
  basis: string;
  scope: 'PLATFORM' | 'FIRM';
  editable: boolean;
  updatedAt: string;
}

export interface UnconfiguredPeriod {
  jurisdiction: string;
  kind: NoticeKind;
  basis: string;
}

export interface NoticePeriodSettings {
  entries: NoticePeriodEntry[];
  tableVersion: string;
  unconfigured: UnconfiguredPeriod[];
}

export interface LeaseLadder {
  lease: {
    id: string;
    status: string;
    tenantName: string | null;
    property: { id: string; address: string; city: string; state: string };
  };
  jurisdiction: string;
  /** Kept so the derivation is visible. */
  jurisdictionDerivedFrom: string;
  /** True when the state could not be matched and the country key was used. */
  jurisdictionFellBack: boolean;
  notices: TenancyNotice[];
  next: { kind: NoticeKind; blockedUntil: string | null } | null;
  nextBlockedReason: string | null;
}
