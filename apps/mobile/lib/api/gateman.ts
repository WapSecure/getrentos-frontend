import { apiFetch, apiUpload } from './client';
import { appendFile, type PickedFile } from './documents';
import type { Paginated } from './properties';
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
  createdAt: string;
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

  logDelivery: (
    estateId: string,
    data: {
      householdId: string;
      courier?: string;
      recipientName?: string;
      gateId?: string;
      photo?: PickedFile;
    }
  ) => {
    const form = new FormData();
    form.append('householdId', data.householdId);
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
