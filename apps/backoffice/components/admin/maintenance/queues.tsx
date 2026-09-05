'use client';

import type { ReactNode } from 'react';
import { CalendarClock, Clock3, Hammer, Receipt, Scroll, Wrench } from 'lucide-react';
import { Badge, type BadgeVariant } from '@getrentos/ui';
import { adminMaintenanceService } from '@/services/adminMaintenanceService';
import { MaintenanceQueuePage, type MaintenanceQueueConfig } from './MaintenanceQueuePage';
import type {
  AdminPreventivePlan,
  AdminSlaPolicy,
  AdminVendor,
  AdminVendorInvoice,
  AdminVendorQuote,
  AdminWorkOrder,
  MaintenanceCategory,
  MaintenancePriority,
  MaintenanceRequestStatus,
  PreventivePlanStatus,
  VendorInvoiceStatus,
  VendorQuoteStatus,
} from '@/types/maintenance';

const naira = (value: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(value);

const date = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';

const Pill = ({ label, variant }: { label: string; variant: BadgeVariant }) => (
  <Badge variant={variant}>{label}</Badge>
);

const Cell = ({ primary, secondary }: { primary: ReactNode; secondary?: ReactNode }) => (
  <div className="min-w-0">
    <p className="font-medium text-foreground">{primary}</p>
    {secondary && <p className="truncate text-xs text-muted-foreground">{secondary}</p>}
  </div>
);

const titleCase = (value: string) =>
  value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

const categoryLabel = (category: MaintenanceCategory) => titleCase(category);

const workOrderStatusVariant = (status: MaintenanceRequestStatus): BadgeVariant => {
  const map: Record<MaintenanceRequestStatus, BadgeVariant> = {
    SUBMITTED: 'neutral',
    ASSIGNED: 'warning',
    IN_PROGRESS: 'info',
    RESOLVED: 'success',
    CANCELLED: 'neutral',
  };
  return map[status] ?? 'neutral';
};
const priorityVariant = (priority: MaintenancePriority): BadgeVariant => {
  const map: Record<MaintenancePriority, BadgeVariant> = {
    LOW: 'neutral',
    MEDIUM: 'info',
    HIGH: 'warning',
    URGENT: 'danger',
  };
  return map[priority] ?? 'neutral';
};
const planStatusVariant = (status: PreventivePlanStatus): BadgeVariant => {
  const map: Record<PreventivePlanStatus, BadgeVariant> = {
    ACTIVE: 'success',
    PAUSED: 'warning',
    COMPLETED: 'neutral',
  };
  return map[status] ?? 'neutral';
};
const quoteStatusVariant = (status: VendorQuoteStatus): BadgeVariant => {
  const map: Record<VendorQuoteStatus, BadgeVariant> = {
    SUBMITTED: 'warning',
    APPROVED: 'success',
    REJECTED: 'danger',
  };
  return map[status] ?? 'neutral';
};
const invoiceStatusVariant = (status: VendorInvoiceStatus): BadgeVariant => {
  const map: Record<VendorInvoiceStatus, BadgeVariant> = {
    DRAFT: 'neutral',
    SUBMITTED: 'warning',
    APPROVED: 'success',
    REJECTED: 'danger',
    VOID: 'neutral',
  };
  return map[status] ?? 'neutral';
};

const statusOptions = [
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CANCELLED', label: 'Cancelled' },
];
const priorityOptions: { value: MaintenancePriority; label: string }[] = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
];
const categoryOptions: { value: MaintenanceCategory; label: string }[] = [
  { value: 'PLUMBING', label: 'Plumbing' },
  { value: 'ELECTRICAL', label: 'Electrical' },
  { value: 'INTERNET', label: 'Internet' },
  { value: 'SECURITY', label: 'Security' },
  { value: 'APPLIANCES', label: 'Appliances' },
  { value: 'OTHER', label: 'Other' },
];
const planStatusOptions: { value: PreventivePlanStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PAUSED', label: 'Paused' },
  { value: 'COMPLETED', label: 'Completed' },
];
const quoteStatusOptions: { value: VendorQuoteStatus; label: string }[] = [
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];
const invoiceStatusOptions: { value: VendorInvoiceStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'VOID', label: 'Void' },
];
const yesNoOptions = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
];

export function WorkOrdersQueue() {
  const config: MaintenanceQueueConfig<AdminWorkOrder> = {
    resource: 'work-orders',
    eyebrow: 'Work Orders',
    title: 'Maintenance work orders',
    description: 'Platform-wide maintenance requests with SLA health indicators.',
    icon: Wrench,
    filters: [
      { key: 'status', label: 'Status', options: statusOptions },
      { key: 'priority', label: 'Priority', options: priorityOptions },
      { key: 'category', label: 'Category', options: categoryOptions },
    ],
    listFn: (params) => adminMaintenanceService.listWorkOrders(params),
    getRowKey: (w) => w.id,
    columns: [
      {
        key: 'property',
        header: 'Property',
        render: (w) => (
          <Cell primary={w.propertyTitle} secondary={`${w.unitName} · ${w.city}, ${w.state}`} />
        ),
      },
      {
        key: 'issue',
        header: 'Issue',
        render: (w) => <Cell primary={w.issueTitle} secondary={categoryLabel(w.category)} />,
      },
      {
        key: 'tenant',
        header: 'Tenant',
        render: (w) => (
          <Cell
            primary={w.tenantName ?? '—'}
            secondary={w.vendorName ? `Vendor: ${w.vendorName}` : undefined}
          />
        ),
      },
      {
        key: 'priority',
        header: 'Priority',
        render: (w) => <Pill label={titleCase(w.priority)} variant={priorityVariant(w.priority)} />,
      },
      {
        key: 'cost',
        header: 'Cost',
        render: (w) => (
          <Cell
            primary={
              w.approvedCost !== null && w.approvedCost !== undefined ? naira(w.approvedCost) : '—'
            }
            secondary={
              w.approvalRequired
                ? 'Approval required'
                : w.estimatedCost
                  ? `Est. ${naira(w.estimatedCost)}`
                  : undefined
            }
          />
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (w) => (
          <div className="flex flex-wrap gap-1">
            <Pill label={titleCase(w.status)} variant={workOrderStatusVariant(w.status)} />
            {w.slaAtRisk && <Pill label="SLA at risk" variant="danger" />}
            {w.isEmergency && <Pill label="Emergency" variant="danger" />}
          </div>
        ),
      },
      {
        key: 'created',
        header: 'Created',
        render: (w) => (
          <Cell
            primary={date(w.createdAt)}
            secondary={w.resolutionDueAt ? `Resolve by ${date(w.resolutionDueAt)}` : undefined}
          />
        ),
      },
    ],
  };
  return <MaintenanceQueuePage config={config} />;
}

export function SlaPoliciesQueue() {
  const config: MaintenanceQueueConfig<AdminSlaPolicy> = {
    resource: 'sla-policies',
    eyebrow: 'SLA Policies',
    title: 'Service-level agreements',
    description: 'Property-scoped response / resolution / escalation targets by priority.',
    icon: Clock3,
    filters: [
      { key: 'priority', label: 'Priority', options: priorityOptions },
      { key: 'isActive', label: 'State', options: yesNoOptions },
    ],
    listFn: (params) => adminMaintenanceService.listSlaPolicies(params),
    getRowKey: (s) => s.id,
    columns: [
      {
        key: 'property',
        header: 'Property',
        render: (s) => <Cell primary={s.propertyTitle} secondary={`${s.city}, ${s.state}`} />,
      },
      {
        key: 'priority',
        header: 'Priority',
        render: (s) => <Pill label={titleCase(s.priority)} variant={priorityVariant(s.priority)} />,
      },
      {
        key: 'targets',
        header: 'Targets',
        render: (s) => (
          <Cell
            primary={`Respond ${s.responseTargetMinutes}m`}
            secondary={`Resolve ${s.resolutionTargetMinutes}m · Escalate ${s.escalationTargetMinutes}m`}
          />
        ),
      },
      {
        key: 'emergency',
        header: 'Emergency routing',
        render: (s) => (
          <Pill
            label={s.emergencyRoutingEnabled ? 'On' : 'Off'}
            variant={s.emergencyRoutingEnabled ? 'success' : 'neutral'}
          />
        ),
      },
      {
        key: 'active',
        header: 'State',
        render: (s) => (
          <Pill
            label={s.isActive ? 'Active' : 'Inactive'}
            variant={s.isActive ? 'success' : 'neutral'}
          />
        ),
      },
      {
        key: 'updated',
        header: 'Updated',
        render: (s) => <span className="text-muted-foreground">{date(s.updatedAt)}</span>,
      },
    ],
  };
  return <MaintenanceQueuePage config={config} />;
}

export function PreventivePlansQueue() {
  const config: MaintenanceQueueConfig<AdminPreventivePlan> = {
    resource: 'preventive-plans',
    eyebrow: 'Preventive Plans',
    title: 'Preventive maintenance plans',
    description: 'Scheduled maintenance across assets and units, with due detection.',
    icon: CalendarClock,
    filters: [
      { key: 'status', label: 'Status', options: planStatusOptions },
      { key: 'category', label: 'Category', options: categoryOptions },
      { key: 'due', label: 'Due', options: [{ value: 'true', label: 'Due now' }] },
    ],
    listFn: (params) => adminMaintenanceService.listPreventivePlans(params),
    getRowKey: (p) => p.id,
    columns: [
      {
        key: 'property',
        header: 'Property',
        render: (p) => (
          <Cell primary={p.propertyTitle} secondary={p.unitName ?? `${p.city}, ${p.state}`} />
        ),
      },
      {
        key: 'plan',
        header: 'Plan',
        render: (p) => (
          <Cell primary={p.title} secondary={p.assetName ?? categoryLabel(p.category)} />
        ),
      },
      {
        key: 'frequency',
        header: 'Frequency',
        render: (p) => <span className="text-muted-foreground">Every {p.frequencyDays} days</span>,
      },
      {
        key: 'nextDue',
        header: 'Next due',
        render: (p) => (
          <Cell
            primary={date(p.nextDueAt)}
            secondary={p.lastCompletedAt ? `Last ${date(p.lastCompletedAt)}` : undefined}
          />
        ),
      },
      {
        key: 'vendor',
        header: 'Vendor',
        render: (p) => <span className="text-muted-foreground">{p.vendorName ?? '—'}</span>,
      },
      {
        key: 'status',
        header: 'Status',
        render: (p) => (
          <div className="flex flex-wrap gap-1">
            <Pill label={titleCase(p.status)} variant={planStatusVariant(p.status)} />
            {p.isDue && <Pill label="Due now" variant="danger" />}
          </div>
        ),
      },
    ],
  };
  return <MaintenanceQueuePage config={config} />;
}

export function VendorsQueue() {
  const config: MaintenanceQueueConfig<AdminVendor> = {
    resource: 'vendors',
    eyebrow: 'Vendors',
    title: 'Vendor directory',
    description: 'Service providers across landlord workspaces, ranked by jobs completed.',
    icon: Hammer,
    listFn: (params) => adminMaintenanceService.listVendors(params),
    getRowKey: (v) => v.id,
    columns: [
      {
        key: 'vendor',
        header: 'Vendor',
        render: (v) => <Cell primary={v.name} secondary={titleCase(v.serviceType)} />,
      },
      {
        key: 'landlord',
        header: 'Landlord',
        render: (v) => <Cell primary={v.landlordName} secondary={v.landlordEmail ?? ''} />,
      },
      {
        key: 'contact',
        header: 'Contact',
        render: (v) => <span className="text-muted-foreground">{v.phone}</span>,
      },
      {
        key: 'rating',
        header: 'Rating',
        render: (v) => (
          <span className="font-medium text-foreground">{v.rating.toFixed(1)} / 5</span>
        ),
      },
      {
        key: 'jobs',
        header: 'Jobs completed',
        render: (v) => <span className="text-muted-foreground">{v.jobsCompleted}</span>,
      },
      {
        key: 'engagement',
        header: 'Engagement',
        render: (v) => (
          <Cell
            primary={`${v.workOrderCount} work orders`}
            secondary={`${v.quoteCount} quotes · ${v.invoiceCount} invoices`}
          />
        ),
      },
    ],
  };
  return <MaintenanceQueuePage config={config} />;
}

export function QuotesQueue() {
  const config: MaintenanceQueueConfig<AdminVendorQuote> = {
    resource: 'quotes',
    eyebrow: 'Vendor Quotes',
    title: 'Work-order quotes',
    description: 'Platform-wide vendor quotes on maintenance work orders.',
    icon: Scroll,
    filters: [{ key: 'status', label: 'Status', options: quoteStatusOptions }],
    listFn: (params) => adminMaintenanceService.listVendorQuotes(params),
    getRowKey: (q) => q.id,
    columns: [
      {
        key: 'workOrder',
        header: 'Work order',
        render: (q) => (
          <Cell primary={q.issueTitle} secondary={`${q.propertyTitle} · ${q.unitName}`} />
        ),
      },
      {
        key: 'vendor',
        header: 'Vendor',
        render: (q) => <span className="text-muted-foreground">{q.vendorName ?? '—'}</span>,
      },
      {
        key: 'amount',
        header: 'Amount',
        render: (q) => <p className="font-medium text-foreground">{naira(q.amount)}</p>,
      },
      {
        key: 'scope',
        header: 'Scope',
        render: (q) => <span className="text-muted-foreground">{q.scopeOfWork}</span>,
      },
      {
        key: 'status',
        header: 'Status',
        render: (q) => <Pill label={titleCase(q.status)} variant={quoteStatusVariant(q.status)} />,
      },
      {
        key: 'submitted',
        header: 'Submitted',
        render: (q) => <Cell primary={date(q.submittedAt)} secondary={q.submittedByName} />,
      },
    ],
  };
  return <MaintenanceQueuePage config={config} />;
}

export function InvoicesQueue() {
  const config: MaintenanceQueueConfig<AdminVendorInvoice> = {
    resource: 'invoices',
    eyebrow: 'Vendor Invoices',
    title: 'Vendor invoice register',
    description: 'Platform-wide vendor invoices across the finance-ready lifecycle.',
    icon: Receipt,
    filters: [{ key: 'status', label: 'Status', options: invoiceStatusOptions }],
    listFn: (params) => adminMaintenanceService.listVendorInvoices(params),
    getRowKey: (inv) => inv.id,
    columns: [
      {
        key: 'workOrder',
        header: 'Work order',
        render: (inv) => (
          <Cell primary={inv.issueTitle} secondary={`${inv.propertyTitle} · ${inv.unitName}`} />
        ),
      },
      {
        key: 'vendor',
        header: 'Vendor',
        render: (inv) => <span className="text-muted-foreground">{inv.vendorName}</span>,
      },
      {
        key: 'reference',
        header: 'Invoice',
        render: (inv) => <span className="text-muted-foreground">{inv.invoiceNumber ?? '—'}</span>,
      },
      {
        key: 'amount',
        header: 'Amount',
        render: (inv) => <p className="font-medium text-foreground">{naira(inv.totalAmount)}</p>,
      },
      {
        key: 'status',
        header: 'Status',
        render: (inv) => (
          <Pill label={titleCase(inv.status)} variant={invoiceStatusVariant(inv.status)} />
        ),
      },
      {
        key: 'approval',
        header: 'Approved',
        render: (inv) => (
          <Cell
            primary={inv.approvedAt ? date(inv.approvedAt) : '—'}
            secondary={inv.approvedByName ?? ''}
          />
        ),
      },
    ],
  };
  return <MaintenanceQueuePage config={config} />;
}
