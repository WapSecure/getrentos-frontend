export type LandWatchTier = 'ESSENTIAL' | 'PROTECTED' | 'MANAGED';
export type LandWatchStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED';
export type LandInspectionKind =
  | 'ROUTINE'
  | 'INCIDENT'
  | 'REINSPECTION'
  | 'PRE_PURCHASE'
  | 'JOB_CHECK';
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

// [lng, lat], as GeoJSON has them.
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

export interface LandWatchOption {
  kind: 'PARCEL' | 'PLOT';
  propertyId: string | null;
  landPlotId: string | null;
  label: string;
  place: string;
  watchId: string | null;
}

export interface InspectorJob {
  id: string;
  reference: string;
  kind: LandInspectionKind;
  status: LandInspectionStatus;
  instructions: string | null;
  dueBy: string | null;
  assignedAt: string | null;
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
  JOB_CHECK: 'Check of vendor work',
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

export const landPoint = (location: LandLocation): { lat: number; lng: number } | null => {
  if (!location) return null;
  const [lng, lat] = 'ring' in location ? location.ring[0] : location.pin;
  return { lat, lng };
};

export const formatDistance = (metres: number): string => {
  if (metres < 1000) return `${Math.round(metres)} m`;
  const km = metres / 1000;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
};

export const describeDistance = (metres: number | null): string =>
  metres == null ? 'no location' : metres === 0 ? 'on the land' : `${formatDistance(metres)} away`;

export type LandWatchJobKind =
  | 'FENCING'
  | 'CLEARING'
  | 'SECURITY'
  | 'BEACON_REPLACEMENT'
  | 'SURVEY'
  | 'OTHER';
export type LandWatchJobStatus =
  | 'REQUESTED'
  | 'QUOTED'
  | 'APPROVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';
export type LandWatchJobQuoteStatus = 'OFFERED' | 'ACCEPTED' | 'DECLINED' | 'WITHDRAWN';

export interface LandWatchJobQuote {
  id: string;
  vendorName: string;
  /** The owner sees it only on the quote they accepted. */
  vendorPhone: string | null;
  amountNaira: number;
  scope: string;
  validUntil: string | null;
  status: LandWatchJobQuoteStatus;
  createdAt: string;
}

export interface LandWatchJobProof {
  id: string;
  fileName: string;
  mimeType: string;
  note: string | null;
  createdAt: string;
  url: string;
}

export interface LandWatchJob {
  id: string;
  reference: string;
  watchId: string;
  kind: LandWatchJobKind;
  description: string;
  status: LandWatchJobStatus;
  createdAt: string;
  acceptedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  completionNote: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  checkInspectionId: string | null;
  quotes: LandWatchJobQuote[];
  proof: LandWatchJobProof[];
}

export interface StaffLandWatchJob extends LandWatchJob {
  tier: LandWatchTier;
  land: { label: string; city: string; state: string; propertyId: string };
  subscriberId: string;
}

export const LAND_WATCH_JOB_KIND_LABELS: Record<LandWatchJobKind, string> = {
  FENCING: 'Fencing',
  CLEARING: 'Clearing',
  SECURITY: 'Security',
  BEACON_REPLACEMENT: 'Beacon replacement',
  SURVEY: 'Survey',
  OTHER: 'Other work',
};

export const LAND_WATCH_JOB_STATUS_LABELS: Record<
  LandWatchJobStatus,
  { label: string; tone: 'neutral' | 'info' | 'warning' | 'success' | 'danger' }
> = {
  REQUESTED: { label: 'Finding vendors', tone: 'neutral' },
  QUOTED: { label: 'Quotes ready', tone: 'warning' },
  APPROVED: { label: 'Vendor chosen', tone: 'info' },
  IN_PROGRESS: { label: 'Work under way', tone: 'info' },
  COMPLETED: { label: 'Done', tone: 'success' },
  CANCELLED: { label: 'Cancelled', tone: 'neutral' },
};

export const LAND_WATCH_JOB_PAYMENT_NOTE =
  'You pay the vendor directly. Sureground arranges the work and records proof of it, but does not hold or pass on this money.';
