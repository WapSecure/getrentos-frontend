'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  CircleAlert,
  Clock3,
  ShieldAlert,
} from 'lucide-react';
import { Badge, type BadgeVariant } from '@getrentos/ui';
import { Button } from '@getrentos/ui';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@getrentos/ui';
import { EmptyState } from '@getrentos/ui';
import { Select } from '@getrentos/ui';
import { Toast, type ToastVariant } from '@getrentos/ui';
import { unwrap } from '@/lib/apiHelpers';
import { formatDate } from '@/lib/format';
import { homeManagementKeys } from '@/lib/queryKeys';
import {
  homeManagementService,
  type HomeManagementEscalation,
  type HomeManagementProperty,
  type HomeManagementWorkOrder,
} from '@/services/homeManagementService';

const priorityMeta: Record<
  HomeManagementWorkOrder['priority'],
  { label: string; variant: BadgeVariant }
> = {
  LOW: { label: 'Low', variant: 'neutral' },
  MEDIUM: { label: 'Medium', variant: 'info' },
  HIGH: { label: 'High', variant: 'warning' },
  URGENT: { label: 'Urgent', variant: 'danger' },
};

const propertyLabel = (property: HomeManagementProperty) =>
  property.title ?? property.name ?? 'Unnamed property';

const timestamp = (value?: string | null) => {
  if (!value) return null;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? null : parsed;
};

const formatBreachType = (breachType: string) => {
  const normalized = breachType.trim().toUpperCase();
  if (normalized.includes('RESPONSE')) return 'Response window breached';
  if (normalized.includes('RESOLUTION')) return 'Resolution window breached';
  if (normalized.includes('ESCALATION')) return 'Escalation deadline reached';
  if (normalized.includes('EMERGENCY')) return 'Emergency routing triggered';
  return breachType
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() ?? ''}${part.slice(1)}`)
    .join(' ');
};

const primaryDeadline = (escalation: HomeManagementEscalation) => {
  const breach = escalation.breach.toUpperCase();
  if (breach.includes('RESPONSE')) return escalation.responseDueAt;
  if (breach.includes('RESOLUTION')) return escalation.resolutionDueAt;
  if (breach.includes('ESCALATION')) return escalation.escalationDueAt;
  return escalation.escalationDueAt ?? escalation.responseDueAt ?? escalation.resolutionDueAt;
};

const relativeDeadline = (value?: string | null) => {
  const deadline = timestamp(value);
  if (deadline === null || !value) return 'No target timestamp recorded';

  const differenceMinutes = Math.round(Math.abs(Date.now() - deadline) / 60_000);
  const duration =
    differenceMinutes < 60
      ? `${differenceMinutes} min`
      : differenceMinutes < 1_440
        ? `${Math.round(differenceMinutes / 60)} hr`
        : `${Math.round(differenceMinutes / 1_440)} day${Math.round(differenceMinutes / 1_440) === 1 ? '' : 's'}`;

  return deadline <= Date.now()
    ? `Overdue by ${duration} · ${formatDate(value)}`
    : `Due in ${duration} · ${formatDate(value)}`;
};

const isEmergency = (escalation: HomeManagementEscalation) => Boolean(escalation.isEmergency);

interface HomeManagementEscalationQueueProps {
  properties: HomeManagementProperty[];
  isPropertiesLoading?: boolean;
}

/**
 * A deliberately PII-light escalation board. It concentrates on service
 * ownership, deadlines, and acknowledgement without exposing resident details.
 */
export function HomeManagementEscalationQueue({
  properties,
  isPropertiesLoading = false,
}: HomeManagementEscalationQueueProps) {
  const queryClient = useQueryClient();
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [escalationConfirmation, setEscalationConfirmation] =
    useState<HomeManagementEscalation | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const effectivePropertyId =
    selectedPropertyId && properties.some((property) => property.id === selectedPropertyId)
      ? selectedPropertyId
      : (properties[0]?.id ?? '');

  const escalationsQuery = useQuery({
    enabled: Boolean(effectivePropertyId),
    queryKey: homeManagementKeys.escalations(effectivePropertyId || undefined),
    queryFn: () => unwrap(homeManagementService.listEscalations(effectivePropertyId)),
  });

  const escalations = useMemo(() => escalationsQuery.data ?? [], [escalationsQuery.data]);
  const orderedEscalations = useMemo(
    () =>
      [...escalations].sort((left, right) => {
        const emergencyDifference = Number(isEmergency(right)) - Number(isEmergency(left));
        if (emergencyDifference !== 0) return emergencyDifference;

        const leftDeadline = timestamp(primaryDeadline(left)) ?? Number.MAX_SAFE_INTEGER;
        const rightDeadline = timestamp(primaryDeadline(right)) ?? Number.MAX_SAFE_INTEGER;
        return leftDeadline - rightDeadline;
      }),
    [escalations]
  );

  const invalidateEscalationViews = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['home-management', 'escalations'] }),
      queryClient.invalidateQueries({ queryKey: homeManagementKeys.workOrders }),
      queryClient.invalidateQueries({ queryKey: homeManagementKeys.dashboard }),
      queryClient.invalidateQueries({ queryKey: ['home-management', 'timeline'] }),
    ]);
  };

  const acknowledge = useMutation<{ id: string }, Error, { id: string }>({
    mutationFn: ({ id }) => unwrap(homeManagementService.acknowledgeWorkOrder(id)),
    onSuccess: async () => {
      await invalidateEscalationViews();
      setToast({
        message: 'Escalation acknowledged and recorded in the service trail.',
        variant: 'success',
      });
    },
    onError: (error) => {
      setToast({
        message: error.message || 'Unable to acknowledge this escalation.',
        variant: 'error',
      });
    },
  });

  const escalate = useMutation<{ id: string }, Error, { id: string }>({
    mutationFn: ({ id }) => unwrap(homeManagementService.escalateWorkOrder(id)),
    onSuccess: async () => {
      await invalidateEscalationViews();
      setEscalationConfirmation(null);
      setToast({
        message: 'Work order escalated and recorded in the service trail.',
        variant: 'success',
      });
    },
    onError: (error) => {
      setToast({
        message: error.message || 'Unable to escalate this work order.',
        variant: 'error',
      });
    },
  });

  const emergencyCount = escalations.filter(isEmergency).length;
  const unacknowledgedCount = escalations.filter((escalation) => !escalation.acknowledgedAt).length;

  return (
    <section aria-labelledby="escalation-queue-heading" className="mt-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Live escalation queue</p>
          <h2
            id="escalation-queue-heading"
            className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-foreground"
          >
            Act before a service promise is missed.
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Emergency-routed and breached work orders are prioritized here for a clear operational
            response.
          </p>
        </div>
        <Select
          ariaLabel="Filter escalations by property"
          className="min-w-56"
          disabled={isPropertiesLoading}
          value={effectivePropertyId}
          onValueChange={setSelectedPropertyId}
          placeholder={isPropertiesLoading ? 'Loading properties…' : 'Select a property'}
          options={properties.map((property) => ({
            value: property.id,
            label: propertyLabel(property),
          }))}
        />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <EscalationStat
          icon={<BellRing className="h-4 w-4" />}
          label="Active escalations"
          value={escalations.length}
        />
        <EscalationStat
          icon={<ShieldAlert className="h-4 w-4" />}
          label="Emergency routed"
          value={emergencyCount}
          urgent={emergencyCount > 0}
        />
        <EscalationStat
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Awaiting acknowledgement"
          value={unacknowledgedCount}
          urgent={unacknowledgedCount > 0}
        />
      </div>

      <div className="mt-5">
        {isPropertiesLoading || (Boolean(effectivePropertyId) && escalationsQuery.isLoading) ? (
          <EscalationLoadingState />
        ) : properties.length === 0 ? (
          <EmptyState
            icon={ShieldAlert}
            title="Add a property before reviewing service risk"
            description="Escalations are scoped to a property so service activity never crosses portfolio boundaries."
          />
        ) : !effectivePropertyId ? (
          <EmptyState
            icon={ShieldAlert}
            title="Select a property to review escalations"
            description="Choose a property to load its active SLA breach queue."
          />
        ) : escalationsQuery.isError ? (
          <EmptyState
            icon={CircleAlert}
            title="Escalations could not be loaded"
            description="Refresh the page to check the current service-risk queue."
            action={
              <Button
                size="sm"
                variant="outline"
                rounded="md"
                onClick={() => void escalationsQuery.refetch()}
              >
                Retry
              </Button>
            }
          />
        ) : orderedEscalations.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="No active SLA escalations"
            description={
              effectivePropertyId
                ? 'This property has no work orders currently outside their service target.'
                : 'Your active work orders are currently within their configured service targets.'
            }
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="divide-y divide-border">
              {orderedEscalations.map((escalation) => {
                const priority = priorityMeta[escalation.priority] ?? priorityMeta.MEDIUM;
                const deadline = primaryDeadline(escalation);
                const currentMutationPending =
                  acknowledge.isPending && acknowledge.variables?.id === escalation.id;
                const currentEscalationPending =
                  escalate.isPending && escalate.variables?.id === escalation.id;
                const workOrderProperty = escalation.unit?.property?.title ?? 'Property';
                const workOrderUnit = escalation.unit?.unitName;

                return (
                  <article key={escalation.id} className="p-5">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-foreground">{escalation.issueTitle}</h3>
                          <Badge variant={priority.variant}>{priority.label}</Badge>
                          {isEmergency(escalation) && <Badge variant="danger">Emergency</Badge>}
                          {escalation.acknowledgedAt ? (
                            <Badge variant="success">Acknowledged</Badge>
                          ) : (
                            <Badge variant="warning">Needs acknowledgement</Badge>
                          )}
                        </div>
                        <p className="mt-2 text-sm font-medium text-destructive">
                          {formatBreachType(escalation.breach)}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5">
                            <ShieldAlert className="h-3.5 w-3.5" />
                            {workOrderProperty}
                            {workOrderUnit ? ` · ${workOrderUnit}` : ''}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Clock3 className="h-3.5 w-3.5 text-destructive" />
                            {relativeDeadline(deadline)}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <BellRing className="h-3.5 w-3.5" />
                            {escalation.category.replace(/_/g, ' ')}
                          </span>
                          {escalation.escalatedAt && (
                            <span className="inline-flex items-center gap-1.5">
                              <BellRing className="h-3.5 w-3.5" />
                              Escalated {formatDate(escalation.escalatedAt)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex w-full flex-col gap-2 rounded-2xl border border-border bg-secondary/30 p-4 sm:w-64 xl:shrink-0">
                        <p className="text-sm font-semibold text-foreground">
                          {escalation.acknowledgedAt ? 'Response recorded' : 'Confirm ownership'}
                        </p>
                        <p className="text-xs leading-5 text-muted-foreground">
                          {escalation.acknowledgedAt
                            ? `Acknowledged ${formatDate(escalation.acknowledgedAt)}. The work order remains in the queue until it is resolved.`
                            : 'Acknowledge to record that an authorised operator has seen and is coordinating this service risk.'}
                        </p>
                        {!escalation.acknowledgedAt && (
                          <Button
                            size="sm"
                            rounded="md"
                            className="mt-1"
                            isLoading={currentMutationPending}
                            disabled={acknowledge.isPending || escalate.isPending}
                            onClick={() => acknowledge.mutate({ id: escalation.id })}
                          >
                            Acknowledge
                          </Button>
                        )}
                        {!escalation.escalatedAt && (
                          <Button
                            size="sm"
                            variant="outline"
                            rounded="md"
                            className="mt-1"
                            disabled={acknowledge.isPending || escalate.isPending}
                            onClick={() => setEscalationConfirmation(escalation)}
                          >
                            Escalate
                          </Button>
                        )}
                        {currentEscalationPending && (
                          <span className="sr-only">Escalating {escalation.issueTitle}</span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <Dialog
        open={Boolean(escalationConfirmation)}
        onOpenChange={(open) => {
          if (!open && !escalate.isPending) setEscalationConfirmation(null);
        }}
      >
        <DialogContent className="max-w-md p-6">
          <DialogTitle className="pr-8 text-xl font-semibold tracking-[-0.02em] text-foreground">
            Escalate this work order?
          </DialogTitle>
          <DialogDescription className="mt-2 text-sm leading-6 text-muted-foreground">
            This records an operational escalation for{' '}
            <span className="font-medium text-foreground">
              {escalationConfirmation?.issueTitle}
            </span>{' '}
            and keeps the service event visible in the audit trail. It does not resolve the work
            order or change its approved spend.
          </DialogDescription>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              rounded="md"
              disabled={escalate.isPending}
              onClick={() => setEscalationConfirmation(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              rounded="md"
              isLoading={escalate.isPending}
              disabled={!escalationConfirmation}
              onClick={() => {
                if (escalationConfirmation) {
                  escalate.mutate({ id: escalationConfirmation.id });
                }
              }}
            >
              Confirm escalation
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </section>
  );
}

function EscalationStat({
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
          ? 'flex items-center gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3'
          : 'flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3'
      }
    >
      <span
        className={
          urgent
            ? 'flex h-9 w-9 items-center justify-center rounded-xl bg-destructive/10 text-destructive'
            : 'flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary'
        }
      >
        {icon}
      </span>
      <div>
        <p className="text-lg font-semibold tracking-[-0.02em] text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function EscalationLoadingState() {
  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="h-36 animate-pulse rounded-xl bg-secondary/70" />
      ))}
    </div>
  );
}
