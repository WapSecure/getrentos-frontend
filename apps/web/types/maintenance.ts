export type MaintenanceCategory =
  | 'plumbing'
  | 'electrical'
  | 'internet'
  | 'security'
  | 'appliances'
  | 'other';
export type MaintenancePriority = 'low' | 'medium' | 'high' | 'urgent';
export type MaintenanceRequestStatus =
  | 'submitted'
  | 'assigned'
  | 'in_progress'
  | 'resolved'
  | 'cancelled';

/** The backend sends UPPERCASE enums; keep the raw shape and lowercase-map at the point of use. */
export type MaintenanceTriageCategory =
  | 'PLUMBING'
  | 'ELECTRICAL'
  | 'INTERNET'
  | 'SECURITY'
  | 'APPLIANCES'
  | 'OTHER';

export type MaintenanceTriageUrgency = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface MaintenanceTriage {
  category: MaintenanceTriageCategory;
  urgency: MaintenanceTriageUrgency;
  needsVendor: boolean;
  rationale: string;
  draftWorkOrder: string;
  suggestedVendor: { id: string; name: string } | null;
  source: 'ai' | 'heuristic';
  model: string | null;
  triagedAt: string;
  requestId: string;
  /** Send it back with the decision. */
  reviewId?: string;
}

/** Accepting applies category and urgency to the request. */
export type MaintenanceTriageDecision =
  | {
      decision: 'accept';
      category?: MaintenanceTriageCategory;
      urgency?: MaintenanceTriageUrgency;
      draftWorkOrder?: string;
    }
  | { decision: 'reject'; reason: string };

export interface MaintenanceTriageDecisionResult {
  reviewId: string;
  outcome: 'ACCEPTED' | 'EDITED' | 'REJECTED';
  applied: { category: string; urgency: string; draftWorkOrder: string } | null;
}

export interface CreateMaintenanceRequestInput {
  title: string;
  category: MaintenanceCategory;
  priority: MaintenancePriority;
  description: string;
  /** Emergency requests are routed by the API as urgent work orders. */
  isEmergency?: boolean;
}

export interface MaintenanceRequest {
  id: string;
  propertyId: string;
  propertyName: string;
  title: string;
  category: MaintenanceCategory;
  description: string;
  priority: MaintenancePriority;
  status: MaintenanceRequestStatus;
  images: string[];
  assignedVendorId?: string;
  assignedVendorName?: string;
  scheduledFor?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  slaResponseTime?: number;
  isEmergency?: boolean;
  responseDueAt?: string | null;
  resolutionDueAt?: string | null;
  escalationDueAt?: string | null;
  acknowledgedAt?: string | null;
  vendorRating?: number;
}

export interface MaintenanceSummary {
  total: number;
  open: number;
  resolved: number;
  urgent: number;
  /** Averaged; open requests count up to now. */
  avgResponseHours: number;
}
