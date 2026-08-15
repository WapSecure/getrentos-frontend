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
