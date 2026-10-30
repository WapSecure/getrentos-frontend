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

/**
 * AI triage result for a maintenance request.
 *
 * The backend speaks UPPERCASE `MaintenanceCategory` / `MaintenancePriority`
 * (its Prisma enums), whereas the rest of the web app uses the lowercase
 * variants above. Keep the raw shape here and lowercase-map at the point of use
 * for badge/icon lookups.
 */
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
  /** When the assigned vendor is due to visit. */
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
