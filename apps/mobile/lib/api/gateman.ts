import { apiFetch, apiFetchOrNull, apiUpload } from './client';
import { toQuery } from './query';
import { appendFile, type PickedFile } from './documents';
import type { Paginated } from './properties';
import type { WatchlistScreening } from '@/lib/gateman/watchlistRefusal';
import type { VisitorPass, VisitorPassStatus } from './visitor-pass';

export type { VisitorPass, VisitorPassSource, VisitorPassStatus } from './visitor-pass';

/** Estate management endpoints the backend opens to ESTATE_MANAGER + GATEMAN. Read mappers lowercase statuses, create DTOs validate the raw UPPERCASE enums, and list filters accept either case. */

/** An absent `gateId` means "no gate recorded", which is a different claim from an empty one. */
function buildGateWriteBody(extra: Record<string, unknown>): Record<string, unknown> | undefined {
  const body = Object.fromEntries(
    Object.entries(extra).filter(([, value]) => value !== undefined && value !== '')
  );
  return Object.keys(body).length > 0 ? body : undefined;
}

/** `gateCount` can be 0 before gates are named. */
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

/** No reason field on purpose: one wording covers every failure, so the screen cannot reveal whether a household exists here. */
export interface DeliveryCodeScreen {
  matched: boolean;
  householdId?: string;
  unitLabel?: string;
  residentName?: string;
  courier?: string;
  description?: string | null;
  expiresAt?: string;
  declaredAt?: string;
  message: string;
  instruction: string;
}

/** Every failure shares one sentence, so trying codes cannot map an estate's patrol points. A scan writes the round's record. */
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

/** `deadlineLabel` is server-worded so a guard's screen never has to decide whether "until Friday" includes today. */
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

/** A hint board: nothing here admits anybody (the pass PIN still does), which is why it is safe to show at the gate. */
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

/** `documentTypeLabel` is server-worded. `documentUrl` is short-lived and absent when this caller may not see the document; that absence is not an error. */
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

/** A `type`, not an `interface`: only a type alias gets the implicit index signature the body builder spreads. */
export type GateWriteOptions = {
  /** ISO time the guard acted, for a write queued offline. */
  occurredAt?: string;
  gateId?: string;
  /** Set only on a deliberate override, never on the first attempt; it is what the estate office is told. */
  overrideReason?: string;
};

export const gatemanApi = {
  /** `null` when they hold no post yet. */
  getMyEstate: () => apiFetchOrNull<GatemanEstate>('/estate/me'),

  /** `/estate/me` answers with one estate only, so a guard posted to two would be locked to the oldest. */
  listMyEstates: () => apiFetch<GatemanEstate[]>('/estate/mine'),

  listGates: (estateId: string) => apiFetch<Gate[]>(`/estate/${estateId}/gates`),

  /** Deliberately open to a guard: nothing on it admits anybody, and a visitor still presents their PIN. */
  getExpectedToday: (estateId: string) =>
    apiFetch<ExpectedToday>(`/estate/${estateId}/expected-today`),

  /** Not queued offline: the photo is evidence, and a queued write would be filed at reconnect time rather than when the guard looked. */
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
    apiFetchOrNull<VisitorIdCheck>(`/estate/${estateId}/visitor-passes/${passId}/id-check`),

  /** Access-checked like other estate routes: "nobody matched" reveals who the estate is watching. */
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

  /** One read, not one per state, so a request the household just answered cannot slip between two queries. */
  listWalkIns: (estateId: string, page = 1, pageSize = 50) =>
    apiFetch<Paginated<VisitorPass>>(
      `/estate/${estateId}/visitor-passes${toQuery({ source: 'gate', page, pageSize })}`
    ),

  /** The QR code encodes exactly this pin. `occurredAt` is sent only by the offline queue, so a pass that expired while offline is not judged at replay time. */
  verifyVisitorPass: (estateId: string, pin: string, options: GateWriteOptions = {}) =>
    apiFetch<VisitorPass>(`/estate/${estateId}/visitor-passes/verify`, {
      method: 'POST',
      body: buildGateWriteBody({ pin, ...options }),
    }),

  /** `occurredAt` is when the guard let the visitor out, not when the queue sent it. */
  checkOutVisitorPass: (estateId: string, passId: string, options: GateWriteOptions = {}) =>
    apiFetch<VisitorPass>(`/estate/${estateId}/visitor-passes/${passId}/check-out`, {
      method: 'PATCH',
      body: buildGateWriteBody(options),
    }),

  /** Does not admit anyone: it asks the household, and the gate stays shut until they answer. */
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

  /** `occurredAt` records a queued admission as happening when the guard acted. */
  admitWalkIn: (estateId: string, passId: string, options: GateWriteOptions = {}) =>
    apiFetch<VisitorPass>(`/estate/${estateId}/visitor-passes/${passId}/admit`, {
      method: 'PATCH',
      body: buildGateWriteBody(options),
    }),

  cancelWalkIn: (estateId: string, passId: string) =>
    apiFetch<VisitorPass>(`/estate/${estateId}/visitor-passes/${passId}/cancel`, {
      method: 'PATCH',
    }),

  listDeliveries: (estateId: string, status: DeliveryLogStatus, page = 1, pageSize = 50) =>
    apiFetch<Paginated<DeliveryLog>>(
      `/estate/${estateId}/deliveries${toQuery({ status, page, pageSize })}`
    ),

  /** Writes nothing: checking a code does not use it up. */
  verifyDeliveryCode: (estateId: string, code: string) =>
    apiFetch<DeliveryCodeScreen>(`/estate/${estateId}/deliveries/verify`, {
      method: 'POST',
      // apiFetch encodes the body itself; encoding it here too sent a string.
      body: { code },
    }),

  /** A refusal is a 200 with one shared sentence, so trying codes cannot map patrol points; read `accepted`. `occurredAt` keeps a queued scan judged by when it was taken. */
  scanPatrolCheckpoint: (estateId: string, code: string, options: { occurredAt?: string } = {}) =>
    apiFetch<PatrolScanResult>(`/estate/${estateId}/patrols/scan`, {
      method: 'POST',
      body: { code, ...options },
    }),

  logDelivery: (
    estateId: string,
    data: {
      householdId?: string;
      /** When present the server derives the household from it and ignores `householdId`. */
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

export const PANIC_DESCRIPTION = 'Panic button activated';
