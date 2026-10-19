/**
 * Land Watch and field inspections, as the API returns them
 * (src/modules/land/services/land-watch.service.ts, land-inspection.service.ts),
 * with the words every app uses for them.
 */

export type LandWatchTier = 'ESSENTIAL' | 'PROTECTED' | 'MANAGED';
export type LandWatchStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED';
export type LandInspectionKind = 'ROUTINE' | 'INCIDENT' | 'REINSPECTION' | 'PRE_PURCHASE';
export type LandInspectionStatus =
  | 'REQUESTED'
  | 'ASSIGNED'
  | 'SUBMITTED'
  | 'ESCALATED'
  | 'QUERIED'
  | 'ACCEPTED'
  | 'CANCELLED';
export type LandBoundaryCondition = 'INTACT' | 'DISTURBED' | 'ENCROACHED' | 'INCONCLUSIVE';
export type LandWatchIncidentKind =
  | 'ENCROACHMENT'
  | 'BOUNDARY_DISTURBANCE'
  | 'CONSTRUCTION'
  | 'DUMPING'
  | 'GOVERNMENT_NOTICE'
  | 'OTHER';
export type LandWatchIncidentStatus = 'OPEN' | 'CONFIRMED' | 'DISMISSED' | 'ESCALATED';
export type LandWatchReminderKind =
  | 'LAND_USE_CHARGE'
  | 'GROUND_RENT'
  | 'TENEMENT_RATE'
  | 'PERFECTION_STEP'
  | 'OTHER';

/** [lng, lat] points, as GeoJSON has them. */
export type LandLocation = { ring: [number, number][] } | { pin: [number, number] } | null;

export interface LandInspectionEvidence {
  id: string;
  fileName: string;
  mimeType: string;
  url: string;
  fileHash: string;
  capturedAt: string;
  receivedAt: string;
  capturedOffline: boolean;
  lat: number | null;
  lng: number | null;
  distanceM: number | null;
  note: string | null;
}

/** An inspection as the owner sees it: the report only once staff accepted it. */
export interface LandWatchInspection {
  id: string;
  reference: string;
  kind: LandInspectionKind;
  status: LandInspectionStatus;
  dueBy: string | null;
  createdAt: string;
  inspector: { name: string } | null;
  report: {
    boundaryCondition: LandBoundaryCondition | null;
    beaconsExpected: number | null;
    beaconsFound: number | null;
    summary: string | null;
    submittedAt: string | null;
    distanceM: number | null;
    staffNote: string | null;
    evidence: LandInspectionEvidence[];
  } | null;
}

export interface LandWatchIncident {
  id: string;
  kind: LandWatchIncidentKind;
  status: LandWatchIncidentStatus;
  source: string;
  description: string;
  inspectionId: string | null;
  disputeId: string | null;
  resolutionNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

export interface LandWatchReminder {
  id: string;
  kind: LandWatchReminderKind;
  label: string;
  dueDate: string;
  annual: boolean;
  amountNaira: number | null;
  lastPaidAt: string | null;
}

export interface LandWatchSummary {
  id: string;
  tier: LandWatchTier;
  status: LandWatchStatus;
  land: {
    propertyId: string;
    landPlotId: string | null;
    label: string;
    city: string;
    state: string;
  };
  inspectionIntervalDays: number | null;
  nextInspectionDue: string | null;
  disclaimerAcceptedAt: string;
  openIncidents: number;
  nextReminder: { label: string; dueDate: string } | null;
  lastInspection: string | null;
}

export interface LandWatchDetail extends LandWatchSummary {
  inspections: LandWatchInspection[];
  incidents: LandWatchIncident[];
  reminders: LandWatchReminder[];
  disclaimer: string;
}

export interface LandWatchTerms {
  disclaimer: string;
  routineIntervalDays: Record<LandWatchTier, number | null>;
}

/** An inspection on the inspector's desk. */
export interface InspectorJob {
  id: string;
  reference: string;
  kind: LandInspectionKind;
  status: LandInspectionStatus;
  instructions: string | null;
  dueBy: string | null;
  assignedAt: string | null;
  /** Staff's questions when the report was sent back. */
  staffNote: string | null;
  land: {
    propertyId: string;
    landParcelId: string | null;
    landPlotId: string | null;
    label: string;
    address: string;
    city: string;
    state: string;
    location: LandLocation;
  };
  report: {
    boundaryCondition: LandBoundaryCondition | null;
    beaconsExpected: number | null;
    beaconsFound: number | null;
    summary: string | null;
    submittedAt: string;
  } | null;
  evidence?: LandInspectionEvidence[];
  evidenceCount: number;
}

export interface InspectionIntegrityFlag {
  code: string;
  message: string;
  evidenceId?: string;
}

/** An inspection as staff see it. */
export interface StaffInspection extends Omit<InspectorJob, 'report' | 'staffNote'> {
  subscriptionId: string | null;
  requestedById: string;
  reinspectionOfId: string | null;
  createdAt: string;
  inspector: { id: string; legalName: string } | null;
  report: {
    boundaryCondition: LandBoundaryCondition | null;
    beaconsExpected: number | null;
    beaconsFound: number | null;
    summary: string | null;
    submittedAt: string;
    lat: number | null;
    lng: number | null;
    distanceM: number | null;
  } | null;
  integrityFlags: InspectionIntegrityFlag[];
  staffNote: string | null;
  reviewedAt: string | null;
}

export interface StaffLandWatchIncident extends LandWatchIncident {
  subscriptionId: string;
  land: string;
}

export const LAND_WATCH_TIER_LABELS: Record<LandWatchTier, { label: string; description: string }> =
  {
    ESSENTIAL: {
      label: 'Essential',
      description: 'Obligation reminders and your land’s records in one place',
    },
    PROTECTED: { label: 'Protected', description: 'Plus an independent inspection every 90 days' },
    MANAGED: { label: 'Managed', description: 'Plus an inspection every 30 days' },
  };

export const LAND_INSPECTION_STATUS_LABELS: Record<LandInspectionStatus, string> = {
  REQUESTED: 'Finding an inspector',
  ASSIGNED: 'Inspector assigned',
  SUBMITTED: 'Report in review',
  ESCALATED: 'Report in review',
  QUERIED: 'Inspector answering questions',
  ACCEPTED: 'Report ready',
  CANCELLED: 'Cancelled',
};

export const LAND_INSPECTION_KIND_LABELS: Record<LandInspectionKind, string> = {
  ROUTINE: 'Routine inspection',
  INCIDENT: 'Incident inspection',
  REINSPECTION: 'Reinspection',
  PRE_PURCHASE: 'Pre-purchase inspection',
};

export const LAND_BOUNDARY_LABELS: Record<LandBoundaryCondition, string> = {
  INTACT: 'Boundary intact',
  DISTURBED: 'Boundary disturbed',
  ENCROACHED: 'Encroachment found',
  INCONCLUSIVE: 'Inconclusive',
};

export const LAND_INCIDENT_KIND_LABELS: Record<LandWatchIncidentKind, string> = {
  ENCROACHMENT: 'Encroachment',
  BOUNDARY_DISTURBANCE: 'Boundary disturbed',
  CONSTRUCTION: 'Unauthorised building',
  DUMPING: 'Dumping',
  GOVERNMENT_NOTICE: 'Government notice',
  OTHER: 'Something else',
};

export const LAND_INCIDENT_STATUS_LABELS: Record<LandWatchIncidentStatus, string> = {
  OPEN: 'Being looked at',
  CONFIRMED: 'Confirmed',
  DISMISSED: 'Closed',
  ESCALATED: 'Now a dispute',
};

export const LAND_REMINDER_KIND_LABELS: Record<LandWatchReminderKind, string> = {
  LAND_USE_CHARGE: 'Land use charge',
  GROUND_RENT: 'Ground rent',
  TENEMENT_RATE: 'Tenement rate',
  PERFECTION_STEP: 'Title perfection step',
  OTHER: 'Other',
};

export type LandWatchTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export const boundaryTone = (c: LandBoundaryCondition | null): LandWatchTone =>
  c === 'INTACT'
    ? 'success'
    : c === 'ENCROACHED'
      ? 'danger'
      : c === 'DISTURBED'
        ? 'warning'
        : 'neutral';

/** A point to centre a map or navigation on: the first boundary corner, or the pin. */
export const landPoint = (location: LandLocation): { lat: number; lng: number } | null => {
  if (!location) return null;
  const [lng, lat] = 'ring' in location ? location.ring[0] : location.pin;
  return { lat, lng };
};
