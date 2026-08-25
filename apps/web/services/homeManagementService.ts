import { authFetch, safeCall, toQuery, type Paginated } from '@/lib/apiHelpers';

export type HomeManagementDashboard = {
  assets: number;
  totalAssets: number;
  assetsNeedingService: number;
  plansDue: number;
  openWorkOrders: number;
  approvalQueue: number;
  overdue: number;
  unacknowledgedEmergencies: number;
  approvedSpend: number;
  propertiesTotal: number;
};

export type HomeManagementPageParams = {
  page?: number;
  pageSize?: number;
};

export type HomeManagementAssetsParams = HomeManagementPageParams & {
  propertyId?: string;
  status?: HomeAssetStatus;
};

export type HomeManagementPlansParams = HomeManagementPageParams & {
  propertyId?: string;
  status?: PreventivePlanStatus;
};

export type HomeManagementWorkOrdersParams = HomeManagementPageParams & {
  propertyId?: string;
  status?: HomeManagementWorkOrder['status'];
};

export type HomeManagementInspectionsParams = HomeManagementPageParams & {
  propertyId?: string;
  status?: HomeManagementInspection['status'];
};

export type HomeManagementSlaPoliciesParams = HomeManagementPageParams & {
  isActive?: boolean;
};

export type HomeAssetStatus = 'ACTIVE' | 'NEEDS_SERVICE' | 'RETIRED';
export type PreventivePlanStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED';
export type HomeManagementMaintenanceCategory =
  | 'PLUMBING'
  | 'ELECTRICAL'
  | 'INTERNET'
  | 'SECURITY'
  | 'APPLIANCES'
  | 'OTHER';

export type HomeManagementProperty = {
  id: string;
  name?: string;
  title?: string;
  city?: string;
  state?: string;
};

export type HomeManagementVendor = {
  id: string;
  name: string;
  serviceType?: string;
  rating?: number;
  jobsCompleted?: number;
};

export type HomeManagementUnit = {
  id: string;
  unitName: string;
};

export type CreateHomeManagementUnitInput = {
  propertyId: string;
  unitName: string;
  bedrooms?: number;
  bathrooms?: number;
  monthlyRent?: number;
};

export type HomeAsset = {
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
  status: HomeAssetStatus;
  createdAt: string;
  updatedAt: string;
  property?: { title?: string | null; name?: string | null };
  unit?: { unitName?: string | null } | null;
  preventivePlans?: Array<{ id: string; nextDueAt: string }>;
};

export type PreventiveMaintenancePlan = {
  id: string;
  propertyId: string;
  unitId?: string | null;
  assetId?: string | null;
  title: string;
  category: HomeManagementMaintenanceCategory;
  frequencyDays: number;
  nextDueAt: string;
  lastCompletedAt?: string | null;
  status: PreventivePlanStatus;
  assignedVendorId?: string | null;
  createdAt: string;
  updatedAt: string;
  property?: { title?: string | null; name?: string | null };
  asset?: { name?: string | null } | null;
  assignedVendor?: { name?: string | null } | null;
};

export type CreateHomeAssetInput = {
  propertyId: string;
  unitId?: string;
  name: string;
  category: string;
  manufacturer?: string;
  modelNumber?: string;
  serialNumber?: string;
  installedAt?: string;
  warrantyExpiresAt?: string;
};

export type CreatePreventivePlanInput = {
  propertyId: string;
  unitId?: string;
  assetId?: string;
  title: string;
  category: HomeManagementMaintenanceCategory;
  frequencyDays: number;
  nextDueAt: string;
  assignedVendorId?: string;
};

export type HomeManagementWorkOrder = {
  id: string;
  issueTitle: string;
  category: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'SUBMITTED' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED';
  dueAt?: string | null;
  /**
   * SLA fields are optional while older work-order records and API deployments
   * are being reconciled. Their absence must never prevent the work-order
   * control centre from rendering.
   */
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
  unit: {
    unitName?: string | null;
    property?: { id: string; title?: string | null } | null;
  };
  tenant?: { legalName?: string | null } | null;
  assignedVendor?: { id: string; name?: string | null } | null;
  asset?: { id: string; name?: string | null; category?: string | null } | null;
};

export type HomeManagementWorkOrderQuoteStatus = 'SUBMITTED' | 'APPROVED' | 'REJECTED';

/**
 * Vendor estimates are recorded by an authenticated Home Management operator.
 * Keep relation fields optional so the UI remains resilient while an older API
 * response, or a deleted vendor/user relation, is being reconciled.
 */
export type HomeManagementWorkOrderQuote = {
  id: string;
  maintenanceRequestId?: string;
  vendorId?: string | null;
  amount: number;
  scopeOfWork: string;
  validUntil?: string | null;
  status: HomeManagementWorkOrderQuoteStatus;
  submittedById?: string | null;
  submittedAt?: string | null;
  approvedById?: string | null;
  approvedAt?: string | null;
  rejectedById?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  vendor?: {
    id?: string;
    name?: string | null;
    serviceType?: string | null;
    phone?: string | null;
  } | null;
  submittedBy?: { id?: string; legalName?: string | null } | null;
  approvedBy?: { id?: string; legalName?: string | null } | null;
  rejectedBy?: { id?: string; legalName?: string | null } | null;
};

export type CreateHomeManagementWorkOrderQuoteInput = {
  vendorId?: string;
  amount: number;
  scopeOfWork: string;
  validUntil?: string;
};

export type RejectHomeManagementWorkOrderQuoteInput = {
  reason: string;
};

export type HomeManagementWorkOrderInvoiceStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'VOID';

/**
 * Monetary values in Home Management are whole currency units. This mirrors
 * approved work-order spend and quote amounts, so the invoice UI never needs
 * to round or reconcile fractional cents client-side.
 */
export type HomeManagementWorkOrderInvoiceLineItem = {
  id?: string;
  description: string;
  quantity: number;
  unitAmount: number;
  totalAmount: number;
};

export type HomeManagementWorkOrderInvoice = {
  id: string;
  maintenanceRequestId: string;
  vendorId: string;
  invoiceNumber?: string | null;
  currency: string;
  totalAmount: number;
  status: HomeManagementWorkOrderInvoiceStatus;
  completionNote?: string | null;
  createdById?: string | null;
  submittedById?: string | null;
  submittedAt?: string | null;
  approvedById?: string | null;
  approvedAt?: string | null;
  rejectedById?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  voidedById?: string | null;
  voidedAt?: string | null;
  voidReason?: string | null;
  createdAt: string;
  updatedAt: string;
  vendor?: {
    id: string;
    name: string;
    serviceType?: string | null;
  } | null;
  lineItems: HomeManagementWorkOrderInvoiceLineItem[];
};

export type CreateHomeManagementWorkOrderInvoiceInput = {
  vendorId: string;
  invoiceNumber?: string;
  currency?: string;
  lineItems: Array<
    Pick<HomeManagementWorkOrderInvoiceLineItem, 'description' | 'quantity' | 'unitAmount'>
  >;
  completionNote?: string;
};

export type RejectHomeManagementWorkOrderInvoiceInput = {
  reason: string;
};

export type VoidHomeManagementWorkOrderInvoiceInput = {
  reason: string;
};

export type CreateHomeManagementWorkOrderInput = {
  propertyId: string;
  unitId: string;
  assetId?: string;
  issueTitle: string;
  category: HomeManagementMaintenanceCategory;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  isEmergency?: boolean;
  dueAt?: string;
  estimatedCost?: number;
  approvalRequired: boolean;
  assignedVendorId?: string;
};

export type AssignHomeManagementWorkOrderVendorInput = {
  assignedVendorId: string;
};

export type ResolveHomeManagementWorkOrderInput = {
  resolutionNote?: string;
};

export type CancelHomeManagementWorkOrderInput = {
  reason?: string;
};

export type HomeManagementInspection = {
  id: string;
  taskId: string;
  agentId: string;
  propertyId: string;
  clientName?: string | null;
  scheduledAt: string;
  status: 'DRAFT' | 'SUBMITTED';
  overallCondition?: string | null;
  submittedAt?: string | null;
  createdAt: string;
  property: { id: string; title?: string | null };
  agent: { id: string; legalName?: string | null };
  task: { id: string; title?: string | null; status?: string | null; dueAt?: string | null };
};

export type HomeManagementTimelineEvent = {
  id: string;
  type: string;
  title: string;
  description?: string | null;
  occurredAt: string;
  status?: string | null;
  property?: {
    id?: string;
    title?: string | null;
    name?: string | null;
  } | null;
  unit?: {
    id?: string;
    unitName?: string | null;
    name?: string | null;
  } | null;
  metadata?: Record<string, unknown> | null;
};

export type HomeManagementTimelineParams = {
  propertyId?: string;
  limit?: number;
};

export type HomeManagementSlaPriority = HomeManagementWorkOrder['priority'];

export type HomeManagementSlaPolicy = {
  id: string;
  propertyId: string;
  priority: HomeManagementSlaPriority;
  responseTargetMinutes: number;
  resolutionTargetMinutes: number;
  escalationTargetMinutes: number;
  emergencyRoutingEnabled: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateHomeManagementSlaPolicyInput = {
  propertyId: string;
  priority: HomeManagementSlaPriority;
  responseTargetMinutes: number;
  resolutionTargetMinutes: number;
  escalationTargetMinutes: number;
  emergencyRoutingEnabled: boolean;
  isActive: boolean;
};

export type UpdateHomeManagementSlaPolicyInput = Partial<
  Omit<CreateHomeManagementSlaPolicyInput, 'propertyId'>
>;

/**
 * The escalation endpoint returns safe operational work-order data together
 * with the reason it entered the queue. Keep the breach label open-ended so
 * newly introduced backend classifications do not break the dashboard.
 */
export type HomeManagementWorkOrderSlaState = Pick<
  HomeManagementWorkOrder,
  | 'id'
  | 'status'
  | 'isEmergency'
  | 'responseDueAt'
  | 'resolutionDueAt'
  | 'escalationDueAt'
  | 'acknowledgedAt'
  | 'escalatedAt'
>;

export type HomeManagementEscalation = {
  id: string;
  issueTitle: string;
  category: string;
  priority: HomeManagementWorkOrder['priority'];
  status: HomeManagementWorkOrder['status'];
  isEmergency: boolean;
  responseDueAt?: string | null;
  resolutionDueAt?: string | null;
  escalationDueAt?: string | null;
  acknowledgedAt?: string | null;
  escalatedAt?: string | null;
  breach: 'RESPONSE_BREACHED' | 'RESOLUTION_BREACHED' | 'ESCALATION_DUE' | string;
  unit: {
    id: string;
    unitName?: string | null;
    property?: { id: string; title?: string | null } | null;
  };
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const asString = (...values: unknown[]): string | undefined => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value;
  }
  return undefined;
};

const normalizeTimelineRelation = (value: unknown) => {
  const relation = asRecord(value);
  if (!relation) {
    const label = asString(value);
    return label ? { id: undefined, title: label, name: label, unitName: label } : null;
  }

  const id = asString(relation.id);
  const title = asString(relation.title, relation.name, relation.label, relation.unitName);
  const name = asString(relation.name, relation.title, relation.label, relation.unitName);
  const unitName = asString(relation.unitName, relation.name, relation.title, relation.label);

  return { id, title, name, unitName };
};

const normalizeTimelineEvents = (payload: unknown): HomeManagementTimelineEvent[] => {
  const envelope = asRecord(payload);
  const events = Array.isArray(payload)
    ? payload
    : Array.isArray(envelope?.events)
      ? envelope.events
      : Array.isArray(envelope?.data)
        ? envelope.data
        : [];

  return events.flatMap((value) => {
    const event = asRecord(value);
    if (!event) return [];

    const id = asString(event.id);
    if (!id) return [];

    const property = normalizeTimelineRelation(
      event.property ?? {
        id: event.propertyId,
        title: event.propertyTitle,
        name: event.propertyName,
      }
    );
    const unit = normalizeTimelineRelation(
      event.unit ?? {
        id: event.unitId,
        unitName: event.unitName,
        name: event.unitName,
      }
    );

    const metadata = asRecord(event.metadata);

    return [
      {
        id,
        type: asString(event.type, event.eventType) ?? 'ACTIVITY',
        title: asString(event.title) ?? 'Home activity',
        description: asString(event.description) ?? null,
        occurredAt: asString(event.occurredAt, event.createdAt, event.updatedAt) ?? '',
        status: asString(event.status, metadata?.status) ?? null,
        property: property ? { id: property.id, title: property.title, name: property.name } : null,
        unit: unit ? { id: unit.id, unitName: unit.unitName, name: unit.name } : null,
        metadata,
      },
    ];
  });
};

export const homeManagementService = {
  getDashboard: () =>
    safeCall(() => authFetch<HomeManagementDashboard>('/home-management/dashboard')),
  listAssets: (params: HomeManagementAssetsParams = {}) =>
    safeCall(() => authFetch<Paginated<HomeAsset>>(`/home-management/assets${toQuery(params)}`)),
  createAsset: (data: CreateHomeAssetInput) =>
    safeCall(() =>
      authFetch<HomeAsset>('/home-management/assets', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    ),
  updateAssetStatus: (id: string, status: HomeAssetStatus) =>
    safeCall(() =>
      authFetch<HomeAsset>(`/home-management/assets/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
    ),
  listPlans: (params: HomeManagementPlansParams = {}) =>
    safeCall(() =>
      authFetch<Paginated<PreventiveMaintenancePlan>>(`/home-management/plans${toQuery(params)}`)
    ),
  createPlan: (data: CreatePreventivePlanInput) =>
    safeCall(() =>
      authFetch<PreventiveMaintenancePlan>('/home-management/plans', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    ),
  completePlan: (id: string) =>
    safeCall(() =>
      authFetch<PreventiveMaintenancePlan>(`/home-management/plans/${id}/complete`, {
        method: 'POST',
      })
    ),
  listUnits: (propertyId: string) =>
    safeCall(() =>
      authFetch<HomeManagementUnit[]>(`/home-management/units${toQuery({ propertyId })}`)
    ),
  createUnit: (data: CreateHomeManagementUnitInput) =>
    safeCall(() =>
      authFetch<HomeManagementUnit>('/home-management/units', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    ),
  listWorkOrders: (params: HomeManagementWorkOrdersParams = {}) =>
    safeCall(() =>
      authFetch<Paginated<HomeManagementWorkOrder>>(
        `/home-management/work-orders${toQuery(params)}`
      )
    ),
  createWorkOrder: (data: CreateHomeManagementWorkOrderInput) =>
    safeCall(() =>
      authFetch<HomeManagementWorkOrder>('/home-management/work-orders', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    ),
  assignWorkOrderVendor: (id: string, data: AssignHomeManagementWorkOrderVendorInput) =>
    safeCall(() =>
      authFetch<HomeManagementWorkOrder>(`/home-management/work-orders/${id}/assignment`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      })
    ),
  startWorkOrder: (id: string) =>
    safeCall(() =>
      authFetch<HomeManagementWorkOrder>(`/home-management/work-orders/${id}/start`, {
        method: 'POST',
      })
    ),
  resolveWorkOrder: (id: string, data: ResolveHomeManagementWorkOrderInput = {}) =>
    safeCall(() =>
      authFetch<HomeManagementWorkOrder>(`/home-management/work-orders/${id}/resolve`, {
        method: 'POST',
        body: JSON.stringify(data),
      })
    ),
  cancelWorkOrder: (id: string, data: CancelHomeManagementWorkOrderInput = {}) =>
    safeCall(() =>
      authFetch<HomeManagementWorkOrder>(`/home-management/work-orders/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify(data),
      })
    ),
  listInspections: (params: HomeManagementInspectionsParams = {}) =>
    safeCall(() =>
      authFetch<Paginated<HomeManagementInspection>>(
        `/home-management/inspections${toQuery(params)}`
      )
    ),
  listTimeline: ({ propertyId, limit }: HomeManagementTimelineParams = {}) => {
    const normalizedLimit =
      typeof limit === 'number' && Number.isInteger(limit) && limit > 0 ? String(limit) : undefined;

    return safeCall(async () =>
      normalizeTimelineEvents(
        await authFetch<unknown>(
          `/home-management/timeline${toQuery({ propertyId, limit: normalizedLimit })}`
        )
      )
    );
  },
  approveWorkOrder: (id: string, approvedCost: number) =>
    safeCall(() =>
      authFetch<HomeManagementWorkOrder>(`/home-management/work-orders/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ approvedCost }),
      })
    ),
  listSlaPolicies: (propertyId: string, params: HomeManagementSlaPoliciesParams = {}) =>
    safeCall(() =>
      authFetch<Paginated<HomeManagementSlaPolicy>>(
        `/home-management/sla-policies${toQuery({ propertyId, ...params })}`
      )
    ),
  createSlaPolicy: (data: CreateHomeManagementSlaPolicyInput) =>
    safeCall(() =>
      authFetch<HomeManagementSlaPolicy>('/home-management/sla-policies', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    ),
  updateSlaPolicy: (id: string, data: UpdateHomeManagementSlaPolicyInput) =>
    safeCall(() =>
      authFetch<HomeManagementSlaPolicy>(`/home-management/sla-policies/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      })
    ),
  listEscalations: (propertyId: string, params: HomeManagementPageParams = {}) =>
    safeCall(() =>
      authFetch<Paginated<HomeManagementEscalation>>(
        `/home-management/escalations${toQuery({ propertyId, ...params })}`
      )
    ),
  acknowledgeWorkOrder: (id: string) =>
    safeCall(() =>
      authFetch<HomeManagementWorkOrderSlaState>(`/home-management/work-orders/${id}/acknowledge`, {
        method: 'POST',
      })
    ),
  escalateWorkOrder: (id: string) =>
    safeCall(() =>
      authFetch<HomeManagementWorkOrderSlaState>(`/home-management/work-orders/${id}/escalate`, {
        method: 'POST',
      })
    ),
  listWorkOrderQuotes: (workOrderId: string, params: HomeManagementPageParams = {}) =>
    safeCall(() =>
      authFetch<Paginated<HomeManagementWorkOrderQuote>>(
        `/home-management/work-orders/${workOrderId}/quotes${toQuery(params)}`
      )
    ),
  createWorkOrderQuote: (workOrderId: string, data: CreateHomeManagementWorkOrderQuoteInput) =>
    safeCall(() =>
      authFetch<HomeManagementWorkOrderQuote>(
        `/home-management/work-orders/${workOrderId}/quotes`,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      )
    ),
  approveWorkOrderQuote: (workOrderId: string, quoteId: string) =>
    safeCall(() =>
      authFetch<HomeManagementWorkOrderQuote>(
        `/home-management/work-orders/${workOrderId}/quotes/${quoteId}/approve`,
        { method: 'POST' }
      )
    ),
  rejectWorkOrderQuote: (
    workOrderId: string,
    quoteId: string,
    data: RejectHomeManagementWorkOrderQuoteInput
  ) =>
    safeCall(() =>
      authFetch<HomeManagementWorkOrderQuote>(
        `/home-management/work-orders/${workOrderId}/quotes/${quoteId}/reject`,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      )
    ),
  listWorkOrderInvoices: (workOrderId: string, params: HomeManagementPageParams = {}) =>
    safeCall(() =>
      authFetch<Paginated<HomeManagementWorkOrderInvoice>>(
        `/home-management/work-orders/${workOrderId}/invoices${toQuery(params)}`
      )
    ),
  createWorkOrderInvoice: (workOrderId: string, data: CreateHomeManagementWorkOrderInvoiceInput) =>
    safeCall(() =>
      authFetch<HomeManagementWorkOrderInvoice>(
        `/home-management/work-orders/${workOrderId}/invoices`,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      )
    ),
  submitWorkOrderInvoice: (invoiceId: string) =>
    safeCall(() =>
      authFetch<HomeManagementWorkOrderInvoice>(`/home-management/invoices/${invoiceId}/submit`, {
        method: 'POST',
      })
    ),
  approveWorkOrderInvoice: (invoiceId: string) =>
    safeCall(() =>
      authFetch<HomeManagementWorkOrderInvoice>(`/home-management/invoices/${invoiceId}/approve`, {
        method: 'POST',
      })
    ),
  rejectWorkOrderInvoice: (invoiceId: string, data: RejectHomeManagementWorkOrderInvoiceInput) =>
    safeCall(() =>
      authFetch<HomeManagementWorkOrderInvoice>(`/home-management/invoices/${invoiceId}/reject`, {
        method: 'POST',
        body: JSON.stringify(data),
      })
    ),
  voidWorkOrderInvoice: (invoiceId: string, data: VoidHomeManagementWorkOrderInvoiceInput) =>
    safeCall(() =>
      authFetch<HomeManagementWorkOrderInvoice>(`/home-management/invoices/${invoiceId}/void`, {
        method: 'POST',
        body: JSON.stringify(data),
      })
    ),
};
