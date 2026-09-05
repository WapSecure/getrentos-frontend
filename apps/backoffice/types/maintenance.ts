export type MaintenanceCategory =
  | 'PLUMBING'
  | 'ELECTRICAL'
  | 'INTERNET'
  | 'SECURITY'
  | 'APPLIANCES'
  | 'OTHER';
export type MaintenancePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type MaintenanceRequestStatus =
  | 'SUBMITTED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CANCELLED';
export type PreventivePlanStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED';
export type VendorQuoteStatus = 'SUBMITTED' | 'APPROVED' | 'REJECTED';
export type VendorInvoiceStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'VOID';

export interface AdminMaintenanceOverview {
  totalWorkOrders: number;
  openWorkOrders: number;
  inProgressWorkOrders: number;
  resolvedWorkOrders: number;
  cancelledWorkOrders: number;
  urgentOpenWorkOrders: number;
  pendingApprovalWorkOrders: number;
  slaAtRiskWorkOrders: number;
}

export interface AdminWorkOrder {
  id: string;
  propertyId: string;
  propertyTitle: string;
  city: string;
  state: string;
  unitId: string;
  unitName: string;
  tenantId: string | null;
  tenantName: string | null;
  createdByName: string | null;
  issueTitle: string;
  category: MaintenanceCategory;
  priority: MaintenancePriority;
  status: MaintenanceRequestStatus;
  isEmergency: boolean;
  assignedVendorId: string | null;
  vendorName: string | null;
  estimatedCost: number | null;
  approvedCost: number | null;
  approvalRequired: boolean;
  approvedAt: string | null;
  responseDueAt: string | null;
  resolutionDueAt: string | null;
  escalationDueAt: string | null;
  acknowledgedAt: string | null;
  escalatedAt: string | null;
  slaAtRisk: boolean;
  quoteCount: number;
  invoiceCount: number;
  createdAt: string;
  resolvedAt: string | null;
}

export interface AdminSlaPolicy {
  id: string;
  propertyId: string;
  propertyTitle: string;
  city: string;
  state: string;
  priority: MaintenancePriority;
  responseTargetMinutes: number;
  resolutionTargetMinutes: number;
  escalationTargetMinutes: number;
  emergencyRoutingEnabled: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminPreventivePlan {
  id: string;
  propertyId: string;
  propertyTitle: string;
  city: string;
  state: string;
  unitId: string | null;
  unitName: string | null;
  assetId: string | null;
  assetName: string | null;
  title: string;
  category: MaintenanceCategory;
  frequencyDays: number;
  nextDueAt: string;
  lastCompletedAt: string | null;
  status: PreventivePlanStatus;
  assignedVendorId: string | null;
  vendorName: string | null;
  isDue: boolean;
}

export interface AdminVendor {
  id: string;
  landlordId: string;
  landlordName: string;
  landlordEmail: string | null;
  name: string;
  serviceType: string;
  phone: string;
  rating: number;
  jobsCompleted: number;
  workOrderCount: number;
  quoteCount: number;
  invoiceCount: number;
  createdAt: string;
}

export interface AdminVendorQuote {
  id: string;
  workOrderId: string;
  propertyTitle: string;
  unitName: string;
  issueTitle: string;
  workOrderStatus: MaintenanceRequestStatus;
  category: MaintenanceCategory;
  vendorId: string | null;
  vendorName: string | null;
  amount: number;
  scopeOfWork: string;
  status: VendorQuoteStatus;
  submittedByName: string;
  submittedAt: string;
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
}

export interface AdminVendorInvoice {
  id: string;
  workOrderId: string;
  propertyTitle: string;
  unitName: string;
  issueTitle: string;
  workOrderStatus: MaintenanceRequestStatus;
  vendorId: string;
  vendorName: string;
  invoiceNumber: string | null;
  currency: string;
  totalAmount: number;
  completionNote: string | null;
  status: VendorInvoiceStatus;
  createdByName: string;
  submittedAt: string | null;
  approvedAt: string | null;
  approvedByName: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  voidedAt: string | null;
  voidReason: string | null;
  createdAt: string;
}
