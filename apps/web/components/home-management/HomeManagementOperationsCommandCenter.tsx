'use client';

import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BadgeDollarSign,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  ClipboardList,
  ShieldAlert,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { Badge, type BadgeVariant } from '@getrentos/ui';
import { Button } from '@getrentos/ui';
import { Card } from '@getrentos/ui';
import { Skeleton } from '@getrentos/ui';
import type {
  HomeAsset,
  HomeManagementProperty,
  HomeManagementWorkOrder,
  PreventiveMaintenancePlan,
} from '@/services/homeManagementService';

type HomeManagementOperationsRole = 'owner' | 'landlord';
type ActionTarget = 'work-orders' | 'care-plans' | 'assets';

type AttentionMetric = {
  id: string;
  label: string;
  emptyLabel: string;
  value: number;
  icon: LucideIcon;
  urgent?: boolean;
};

type OperationsAction = {
  id: string;
  title: string;
  detail: string;
  target: ActionTarget;
  targetLabel: string;
  severity: number;
  deadline: number | null;
  priority: number;
  icon: LucideIcon;
  badge: string;
  badgeVariant: BadgeVariant;
};

interface HomeManagementOperationsCommandCenterProps {
  role: HomeManagementOperationsRole;
  properties: HomeManagementProperty[];
  assets: HomeAsset[];
  plans: PreventiveMaintenancePlan[];
  workOrders: HomeManagementWorkOrder[];
  /**
   * This is derived from the workspace's existing queries. It avoids showing
   * an all-clear state while the operational records are still loading.
   */
  isLoading?: boolean;
}

const CLOSED_WORK_ORDER_STATUSES = new Set<HomeManagementWorkOrder['status']>([
  'RESOLVED',
  'CANCELLED',
]);

const workOrderPriority: Record<HomeManagementWorkOrder['priority'], number> = {
  URGENT: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

const priorityWeight = (priority: HomeManagementWorkOrder['priority']) =>
  workOrderPriority[priority] ?? workOrderPriority.LOW;

const sectionTargets: Record<ActionTarget, string> = {
  'work-orders': '#work-order-queue-heading',
  'care-plans': '#preventive-plans-heading',
  assets: '#asset-registry-heading',
};

const timestamp = (value?: string | null): number | null => {
  if (!value) return null;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? null : parsed;
};

const isOpenWorkOrder = (workOrder: HomeManagementWorkOrder) =>
  !CLOSED_WORK_ORDER_STATUSES.has(workOrder.status);

const workOrderDeadline = (workOrder: HomeManagementWorkOrder) =>
  workOrder.dueAt ??
  workOrder.resolutionDueAt ??
  workOrder.responseDueAt ??
  workOrder.escalationDueAt ??
  null;

const emergencyDeadline = (workOrder: HomeManagementWorkOrder) =>
  workOrder.responseDueAt ?? workOrderDeadline(workOrder);

const isWorkOrderOverdue = (workOrder: HomeManagementWorkOrder, now: number) => {
  const deadline = timestamp(workOrderDeadline(workOrder));
  return isOpenWorkOrder(workOrder) && deadline !== null && deadline < now;
};

const isPlanDue = (plan: PreventiveMaintenancePlan, now: number) => {
  const dueAt = timestamp(plan.nextDueAt);
  return plan.status === 'ACTIVE' && dueAt !== null && dueAt <= now;
};

const propertyLabel = (property?: HomeManagementProperty | null) =>
  property?.title ?? property?.name ?? 'Property';

const workOrderLocation = (
  workOrder: HomeManagementWorkOrder,
  properties: HomeManagementProperty[]
) => {
  const propertyId = workOrder.unit?.property?.id;
  const property =
    workOrder.unit?.property?.title ??
    properties.find((candidate) => candidate.id === propertyId)?.title ??
    properties.find((candidate) => candidate.id === propertyId)?.name;
  const unit = workOrder.unit?.unitName;

  return [property ?? 'Property', unit].filter(Boolean).join(' · ');
};

const planLocation = (plan: PreventiveMaintenancePlan, properties: HomeManagementProperty[]) => {
  const property =
    plan.property?.title ??
    plan.property?.name ??
    propertyLabel(properties.find((candidate) => candidate.id === plan.propertyId));
  return plan.asset?.name ? `${property} · ${plan.asset.name}` : property;
};

const assetLocation = (asset: HomeAsset, properties: HomeManagementProperty[]) => {
  const property =
    asset.property?.title ??
    asset.property?.name ??
    propertyLabel(properties.find((candidate) => candidate.id === asset.propertyId));
  return asset.unit?.unitName ? `${property} · ${asset.unit.unitName}` : property;
};

const deadlineLabel = (value: number | null, now: number) => {
  if (value === null) return 'No due date recorded';

  const difference = value - now;
  const wholeDays = Math.max(1, Math.ceil(Math.abs(difference) / 86_400_000));
  if (difference < 0) return `Overdue by ${wholeDays} day${wholeDays === 1 ? '' : 's'}`;
  if (difference < 86_400_000) return 'Due today';
  return `Due in ${wholeDays} day${wholeDays === 1 ? '' : 's'}`;
};

const actionOrder = (left: OperationsAction, right: OperationsAction) => {
  if (left.severity !== right.severity) return left.severity - right.severity;
  if (left.priority !== right.priority) return left.priority - right.priority;
  return (left.deadline ?? Number.MAX_SAFE_INTEGER) - (right.deadline ?? Number.MAX_SAFE_INTEGER);
};

function AttentionCard({ metric }: { metric: AttentionMetric }) {
  const Icon = metric.icon;
  const hasAttention = metric.value > 0;

  return (
    <Card static hover={false} className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-foreground">
            {metric.value}
          </p>
        </div>
        <span
          className={
            metric.urgent && hasAttention
              ? 'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive'
              : hasAttention
                ? 'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400'
                : 'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground'
          }
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
      <p
        className={
          hasAttention
            ? 'mt-3 text-xs font-medium text-foreground'
            : 'mt-3 text-xs text-muted-foreground'
        }
      >
        {hasAttention ? 'Review in the action queue' : metric.emptyLabel}
      </p>
    </Card>
  );
}

function CommandCenterLoadingState() {
  return (
    <div
      aria-label="Loading operational overview"
      className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5"
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <Card key={index} static hover={false} className="p-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-3 h-8 w-10" />
          <Skeleton className="mt-4 h-3 w-32" />
        </Card>
      ))}
    </div>
  );
}

/**
 * A PII-light, derived operational overview. It deliberately receives the
 * workspace records as props so it never creates a second source of truth or
 * adds another Home Management request to the page.
 */
export function HomeManagementOperationsCommandCenter({
  role,
  properties,
  assets,
  plans,
  workOrders,
  isLoading = false,
}: HomeManagementOperationsCommandCenterProps) {
  const [now] = useState(() => Date.now());
  const hasRecords = properties.length + assets.length + plans.length + workOrders.length > 0;
  const showLoadingState = isLoading && !hasRecords;

  const { attention, actions } = useMemo(() => {
    const unacknowledgedEmergencies = workOrders.filter(
      (workOrder) =>
        isOpenWorkOrder(workOrder) && Boolean(workOrder.isEmergency) && !workOrder.acknowledgedAt
    );
    const approvalsNeeded = workOrders.filter(
      (workOrder) =>
        isOpenWorkOrder(workOrder) && workOrder.approvalRequired && !workOrder.approvedAt
    );
    const overdueWorkOrders = workOrders.filter((workOrder) => isWorkOrderOverdue(workOrder, now));
    const duePlans = plans.filter((plan) => isPlanDue(plan, now));
    const serviceAssets = assets.filter((asset) => asset.status === 'NEEDS_SERVICE');

    const attention: AttentionMetric[] = [
      {
        id: 'emergencies',
        label: 'Unacknowledged emergency',
        emptyLabel: 'No emergency acknowledgement is pending',
        value: unacknowledgedEmergencies.length,
        icon: ShieldAlert,
        urgent: true,
      },
      {
        id: 'approvals',
        label: 'Approval needed',
        emptyLabel: 'No work-order approval is pending',
        value: approvalsNeeded.length,
        icon: BadgeDollarSign,
        urgent: true,
      },
      {
        id: 'overdue-work',
        label: 'Overdue work',
        emptyLabel: 'No open work is past its recorded due date',
        value: overdueWorkOrders.length,
        icon: AlertTriangle,
        urgent: true,
      },
      {
        id: 'due-care',
        label: 'Due care plans',
        emptyLabel: 'No active care plan is currently due',
        value: duePlans.length,
        icon: CalendarClock,
      },
      {
        id: 'assets-service',
        label: 'Assets needing service',
        emptyLabel: 'No asset is marked as needing service',
        value: serviceAssets.length,
        icon: Wrench,
      },
    ];

    const actionByWorkOrder = new Map<string, OperationsAction>();

    unacknowledgedEmergencies.forEach((workOrder) => {
      const deadline = timestamp(emergencyDeadline(workOrder));
      actionByWorkOrder.set(workOrder.id, {
        id: `emergency-${workOrder.id}`,
        title: workOrder.issueTitle || 'Emergency work order',
        detail: `${workOrderLocation(workOrder, properties)} · ${deadlineLabel(deadline, now)}`,
        target: 'work-orders',
        targetLabel: 'Open work orders',
        severity: 0,
        deadline,
        priority: priorityWeight(workOrder.priority),
        icon: ShieldAlert,
        badge: 'Emergency',
        badgeVariant: 'danger',
      });
    });

    approvalsNeeded.forEach((workOrder) => {
      if (actionByWorkOrder.has(workOrder.id)) return;
      const deadline = timestamp(workOrderDeadline(workOrder));
      actionByWorkOrder.set(workOrder.id, {
        id: `approval-${workOrder.id}`,
        title: workOrder.issueTitle || 'Work-order approval',
        detail: `${workOrderLocation(workOrder, properties)} · ${deadlineLabel(deadline, now)}`,
        target: 'work-orders',
        targetLabel: 'Review approval',
        severity: 1,
        deadline,
        priority: priorityWeight(workOrder.priority),
        icon: BadgeDollarSign,
        badge: 'Approval needed',
        badgeVariant: 'warning',
      });
    });

    overdueWorkOrders.forEach((workOrder) => {
      if (actionByWorkOrder.has(workOrder.id)) return;
      const deadline = timestamp(workOrderDeadline(workOrder));
      actionByWorkOrder.set(workOrder.id, {
        id: `overdue-${workOrder.id}`,
        title: workOrder.issueTitle || 'Overdue work order',
        detail: `${workOrderLocation(workOrder, properties)} · ${deadlineLabel(deadline, now)}`,
        target: 'work-orders',
        targetLabel: 'Review work order',
        severity: 2,
        deadline,
        priority: priorityWeight(workOrder.priority),
        icon: CircleAlert,
        badge: 'Overdue',
        badgeVariant: 'danger',
      });
    });

    const careActions: OperationsAction[] = duePlans.map((plan) => {
      const deadline = timestamp(plan.nextDueAt);
      return {
        id: `plan-${plan.id}`,
        title: plan.title || 'Preventive care plan',
        detail: `${planLocation(plan, properties)} · ${deadlineLabel(deadline, now)}`,
        target: 'care-plans',
        targetLabel: 'Open care plans',
        severity: 3,
        deadline,
        priority: 0,
        icon: CalendarClock,
        badge: 'Care due',
        badgeVariant: 'warning',
      };
    });

    const assetActions: OperationsAction[] = serviceAssets.map((asset) => ({
      id: `asset-${asset.id}`,
      title: asset.name || 'Asset needing service',
      detail: assetLocation(asset, properties),
      target: 'assets',
      targetLabel: 'Open asset register',
      severity: 4,
      deadline: null,
      priority: 0,
      icon: Wrench,
      badge: 'Needs service',
      badgeVariant: 'warning',
    }));

    return {
      attention,
      actions: [...actionByWorkOrder.values(), ...careActions, ...assetActions]
        .sort(actionOrder)
        .slice(0, 6),
    };
  }, [assets, now, plans, properties, workOrders]);

  const attentionSignalCount = attention.reduce((total, metric) => total + metric.value, 0);
  const portfolioType = role === 'owner' ? 'ownership' : 'management';
  const overviewDescription =
    role === 'owner'
      ? 'A PII-light view of service risk, spending approvals, and preventive care across your portfolio.'
      : 'A PII-light view of service risk, spending approvals, and preventive care across the homes you manage.';

  return (
    <section aria-labelledby="operations-command-center-heading" className="mt-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-primary">Operations command center</p>
            {!showLoadingState && (
              <Badge
                variant={attentionSignalCount > 0 ? 'warning' : hasRecords ? 'success' : 'neutral'}
              >
                {attentionSignalCount > 0
                  ? `${attentionSignalCount} attention signal${
                      attentionSignalCount === 1 ? '' : 's'
                    }`
                  : hasRecords
                    ? 'No active attention signal'
                    : 'No operational records yet'}
              </Badge>
            )}
          </div>
          <h2
            id="operations-command-center-heading"
            className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-foreground"
          >
            See what needs an operator’s attention.
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{overviewDescription}</p>
        </div>
        {!showLoadingState && properties.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {properties.length} {properties.length === 1 ? 'property' : 'properties'} in your{' '}
            {portfolioType} portfolio
          </p>
        )}
      </div>

      {showLoadingState ? (
        <CommandCenterLoadingState />
      ) : (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {attention.map((metric) => (
              <AttentionCard key={metric.id} metric={metric} />
            ))}
          </div>

          <Card static hover={false} className="mt-5">
            <div className="flex flex-col gap-4 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-primary" aria-hidden="true" />
                  <h3 className="font-semibold text-foreground">Prioritized action queue</h3>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  The next actions surfaced by the operational records already in this workspace.
                </p>
              </div>
              {actions.length > 0 && <Badge variant="neutral">Top {actions.length}</Badge>}
            </div>

            {actions.length > 0 ? (
              <ol className="divide-y divide-border">
                {actions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <li
                      key={action.id}
                      className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <span
                          className={
                            action.badgeVariant === 'danger'
                              ? 'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive'
                              : 'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary'
                          }
                        >
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate font-medium text-foreground">{action.title}</p>
                            <Badge variant={action.badgeVariant}>{action.badge}</Badge>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">{action.detail}</p>
                        </div>
                      </div>
                      <Button
                        href={sectionTargets[action.target]}
                        variant="outline"
                        size="sm"
                        rounded="md"
                        className="shrink-0"
                        icon={<ChevronRight className="h-4 w-4" />}
                        iconPosition="right"
                      >
                        {action.targetLabel}
                      </Button>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <div className="px-5 py-8 text-center">
                <CheckCircle2
                  className="mx-auto h-7 w-7 text-green-600 dark:text-green-400"
                  aria-hidden="true"
                />
                <p className="mt-3 font-medium text-foreground">
                  {properties.length === 0
                    ? 'No properties are available for operations yet'
                    : 'No current action items were found'}
                </p>
                <p className="mx-auto mt-1 max-w-lg text-sm text-muted-foreground">
                  {properties.length === 0
                    ? 'Add a property to begin recording assets, care plans, and work orders.'
                    : 'The current work orders, care plans, and asset register do not surface an item requiring review.'}
                </p>
              </div>
            )}
          </Card>
        </>
      )}
    </section>
  );
}
