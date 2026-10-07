/**
 * Tenancy notices: the escalation ladder, and the period register it depends on.
 *
 * The two are one workflow rather than two screens. A firm cannot serve a notice
 * to quit until it has recorded how long one runs in that property's
 * jurisdiction, so the register is the thing standing in the way — and the
 * unconfigured list is the worklist that makes that discoverable before somebody
 * is standing in front of a tenant rather than after.
 */

/** Where a notice stands. Derived on the server from the clock, never set here. */
export type NoticeState = 'DRAFT' | 'SERVED' | 'EXPIRED' | 'SUPERSEDED' | 'WITHDRAWN';

/** The steps, in the order they may be taken. */
export type NoticeKind =
  | 'ARREARS_REMINDER'
  | 'DEMAND_LETTER'
  | 'NOTICE_TO_QUIT'
  | 'NOTICE_OF_INTENTION_TO_RECOVER'
  | 'COURT_SUMMONS';

/**
 * Where a period's number came from.
 *
 * Rendered next to the number rather than kept in a tooltip: `MANUAL` is the
 * least certain source and a reader is entitled to know when they are looking at
 * one.
 */
export type NoticePeriodSource = 'TABLE' | 'FIRM_OVERRIDE' | 'MANUAL' | 'NOT_APPLICABLE';

export type NoticeServiceMethod = 'HAND_DELIVERY' | 'POST' | 'COURIER' | 'EMAIL' | 'OTHER';

export interface TenancyNotice {
  id: string;
  leaseId: string;
  kind: NoticeKind;
  kindLabel: string;
  /** Position on the ladder, so a view can show progression rather than a list. */
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
  /** Whole days left. Null when nothing is counting down. */
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
  /** A shipped starting point or the firm's own answer. */
  scope: 'PLATFORM' | 'FIRM';
  editable: boolean;
  updatedAt: string;
}

export interface UnconfiguredPeriod {
  jurisdiction: string;
  kind: NoticeKind;
  /** What to confirm. The value of shipping a table that asserts nothing. */
  basis: string;
}

export interface NoticePeriodSettings {
  entries: NoticePeriodEntry[];
  tableVersion: string;
  unconfigured: UnconfiguredPeriod[];
}

/** Where a tenancy stands, and what is standing in the way of the next step. */
export interface LeaseLadder {
  lease: {
    id: string;
    status: string;
    tenantName: string | null;
    property: { id: string; address: string; city: string; state: string };
  };
  jurisdiction: string;
  /** What the property says, kept so the derivation is visible. */
  jurisdictionDerivedFrom: string;
  /** True when the state could not be matched and the country key was used. */
  jurisdictionFellBack: boolean;
  notices: TenancyNotice[];
  next: { kind: NoticeKind; blockedUntil: string | null } | null;
  /** Why the next step is not available yet, when it is not. */
  nextBlockedReason: string | null;
}
