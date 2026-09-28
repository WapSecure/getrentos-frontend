import { apiFetch } from './client';
import type { Paginated } from './properties';

/**
 * Home Management ("Home care" in the app): work orders from report to paid
 * invoice, the assets in each home, preventive maintenance and service
 * targets. Owners and landlords; a Pro feature (402 otherwise).
 */

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type WorkOrderStatus = 'SUBMITTED' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED';
export type Category = 'PLUMBING' | 'ELECTRICAL' | 'INTERNET' | 'SECURITY' | 'APPLIANCES' | 'OTHER';
export type AssetStatus = 'ACTIVE' | 'NEEDS_SERVICE' | 'RETIRED';

export interface HomeCareDashboard {
  totalAssets: number;
  assetsNeedingService: number;
  plansDue: number;
  openWorkOrders: number;
  approvalQueue: number;
  overdue: number;
  unacknowledgedEmergencies: number;
  approvedSpend: number;
  propertiesTotal: number;
}

export interface WorkOrder {
  id: string;
  issueTitle: string;
  category: string;
  description: string;
  priority: Priority;
  status: WorkOrderStatus;
  dueAt?: string | null;
  isEmergency?: boolean;
  responseDueAt?: string | null;
  resolutionDueAt?: string | null;
  escalationDueAt?: string | null;
  acknowledgedAt?: string | null;
  escalatedAt?: string | null;
  estimatedCost?: number | null;
  approvedCost?: number | null;
  approvalRequired: boolean;
  approvedAt?: string | null;
  createdById?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
  images?: string[] | null;
  unit: { unitName?: string | null; property?: { id: string; title?: string | null } | null };
  tenant?: { legalName?: string | null } | null;
  assignedVendor?: { id: string; name?: string | null } | null;
  asset?: { id: string; name?: string | null; category?: string | null } | null;
}

export interface Quote {
  id: string;
  vendorId?: string | null;
  amount: number;
  scopeOfWork: string;
  validUntil?: string | null;
  status: 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string | null;
  createdAt?: string | null;
  vendor?: { id?: string; name?: string | null } | null;
}

export interface InvoiceLine {
  description: string;
  quantity: number;
  unitAmount: number;
  totalAmount?: number;
}

export interface Invoice {
  id: string;
  vendorId: string;
  invoiceNumber?: string | null;
  totalAmount: number;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'VOID';
  completionNote?: string | null;
  createdById?: string | null;
  submittedById?: string | null;
  rejectionReason?: string | null;
  voidReason?: string | null;
  payoutStatus: 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED';
  paidOutAt?: string | null;
  createdAt: string;
  vendor?: { id: string; name: string } | null;
  lineItems: InvoiceLine[];
}

export interface Vendor {
  id: string;
  name: string;
  serviceType: string;
  phone?: string;
  isActive?: boolean;
}

export interface Asset {
  id: string;
  propertyId: string;
  unitId?: string | null;
  name: string;
  category: string;
  manufacturer?: string | null;
  modelNumber?: string | null;
  serialNumber?: string | null;
  installedAt?: string | null;
  warrantyExpiresAt?: string | null;
  status: AssetStatus;
  property?: { title?: string | null; name?: string | null };
  unit?: { unitName?: string | null } | null;
  preventivePlans?: { id: string; nextDueAt: string }[];
}

export interface Plan {
  id: string;
  propertyId: string;
  title: string;
  category: Category;
  frequencyDays: number;
  nextDueAt: string;
  lastCompletedAt?: string | null;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  property?: { title?: string | null; name?: string | null };
  asset?: { name?: string | null } | null;
  assignedVendor?: { name?: string | null } | null;
}

export interface SlaPolicy {
  id: string;
  propertyId: string;
  priority: Priority;
  responseTargetMinutes: number;
  resolutionTargetMinutes: number;
  escalationTargetMinutes: number;
  emergencyRoutingEnabled: boolean;
  isActive: boolean;
}

export interface Escalation {
  id: string;
  issueTitle: string;
  priority: Priority;
  status: WorkOrderStatus;
  isEmergency: boolean;
  breach: string;
  responseDueAt?: string | null;
  resolutionDueAt?: string | null;
  unit: { unitName?: string | null; property?: { id: string; title?: string | null } | null };
}

export interface TimelineEvent {
  id: string;
  type: string;
  title: string;
  description?: string | null;
  occurredAt: string;
  status?: string | null;
  property?: { title?: string | null; name?: string | null } | null;
  unit?: { unitName?: string | null } | null;
}

export interface Unit {
  id: string;
  unitName: string;
}

export type WorkOrderView = 'open' | 'resolved' | 'cancelled';

const q = (params: Record<string, string | number | undefined>) => {
  const s = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&');
  return s ? `?${s}` : '';
};

export const homeCareApi = {
  dashboard: () => apiFetch<HomeCareDashboard>('/home-management/dashboard'),

  // ---- work orders ----
  workOrders: (status?: WorkOrderStatus, page = 1, pageSize = 30, propertyId?: string) =>
    apiFetch<Paginated<WorkOrder>>(
      `/home-management/work-orders${q({ status, page, pageSize, propertyId })}`
    ),
  workOrder: (id: string) => apiFetch<WorkOrder>(`/home-management/work-orders/${id}`),
  createWorkOrder: (input: {
    propertyId: string;
    unitId: string;
    assetId?: string;
    issueTitle: string;
    category: Category;
    description: string;
    priority: Priority;
    isEmergency?: boolean;
    dueAt?: string;
    estimatedCost?: number;
    approvalRequired: boolean;
    assignedVendorId?: string;
  }) => apiFetch<WorkOrder>('/home-management/work-orders', { method: 'POST', body: input }),
  assign: (id: string, assignedVendorId: string) =>
    apiFetch<WorkOrder>(`/home-management/work-orders/${id}/assignment`, {
      method: 'PATCH',
      body: { assignedVendorId },
    }),
  acknowledge: (id: string) =>
    apiFetch<unknown>(`/home-management/work-orders/${id}/acknowledge`, { method: 'POST' }),
  escalate: (id: string) =>
    apiFetch<unknown>(`/home-management/work-orders/${id}/escalate`, { method: 'POST' }),
  approve: (id: string, approvedCost: number) =>
    apiFetch<WorkOrder>(`/home-management/work-orders/${id}/approve`, {
      method: 'POST',
      body: { approvedCost },
    }),
  start: (id: string) =>
    apiFetch<WorkOrder>(`/home-management/work-orders/${id}/start`, { method: 'POST' }),
  resolve: (id: string, input: { resolutionNote?: string; finalCost?: number }) =>
    apiFetch<WorkOrder>(`/home-management/work-orders/${id}/resolve`, {
      method: 'POST',
      body: input,
    }),
  cancel: (id: string, reason?: string) =>
    apiFetch<WorkOrder>(`/home-management/work-orders/${id}/cancel`, {
      method: 'POST',
      body: reason ? { reason } : {},
    }),

  // ---- quotes ----
  quotes: (id: string) => apiFetch<Paginated<Quote>>(`/home-management/work-orders/${id}/quotes`),
  addQuote: (
    id: string,
    input: { vendorId?: string; amount: number; scopeOfWork: string; validUntil?: string }
  ) =>
    apiFetch<Quote>(`/home-management/work-orders/${id}/quotes`, { method: 'POST', body: input }),
  approveQuote: (id: string, quoteId: string) =>
    apiFetch<Quote>(`/home-management/work-orders/${id}/quotes/${quoteId}/approve`, {
      method: 'POST',
    }),
  rejectQuote: (id: string, quoteId: string, reason: string) =>
    apiFetch<Quote>(`/home-management/work-orders/${id}/quotes/${quoteId}/reject`, {
      method: 'POST',
      body: { reason },
    }),

  // ---- invoices ----
  invoices: (id: string) =>
    apiFetch<Paginated<Invoice>>(`/home-management/work-orders/${id}/invoices`),
  addInvoice: (
    id: string,
    input: {
      vendorId: string;
      invoiceNumber?: string;
      lineItems: InvoiceLine[];
      completionNote?: string;
    }
  ) =>
    apiFetch<Invoice>(`/home-management/work-orders/${id}/invoices`, {
      method: 'POST',
      body: input,
    }),
  submitInvoice: (invoiceId: string) =>
    apiFetch<Invoice>(`/home-management/invoices/${invoiceId}/submit`, { method: 'POST' }),
  approveInvoice: (invoiceId: string) =>
    apiFetch<Invoice>(`/home-management/invoices/${invoiceId}/approve`, { method: 'POST' }),
  rejectInvoice: (invoiceId: string, reason: string) =>
    apiFetch<Invoice>(`/home-management/invoices/${invoiceId}/reject`, {
      method: 'POST',
      body: { reason },
    }),
  voidInvoice: (invoiceId: string, reason: string) =>
    apiFetch<Invoice>(`/home-management/invoices/${invoiceId}/void`, {
      method: 'POST',
      body: { reason },
    }),
  payInvoice: (invoiceId: string) =>
    apiFetch<unknown>(`/home-management/invoices/${invoiceId}/pay`, { method: 'POST' }),

  // ---- vendors (scoped to the signed-in user) ----
  vendors: () =>
    apiFetch<Paginated<Vendor>>('/landlord/vendors?page=1&pageSize=100&activeOnly=true'),
  addVendor: (input: { name: string; serviceType: string; phone: string }) =>
    apiFetch<Vendor>('/landlord/vendors', { method: 'POST', body: input }),

  // ---- homes ----
  units: (propertyId: string) => apiFetch<Unit[]>(`/home-management/units${q({ propertyId })}`),
  addUnit: (propertyId: string, unitName: string) =>
    apiFetch<Unit>('/home-management/units', { method: 'POST', body: { propertyId, unitName } }),

  // ---- assets ----
  assets: (propertyId?: string, status?: AssetStatus) =>
    apiFetch<Paginated<Asset>>(
      `/home-management/assets${q({ propertyId, status, page: 1, pageSize: 100 })}`
    ),
  addAsset: (input: {
    propertyId: string;
    unitId?: string;
    name: string;
    category: string;
    manufacturer?: string;
    modelNumber?: string;
    serialNumber?: string;
    installedAt?: string;
    warrantyExpiresAt?: string;
  }) => apiFetch<Asset>('/home-management/assets', { method: 'POST', body: input }),
  setAssetStatus: (id: string, status: AssetStatus) =>
    apiFetch<Asset>(`/home-management/assets/${id}/status`, { method: 'PATCH', body: { status } }),

  // ---- preventive plans ----
  plans: (propertyId?: string) =>
    apiFetch<Paginated<Plan>>(`/home-management/plans${q({ propertyId, page: 1, pageSize: 100 })}`),
  addPlan: (input: {
    propertyId: string;
    assetId?: string;
    title: string;
    category: Category;
    frequencyDays: number;
    nextDueAt: string;
    assignedVendorId?: string;
  }) => apiFetch<Plan>('/home-management/plans', { method: 'POST', body: input }),
  completePlan: (id: string) =>
    apiFetch<Plan>(`/home-management/plans/${id}/complete`, { method: 'POST' }),

  // ---- service targets ----
  slaPolicies: (propertyId: string) =>
    apiFetch<Paginated<SlaPolicy>>(
      `/home-management/sla-policies${q({ propertyId, page: 1, pageSize: 20 })}`
    ),
  addSlaPolicy: (input: Omit<SlaPolicy, 'id'>) =>
    apiFetch<SlaPolicy>('/home-management/sla-policies', { method: 'POST', body: input }),
  updateSlaPolicy: (id: string, input: Partial<Omit<SlaPolicy, 'id' | 'propertyId'>>) =>
    apiFetch<SlaPolicy>(`/home-management/sla-policies/${id}`, { method: 'PATCH', body: input }),
  escalations: (propertyId: string) =>
    apiFetch<Paginated<Escalation>>(
      `/home-management/escalations${q({ propertyId, page: 1, pageSize: 50 })}`
    ),

  timeline: (propertyId?: string, limit = 50) =>
    apiFetch<TimelineEvent[] | { events: TimelineEvent[] }>(
      `/home-management/timeline${q({ propertyId, limit })}`
    ),
};

/* ------------------------------- vocabulary ------------------------------- */

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'PLUMBING', label: 'Plumbing' },
  { value: 'ELECTRICAL', label: 'Electrical' },
  { value: 'APPLIANCES', label: 'Appliances' },
  { value: 'SECURITY', label: 'Security' },
  { value: 'INTERNET', label: 'Internet' },
  { value: 'OTHER', label: 'Other' },
];

export const PRIORITIES: { value: Priority; label: string }[] = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
];

export const STATUS_LABEL: Record<WorkOrderStatus, string> = {
  SUBMITTED: 'New',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In progress',
  RESOLVED: 'Resolved',
  CANCELLED: 'Cancelled',
};

export const categoryLabel = (c: string) =>
  CATEGORIES.find((x) => x.value === c)?.label ?? c.charAt(0) + c.slice(1).toLowerCase();

/** Minutes as "45 min", "6 h", "2 d". */
export function minutesLabel(m: number): string {
  if (m < 60) return `${m} min`;
  if (m < 60 * 24) return `${Math.round((m / 60) * 10) / 10} h`;
  return `${Math.round((m / 1440) * 10) / 10} d`;
}

/**
 * Where a work order's clock stands: the next promise it has to keep, and
 * whether that promise is already broken. Resolved/cancelled have no clock.
 */
export function slaState(
  w: Pick<WorkOrder, 'status' | 'acknowledgedAt' | 'responseDueAt' | 'resolutionDueAt'>,
  now = Date.now()
): { label: string; overdue: boolean; due?: string } | null {
  if (w.status === 'RESOLVED' || w.status === 'CANCELLED') return null;
  const due = !w.acknowledgedAt && w.responseDueAt ? w.responseDueAt : w.resolutionDueAt;
  if (!due) return null;
  const what = !w.acknowledgedAt && w.responseDueAt ? 'Respond' : 'Resolve';
  const ms = new Date(due).getTime() - now;
  const mins = Math.round(Math.abs(ms) / 60_000);
  return ms < 0
    ? { label: `${what} overdue by ${minutesLabel(mins)}`, overdue: true, due }
    : { label: `${what} within ${minutesLabel(mins)}`, overdue: false, due };
}

/** What the next useful step on a work order is, in words. */
export function nextStep(w: WorkOrder, myId?: string): string {
  if (w.status === 'RESOLVED') return 'Done. Invoice the vendor if you haven’t.';
  if (w.status === 'CANCELLED') return 'Cancelled.';
  if (w.approvalRequired && !w.approvedAt)
    return w.createdById === myId
      ? 'Waiting for another manager to approve the spend.'
      : 'Approve the spend so work can go ahead.';
  if (!w.assignedVendor) return 'Assign a vendor.';
  if (w.status === 'ASSIGNED') return 'Start the job when the vendor begins.';
  return 'Resolve it when the work is done.';
}

export function sumLines(lines: InvoiceLine[]): number {
  return lines.reduce((n, l) => n + (l.quantity || 0) * (l.unitAmount || 0), 0);
}
