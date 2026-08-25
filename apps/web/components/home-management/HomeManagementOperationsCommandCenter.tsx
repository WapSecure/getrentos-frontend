'use client';

import {
  AlertTriangle,
  BadgeDollarSign,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  ShieldAlert,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { Badge, type BadgeVariant, Button, Card, Skeleton } from '@getrentos/ui';
import type { HomeManagementDashboard } from '@/services/homeManagementService';

type HomeManagementOperationsRole = 'owner' | 'landlord';
type ActionTarget = 'work-orders' | 'care-plans' | 'assets';

type AttentionMetric = {
  id: string;
  label: string;
  emptyLabel: string;
  value: number;
  icon: LucideIcon;
  target: ActionTarget;
  urgent?: boolean;
};

type OperationsAction = AttentionMetric & {
  title: string;
  detail: string;
  targetLabel: string;
  badge: string;
  badgeVariant: BadgeVariant;
};

interface HomeManagementOperationsCommandCenterProps {
  role: HomeManagementOperationsRole;
  /**
   * The backend calculates this summary over the entire active portfolio.
   * The paginated operational tables below never determine these counts.
   */
  summary?: HomeManagementDashboard;
  isLoading?: boolean;
}

const sectionTargets: Record<ActionTarget, string> = {
  'work-orders': '#work-order-queue-heading',
  'care-plans': '#preventive-plans-heading',
  assets: '#asset-registry-heading',
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
        {hasAttention ? 'Review in the operational queue' : metric.emptyLabel}
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

/** Portfolio-wide service-risk overview backed by aggregate API metrics. */
export function HomeManagementOperationsCommandCenter({
  role,
  summary,
  isLoading = false,
}: HomeManagementOperationsCommandCenterProps) {
  const hasRecords = (summary?.propertiesTotal ?? 0) > 0;
  const metrics: AttentionMetric[] = [
    {
      id: 'emergencies',
      label: 'Unacknowledged emergency',
      emptyLabel: 'No emergency acknowledgement is pending',
      value: summary?.unacknowledgedEmergencies ?? 0,
      icon: ShieldAlert,
      target: 'work-orders',
      urgent: true,
    },
    {
      id: 'approvals',
      label: 'Approval needed',
      emptyLabel: 'No work-order approval is pending',
      value: summary?.approvalQueue ?? 0,
      icon: BadgeDollarSign,
      target: 'work-orders',
      urgent: true,
    },
    {
      id: 'overdue-work',
      label: 'Overdue work',
      emptyLabel: 'No open work is past its recorded due date',
      value: summary?.overdue ?? 0,
      icon: AlertTriangle,
      target: 'work-orders',
      urgent: true,
    },
    {
      id: 'due-care',
      label: 'Due care plans',
      emptyLabel: 'No active care plan is currently due',
      value: summary?.plansDue ?? 0,
      icon: CalendarClock,
      target: 'care-plans',
    },
    {
      id: 'assets-service',
      label: 'Assets needing service',
      emptyLabel: 'No asset is marked as needing service',
      value: summary?.assetsNeedingService ?? 0,
      icon: Wrench,
      target: 'assets',
    },
  ];
  const actions: OperationsAction[] = metrics
    .filter((metric) => metric.value > 0)
    .map((metric) => ({
      ...metric,
      title: `${metric.value} ${metric.label.toLowerCase()}${metric.value === 1 ? '' : 's'}`,
      detail: 'This total is calculated across every active property in your portfolio.',
      targetLabel:
        metric.target === 'work-orders'
          ? 'Open work orders'
          : metric.target === 'care-plans'
            ? 'Open care plans'
            : 'Open asset register',
      badge: metric.urgent ? 'Priority' : 'Review',
      badgeVariant: metric.urgent ? 'danger' : 'warning',
    }));
  const attentionSignalCount = metrics.reduce((total, metric) => total + metric.value, 0);
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
            {!isLoading && (
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
            See what needs an operator&apos;s attention.
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{overviewDescription}</p>
        </div>
        {!isLoading && hasRecords && (
          <p className="text-sm text-muted-foreground">
            {summary?.propertiesTotal ?? 0}{' '}
            {summary?.propertiesTotal === 1 ? 'property' : 'properties'} in your {portfolioType}{' '}
            portfolio
          </p>
        )}
      </div>

      {isLoading ? (
        <CommandCenterLoadingState />
      ) : (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {metrics.map((metric) => (
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
                  Portfolio-wide totals remain accurate while each operational table is paginated.
                </p>
              </div>
              {actions.length > 0 && <Badge variant="neutral">{actions.length} areas</Badge>}
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
                        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
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
                  {hasRecords
                    ? 'No current action items were found'
                    : 'No properties are available for operations yet'}
                </p>
                <p className="mx-auto mt-1 max-w-lg text-sm text-muted-foreground">
                  {hasRecords
                    ? 'Every current portfolio metric is clear. Continue recording work in the operational tables below.'
                    : 'Add a property to begin recording assets, care plans, and work orders.'}
                </p>
              </div>
            )}
          </Card>
        </>
      )}
    </section>
  );
}
