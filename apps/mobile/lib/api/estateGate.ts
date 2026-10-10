import { tierAtLeast } from '@getrentos/shared';
import { ApiError, apiFetch } from './client';
import type { PickedFile } from './documents';
import type { PlanTier, Tone } from './estateManager';
import {
  gatemanApi,
  type DeliveryCodeScreen,
  type DeliveryLog,
  type DeliveryLogStatus,
  type Gate,
  type VehicleLog,
  type VehiclePurpose,
} from './gateman';
import type { Paginated } from './properties';

export type {
  DeliveryCodeScreen,
  DeliveryLog,
  DeliveryLogStatus,
  Gate,
  VehicleLog,
  VehiclePurpose,
} from './gateman';

/**
 * The estate office's view of the gate: the vehicle and parcel logs, the
 * estate's gates, regular visitors, dwell analytics and patrols.
 *
 * Same `/estate/:id/...` endpoints the guard's console uses for the logs, but
 * read the way the office reads them (every entry, any status), plus the
 * manager-only Enterprise features. Regular visitors, dwell and patrols are
 * ENTERPRISE on the ESTATE's plan: the API refuses with 403
 * `PLAN_UPGRADE_REQUIRED` carrying `required` and `current`.
 */

/* ---------------------------------- types --------------------------------- */

export type ContractorPassStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED';

/**
 * A standing authorisation for somebody who arrives repeatedly. Not a visit:
 * every arrival under it still records its own visitor pass.
 */
export interface ContractorPass {
  id: string;
  estateId: string;
  householdId: string;
  householdLabel?: string | null;
  name: string;
  phone?: string | null;
  company?: string | null;
  trade?: string | null;
  status: ContractorPassStatus;
  /** Ready to render: Active / Withdrawn / Expired. */
  statusLabel: string;
  validFrom: string;
  validUntil: string;
  /** 0 = Sunday. Empty means every day. */
  daysOfWeek: number[];
  dailyFrom?: string | null;
  dailyTo?: string | null;
  /** "Monday and Thursday, 08:00-17:00, until 31 Dec 2026". */
  scheduleLabel: string;
  /** Arrivals this authorisation has let in, ever. */
  visitCount: number;
  createdAt: string;
  revokedAt?: string | null;
  revokeReason?: string | null;
}

/** The one and only time the PIN is readable. */
export interface IssuedContractorPass extends ContractorPass {
  pin: string;
  /** data:image/png;base64,... */
  qrDataUrl: string;
}

export interface NewContractorPass {
  householdId: string;
  name: string;
  phone?: string;
  company?: string;
  trade?: string;
  /** ISO instant. */
  validFrom: string;
  /** ISO instant. */
  validUntil: string;
  daysOfWeek: number[];
  dailyFrom?: string;
  dailyTo?: string;
}

/** One person the estate believes is still inside. Labels are server-worded. */
export interface OnSiteEntry {
  passId: string;
  visitorName: string;
  source: 'RESIDENT' | 'GATE' | 'CONTRACTOR';
  sourceLabel: string;
  householdId: string;
  unitLabel: string;
  gateName?: string | null;
  contractorPassId?: string | null;
  authorisationName?: string | null;
  admittedAt: string;
  minutesInside: number;
  /** 'Inside 3h 20m' / 'Inside 10h, past the end the estate authorised by 2h' */
  insideLabel: string;
  expectedOutAt?: string | null;
  expectedOutSource: 'AUTHORISED_WINDOW' | 'NONE';
  /** 'Authorised until 17:00' / 'No end was stated for this visit' */
  expectationLabel: string;
  minutesOver: number;
  overstaying: boolean;
  /** When the office was told about the overstay. */
  reportedAt?: string | null;
}

export interface OnSiteBoard {
  estateId: string;
  asOf: string;
  graceMinutes: number;
  tally: { open: number; overstaying: number; oldestMinutes: number | null; label: string };
  entries: OnSiteEntry[];
}

/** One standing authorisation, measured over a period. */
export interface AuthorisationDwell {
  contractorPassId: string;
  name: string;
  company?: string | null;
  trade?: string | null;
  householdLabel?: string | null;
  status: ContractorPassStatus;
  statusLabel: string;
  scheduleLabel: string;
  visits: number;
  completed: number;
  /** Still recorded as inside: the number a completed average hides. */
  openVisits: number;
  overstays: number;
  /** Mean over COMPLETED visits only; null when none finished. */
  averageMinutes: number | null;
  longestMinutes: number | null;
  totalMinutes: number;
  firstVisitAt?: string | null;
  lastVisitAt?: string | null;
  summaryLabel: string;
}

export interface AuthorisationDwellReport {
  estateId: string;
  from: string;
  /** Exclusive. */
  to: string;
  graceMinutes: number;
  authorisations: AuthorisationDwell[];
}

export type DwellSort = 'dwell' | 'visits';

/** A patrol point. Never carries its code: that is shown once, when minted. */
export interface PatrolCheckpoint {
  id: string;
  name: string;
  location?: string | null;
  active: boolean;
  routeCount: number;
  scanCount: number;
  createdAt: string;
}

export interface IssuedPatrolCheckpoint extends PatrolCheckpoint {
  code: string;
  /** Where the code belongs, worded by the server. */
  guidance: string;
}

export interface PatrolRouteCheckpoint {
  id: string;
  name: string;
  location?: string | null;
  position: number;
  active: boolean;
}

export interface PatrolRoute {
  id: string;
  name: string;
  /** 0 = Sunday. Empty means every day. */
  daysOfWeek: number[];
  /** 'HH:MM' on the estate's clock. */
  startTime: string;
  windowMinutes: number;
  active: boolean;
  checkpoints: PatrolRouteCheckpoint[];
  /** 'Every day, from 22:00, within 1h 30m'. */
  scheduleLabel: string;
  createdAt: string;
}

export interface PatrolRouteInput {
  name: string;
  daysOfWeek: number[];
  startTime: string;
  windowMinutes: number;
  /** The order IS the walk order. */
  checkpointIds: string[];
}

export type PatrolRoundStatus = 'OPEN' | 'COMPLETE' | 'MISSED';

export interface PatrolScan {
  id: string;
  checkpointId: string;
  checkpointName: string;
  expectedPosition: number | null;
  scannedAt: string;
  scannedBy: string;
  late: boolean;
}

export interface PatrolRound {
  id: string;
  routeId: string;
  routeName: string;
  scheduledFor: string;
  windowEndsAt: string;
  status: PatrolRoundStatus;
  /** 'Walked' / 'Not walked' / 'Incomplete, 2 of 6 missed' / '3 of 6 so far'. */
  statusLabel: string;
  expected: number;
  scanned: number;
  missing: { id: string; name: string; position: number | null }[];
  late: number;
  inOrder: boolean;
  scans: PatrolScan[];
  reportedAt?: string | null;
}

export interface PatrolReport {
  estateId: string;
  asOf: string;
  from: string;
  to: string;
  rounds: PatrolRound[];
  tally: {
    closed: number;
    walked: number;
    missed: number;
    open: number;
    missedScans: number;
    label: string;
  };
}

/* ----------------------------------- api ---------------------------------- */

const PAGE_SIZE = 30;

function q(params: Record<string, string | number | boolean | undefined | null>): string {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    s.set(k, String(v));
  }
  const out = s.toString();
  return out ? `?${out}` : '';
}

export const estateGateApi = {
  /* gates */
  gates: (estateId: string) => apiFetch<Gate[]>(`/estate/${estateId}/gates`),
  addGate: (estateId: string, body: { name: string; location?: string }) =>
    apiFetch<Gate>(`/estate/${estateId}/gates`, { method: 'POST', body }),
  removeGate: (estateId: string, gateId: string) =>
    apiFetch<void>(`/estate/${estateId}/gates/${gateId}`, { method: 'DELETE' }),

  /* vehicles: `open` only narrows to vehicles still inside; omitted is every log. */
  vehicleLogs: (estateId: string, opts: { open?: boolean; page?: number } = {}) =>
    apiFetch<Paginated<VehicleLog>>(
      `/estate/${estateId}/vehicle-logs${q({ open: opts.open || undefined, page: opts.page ?? 1, pageSize: PAGE_SIZE })}`
    ),
  logVehicle: (
    estateId: string,
    data: {
      plateNumber: string;
      vehicleDescription?: string;
      driverName?: string;
      purpose?: Uppercase<VehiclePurpose>;
      gateId?: string;
      photo?: PickedFile;
    }
  ) => gatemanApi.logVehicleEntry(estateId, data),
  markVehicleExited: (estateId: string, logId: string) =>
    gatemanApi.markVehicleExited(estateId, logId),

  /* deliveries */
  deliveries: (estateId: string, opts: { status?: DeliveryLogStatus; page?: number } = {}) =>
    apiFetch<Paginated<DeliveryLog>>(
      `/estate/${estateId}/deliveries${q({ status: opts.status, page: opts.page ?? 1, pageSize: PAGE_SIZE })}`
    ),
  /** Writes nothing: checking a code does not use it up. */
  verifyDeliveryCode: (estateId: string, code: string) =>
    apiFetch<DeliveryCodeScreen>(`/estate/${estateId}/deliveries/verify`, {
      method: 'POST',
      body: { code },
    }),
  logDelivery: (
    estateId: string,
    data: {
      householdId?: string;
      code?: string;
      courier?: string;
      recipientName?: string;
      gateId?: string;
      photo?: PickedFile;
    }
  ) => gatemanApi.logDelivery(estateId, data),
  markDeliveryCollected: (estateId: string, logId: string) =>
    gatemanApi.markDeliveryCollected(estateId, logId),

  /* regular visitors (Enterprise to create; listing and withdrawing stay open) */
  contractorPasses: (
    estateId: string,
    opts: { status?: ContractorPassStatus; page?: number } = {}
  ) =>
    apiFetch<Paginated<ContractorPass>>(
      `/estate/${estateId}/contractor-passes${q({ status: opts.status, page: opts.page ?? 1, pageSize: PAGE_SIZE })}`
    ),
  createContractorPass: (estateId: string, body: NewContractorPass) =>
    apiFetch<IssuedContractorPass>(`/estate/${estateId}/contractor-passes`, {
      method: 'POST',
      body,
    }),
  revokeContractorPass: (estateId: string, passId: string, reason: string) =>
    apiFetch<ContractorPass>(`/estate/${estateId}/contractor-passes/${passId}/revoke`, {
      method: 'PATCH',
      body: { reason },
    }),

  /* dwell (Enterprise) */
  onSiteBoard: (estateId: string) => apiFetch<OnSiteBoard>(`/estate/${estateId}/dwell/on-site`),
  authorisationDwell: (estateId: string, opts: { from?: string; sort?: DwellSort } = {}) =>
    apiFetch<AuthorisationDwellReport>(
      `/estate/${estateId}/dwell/authorisations${q({ from: opts.from, sort: opts.sort })}`
    ),

  /* patrols (Enterprise) */
  patrolCheckpoints: (estateId: string) =>
    apiFetch<PatrolCheckpoint[]>(`/estate/${estateId}/patrol-checkpoints`),
  addPatrolCheckpoint: (estateId: string, body: { name: string; location?: string }) =>
    apiFetch<IssuedPatrolCheckpoint>(`/estate/${estateId}/patrol-checkpoints`, {
      method: 'POST',
      body,
    }),
  updatePatrolCheckpoint: (
    estateId: string,
    checkpointId: string,
    body: { name?: string; location?: string; active?: boolean }
  ) =>
    apiFetch<PatrolCheckpoint>(`/estate/${estateId}/patrol-checkpoints/${checkpointId}`, {
      method: 'PATCH',
      body,
    }),
  reissuePatrolCheckpointCode: (estateId: string, checkpointId: string) =>
    apiFetch<IssuedPatrolCheckpoint>(
      `/estate/${estateId}/patrol-checkpoints/${checkpointId}/reissue-code`,
      { method: 'POST' }
    ),
  patrolRoutes: (estateId: string) => apiFetch<PatrolRoute[]>(`/estate/${estateId}/patrol-routes`),
  addPatrolRoute: (estateId: string, body: PatrolRouteInput) =>
    apiFetch<PatrolRoute>(`/estate/${estateId}/patrol-routes`, { method: 'POST', body }),
  updatePatrolRoute: (
    estateId: string,
    routeId: string,
    body: Partial<PatrolRouteInput> & { active?: boolean }
  ) =>
    apiFetch<PatrolRoute>(`/estate/${estateId}/patrol-routes/${routeId}`, {
      method: 'PATCH',
      body,
    }),
  patrolReport: (estateId: string, opts: { from?: string } = {}) =>
    apiFetch<PatrolReport>(`/estate/${estateId}/patrols/rounds${q({ from: opts.from })}`),
};

/* ------------------------------- query keys ------------------------------- */

/**
 * Everything here sits under `['estate-manager', estateId, 'gate', ...]`, so
 * invalidating `qk.estateManager.estate(estateId)` still clears it.
 */
export const gateKeys = {
  all: (estateId: string) => ['estate-manager', estateId, 'gate'] as const,
  gates: (estateId: string) => ['estate-manager', estateId, 'gate', 'gates'] as const,
  vehicles: (estateId: string, view = 'all') =>
    ['estate-manager', estateId, 'gate', 'vehicles', view] as const,
  deliveries: (estateId: string, status = 'all') =>
    ['estate-manager', estateId, 'gate', 'deliveries', status] as const,
  contractors: (estateId: string, status = 'all') =>
    ['estate-manager', estateId, 'gate', 'contractors', status] as const,
  onSite: (estateId: string) => ['estate-manager', estateId, 'gate', 'dwell', 'on-site'] as const,
  dwellReport: (estateId: string, from: string, sort: DwellSort) =>
    ['estate-manager', estateId, 'gate', 'dwell', 'report', { from, sort }] as const,
  checkpoints: (estateId: string) =>
    ['estate-manager', estateId, 'gate', 'patrol', 'checkpoints'] as const,
  routes: (estateId: string) => ['estate-manager', estateId, 'gate', 'patrol', 'routes'] as const,
  patrolReport: (estateId: string, from: string) =>
    ['estate-manager', estateId, 'gate', 'patrol', 'report', from] as const,
};

/* ------------------------------ plan gating ------------------------------- */

/**
 * The estate is KNOWN to be below `required`. An absent tier is unknown, not
 * free, and fails open: the screen asks the API and lets its refusal decide.
 */
export const lacksTier = (planTier: PlanTier | undefined, required: PlanTier = 'ENTERPRISE') =>
  Boolean(planTier && !tierAtLeast(planTier, required));

const PLAN_TIERS: readonly PlanTier[] = ['FREE', 'PRO', 'ENTERPRISE'];
const asTier = (v: unknown): PlanTier | undefined =>
  typeof v === 'string' && (PLAN_TIERS as readonly string[]).includes(v)
    ? (v as PlanTier)
    : undefined;

/**
 * The plan a refusal asked for and the one the estate is on, or null when the
 * error is not a plan refusal.
 */
export function planRefusal(err: unknown): { required: PlanTier; current?: PlanTier } | null {
  if (!(err instanceof ApiError)) return null;
  if (err.code !== 'PLAN_UPGRADE_REQUIRED' && err.status !== 402) return null;
  return {
    required: asTier(err.details.required) ?? 'ENTERPRISE',
    current: asTier(err.details.current),
  };
}

/** Don't retry a plan refusal: it won't change on the next attempt. */
export const retryUnlessPlanGate = (count: number, err: unknown) => !planRefusal(err) && count < 2;

/* --------------------------------- labels --------------------------------- */

export const VEHICLE_PURPOSES: { value: Uppercase<VehiclePurpose>; label: string }[] = [
  { value: 'VISITOR', label: 'Visitor' },
  { value: 'RESIDENT', label: 'Resident' },
  { value: 'DELIVERY', label: 'Delivery' },
  { value: 'STAFF', label: 'Staff' },
  { value: 'OTHER', label: 'Other' },
];
export const vehiclePurposeLabel = (p: string) =>
  VEHICLE_PURPOSES.find((x) => x.value === p.toUpperCase())?.label ?? 'Other';

export const DELIVERY_STATUS: Record<DeliveryLogStatus, { label: string; tone: Tone }> = {
  received: { label: 'Awaiting pickup', tone: 'warning' },
  collected: { label: 'Collected', tone: 'success' },
};

export const CONTRACTOR_STATUS_TONE: Record<ContractorPassStatus, Tone> = {
  ACTIVE: 'success',
  REVOKED: 'danger',
  EXPIRED: 'neutral',
};

export const ROUND_STATUS_TONE: Record<PatrolRoundStatus, Tone> = {
  MISSED: 'danger',
  OPEN: 'info',
  COMPLETE: 'success',
};

/** Monday first, the way an estate's week reads; values are the API's (0 = Sunday). */
export const WEEK_DAYS: { value: number; short: string; long: string }[] = [
  { value: 1, short: 'Mon', long: 'Monday' },
  { value: 2, short: 'Tue', long: 'Tuesday' },
  { value: 3, short: 'Wed', long: 'Wednesday' },
  { value: 4, short: 'Thu', long: 'Thursday' },
  { value: 5, short: 'Fri', long: 'Friday' },
  { value: 6, short: 'Sat', long: 'Saturday' },
  { value: 0, short: 'Sun', long: 'Sunday' },
];

/** Adds or removes a day, keeping the API's order (0 = Sunday first). */
export function toggleDay(days: number[], day: number): number[] {
  return days.includes(day) ? days.filter((d) => d !== day) : [...days, day].sort((a, b) => a - b);
}

/* ----------------------------- regular visitors ---------------------------- */

/** The API's caps, kept in step so the form never allows what the server refuses. */
export const MAX_AUTHORISATION_DAYS = 366;
export const WITHDRAW_REASON_MIN = 10;

/** More than one name word: something the watch list can match against. */
export const hasFullName = (value: string) => value.trim().split(/\s+/).filter(Boolean).length >= 2;

export interface ContractorDraft {
  householdId?: string;
  name: string;
  phone: string;
  company: string;
  trade: string;
  /** `yyyy-MM-dd`. */
  validFrom: string;
  /** `yyyy-MM-dd`. */
  validUntil: string;
  daysOfWeek: number[];
  restrictHours: boolean;
  dailyFrom: string;
  dailyTo: string;
}

/** Whole calendar days between two `yyyy-MM-dd` dates (can be negative). */
export function daySpan(from: string, until: string): number {
  const a = Date.UTC(+from.slice(0, 4), +from.slice(5, 7) - 1, +from.slice(8, 10));
  const b = Date.UTC(+until.slice(0, 4), +until.slice(5, 7) - 1, +until.slice(8, 10));
  return Math.round((b - a) / 86_400_000);
}

/** Why the draft can't be sent yet, in words; null when it can. Mirrors the API's rules. */
export function contractorDraftError(d: ContractorDraft): string | null {
  if (!d.householdId) return 'Choose the household they’re working for.';
  if (d.name.trim().length < 2) return 'Enter their name.';
  if (!hasFullName(d.name) && !d.phone.trim()) {
    return 'Add a surname or a phone number. With one name word there’s nothing to check them against.';
  }
  if (!d.validFrom || !d.validUntil) return 'Choose when it starts and ends.';
  const span = daySpan(d.validFrom, d.validUntil);
  if (span < 0) return 'It has to end on or after the day it starts.';
  // Both days count: it runs from the start of the first to the end of the last.
  const days = span + 1;
  if (days > MAX_AUTHORISATION_DAYS) {
    return `That’s ${days} days. An authorisation can run for at most ${MAX_AUTHORISATION_DAYS}, so it’s looked at again every year.`;
  }
  if (d.restrictHours) {
    if (!d.dailyFrom || !d.dailyTo) return 'Choose both a start and an end time.';
    if (d.dailyFrom === d.dailyTo) return 'The start and end time can’t be the same.';
  }
  return null;
}

/**
 * The API body for a draft. Calendar days become instants: from the start of
 * the first day to the end of the last, so a permission doesn't lapse on the
 * morning it was meant to run until.
 */
export function contractorPassBody(d: ContractorDraft): NewContractorPass {
  return {
    householdId: d.householdId ?? '',
    name: d.name.trim(),
    ...(d.phone.trim() ? { phone: d.phone.trim() } : {}),
    ...(d.company.trim() ? { company: d.company.trim() } : {}),
    ...(d.trade.trim() ? { trade: d.trade.trim() } : {}),
    validFrom: new Date(`${d.validFrom}T00:00:00`).toISOString(),
    validUntil: new Date(`${d.validUntil}T23:59:59`).toISOString(),
    daysOfWeek: d.daysOfWeek,
    ...(d.restrictHours ? { dailyFrom: d.dailyFrom, dailyTo: d.dailyTo } : {}),
  };
}

/* ---------------------------------- dwell --------------------------------- */

/** Minutes as the server's own sentences write them: "45m", "2h", "4h 30m". */
export function formatMinutes(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) return '–';
  const total = Math.max(0, Math.round(minutes));
  if (total < 60) return `${total}m`;
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/** The ISO instant `days` back from `now`. Held in state by callers, never derived in render. */
export const windowStart = (days: number, now: number = Date.now()) =>
  new Date(now - days * 86_400_000).toISOString();

/** Overstays first (longest over first), then longest inside. */
export function onSiteOrder(entries: OnSiteEntry[]): OnSiteEntry[] {
  return [...entries].sort(
    (a, b) =>
      Number(b.overstaying) - Number(a.overstaying) ||
      b.minutesOver - a.minutesOver ||
      b.minutesInside - a.minutesInside
  );
}

/* --------------------------------- patrols -------------------------------- */

/** The night nobody walked first, then rounds still open, then walked; latest first within each. */
export function roundOrder(rounds: PatrolRound[]): PatrolRound[] {
  const rank: Record<PatrolRoundStatus, number> = { MISSED: 0, OPEN: 1, COMPLETE: 2 };
  return [...rounds].sort(
    (a, b) => rank[a.status] - rank[b.status] || b.scheduledFor.localeCompare(a.scheduledFor)
  );
}

/** Moves one item up or down a list; out-of-range moves return the list unchanged. */
export function moveItem<T>(items: T[], index: number, delta: number): T[] {
  const target = index + delta;
  if (index < 0 || index >= items.length || target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export const PATROL_WINDOW_OPTIONS = [30, 45, 60, 90, 120, 180];
export const windowLabel = (minutes: number) =>
  minutes < 60 ? `${minutes} min` : formatMinutes(minutes);

const HH_MM = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Why a round can't be saved yet; null when it can. Mirrors the API's rules. */
export function routeDraftError(d: PatrolRouteInput): string | null {
  if (!d.name.trim()) return 'Give the round a name.';
  if (d.name.trim().length > 80) return 'Keep the name under 80 characters.';
  if (!HH_MM.test(d.startTime)) return 'Choose when the round starts.';
  if (!Number.isInteger(d.windowMinutes) || d.windowMinutes < 5 || d.windowMinutes > 1440) {
    return 'The window has to be between 5 minutes and 24 hours.';
  }
  if (!d.checkpointIds.length) return 'Add at least one checkpoint.';
  if (d.checkpointIds.length > 50) return 'A round can have at most 50 checkpoints.';
  return null;
}
