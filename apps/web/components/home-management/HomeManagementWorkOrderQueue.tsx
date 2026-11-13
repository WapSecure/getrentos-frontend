'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarClock,
  CircleAlert,
  ClipboardCheck,
  ClipboardPlus,
  Clock3,
  Sparkles,
  UserRound,
  Wrench,
} from '@sureground/icons';
import { Badge, type BadgeVariant } from '@sureground/ui';
import { Button } from '@sureground/ui';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@sureground/ui';
import { EmptyState } from '@sureground/ui';
import { ListSkeleton } from '@sureground/ui';
import { DatePicker } from '@sureground/ui';
import { Field } from '@sureground/ui';
import { CurrencyInput, Input, NumberInput } from '@sureground/ui';
import { Pagination } from '@sureground/ui';
import { Select } from '@sureground/ui';
import { Switch } from '@sureground/ui';
import { Textarea } from '@sureground/ui';
import { useToast } from '@sureground/ui';
import dynamic from 'next/dynamic';
import { Skeleton } from '@sureground/ui';
import {
  HomeManagementSectionHeading,
  useCreateRequest,
} from '@/components/home-management/HomeManagementSectionHeading';
import { unwrap } from '@/lib/apiHelpers';
import { formatCurrency, formatDate } from '@/lib/format';
import { homeManagementKeys } from '@/lib/queryKeys';
import { TriageResultModal } from '@/components/landlord/maintenance/TriageResultModal';
import { useMaintenanceTriage } from '@/components/shared/maintenance/useMaintenanceTriage';
import {
  homeManagementService,
  type CreateHomeManagementUnitInput,
  type CreateHomeManagementWorkOrderInput,
  type HomeManagementMaintenanceCategory,
  type HomeManagementProperty,
  type HomeManagementVendor,
  type HomeManagementWorkOrder,
} from '@/services/homeManagementService';
import { AWAITING_OWNER_MESSAGE, isAwaitingOwnerApproval } from '@sureground/shared';
import type { AwaitingOwnerApproval } from '@/types/managed';

const panelFallback = () => <Skeleton className="h-40 w-full rounded-lg" />;
const HomeManagementWorkOrderQuotes = dynamic(
  () =>
    import('@/components/home-management/HomeManagementWorkOrderQuotes').then(
      (m) => m.HomeManagementWorkOrderQuotes
    ),
  { loading: panelFallback }
);
const HomeManagementWorkOrderInvoices = dynamic(
  () =>
    import('@/components/home-management/HomeManagementWorkOrderInvoices').then(
      (m) => m.HomeManagementWorkOrderInvoices
    ),
  { loading: panelFallback }
);
const WorkOrderEvidence = dynamic(
  () => import('@/components/home-management/WorkOrderEvidence').then((m) => m.WorkOrderEvidence),
  { loading: panelFallback }
);

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
  askingRent: string;
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
  finalCost?: number;
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
  askingRent: '',
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
  workOrders: HomeManagementWorkOrder[];
  properties: HomeManagementProperty[];
  vendors?: HomeManagementVendor[];
  isLoading?: boolean;
  isPropertiesLoading?: boolean;
  error?: Error | null;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  /** Who is looking: the owner can rate a finished job. */
  viewerRole?: 'owner' | 'landlord' | 'manager';
  /** Inside a page that already titles the section: drops the heading and the page counts. */
  compact?: boolean;
  /** An owner looking at a property someone else manages: the jobs and their evidence, no actions. */
  readOnly?: boolean;
  /** Off where the page header already offers "Create work order", so the action is not shown twice. */
  showCreateAction?: boolean;
  /** Set by the page header's "Create work order"; see useCreateRequest. */
  createRequest?: number;
  onCreateRequestHandled?: () => void;
}

export function HomeManagementWorkOrderQueue({
  workOrders,
  properties,
  vendors = [],
  isLoading = false,
  isPropertiesLoading = false,
  error,
  page,
  pageSize,
  total,
  onPageChange,
  viewerRole,
  compact = false,
  readOnly = false,
  showCreateAction = true,
  createRequest,
  onCreateRequestHandled,
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
  const [lifecycleCost, setLifecycleCost] = useState('');
  const toast = useToast();

  const unitsQuery = useQuery({
    enabled: isCreateOpen && Boolean(form.propertyId),
    queryKey: homeManagementKeys.units(form.propertyId),
    queryFn: () => unwrap(homeManagementService.listUnits(form.propertyId)),
  });

  const units = unitsQuery.data ?? [];
  const assetsQuery = useQuery({
    enabled: isCreateOpen && Boolean(form.propertyId),
    queryKey: [...homeManagementKeys.assets(form.propertyId), 'work-order-selector'],
    queryFn: () =>
      unwrap(
        homeManagementService.listAssets({ propertyId: form.propertyId, page: 1, pageSize: 100 })
      ),
  });
  const propertyAssets = useMemo(() => assetsQuery.data?.items ?? [], [assetsQuery.data]);
  // Vendors scoped to the selected property's owner, so a manager spanning several owners only sees valid ones.
  const createVendorsQuery = useQuery({
    enabled: isCreateOpen && Boolean(form.propertyId),
    queryKey: [...homeManagementKeys.vendors, 'work-order-create', form.propertyId],
    queryFn: () => unwrap(homeManagementService.listAssignableVendors(form.propertyId)),
  });
  const createVendors = form.propertyId ? (createVendorsQuery.data ?? []) : vendors;
  const selectedProperty = properties.find((property) => property.id === form.propertyId);
  const availableAssets = useMemo(
    () =>
      propertyAssets.filter(
        (asset) =>
          asset.propertyId === form.propertyId &&
          asset.status !== 'RETIRED' &&
          (!asset.unitId || asset.unitId === form.unitId)
      ),
    [propertyAssets, form.propertyId, form.unitId]
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
    isOptionalWholeNumber(unitForm.askingRent);
  const canCreateUnit =
    Boolean(form.propertyId) && Boolean(unitForm.unitName.trim()) && hasValidUnitDetails;

  const triage = useMaintenanceTriage({
    onApplied: () => invalidateWorkOrderViews(),
    assignVendor: (id, vendorId) => assignVendor.mutateAsync({ id, assignedVendorId: vendorId }),
  });

  const invalidateWorkOrderViews = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: homeManagementKeys.workOrders }),
      queryClient.invalidateQueries({ queryKey: homeManagementKeys.dashboard }),
      queryClient.invalidateQueries({ queryKey: ['home-management', 'timeline'] }),
    ]);
  };

  const approve = useMutation<
    HomeManagementWorkOrder | AwaitingOwnerApproval,
    Error,
    { id: string; approvedCost: number }
  >({
    mutationFn: ({ id, approvedCost }: { id: string; approvedCost: number }) =>
      unwrap(homeManagementService.approveWorkOrder(id, approvedCost)),
    onSuccess: async (result) => {
      await invalidateWorkOrderViews();
      if (isAwaitingOwnerApproval(result)) {
        toast.info(AWAITING_OWNER_MESSAGE[result.band] ?? AWAITING_OWNER_MESSAGE.OWNER);
        return;
      }
      toast.success('Work order budget approved and recorded.');
    },
    onError: (mutationError: Error) => {
      toast.error(mutationError.message || 'Unable to approve this work order.');
    },
  });

  const createWorkOrder = useMutation({
    mutationFn: (input: CreateHomeManagementWorkOrderInput) =>
      unwrap(homeManagementService.createWorkOrder(input)),
    onSuccess: async () => {
      await invalidateWorkOrderViews();
      setForm(initialWorkOrderForm);
      setIsCreateOpen(false);
      toast.success('Work order created and added to your operational queue.');
    },
    onError: (mutationError: Error) => {
      toast.error(mutationError.message || 'Unable to create this work order.');
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
      toast.success(`${unit.unitName} was added and selected for this work order.`);
    },
    onError: (mutationError: Error) => {
      toast.error(mutationError.message || 'Unable to add this unit.');
    },
  });

  const assignVendor = useMutation<HomeManagementWorkOrder, Error, AssignVendorInput>({
    mutationFn: ({ id, assignedVendorId }) =>
      unwrap(homeManagementService.assignWorkOrderVendor(id, { assignedVendorId })),
    onSuccess: async () => {
      await invalidateWorkOrderViews();
      toast.success('Vendor assignment was updated.');
    },
    onError: (mutationError) => {
      toast.error(mutationError.message || 'Unable to update the vendor assignment.');
    },
  });

  const startWorkOrder = useMutation<HomeManagementWorkOrder, Error, WorkOrderIdInput>({
    mutationFn: ({ id }) => unwrap(homeManagementService.startWorkOrder(id)),
    onSuccess: async () => {
      await invalidateWorkOrderViews();
      toast.success('Work order moved into progress.');
    },
    onError: (mutationError) => {
      toast.error(mutationError.message || 'Unable to start this work order.');
    },
  });

  const resolveWorkOrder = useMutation<HomeManagementWorkOrder, Error, ResolveWorkOrderInput>({
    mutationFn: ({ id, resolutionNote, finalCost }) =>
      unwrap(homeManagementService.resolveWorkOrder(id, { resolutionNote, finalCost })),
    onSuccess: async () => {
      await invalidateWorkOrderViews();
      setLifecycleDialog(null);
      setLifecycleNote('');
      setLifecycleCost('');
      toast.success('Work order resolved and recorded in service history.');
    },
    onError: (mutationError) => {
      toast.error(mutationError.message || 'Unable to resolve this work order.');
    },
  });

  const cancelWorkOrder = useMutation<HomeManagementWorkOrder, Error, CancelWorkOrderInput>({
    mutationFn: ({ id, reason }) => unwrap(homeManagementService.cancelWorkOrder(id, { reason })),
    onSuccess: async () => {
      await invalidateWorkOrderViews();
      setLifecycleDialog(null);
      setLifecycleNote('');
      toast.success('Work order cancelled and recorded in service history.');
    },
    onError: (mutationError) => {
      toast.error(mutationError.message || 'Unable to cancel this work order.');
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

  useCreateRequest(readOnly ? undefined : createRequest, openCreateDialog, onCreateRequestHandled);

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
    // Without spend approval there is no ceiling to invoice against, so completing it captures the real cost.
    setLifecycleCost(
      action === 'resolve' && workOrder.approvedCost === null && workOrder.estimatedCost
        ? String(workOrder.estimatedCost)
        : ''
    );
    setLifecycleDialog({ action, workOrder });
  };

  const closeLifecycleDialog = () => {
    if (!isLifecycleDialogPending) {
      setLifecycleDialog(null);
      setLifecycleNote('');
      setLifecycleCost('');
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
      assignedVendorId: form.assignedVendorId || undefined,
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
      askingRent: toOptionalWholeNumber(unitForm.askingRent),
    });
  };

  const submitLifecycleAction = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!lifecycleDialog || isLifecycleDialogPending) return;

    const note = lifecycleNote.trim() || undefined;
    if (lifecycleDialog.action === 'resolve') {
      resolveWorkOrder.mutate({
        id: lifecycleDialog.workOrder.id,
        resolutionNote: note,
        finalCost: lifecycleCostNeeded ? lifecycleCostValue : undefined,
      });
      return;
    }

    cancelWorkOrder.mutate({ id: lifecycleDialog.workOrder.id, reason: note });
  };

  const isResolvingLifecycleWorkOrder = lifecycleDialog?.action === 'resolve';
  const lifecycleActionLabel = isResolvingLifecycleWorkOrder
    ? 'Resolve work order'
    : 'Cancel work order';
  const lifecycleNoteLabel = isResolvingLifecycleWorkOrder
    ? 'Resolution note'
    : 'Cancellation reason';
  // Invoicing reconciles against the approved cost and this work order never had one: capture it here or the job can never be paid.
  const lifecycleCostNeeded = Boolean(
    isResolvingLifecycleWorkOrder && lifecycleDialog?.workOrder.approvedCost === null
  );
  const lifecycleCostValue = Number(lifecycleCost);
  const lifecycleCostValid =
    lifecycleCost.trim() !== '' && Number.isInteger(lifecycleCostValue) && lifecycleCostValue >= 0;
  const canSubmitLifecycleAction = !lifecycleCostNeeded || lifecycleCostValid;

  const createButton = (
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
  );

  return (
    <section
      aria-labelledby={compact ? undefined : 'work-order-queue-heading'}
      aria-label={compact ? 'Work orders' : undefined}
    >
      {compact ? (
        !readOnly && <div className="flex justify-end">{createButton}</div>
      ) : (
        <HomeManagementSectionHeading
          id="work-order-queue-heading"
          title="Work orders"
          description="Requests and planned work, with approvals, vendors, quotes and invoices for each job."
          actions={!readOnly && showCreateAction ? createButton : undefined}
        />
      )}

      <div className="mt-5">
        {isLoading ? (
          <ListSkeleton rows={3} className="rounded-2xl" />
        ) : error && workOrders.length === 0 ? (
          <EmptyState
            icon={CircleAlert}
            title="Work orders could not be loaded"
            description="Refresh the page to try again."
          />
        ) : workOrders.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="No work orders yet"
            description={
              readOnly
                ? 'Jobs your manager raises appear here with their photos and progress.'
                : 'Maintenance requests and scheduled work will appear here with their approval and due-date status.'
            }
            action={
              !readOnly && properties.length > 0 ? (
                <Button size="sm" rounded="md" onClick={openCreateDialog}>
                  Create the first work order
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
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
                const vendorAssignmentAvailable = canAssignVendor(workOrder);
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
                const isThisWorkOrderMutationPending =
                  (approve.isPending && approve.variables?.id === workOrder.id) ||
                  (assignVendor.isPending && assignVendor.variables?.id === workOrder.id) ||
                  (startWorkOrder.isPending && startWorkOrder.variables?.id === workOrder.id) ||
                  (resolveWorkOrder.isPending && resolveWorkOrder.variables?.id === workOrder.id) ||
                  (cancelWorkOrder.isPending && cancelWorkOrder.variables?.id === workOrder.id);
                const hasApprovedCost =
                  !approvalPending &&
                  workOrder.approvedCost !== null &&
                  workOrder.approvedCost !== undefined;
                const showControlPanel = readOnly
                  ? hasApprovedCost
                  : isOpen(workOrder) || approvalPending || hasApprovedCost;

                return (
                  <article key={workOrder.id} className="p-5">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-foreground">{workOrder.issueTitle}</h3>
                          <Badge variant={status.variant}>{status.label}</Badge>
                          <Badge variant={priority.variant}>{priority.label}</Badge>
                          {workOrder.isEmergency && <Badge variant="danger">Emergency</Badge>}
                          {slaBreached && <Badge variant="danger">Service target missed</Badge>}
                          {workOrder.acknowledgedAt && (
                            <Badge variant="success">Acknowledged</Badge>
                          )}
                          {isOverdue(workOrder) && <Badge variant="danger">Overdue</Badge>}
                          {readOnly && approvalPending && (
                            <Badge variant="warning">Approval pending</Badge>
                          )}
                        </div>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                          {workOrder.description}
                        </p>
                        {workOrder.workOrderScope && (
                          <p className="mt-2 max-w-3xl rounded-md bg-secondary/40 px-3 py-2 text-sm text-foreground">
                            <span className="font-medium">Agreed scope: </span>
                            {workOrder.workOrderScope}
                          </p>
                        )}
                        {workOrder.images?.length ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {workOrder.images.map((image, index) => (
                              <a
                                key={image}
                                href={image}
                                target="_blank"
                                rel="noreferrer"
                                className="group relative block h-20 w-20 overflow-hidden rounded-xl border border-border bg-secondary/40"
                                title="Open reported photo evidence"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={image}
                                  alt={`Reported evidence ${index + 1} for ${workOrder.issueTitle}`}
                                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                />
                              </a>
                            ))}
                          </div>
                        ) : null}
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
                              <div className="mt-3 flex items-center gap-2">
                                <CurrencyInput
                                  aria-label={`Approved cost for ${workOrder.issueTitle}`}
                                  prefix="₦"
                                  min={0}
                                  value={currentCost}
                                  disabled={isThisWorkOrderMutationPending}
                                  onValueChange={(v) =>
                                    setCosts((current) => ({
                                      ...current,
                                      [workOrder.id]: v === 0 ? '' : String(v),
                                    }))
                                  }
                                />
                                <Button
                                  size="sm"
                                  rounded="md"
                                  isLoading={
                                    approve.isPending && approve.variables?.id === workOrder.id
                                  }
                                  disabled={!canApprove || isThisWorkOrderMutationPending}
                                  onClick={() => approve.mutate({ id: workOrder.id, approvedCost })}
                                >
                                  Approve
                                </Button>
                              </div>
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

                          {!readOnly && vendorAssignmentAvailable && (
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

                          {!readOnly && isOpen(workOrder) && (
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
                                <p className="mt-3 rounded-xl bg-warning-subtle px-3 py-2 text-xs leading-5 text-foreground">
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
                                  variant="outline"
                                  rounded="md"
                                  className="gap-1.5"
                                  isLoading={triage.isTriaging(workOrder.id)}
                                  disabled={isThisWorkOrderMutationPending}
                                  onClick={() => triage.start(workOrder.id)}
                                >
                                  <Sparkles className="h-3.5 w-3.5" />
                                  Suggest triage
                                </Button>
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

                    {!readOnly && (
                      <div className="mt-4 grid gap-4 2xl:grid-cols-2">
                        <HomeManagementWorkOrderQuotes workOrder={workOrder} vendors={vendors} />
                        <HomeManagementWorkOrderInvoices workOrder={workOrder} />
                      </div>
                    )}
                    <WorkOrderEvidence workOrder={workOrder} viewerRole={viewerRole} />
                  </article>
                );
              })}
            </div>
          </div>
        )}
        {total > 0 && (
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={onPageChange}
            className="rounded-b-2xl border border-border bg-card"
          />
        )}
      </div>

      <Dialog
        open={Boolean(lifecycleDialog)}
        onOpenChange={(open) => {
          if (!open) closeLifecycleDialog();
        }}
      >
        <DialogContent className="max-w-lg p-0" showClose={!isLifecycleDialogPending}>
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

              {lifecycleCostNeeded && (
                <div className="mt-4">
                  <Field
                    label="Final cost"
                    htmlFor="home-management-work-order-lifecycle-cost"
                    hint="This work never needed spend approval, so this becomes the figure the vendor's invoice is reconciled against."
                  >
                    <CurrencyInput
                      id="home-management-work-order-lifecycle-cost"
                      aria-label="Final cost of the completed work"
                      prefix="₦"
                      min={0}
                      value={lifecycleCost}
                      disabled={isLifecycleDialogPending}
                      onValueChange={(v) => setLifecycleCost(v === 0 ? '' : String(v))}
                    />
                  </Field>
                </div>
              )}

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
                  disabled={!canSubmitLifecycleAction}
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
        <DialogContent className="max-w-3xl p-0">
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
                    urgent priority, applies the property&apos;s emergency service target, and
                    routes the work into the escalation queue when emergency routing is enabled.
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
                <CurrencyInput
                  id="home-work-order-estimated-cost"
                  prefix="₦"
                  min={0}
                  value={form.estimatedCost}
                  onValueChange={(v) =>
                    setForm((current) => ({ ...current, estimatedCost: v === 0 ? '' : String(v) }))
                  }
                  placeholder="e.g. 85000"
                />
              </Field>
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
                      label: createVendorsQuery.isLoading
                        ? 'Loading vendors…'
                        : createVendors.length > 0
                          ? 'Assign later'
                          : 'No active vendors',
                    },
                    ...createVendors.map((vendor) => ({
                      value: vendor.id,
                      label: vendor.serviceType
                        ? `${vendor.name} · ${vendor.serviceType}`
                        : vendor.name,
                    })),
                  ]}
                />
              </Field>

              <div className="sm:col-span-2 flex items-start justify-between gap-4 rounded-2xl border border-border bg-secondary/35 p-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">Require budget approval</p>
                  <p className="mt-1 max-w-xl text-xs leading-5 text-muted-foreground">
                    Keep this work in the approval queue before committing spend. Someone else with
                    approval rights records the approved budget, and the decision is kept on record.
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
        <DialogContent className="max-w-lg p-0">
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
                <NumberInput
                  id="home-work-order-unit-bedrooms"
                  min={0}
                  step={1}
                  value={unitForm.bedrooms}
                  onValueChange={(value) =>
                    setUnitForm((current) => ({ ...current, bedrooms: value }))
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
                <NumberInput
                  id="home-work-order-unit-bathrooms"
                  min={0}
                  step={1}
                  value={unitForm.bathrooms}
                  onValueChange={(value) =>
                    setUnitForm((current) => ({ ...current, bathrooms: value }))
                  }
                />
              </Field>

              <Field
                className="sm:col-span-2"
                label="Rent (per year)"
                htmlFor="home-work-order-unit-rent"
                hint="Optional. Rent is quoted per year here. Leave empty if it is managed elsewhere."
                error={
                  !isOptionalWholeNumber(unitForm.askingRent)
                    ? 'Enter a whole amount of zero or more.'
                    : undefined
                }
              >
                <CurrencyInput
                  id="home-work-order-unit-rent"
                  prefix="₦"
                  min={0}
                  value={unitForm.askingRent}
                  onValueChange={(v) =>
                    setUnitForm((current) => ({
                      ...current,
                      askingRent: v === 0 ? '' : String(v),
                    }))
                  }
                  placeholder="e.g. 2500000"
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
      <TriageResultModal
        {...triage.modal}
        onAssignVendor={
          triage.requestId
            ? (vendorId) =>
                assignVendor.mutate(
                  { id: triage.requestId!, assignedVendorId: vendorId },
                  { onSuccess: triage.close }
                )
            : undefined
        }
        isAssigning={assignVendor.isPending && assignVendor.variables?.id === triage.requestId}
      />
    </section>
  );
}
