import { apiFetch, apiUpload } from './client';
import { appendFile, type PickedFile } from './documents';
import type { Paginated } from './properties';
import type { WatchlistScreening } from '@/lib/gateman/watchlistRefusal';
import type { VisitorPass, VisitorPassStatus } from './visitor-pass';

export type { VisitorPass, VisitorPassSource, VisitorPassStatus } from './visitor-pass';

/**
 * The gate console.
 *
 * These are the estate *management* endpoints (`/estate/:id/...`), not the
 * resident ones in `resident.ts`. The backend gates exactly this subset to
 * `ESTATE_MANAGER + GATEMAN`, which is why a guard never needs an estate id
 * passed in — `getMyEstate` resolves their post.
 *
 * Case asymmetry to preserve: the read mappers lowercase statuses for display,
 * while the create DTOs validate against the raw (UPPERCASE) Prisma enums. The
 * list filters accept either case — the backend normalises with `toUpperCase()`
 * — so these callers send lowercase to match the shapes they read back.
 */

function toQuery(params: Record<string, string | number | boolean | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === '') continue;
    q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

/**
 * Builds the body for a gate write, omitting what the gate does not know.
 *
 * Sends nothing at all when there is nothing to say, rather than an object full
 * of `undefined` — and an absent `gateId` means "no gate recorded", which is a
 * different claim from an empty one. The API validates whichever fields arrive.
 */
function buildGateWriteBody(extra: Record<string, unknown>): Record<string, unknown> | undefined {
  const body = Object.fromEntries(
    Object.entries(extra).filter(([, value]) => value !== undefined && value !== '')
  );
  return Object.keys(body).length > 0 ? body : undefined;
}

/** The estate a guard is posted to. `gateCount` can be 0 before gates are named. */
export interface GatemanEstate {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  gateCount: number | null;
}

export interface Gate {
  id: string;
  estateId: string;
  name: string;
  location?: string;
  createdAt: string;
}

export type HouseholdStatus = 'active' | 'inactive';

export interface Household {
  id: string;
  estateId: string;
  unitLabel: string;
  residentName: string;
  contactPhone?: string;
  contactEmail?: string;
  status: HouseholdStatus;
  residentLinked: boolean;
  createdAt: string;
}

export type DeliveryLogStatus = 'received' | 'collected';

export interface DeliveryLog {
  id: string;
  householdId: string;
  unitLabel: string;
  residentName: string;
  courier?: string;
  recipientName?: string;
  status: DeliveryLogStatus;
  photoUrl?: string;
  gateId?: string;
  gateName?: string;
  receivedAt: string;
  collectedAt?: string;
  createdAt: string;
}

/**
 * The gate's answer to a code the household sent its courier.
 *
 * There is no reason field, and that is the point: one wording covers a wrong,
 * expired, spent, withdrawn or another-estate code, so this screen cannot be
 * used to work out whether a household exists here.
 */
export interface DeliveryCodeScreen {
  matched: boolean;
  householdId?: string;
  unitLabel?: string;
  residentName?: string;
  courier?: string;
  description?: string | null;
  expiresAt?: string;
  declaredAt?: string;
  /** What this means, for the guard. */
  message: string;
  /** What to do next, for the guard. */
  instruction: string;
}

/**
 * The gate's answer to a patrol checkpoint's code.
 *
 * Same shape of contract as `DeliveryCodeScreen`, and the same reasoning: every
 * failure shares one sentence, so trying codes cannot map an estate's patrol
 * points. The difference is that a patrol scan WRITES — it is the record that
 * the round was walked — so `accepted` is the thing the guard is waiting for.
 */
export interface PatrolScanResult {
  accepted: boolean;
  checkpointName?: string;
  position?: number;
  total?: number;
  routeName?: string;
  roundId?: string;
  scheduledFor?: string;
  scannedAt?: string;
  /** Recorded, but after the round's window had closed. */
  late?: boolean;
  /** This checkpoint was already recorded on this round; the first scan is kept. */
  alreadyScanned?: boolean;
  message: string;
  instruction: string;
}

export type VehiclePurpose = 'visitor' | 'resident' | 'delivery' | 'staff' | 'other';

export interface VehicleLog {
  id: string;
  estateId: string;
  plateNumber: string;
  vehicleDescription?: string;
  driverName?: string;
  purpose: VehiclePurpose;
  photoUrl?: string;
  gateId?: string;
  gateName?: string;
  enteredAt: string;
  exitedAt?: string;
  /** Set only on the write that logged this vehicle — see `VisitorPass`. */
  watchlistWarning?: string;
  createdAt: string;
}

/**
 * One arrival the estate has been told about.
 *
 * Every row carries the deadline it was given, and nothing here says a visitor
 * is definitely coming. `deadlineLabel` is worded by the server so a guard's
 * screen never has to decide whether "until Friday" includes today.
 */
export interface ExpectedVisitor {
  id: string;
  householdId: string;
  unitLabel: string;
  residentName: string;
  visitorName: string;
  visitorPhone?: string | null;
  purpose?: string | null;
  deadline: string;
  deadlineLabel: string;
  deadlineToday: boolean;
  source: 'RESIDENT' | 'GATE' | 'CONTRACTOR' | 'IMPORT';
  sourceLabel: string;
}

export interface ExpectedContractor {
  id: string;
  name: string;
  company?: string | null;
  trade?: string | null;
  householdId?: string | null;
  unitLabel?: string | null;
  hoursLabel: string;
  deadline: string;
  deadlineLabel: string;
  deadlineToday: boolean;
  daysLabel: string;
}

export interface ExpectedParcel {
  id: string;
  householdId: string;
  unitLabel: string;
  residentName: string;
  courier: string;
  description?: string | null;
  deadline: string;
  deadlineLabel: string;
  deadlineToday: boolean;
}

/**
 * Who the estate expects today.
 *
 * A hint board, and the guard's screen says so out loud: nothing here opens a
 * barrier, and the pass PIN is still what admits anybody. It is readable at the
 * gate on purpose — the guard is the one being asked "am I expecting them?" —
 * and showing it is safe precisely because it cannot admit anyone.
 */
export interface ExpectedToday {
  estateId: string;
  asOf: string;
  visitors: ExpectedVisitor[];
  contractors: ExpectedContractor[];
  parcels: ExpectedParcel[];
  tally: {
    visitors: number;
    contractors: number;
    parcels: number;
    byEndOfToday: number;
    label: string;
  };
}

/**
 * The identity document a guard was shown at the barrier.
 *
 * `documentTypeLabel` is what a screen displays — the server words it, so a
 * recorded check reads the same on every client and cannot drift from the
 * vocabulary above. `documentUrl` is a short-lived signed URL and is present
 * only when this caller may see the document at all.
 *
 * The absence of `documentUrl` is NOT an error: it means a check exists and it is
 * not this caller's to look at.
 */
export interface VisitorIdCheck {
  id: string;
  visitorPassId: string;
  documentType: string;
  documentTypeLabel: string;
  checkedAt: string;
  checkedById: string;
  checkedByName?: string | null;
  sizeBytes: number;
  mimeType: string;
  documentUrl?: string;
  documentWithheld?: boolean;
  notice?: string;
}

export type IncidentCategory = 'security' | 'maintenance' | 'safety' | 'other';
export type IncidentPriority = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'open' | 'in_progress' | 'resolved' | 'dismissed';

export interface Incident {
  id: string;
  estateId: string;
  category: IncidentCategory;
  priority: IncidentPriority;
  status: IncidentStatus;
  description: string;
  photoUrl?: string;
  resolutionNotes?: string;
  createdAt: string;
}

/**
 * The optional facts a gate write can carry, both of which are about the same
 * thing: what actually happened at the barrier, and where it is.
 *
 * A `type` rather than an `interface` deliberately — only a type alias gets an
 * implicit index signature, which is what lets it be spread into the request
 * body builder below.
 */
export type GateWriteOptions = {
  /** ISO time the guard acted, for a write queued offline. */
  occurredAt?: string;
  /** The barrier the guard is standing at. */
  gateId?: string;
  /**
   * A guard's stated reason for admitting somebody the estate has blocked.
   *
   * Only ever set on a deliberate override, never on the first attempt: the
   * reason is the whole point of the override, and it is what the estate office
   * is told when they are woken by the notification.
   */
  overrideReason?: string;
};

export const gatemanApi = {
  /** The estate this guard is posted to; `null` when they hold no post yet. */
  getMyEstate: () => apiFetch<GatemanEstate | null>('/estate/me'),

  /**
   * Every estate this guard can open.
   *
   * `/estate/me` answers with one estate and offers no way to ask for another,
   * so a guard posted to two estates was locked to whichever came back — always
   * the oldest, with nothing on screen to say another existed.
   */
  listMyEstates: () => apiFetch<GatemanEstate[]>('/estate/mine'),

  listGates: (estateId: string) => apiFetch<Gate[]>(`/estate/${estateId}/gates`),

  /**
   * Who the estate expects today, for the guard being asked at the barrier.
   *
   * Read-only, and deliberately open to a guard even where the guest list behind
   * it is the office's: this replaces a phone call to the office, and nothing on
   * it admits anybody, so a guard holding it cannot let in someone the estate
   * would not have. It is a hint board — a visitor still presents their PIN.
   */
  getExpectedToday: (estateId: string) =>
    apiFetch<ExpectedToday>(`/estate/${estateId}/expected-today`),

  /**
   * Records the document a guard was shown against a visitor's pass.
   *
   * Recording does not admit anybody — the visitor is admitted on their pass as
   * always — and it is NOT queued offline like a check-in: the photograph is the
   * evidence, so a write that waited in a queue would be filed against the moment
   * the network came back rather than the moment the guard looked at the
   * document. A guard with no connection keeps the pass flow and loses the photo,
   * which is the right way round.
   */
  recordVisitorIdCheck: (
    estateId: string,
    passId: string,
    documentType: string,
    file: PickedFile
  ) => {
    const form = new FormData();
    form.append('documentType', documentType);
    appendFile(form, 'file', file);
    return apiUpload<VisitorIdCheck>(`/estate/${estateId}/visitor-passes/${passId}/id-check`, form);
  },

  /** The document recorded against a pass, or null when the guard took none. */
  getVisitorIdCheck: (estateId: string, passId: string) =>
    apiFetch<VisitorIdCheck | null>(`/estate/${estateId}/visitor-passes/${passId}/id-check`),

  /**
   * Asks the estate's watch list about somebody, instead of attempting a write.
   *
   * For a guard who would rather find out before they have told a visitor they
   * are asking the household — and so a household is never asked to consent to
   * somebody the estate has already refused. Answering "nobody matched" reveals
   * who the estate is watching, so the endpoint is access-checked like every
   * other estate route.
   */
  screenWatchlist: (
    estateId: string,
    query: { name?: string; phone?: string; plateNumber?: string }
  ) =>
    apiFetch<WatchlistScreening>(`/estate/${estateId}/watchlist/screen`, {
      method: 'POST',
      body: query,
    }),

  listHouseholds: (estateId: string, page = 1, pageSize = 20) =>
    apiFetch<Paginated<Household>>(
      `/estate/${estateId}/households${toQuery({ page, pageSize, status: 'active' })}`
    ),

  listVisitorPasses: (estateId: string, status: VisitorPassStatus, page = 1, pageSize = 50) =>
    apiFetch<Paginated<VisitorPass>>(
      `/estate/${estateId}/visitor-passes${toQuery({ status, page, pageSize })}`
    ),

  /**
   * Every walk-in the gate has raised, whatever its state.
   *
   * One read rather than one per state, so a request the household has just
   * answered cannot slip between two queries: the console has to be able to tell
   * "waiting", "approved" and "refused" apart from the same snapshot.
   */
  listWalkIns: (estateId: string, page = 1, pageSize = 50) =>
    apiFetch<Paginated<VisitorPass>>(
      `/estate/${estateId}/visitor-passes${toQuery({ source: 'gate', page, pageSize })}`
    ),

  /**
   * Checks a visitor in. `pin` is the 6-digit code the resident shared — the QR
   * code at the gate encodes exactly this pin, so the keyboard path and the scan
   * path converge on the same call.
   *
   * `occurredAt` is only sent by the offline queue. Without it a check-in that
   * waited in the queue is judged against the clock at replay, so a pass that
   * expired while the network was down is refused and the arrival is lost — the
   * guest is standing at the gate but the estate has no record of them.
   */
  verifyVisitorPass: (estateId: string, pin: string, options: GateWriteOptions = {}) =>
    apiFetch<VisitorPass>(`/estate/${estateId}/visitor-passes/verify`, {
      method: 'POST',
      body: buildGateWriteBody({ pin, ...options }),
    }),

  /**
   * Logs a checked-in visitor off the estate. Until this existed a pass stayed
   * checked in forever, so "who is inside?" was unanswerable for people.
   *
   * `occurredAt` carries the same meaning as on check-in: the time the guard
   * actually let the visitor out, not the time the queue got to send it.
   */
  checkOutVisitorPass: (estateId: string, passId: string, options: GateWriteOptions = {}) =>
    apiFetch<VisitorPass>(`/estate/${estateId}/visitor-passes/${passId}/check-out`, {
      method: 'PATCH',
      body: buildGateWriteBody(options),
    }),

  /**
   * Raises a walk-in: somebody is at the barrier with nothing arranged.
   *
   * The guard names the unit rather than quoting a code, because there is no
   * code. This does not admit anyone — it asks the household, and the gate stays
   * shut until they answer.
   */
  requestWalkIn: (
    estateId: string,
    data: {
      householdId: string;
      visitorName: string;
      visitorPhone?: string;
      purpose?: string;
      gateId?: string;
      /** Set only when a guard is admitting somebody the estate has blocked. */
      overrideReason?: string;
    }
  ) =>
    apiFetch<VisitorPass>(`/estate/${estateId}/visitor-passes/walk-in`, {
      method: 'POST',
      body: data,
    }),

  /**
   * Opens the barrier for a walk-in the household has already approved.
   *
   * Takes the same optional `occurredAt` as the other gate writes: a guard whose
   * connection drops between the approval and the barrier gets their admission
   * queued, and it must be recorded as happening when they acted.
   */
  admitWalkIn: (estateId: string, passId: string, options: GateWriteOptions = {}) =>
    apiFetch<VisitorPass>(`/estate/${estateId}/visitor-passes/${passId}/admit`, {
      method: 'PATCH',
      body: buildGateWriteBody(options),
    }),

  /** Withdraws a walk-in the gate raised — wrong unit, or the visitor left. */
  cancelWalkIn: (estateId: string, passId: string) =>
    apiFetch<VisitorPass>(`/estate/${estateId}/visitor-passes/${passId}/cancel`, {
      method: 'PATCH',
    }),

  listDeliveries: (estateId: string, status: DeliveryLogStatus, page = 1, pageSize = 50) =>
    apiFetch<Paginated<DeliveryLog>>(
      `/estate/${estateId}/deliveries${toQuery({ status, page, pageSize })}`
    ),

  /**
   * Ask whether a code names a delivery this estate is expecting.
   *
   * Writes nothing, so checking a code does not use it up — a guard may check
   * one, find the van is carrying a different parcel, and check another.
   */
  verifyDeliveryCode: (estateId: string, code: string) =>
    apiFetch<DeliveryCodeScreen>(`/estate/${estateId}/deliveries/verify`, {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),

  /**
   * Record reaching a patrol checkpoint, by the code printed at it.
   *
   * Unlike the visitor-pass writes this answers a refusal with 200 and a
   * sentence rather than an error: a guard's screen must not become a way to map
   * an estate's patrol points by trying codes, so every failure shares one
   * wording and the caller reads `accepted`.
   *
   * `occurredAt` is what makes the queued version honest — a scan taken at 22:10
   * inside a window that shut at 22:30 must not be judged late because the
   * connection came back at 23:00.
   */
  scanPatrolCheckpoint: (estateId: string, code: string, options: { occurredAt?: string } = {}) =>
    apiFetch<PatrolScanResult>(`/estate/${estateId}/patrols/scan`, {
      method: 'POST',
      body: JSON.stringify({ code, ...options }),
    }),

  logDelivery: (
    estateId: string,
    data: {
      householdId?: string;
      /**
       * The code the household gave the courier. When present the server derives
       * the household from it and ignores `householdId`, so a guard holding a
       * code cannot redirect the parcel to somebody the code does not name.
       */
      code?: string;
      courier?: string;
      recipientName?: string;
      gateId?: string;
      photo?: PickedFile;
    }
  ) => {
    const form = new FormData();
    if (data.householdId) form.append('householdId', data.householdId);
    if (data.code) form.append('code', data.code);
    if (data.courier) form.append('courier', data.courier);
    if (data.recipientName) form.append('recipientName', data.recipientName);
    if (data.gateId) form.append('gateId', data.gateId);
    if (data.photo) appendFile(form, 'file', data.photo);
    return apiUpload<DeliveryLog>(`/estate/${estateId}/deliveries`, form);
  },

  markDeliveryCollected: (estateId: string, logId: string) =>
    apiFetch<DeliveryLog>(`/estate/${estateId}/deliveries/${logId}/collect`, { method: 'PATCH' }),

  /** `open` returns only vehicles that have not exited yet. */
  listVehicleLogs: (estateId: string, open = true, page = 1, pageSize = 50) =>
    apiFetch<Paginated<VehicleLog>>(
      `/estate/${estateId}/vehicle-logs${toQuery({ open, page, pageSize })}`
    ),

  logVehicleEntry: (
    estateId: string,
    data: {
      plateNumber: string;
      vehicleDescription?: string;
      driverName?: string;
      purpose?: Uppercase<VehiclePurpose>;
      gateId?: string;
      /** Set only when the guard is admitting a vehicle the estate has blocked. */
      overrideReason?: string;
      photo?: PickedFile;
    }
  ) => {
    const form = new FormData();
    form.append('plateNumber', data.plateNumber);
    if (data.vehicleDescription) form.append('vehicleDescription', data.vehicleDescription);
    if (data.driverName) form.append('driverName', data.driverName);
    if (data.purpose) form.append('purpose', data.purpose);
    if (data.gateId) form.append('gateId', data.gateId);
    if (data.overrideReason) form.append('overrideReason', data.overrideReason);
    if (data.photo) appendFile(form, 'file', data.photo);
    return apiUpload<VehicleLog>(`/estate/${estateId}/vehicle-logs`, form);
  },

  markVehicleExited: (estateId: string, logId: string) =>
    apiFetch<VehicleLog>(`/estate/${estateId}/vehicle-logs/${logId}/exit`, { method: 'PATCH' }),

  /** Incidents are not paginated — the console only ever shows the open ones. */
  listIncidents: (estateId: string, status?: IncidentStatus) =>
    apiFetch<Incident[]>(`/estate/${estateId}/incidents${toQuery({ status })}`),

  reportIncident: (
    estateId: string,
    data: {
      description: string;
      category?: Uppercase<IncidentCategory>;
      priority?: Uppercase<IncidentPriority>;
      photo?: PickedFile;
    }
  ) => {
    const form = new FormData();
    form.append('description', data.description);
    if (data.category) form.append('category', data.category);
    if (data.priority) form.append('priority', data.priority);
    if (data.photo) appendFile(form, 'file', data.photo);
    return apiUpload<Incident>(`/estate/${estateId}/incidents`, form);
  },
};

/** The description the panic button files, so the office can triage it on sight. */
export const PANIC_DESCRIPTION = 'Panic button activated';
