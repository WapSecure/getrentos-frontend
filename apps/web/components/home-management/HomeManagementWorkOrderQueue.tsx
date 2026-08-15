'use client';

import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BadgeDollarSign,
  CalendarClock,
  CircleAlert,
  ClipboardCheck,
  ClipboardPlus,
  Clock3,
  UserRound,
  Wrench,
} from 'lucide-react';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/Dialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { DatePicker } from '@/components/ui/DatePicker';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Textarea } from '@/components/ui/Textarea';
import { Toast, type ToastVariant } from '@/components/ui/Toast';
import { HomeManagementWorkOrderInvoices } from '@/components/home-management/HomeManagementWorkOrderInvoices';
import { HomeManagementWorkOrderQuotes } from '@/components/home-management/HomeManagementWorkOrderQuotes';
import { unwrap } from '@/lib/apiHelpers';
import { getStoredUser } from '@/lib/authStorage';
import { formatCurrency, formatDate } from '@/lib/format';
import { homeManagementKeys } from '@/lib/queryKeys';
import {
  homeManagementService,
  type CreateHomeManagementUnitInput,
  type CreateHomeManagementWorkOrderInput,
  type HomeAsset,
  type HomeManagementMaintenanceCategory,
  type HomeManagementProperty,
  type HomeManagementVendor,
  type HomeManagementWorkOrder,
} from '@/services/homeManagementService';

const statusMeta: Record<
  HomeManagementWorkOrder['status'],
  { label: string; variant: BadgeVariant }
> = {
  SUBMITTED: { label: 'Submitted', variant: 'info' },
  ASSIGNED: { label: 'Assigned', variant: 'warning' },
  IN_PROGRESS: { label: 'In progress', variant: 'info' },
  RESOLVED: { label: 'Resolved', variant: 'success' },
  CANCELLED: { label: 'Cancelled', variant: 'neutral' },
};

const priorityMeta: Record<
  HomeManagementWorkOrder['priority'],
  { label: string; variant: BadgeVariant }
> = {
  LOW: { label: 'Low', variant: 'neutral' },
  MEDIUM: { label: 'Medium', variant: 'info' },
  HIGH: { label: 'High', variant: 'warning' },
  URGENT: { label: 'Urgent', variant: 'danger' },
};

const categoryOptions: Array<{ value: HomeManagementMaintenanceCategory; label: string }> = [
  { value: 'PLUMBING', label: 'Plumbing' },
  { value: 'ELECTRICAL', label: 'Electrical' },
  { value: 'INTERNET', label: 'Internet' },
  { value: 'SECURITY', label: 'Security' },
  { value: 'APPLIANCES', label: 'Appliances' },
  { value: 'OTHER', label: 'Other' },
];

const priorityOptions: Array<{ value: HomeManagementWorkOrder['priority']; label: string }> = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
];

type WorkOrderForm = {
  propertyId: string;
  unitId: string;
  assetId: string;
  issueTitle: string;
  category: HomeManagementMaintenanceCategory;
  description: string;
  priority: HomeManagementWorkOrder['priority'];
  isEmergency: boolean;
  dueAt: string;
  estimatedCost: string;
  approvalRequired: boolean;
  assignedVendorId: string;
};

type UnitForm = {
  unitName: string;
  bedrooms: string;
  bathrooms: string;
  monthlyRent: string;
};

type WorkOrderLifecycleDialog = {
  action: 'resolve' | 'cancel';
  workOrder: HomeManagementWorkOrder;
};

type WorkOrderIdInput = {
  id: string;
};

type AssignVendorInput = WorkOrderIdInput & {
  assignedVendorId: string;
};

type ResolveWorkOrderInput = WorkOrderIdInput & {
  resolutionNote?: string;
};

type CancelWorkOrderInput = WorkOrderIdInput & {
  reason?: string;
};

const initialWorkOrderForm: WorkOrderForm = {
  propertyId: '',
  unitId: '',
  assetId: '',
  issueTitle: '',
  category: 'OTHER',
  description: '',
  priority: 'MEDIUM',
  isEmergency: false,
  dueAt: '',
  estimatedCost: '',
  approvalRequired: false,
  assignedVendorId: '',
};

const initialUnitForm: UnitForm = {
  unitName: '',
  bedrooms: '',
  bathrooms: '',
  monthlyRent: '',
};

const propertyLabel = (property: HomeManagementProperty) =>
  property.title ?? property.name ?? 'Unnamed property';

const isOpen = (workOrder: HomeManagementWorkOrder) =>
  !['RESOLVED', 'CANCELLED'].includes(workOrder.status);

const isApprovalPending = (workOrder: HomeManagementWorkOrder) =>
  isOpen(workOrder) && workOrder.approvalRequired;

const canAssignVendor = (workOrder: HomeManagementWorkOrder) =>
  ['SUBMITTED', 'ASSIGNED'].includes(workOrder.status);

const canStartWorkOrder = (workOrder: HomeManagementWorkOrder) =>
  workOrder.status === 'ASSIGNED' && !isApprovalPending(workOrder);

const canResolveWorkOrder = (workOrder: HomeManagementWorkOrder) =>
  isOpen(workOrder) && !isApprovalPending(workOrder);

const isOverdue = (workOrder: HomeManagementWorkOrder) =>
  Boolean(workOrder.dueAt) &&
  isOpen(workOrder) &&
  new Date(workOrder.dueAt!).getTime() < Date.now();

const isSlaTargetBreached = (target?: string | null) => {
  if (!target) return false;
  const timestamp = new Date(target).getTime();
  return !Number.isNaN(timestamp) && timestamp < Date.now();
};

const hasSlaBreach = (workOrder: HomeManagementWorkOrder) =>
  isOpen(workOrder) &&
  [workOrder.responseDueAt, workOrder.resolutionDueAt, workOrder.escalationDueAt].some(
    isSlaTargetBreached
  );

const isOptionalWholeNumber = (value: string) =>
  value.trim() === '' || (Number.isInteger(Number(value)) && Number(value) >= 0);

const toOptionalWholeNumber = (value: string) => (value.trim() === '' ? undefined : Number(value));

interface HomeManagementWorkOrderQueueProps {
  role: 'owner' | 'landlord';
  workOrders: HomeManagementWorkOrder[];
  properties: HomeManagementProperty[];
  assets: HomeAsset[];
  vendors?: HomeManagementVendor[];
  isLoading?: boolean;
  isPropertiesLoading?: boolean;
  error?: Error | null;
}

export function HomeManagementWorkOrderQueue({
  role,
  workOrders,
  properties,
  assets,
  vendors = [],
  isLoading = false,
  isPropertiesLoading = false,
  error,
}: HomeManagementWorkOrderQueueProps) {
  const queryClient = useQueryClient();
  const [costs, setCosts] = useState<Record<string, string>>({});
  const [vendorSelections, setVendorSelections] = useState<Record<string, string>>({});
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreateUnitOpen, setIsCreateUnitOpen] = useState(false);
  const [form, setForm] = useState<WorkOrderForm>(initialWorkOrderForm);
  const [unitForm, setUnitForm] = useState<UnitForm>(initialUnitForm);
  const [lifecycleDialog, setLifecycleDialog] = useState<WorkOrderLifecycleDialog | null>(null);
  const [lifecycleNote, setLifecycleNote] = useState('');
  const [currentUserId] = useState<string | null | undefined>(
    () => getStoredUser<{ id?: string }>()?.id ?? null
  );
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const unitsQuery = useQuery({
    enabled: isCreateOpen && Boolean(form.propertyId),
    queryKey: homeManagementKeys.units(form.propertyId),
    queryFn: () => unwrap(homeManagementService.listUnits(form.propertyId)),
  });

  const units = unitsQuery.data ?? [];
  const selectedProperty = properties.find((property) => property.id === form.propertyId);
  const availableAssets = useMemo(
    () =>
      assets.filter(
        (asset) =>
          asset.propertyId === form.propertyId &&
          asset.status !== 'RETIRED' &&
          (!asset.unitId || asset.unitId === form.unitId)
      ),
    [assets, form.propertyId, form.unitId]
  );
  const estimatedCost = Number(form.estimatedCost);
  const hasValidEstimatedCost =
    form.estimatedCost.trim() === '' || (Number.isInteger(estimatedCost) && estimatedCost >= 0);
  const canCreate =
    Boolean(form.propertyId) &&
    Boolean(form.unitId) &&
    Boolean(form.issueTitle.trim()) &&
    Boolean(form.description.trim()) &&
    hasValidEstimatedCost;
  const hasValidUnitDetails =
    isOptionalWholeNumber(unitForm.bedrooms) &&
    isOptionalWholeNumber(unitForm.bathrooms) &&
    isOptionalWholeNumber(unitForm.monthlyRent);
  const canCreateUnit =
    Boolean(form.propertyId) && Boolean(unitForm.unitName.trim()) && hasValidUnitDetails;

  const invalidateWorkOrderViews = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: homeManagementKeys.workOrders }),
      queryClient.invalidateQueries({ queryKey: homeManagementKeys.dashboard }),
      queryClient.invalidateQueries({ queryKey: ['home-management', 'timeline'] }),
    ]);
  };

  const approve = useMutation<HomeManagementWorkOrder, Error, { id: string; approvedCost: number }>(
    {
      mutationFn: ({ id, approvedCost }: { id: string; approvedCost: number }) =>
        unwrap(homeManagementService.approveWorkOrder(id, approvedCost)),
      onSuccess: async () => {
        await invalidateWorkOrderViews();
        setToast({ message: 'Work order budget approved and recorded.', variant: 'success' });
      },
      onError: (mutationError: Error) => {
        setToast({
          message: mutationError.message || 'Unable to approve this work order.',
          variant: 'error',
        });
      },
    }
  );

  const createWorkOrder = useMutation({
    mutationFn: (input: CreateHomeManagementWorkOrderInput) =>
      unwrap(homeManagementService.createWorkOrder(input)),
    onSuccess: async () => {
      await invalidateWorkOrderViews();
      setForm(initialWorkOrderForm);
      setIsCreateOpen(false);
      setToast({
        message: 'Work order created and added to your operational queue.',
        variant: 'success',
      });
    },
    onError: (mutationError: Error) => {
      setToast({
        message: mutationError.message || 'Unable to create this work order.',
        variant: 'error',
      });
    },
  });

  const createUnit = useMutation({
    mutationFn: (input: CreateHomeManagementUnitInput) =>
      unwrap(homeManagementService.createUnit(input)),
    onSuccess: async (unit, input) => {
      await queryClient.invalidateQueries({
        queryKey: homeManagementKeys.units(input.propertyId),
      });
      setForm((current) =>
        current.propertyId === input.propertyId ? { ...current, unitId: unit.id } : current
      );
      setUnitForm(initialUnitForm);
      setIsCreateUnitOpen(false);
      setToast({
        message: `${unit.unitName} was added and selected for this work order.`,
        variant: 'success',
      });
    },
    onError: (mutationError: Error) => {
      setToast({
        message: mutationError.message || 'Unable to add this unit.',
        variant: 'error',
      });
    },
  });

  const assignVendor = useMutation<HomeManagementWorkOrder, Error, AssignVendorInput>({
    mutationFn: ({ id, assignedVendorId }) =>
      unwrap(homeManagementService.assignWorkOrderVendor(id, { assignedVendorId })),
    onSuccess: async () => {
      await invalidateWorkOrderViews();
      setToast({ message: 'Vendor assignment was updated.', variant: 'success' });
    },
    onError: (mutationError) => {
      setToast({
        message: mutationError.message || 'Unable to update the vendor assignment.',
        variant: 'error',
      });
    },
  });

  const startWorkOrder = useMutation<HomeManagementWorkOrder, Error, WorkOrderIdInput>({
    mutationFn: ({ id }) => unwrap(homeManagementService.startWorkOrder(id)),
    onSuccess: async () => {
      await invalidateWorkOrderViews();
      setToast({ message: 'Work order moved into progress.', variant: 'success' });
    },
    onError: (mutationError) => {
      setToast({
        message: mutationError.message || 'Unable to start this work order.',
        variant: 'error',
      });
    },
  });

  const resolveWorkOrder = useMutation<HomeManagementWorkOrder, Error, ResolveWorkOrderInput>({
    mutationFn: ({ id, resolutionNote }) =>
      unwrap(homeManagementService.resolveWorkOrder(id, { resolutionNote })),
    onSuccess: async () => {
      await invalidateWorkOrderViews();
      setLifecycleDialog(null);
      setLifecycleNote('');
      setToast({
        message: 'Work order resolved and recorded in service history.',
        variant: 'success',
      });
    },
    onError: (mutationError) => {
      setToast({
        message: mutationError.message || 'Unable to resolve this work order.',
        variant: 'error',
      });
    },
  });

  const cancelWorkOrder = useMutation<HomeManagementWorkOrder, Error, CancelWorkOrderInput>({
    mutationFn: ({ id, reason }) => unwrap(homeManagementService.cancelWorkOrder(id, { reason })),
    onSuccess: async () => {
      await invalidateWorkOrderViews();
      setLifecycleDialog(null);
      setLifecycleNote('');
      setToast({
        message: 'Work order cancelled and recorded in service history.',
        variant: 'success',
      });
    },
    onError: (mutationError) => {
      setToast({
        message: mutationError.message || 'Unable to cancel this work order.',
        variant: 'error',
      });
    },
  });

  const isLifecycleActionPending =
    assignVendor.isPending ||
    startWorkOrder.isPending ||
    resolveWorkOrder.isPending ||
    cancelWorkOrder.isPending;
  const isLifecycleDialogPending =
    lifecycleDialog?.action === 'resolve'
      ? resolveWorkOrder.isPending
      : lifecycleDialog?.action === 'cancel'
        ? cancelWorkOrder.isPending
        : false;

  const openCreateDialog = () => {
    setForm(initialWorkOrderForm);
    setUnitForm(initialUnitForm);
    setIsCreateUnitOpen(false);
    setIsCreateOpen(true);
  };

  const closeCreateDialog = () => {
    if (!createWorkOrder.isPending && !createUnit.isPending) {
      setIsCreateOpen(false);
    }
  };

  const closeCreateUnitDialog = () => {
    if (!createUnit.isPending) {
      setIsCreateUnitOpen(false);
    }
  };

  const openLifecycleDialog = (
    action: WorkOrderLifecycleDialog['action'],
    workOrder: HomeManagementWorkOrder
  ) => {
    if (isLifecycleActionPending) return;
    setLifecycleNote('');
    setLifecycleDialog({ action, workOrder });
  };

  const closeLifecycleDialog = () => {
    if (!isLifecycleDialogPending) {
      setLifecycleDialog(null);
      setLifecycleNote('');
    }
  };

  const submitWorkOrder = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canCreate) return;

    createWorkOrder.mutate({
      propertyId: form.propertyId,
      unitId: form.unitId,
      assetId: form.assetId || undefined,
      issueTitle: form.issueTitle.trim(),
      category: form.category,
      description: form.description.trim(),
      priority: form.priority,
      isEmergency: form.isEmergency,
      dueAt: form.dueAt || undefined,
      estimatedCost: form.estimatedCost.trim() === '' ? undefined : estimatedCost,
      approvalRequired: form.approvalRequired,
      assignedVendorId:
        role === 'landlord' && form.assignedVendorId ? form.assignedVendorId : undefined,
    });
  };

  const submitUnit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canCreateUnit) return;

    createUnit.mutate({
      propertyId: form.propertyId,
      unitName: unitForm.unitName.trim(),
      bedrooms: toOptionalWholeNumber(unitForm.bedrooms),
      bathrooms: toOptionalWholeNumber(unitForm.bathrooms),
      monthlyRent: toOptionalWholeNumber(unitForm.monthlyRent),
    });
  };

  const submitLifecycleAction = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!lifecycleDialog || isLifecycleDialogPending) return;

    const note = lifecycleNote.trim() || undefined;
    if (lifecycleDialog.action === 'resolve') {
      resolveWorkOrder.mutate({ id: lifecycleDialog.workOrder.id, resolutionNote: note });
      return;
    }

    cancelWorkOrder.mutate({ id: lifecycleDialog.workOrder.id, reason: note });
  };

  const pendingApprovals = workOrders.filter(isApprovalPending);
  const activeWorkOrders = workOrders.filter(isOpen);
  const overdueWorkOrders = workOrders.filter(isOverdue);
  const isResolvingLifecycleWorkOrder = lifecycleDialog?.action === 'resolve';
  const lifecycleActionLabel = isResolvingLifecycleWorkOrder
    ? 'Resolve work order'
    : 'Cancel work order';
  const lifecycleNoteLabel = isResolvingLifecycleWorkOrder
    ? 'Resolution note'
    : 'Cancellation reason';

  return (
    <section aria-labelledby="work-order-queue-heading" className="mt-10">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Work order control</p>
          <h2
            id="work-order-queue-heading"
            className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-foreground"
          >
            Keep spend and service delivery under control.
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Review operational work, approve planned spend, and spot care requests that are at risk
            of missing their due date.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            icon={<ClipboardPlus className="h-4 w-4" />}
            rounded="md"
            disabled={isPropertiesLoading || properties.length === 0}
            title={
              isPropertiesLoading
                ? 'Loading your property portfolio'
                : properties.length === 0
                  ? 'Add a property and unit before creating a work order'
                  : undefined
            }
            onClick={openCreateDialog}
          >
            Create work order
          </Button>
          <QueueStat
            icon={<BadgeDollarSign className="h-4 w-4" />}
            label="Needs approval"
            value={pendingApprovals.length}
            urgent={pendingApprovals.length > 0}
          />
          <QueueStat
            icon={<Clock3 className="h-4 w-4" />}
            label="Open"
            value={activeWorkOrders.length}
          />
          <QueueStat
            icon={<CircleAlert className="h-4 w-4" />}
            label="Overdue"
            value={overdueWorkOrders.length}
            urgent={overdueWorkOrders.length > 0}
          />
        </div>
      </div>

      <div className="mt-5">
        {isLoading ? (
          <WorkOrderLoadingState />
        ) : error ? (
          <EmptyState
            icon={CircleAlert}
            title="Work orders could not be loaded"
            description="Refresh the page to try again."
          />
        ) : workOrders.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="No work orders yet"
            description="Maintenance requests and scheduled work will appear here with their approval and due-date status."
            action={
              properties.length > 0 ? (
                <Button size="sm" rounded="md" onClick={openCreateDialog}>
                  Create the first work order
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="divide-y divide-border">
              {workOrders.map((workOrder) => {
                const status = statusMeta[workOrder.status];
                const priority = priorityMeta[workOrder.priority];
                const currentCost =
                  costs[workOrder.id] ??
                  (workOrder.approvalRequired ? String(workOrder.estimatedCost ?? '') : '');
                const approvedCost = Number(currentCost);
                const canApprove =
                  isApprovalPending(workOrder) &&
                  currentCost.trim() !== '' &&
                  Number.isInteger(approvedCost) &&
                  approvedCost >= 0;
                const approvalPending = isApprovalPending(workOrder);
                const currentVendorId = workOrder.assignedVendor?.id ?? '';
                const selectedVendorId = vendorSelections[workOrder.id] ?? currentVendorId;
                const vendorAssignmentAvailable = role === 'landlord' && canAssignVendor(workOrder);
                const vendorOptions = [
                  ...(currentVendorId && !vendors.some((vendor) => vendor.id === currentVendorId)
                    ? [
                        {
                          value: currentVendorId,
                          label: `${workOrder.assignedVendor?.name ?? 'Current vendor'} (unavailable)`,
                          disabled: true,
                        },
                      ]
                    : []),
                  ...vendors.map((vendor) => ({
                    value: vendor.id,
                    label: vendor.serviceType
                      ? `${vendor.name} · ${vendor.serviceType}`
                      : vendor.name,
                  })),
                ];
                const canSubmitVendorAssignment =
                  Boolean(selectedVendorId) && selectedVendorId !== currentVendorId;
                const canStart = canStartWorkOrder(workOrder);
                const canResolve = canResolveWorkOrder(workOrder);
                const slaBreached = hasSlaBreach(workOrder);
                const createdByCurrentUser = Boolean(
                  currentUserId && workOrder.createdById && currentUserId === workOrder.createdById
                );
                const approvalAuthorityCheckPending =
                  Boolean(workOrder.createdById) && currentUserId === undefined;
                const isThisWorkOrderMutationPending =
                  (approve.isPending && approve.variables?.id === workOrder.id) ||
                  (assignVendor.isPending && assignVendor.variables?.id === workOrder.id) ||
                  (startWorkOrder.isPending && startWorkOrder.variables?.id === workOrder.id) ||
                  (resolveWorkOrder.isPending && resolveWorkOrder.variables?.id === workOrder.id) ||
                  (cancelWorkOrder.isPending && cancelWorkOrder.variables?.id === workOrder.id);
                const showControlPanel =
                  isOpen(workOrder) ||
                  approvalPending ||
                  (!approvalPending &&
                    workOrder.approvedCost !== null &&
                    workOrder.approvedCost !== undefined);

                return (
                  <article key={workOrder.id} className="p-5">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-foreground">{workOrder.issueTitle}</h3>
                          <Badge variant={status.variant}>{status.label}</Badge>
                          <Badge variant={priority.variant}>{priority.label}</Badge>
                          {workOrder.isEmergency && <Badge variant="danger">Emergency</Badge>}
                          {slaBreached && <Badge variant="danger">SLA breached</Badge>}
                          {workOrder.acknowledgedAt && (
                            <Badge variant="success">Acknowledged</Badge>
                          )}
                          {isOverdue(workOrder) && <Badge variant="danger">Overdue</Badge>}
                        </div>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                          {workOrder.description}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5">
                            <Wrench className="h-3.5 w-3.5" />
                            {workOrder.category.replace(/_/g, ' ')}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <ClipboardCheck className="h-3.5 w-3.5" />
                            {workOrder.unit.property?.title ?? 'Property'}
                            {workOrder.unit.unitName ? ` · ${workOrder.unit.unitName}` : ''}
                          </span>
                          {workOrder.asset?.name && (
                            <span className="inline-flex items-center gap-1.5">
                              <Wrench className="h-3.5 w-3.5" />
                              {workOrder.asset.name}
                            </span>
                          )}
                          {workOrder.tenant?.legalName && (
                            <span className="inline-flex items-center gap-1.5">
                              <UserRound className="h-3.5 w-3.5" />
                              {workOrder.tenant.legalName}
                            </span>
                          )}
                          {workOrder.assignedVendor?.name && (
                            <span className="inline-flex items-center gap-1.5">
                              <UserRound className="h-3.5 w-3.5" />
                              {workOrder.assignedVendor.name}
                            </span>
                          )}
                          {workOrder.dueAt && (
                            <span
                              className={
                                isOverdue(workOrder)
                                  ? 'inline-flex items-center gap-1.5 font-medium text-destructive'
                                  : 'inline-flex items-center gap-1.5'
                              }
                            >
                              <CalendarClock className="h-3.5 w-3.5" />
                              Due {formatDate(workOrder.dueAt)}
                            </span>
                          )}
                          {workOrder.responseDueAt && !workOrder.acknowledgedAt && (
                            <span
                              className={
                                isSlaTargetBreached(workOrder.responseDueAt)
                                  ? 'inline-flex items-center gap-1.5 font-medium text-destructive'
                                  : 'inline-flex items-center gap-1.5'
                              }
                            >
                              <Clock3 className="h-3.5 w-3.5" />
                              Response target {formatDate(workOrder.responseDueAt)}
                            </span>
                          )}
                          {workOrder.resolutionDueAt && (
                            <span
                              className={
                                isSlaTargetBreached(workOrder.resolutionDueAt)
                                  ? 'inline-flex items-center gap-1.5 font-medium text-destructive'
                                  : 'inline-flex items-center gap-1.5'
                              }
                            >
                              <Clock3 className="h-3.5 w-3.5" />
                              Resolution target {formatDate(workOrder.resolutionDueAt)}
                            </span>
                          )}
                        </div>
                      </div>

                      {showControlPanel && (
                        <div className="flex w-full flex-col gap-3 xl:w-80 xl:shrink-0">
                          {approvalPending ? (
                            <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
                              <p className="text-sm font-semibold text-foreground">
                                Approve planned spend
                              </p>
                              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                {workOrder.estimatedCost !== null &&
                                workOrder.estimatedCost !== undefined
                                  ? `Estimated cost: ${formatCurrency(workOrder.estimatedCost)}`
                                  : 'Set the budget that this work is approved to spend.'}
                              </p>
                              {approvalAuthorityCheckPending ? (
                                <p className="mt-3 rounded-xl bg-card px-3 py-2 text-xs leading-5 text-muted-foreground">
                                  Checking whether you can approve this work order…
                                </p>
                              ) : createdByCurrentUser ? (
                                <p className="mt-3 rounded-xl bg-card px-3 py-2 text-xs leading-5 text-muted-foreground">
                                  A different authorised operator must approve work that you
                                  created.
                                </p>
                              ) : (
                                <div className="mt-3 flex items-center gap-2">
                                  <Input
                                    aria-label={`Approved cost for ${workOrder.issueTitle}`}
                                    type="number"
                                    min={0}
                                    inputMode="numeric"
                                    value={currentCost}
                                    disabled={isThisWorkOrderMutationPending}
                                    onChange={(event) =>
                                      setCosts((current) => ({
                                        ...current,
                                        [workOrder.id]: event.target.value,
                                      }))
                                    }
                                    leadingIcon={<span className="text-sm">₦</span>}
                                  />
                                  <Button
                                    size="sm"
                                    rounded="md"
                                    isLoading={
                                      approve.isPending && approve.variables?.id === workOrder.id
                                    }
                                    disabled={!canApprove || isThisWorkOrderMutationPending}
                                    onClick={() =>
                                      approve.mutate({ id: workOrder.id, approvedCost })
                                    }
                                  >
                                    Approve
                                  </Button>
                                </div>
                              )}
                            </div>
                          ) : workOrder.approvedCost !== null &&
                            workOrder.approvedCost !== undefined ? (
                            <div className="rounded-xl bg-secondary/70 px-4 py-3 text-right">
                              <p className="text-xs text-muted-foreground">Approved spend</p>
                              <p className="mt-1 font-semibold text-foreground">
                                {formatCurrency(workOrder.approvedCost)}
                              </p>
                            </div>
                          ) : null}

                          {vendorAssignmentAvailable && (
                            <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                              <p className="text-sm font-semibold text-foreground">
                                {currentVendorId ? 'Reassign vendor' : 'Assign vendor'}
                              </p>
                              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                Assign a vendor in your operational directory to own this work.
                              </p>
                              {vendors.length > 0 ? (
                                <div className="mt-3 space-y-2">
                                  <Select
                                    ariaLabel={`Vendor for ${workOrder.issueTitle}`}
                                    value={selectedVendorId}
                                    disabled={isThisWorkOrderMutationPending}
                                    placeholder="Select a vendor"
                                    onValueChange={(assignedVendorId) =>
                                      setVendorSelections((current) => ({
                                        ...current,
                                        [workOrder.id]: assignedVendorId,
                                      }))
                                    }
                                    options={vendorOptions}
                                  />
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    rounded="md"
                                    fullWidth
                                    isLoading={
                                      assignVendor.isPending &&
                                      assignVendor.variables?.id === workOrder.id
                                    }
                                    disabled={
                                      !canSubmitVendorAssignment || isThisWorkOrderMutationPending
                                    }
                                    onClick={() =>
                                      assignVendor.mutate({
                                        id: workOrder.id,
                                        assignedVendorId: selectedVendorId,
                                      })
                                    }
                                  >
                                    {currentVendorId ? 'Update vendor' : 'Assign vendor'}
                                  </Button>
                                </div>
                              ) : (
                                <p className="mt-3 rounded-xl bg-card px-3 py-2 text-xs leading-5 text-muted-foreground">
                                  Add a vendor in your vendor directory before assigning this work
                                  order.
                                </p>
                              )}
                            </div>
                          )}

                          {isOpen(workOrder) && (
                            <div className="rounded-2xl border border-border bg-card p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-foreground">
                                    Service delivery
                                  </p>
                                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                    Move the job through its operational lifecycle with a complete
                                    audit trail.
                                  </p>
                                </div>
                                {approvalPending && (
                                  <Badge variant="warning">Approval pending</Badge>
                                )}
                              </div>

                              {approvalPending && (
                                <p className="mt-3 rounded-xl bg-amber-500/10 px-3 py-2 text-xs leading-5 text-amber-800 dark:text-amber-300">
                                  Budget approval is required before this work can start or be
                                  resolved.
                                </p>
                              )}
                              {!approvalPending && workOrder.status === 'SUBMITTED' && (
                                <p className="mt-3 rounded-xl bg-secondary/70 px-3 py-2 text-xs leading-5 text-muted-foreground">
                                  Assign a vendor before starting this work order. You can still
                                  resolve or cancel it when appropriate.
                                </p>
                              )}

                              <div className="mt-3 flex flex-wrap gap-2">
                                {canStart && (
                                  <Button
                                    size="sm"
                                    rounded="md"
                                    isLoading={
                                      startWorkOrder.isPending &&
                                      startWorkOrder.variables?.id === workOrder.id
                                    }
                                    disabled={isThisWorkOrderMutationPending}
                                    onClick={() => startWorkOrder.mutate({ id: workOrder.id })}
                                  >
                                    Start work
                                  </Button>
                                )}
                                {canResolve && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    rounded="md"
                                    disabled={isThisWorkOrderMutationPending}
                                    onClick={() => openLifecycleDialog('resolve', workOrder)}
                                  >
                                    Resolve
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  rounded="md"
                                  disabled={isThisWorkOrderMutationPending}
                                  onClick={() => openLifecycleDialog('cancel', workOrder)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 grid gap-4 2xl:grid-cols-2">
                      <HomeManagementWorkOrderQuotes
                        role={role}
                        workOrder={workOrder}
                        vendors={role === 'landlord' ? vendors : undefined}
                      />
                      <HomeManagementWorkOrderInvoices workOrder={workOrder} />
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <Dialog
        open={Boolean(lifecycleDialog)}
        onOpenChange={(open) => {
          if (!open) closeLifecycleDialog();
        }}
      >
        <DialogContent className="max-w-lg" showClose={!isLifecycleDialogPending}>
          {lifecycleDialog && (
            <form onSubmit={submitLifecycleAction} className="p-6">
              <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-foreground">
                {lifecycleActionLabel}
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm leading-6 text-muted-foreground">
                {isResolvingLifecycleWorkOrder
                  ? `Mark “${lifecycleDialog.workOrder.issueTitle}” as complete. This closes the work order and records the action in its audit trail.`
                  : `Cancel “${lifecycleDialog.workOrder.issueTitle}”. This cannot be reopened, and the reason will be recorded in its audit trail.`}
              </DialogDescription>

              <div className="mt-6">
                <Field
                  label={lifecycleNoteLabel}
                  htmlFor="home-management-work-order-lifecycle-note"
                  hint="Optional. This is retained in the immutable operational audit trail."
                >
                  <Textarea
                    id="home-management-work-order-lifecycle-note"
                    autoFocus
                    maxLength={2000}
                    value={lifecycleNote}
                    disabled={isLifecycleDialogPending}
                    onChange={(event) => setLifecycleNote(event.target.value)}
                    placeholder={
                      isResolvingLifecycleWorkOrder
                        ? 'e.g. Pump serviced, tested, and returned to normal operation.'
                        : 'e.g. The tenant resolved the issue before the vendor visit.'
                    }
                  />
                </Field>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  rounded="md"
                  disabled={isLifecycleDialogPending}
                  onClick={closeLifecycleDialog}
                >
                  Keep work order open
                </Button>
                <Button
                  type="submit"
                  variant={isResolvingLifecycleWorkOrder ? 'primary' : 'danger'}
                  rounded="md"
                  isLoading={isLifecycleDialogPending}
                >
                  {lifecycleActionLabel}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          if (open) setIsCreateOpen(true);
          else closeCreateDialog();
        }}
      >
        <DialogContent className="max-w-3xl">
          <form onSubmit={submitWorkOrder} className="p-6">
            <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-foreground">
              Create a work order
            </DialogTitle>
            <DialogDescription className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              Record operational work against a specific home and unit so service delivery, due
              dates, vendor activity, and spend remain auditable.
            </DialogDescription>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Property" required>
                <Select
                  ariaLabel="Work order property"
                  value={form.propertyId}
                  placeholder="Select a property"
                  onValueChange={(propertyId) => {
                    setForm((current) => ({
                      ...current,
                      propertyId,
                      unitId: '',
                      assetId: '',
                    }));
                    setUnitForm(initialUnitForm);
                    setIsCreateUnitOpen(false);
                  }}
                  options={properties.map((property) => ({
                    value: property.id,
                    label: propertyLabel(property),
                  }))}
                />
              </Field>

              <Field
                label="Unit"
                required
                hint={
                  !form.propertyId
                    ? 'Choose a property first.'
                    : unitsQuery.isLoading
                      ? 'Loading units…'
                      : unitsQuery.isError
                        ? 'Units could not be loaded. Choose the property again or retry.'
                        : units.length === 0
                          ? 'This property has no units available for operational work.'
                          : 'Work orders are always linked to a unit.'
                }
              >
                <div className="space-y-2">
                  <Select
                    ariaLabel="Work order unit"
                    value={form.unitId}
                    disabled={
                      !form.propertyId ||
                      unitsQuery.isLoading ||
                      unitsQuery.isError ||
                      units.length === 0
                    }
                    placeholder={
                      !form.propertyId
                        ? 'Choose a property first'
                        : unitsQuery.isLoading
                          ? 'Loading units'
                          : units.length === 0
                            ? 'No units available'
                            : 'Select a unit'
                    }
                    onValueChange={(unitId) => setForm((current) => ({ ...current, unitId }))}
                    options={units.map((unit) => ({ value: unit.id, label: unit.unitName }))}
                  />

                  {form.propertyId &&
                    !unitsQuery.isLoading &&
                    !unitsQuery.isError &&
                    units.length === 0 && (
                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-dashed border-primary/25 bg-primary/5 px-3 py-2.5">
                        <p className="text-xs leading-5 text-muted-foreground">
                          Add the first unit to continue with this work order.
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          rounded="md"
                          onClick={() => {
                            setUnitForm(initialUnitForm);
                            setIsCreateUnitOpen(true);
                          }}
                        >
                          Add a unit
                        </Button>
                      </div>
                    )}

                  {form.propertyId && unitsQuery.isError && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      rounded="md"
                      onClick={() => void unitsQuery.refetch()}
                    >
                      Retry loading units
                    </Button>
                  )}
                </div>
              </Field>

              <Field
                label="Linked asset"
                hint="Optional. Link equipment to preserve its complete service history."
              >
                <Select
                  ariaLabel="Work order linked asset"
                  value={form.assetId}
                  disabled={!form.propertyId}
                  placeholder={form.propertyId ? 'No linked asset' : 'Choose a property first'}
                  onValueChange={(assetId) => setForm((current) => ({ ...current, assetId }))}
                  options={[
                    { value: '', label: 'No linked asset' },
                    ...availableAssets.map((asset) => ({
                      value: asset.id,
                      label: asset.unit?.unitName
                        ? `${asset.name} · ${asset.unit.unitName}`
                        : asset.name,
                    })),
                  ]}
                />
              </Field>

              <Field label="Work title" htmlFor="home-work-order-title" required>
                <Input
                  id="home-work-order-title"
                  value={form.issueTitle}
                  maxLength={160}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, issueTitle: event.target.value }))
                  }
                  placeholder="e.g. Service the water pump"
                />
              </Field>

              <Field label="Category" required>
                <Select
                  ariaLabel="Work order category"
                  value={form.category}
                  onValueChange={(category) =>
                    setForm((current) => ({
                      ...current,
                      category: category as HomeManagementMaintenanceCategory,
                    }))
                  }
                  options={categoryOptions}
                />
              </Field>

              <Field
                label="Priority"
                required
                hint={
                  form.isEmergency ? 'Emergency work orders always use urgent priority.' : undefined
                }
              >
                <Select
                  ariaLabel="Work order priority"
                  value={form.priority}
                  disabled={form.isEmergency}
                  onValueChange={(priority) =>
                    setForm((current) => ({
                      ...current,
                      priority: priority as HomeManagementWorkOrder['priority'],
                    }))
                  }
                  options={priorityOptions}
                />
              </Field>

              <div className="sm:col-span-2 flex items-start justify-between gap-4 rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">Emergency work order</p>
                  <p className="mt-1 max-w-xl text-xs leading-5 text-muted-foreground">
                    Use only for an active safety, security, or habitability risk. This forces
                    urgent priority, applies the property&apos;s emergency SLA, and routes the work
                    into the escalation queue when emergency routing is enabled.
                  </p>
                </div>
                <Switch
                  id="home-work-order-emergency"
                  aria-label="Mark as an emergency work order"
                  checked={form.isEmergency}
                  onCheckedChange={(isEmergency) =>
                    setForm((current) => ({
                      ...current,
                      isEmergency,
                      priority: isEmergency ? 'URGENT' : current.priority,
                    }))
                  }
                />
              </div>

              <Field label="Due date" hint="Optional">
                <DatePicker
                  value={form.dueAt}
                  onChange={(value) => setForm((current) => ({ ...current, dueAt: value }))}
                />
              </Field>

              <Field
                className="sm:col-span-2"
                label="Work description"
                htmlFor="home-work-order-description"
                required
                hint="Describe the issue, desired outcome, access instructions, or operational constraints."
              >
                <Textarea
                  id="home-work-order-description"
                  value={form.description}
                  maxLength={2000}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, description: event.target.value }))
                  }
                  placeholder="Describe what needs to be done and any context the team or vendor needs before visiting."
                />
              </Field>

              <Field
                label="Estimated cost"
                htmlFor="home-work-order-estimated-cost"
                hint="Optional. Enter a whole amount in naira."
                error={!hasValidEstimatedCost ? 'Enter a whole amount of zero or more.' : undefined}
              >
                <Input
                  id="home-work-order-estimated-cost"
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={form.estimatedCost}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, estimatedCost: event.target.value }))
                  }
                  placeholder="e.g. 85000"
                  leadingIcon={<span className="text-sm">₦</span>}
                />
              </Field>

              {role === 'landlord' && (
                <Field
                  label="Assign vendor"
                  hint="Optional. The request can remain unassigned until the right provider is selected."
                >
                  <Select
                    ariaLabel="Assigned vendor"
                    value={form.assignedVendorId}
                    onValueChange={(assignedVendorId) =>
                      setForm((current) => ({ ...current, assignedVendorId }))
                    }
                    options={[
                      {
                        value: '',
                        label: vendors.length > 0 ? 'Assign later' : 'No active vendors',
                      },
                      ...vendors.map((vendor) => ({
                        value: vendor.id,
                        label: vendor.serviceType
                          ? `${vendor.name} · ${vendor.serviceType}`
                          : vendor.name,
                      })),
                    ]}
                  />
                </Field>
              )}

              <div className="sm:col-span-2 flex items-start justify-between gap-4 rounded-2xl border border-border bg-secondary/35 p-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">Require budget approval</p>
                  <p className="mt-1 max-w-xl text-xs leading-5 text-muted-foreground">
                    Keep this work in the approval queue before committing spend. A different
                    authorised operator will record the approved budget with an audit trail.
                  </p>
                </div>
                <Switch
                  id="home-work-order-approval-required"
                  aria-label="Require budget approval"
                  checked={form.approvalRequired}
                  onCheckedChange={(approvalRequired) =>
                    setForm((current) => ({ ...current, approvalRequired }))
                  }
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                rounded="md"
                disabled={createWorkOrder.isPending}
                onClick={closeCreateDialog}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                rounded="md"
                isLoading={createWorkOrder.isPending}
                disabled={!canCreate || unitsQuery.isLoading || unitsQuery.isError}
              >
                Create work order
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isCreateUnitOpen}
        onOpenChange={(open) => {
          if (open) setIsCreateUnitOpen(true);
          else closeCreateUnitDialog();
        }}
      >
        <DialogContent className="max-w-lg">
          <form onSubmit={submitUnit} className="p-6">
            <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-foreground">
              Add a unit
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm leading-6 text-muted-foreground">
              Add a unit to {selectedProperty ? propertyLabel(selectedProperty) : 'this property'}{' '}
              so this work order stays scoped to the right home. You can complete commercial details
              later.
            </DialogDescription>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field
                className="sm:col-span-2"
                label="Unit name"
                htmlFor="home-work-order-unit-name"
                required
              >
                <Input
                  id="home-work-order-unit-name"
                  autoFocus
                  maxLength={120}
                  value={unitForm.unitName}
                  onChange={(event) =>
                    setUnitForm((current) => ({ ...current, unitName: event.target.value }))
                  }
                  placeholder="e.g. Apartment 2B or Main house"
                />
              </Field>

              <Field
                label="Bedrooms"
                htmlFor="home-work-order-unit-bedrooms"
                hint="Optional"
                error={
                  !isOptionalWholeNumber(unitForm.bedrooms)
                    ? 'Enter a whole number of zero or more.'
                    : undefined
                }
              >
                <Input
                  id="home-work-order-unit-bedrooms"
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={unitForm.bedrooms}
                  onChange={(event) =>
                    setUnitForm((current) => ({ ...current, bedrooms: event.target.value }))
                  }
                />
              </Field>

              <Field
                label="Bathrooms"
                htmlFor="home-work-order-unit-bathrooms"
                hint="Optional"
                error={
                  !isOptionalWholeNumber(unitForm.bathrooms)
                    ? 'Enter a whole number of zero or more.'
                    : undefined
                }
              >
                <Input
                  id="home-work-order-unit-bathrooms"
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={unitForm.bathrooms}
                  onChange={(event) =>
                    setUnitForm((current) => ({ ...current, bathrooms: event.target.value }))
                  }
                />
              </Field>

              <Field
                className="sm:col-span-2"
                label="Monthly rent"
                htmlFor="home-work-order-unit-rent"
                hint="Optional. Leave empty if rent is managed elsewhere."
                error={
                  !isOptionalWholeNumber(unitForm.monthlyRent)
                    ? 'Enter a whole amount of zero or more.'
                    : undefined
                }
              >
                <Input
                  id="home-work-order-unit-rent"
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  leadingIcon={<span className="text-sm">₦</span>}
                  value={unitForm.monthlyRent}
                  onChange={(event) =>
                    setUnitForm((current) => ({ ...current, monthlyRent: event.target.value }))
                  }
                  placeholder="e.g. 350000"
                />
              </Field>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                rounded="md"
                disabled={createUnit.isPending}
                onClick={closeCreateUnitDialog}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                rounded="md"
                isLoading={createUnit.isPending}
                disabled={!canCreateUnit}
              >
                Add and select unit
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </section>
  );
}

function QueueStat({
  icon,
  label,
  value,
  urgent = false,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  urgent?: boolean;
}) {
  return (
    <div
      className={
        urgent
          ? 'flex items-center gap-2 rounded-full border border-destructive/20 bg-destructive/5 px-3 py-2 text-destructive'
          : 'flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-muted-foreground'
      }
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

function WorkOrderLoadingState() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="h-40 animate-pulse border-b border-border last:border-b-0" />
      ))}
    </div>
  );
}
