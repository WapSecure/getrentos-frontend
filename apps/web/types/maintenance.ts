export type MaintenanceCategory =
  | 'plumbing'
  | 'electrical'
  | 'internet'
  | 'security'
  | 'appliances'
  | 'other';
export type MaintenancePriority = 'low' | 'medium' | 'high' | 'urgent';
export type MaintenanceRequestStatus = 'submitted' | 'assigned' | 'in_progress' | 'resolved';

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
  vendorRating?: number;
}
