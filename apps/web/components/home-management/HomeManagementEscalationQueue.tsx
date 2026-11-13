'use client';

import { useMemo, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BellRing, CheckCircle2, CircleAlert, Clock3, ShieldAlert } from '@sureground/icons';
import { Badge, type BadgeVariant } from '@sureground/ui';
import { Button } from '@sureground/ui';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@sureground/ui';
import { EmptyState } from '@sureground/ui';
import { Skeleton } from '@sureground/ui';
import { Pagination } from '@sureground/ui';
import { Select } from '@sureground/ui';
import { useToast } from '@sureground/ui';
import { maintenanceCategoryLabel } from '@sureground/shared';
import { HomeManagementSectionHeading } from '@/components/home-management/HomeManagementSectionHeading';
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
const ESCALATION_PAGE_SIZE = 10;

interface HomeManagementEscalationQueueProps {
  properties: HomeManagementProperty[];
  isPropertiesLoading?: boolean;
}

// Shows no resident details, only the job, its property and its deadlines.
export function HomeManagementEscalationQueue({
  properties,
  isPropertiesLoading = false,
}: HomeManagementEscalationQueueProps) {
  const queryClient = useQueryClient();
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [page, setPage] = useState(1);
  const [escalationConfirmation, setEscalationConfirmation] =
    useState<HomeManagementEscalation | null>(null);
  const toast = useToast();

  const effectivePropertyId =
    selectedPropertyId && properties.some((property) => property.id === selectedPropertyId)
      ? selectedPropertyId
      : (properties[0]?.id ?? '');

  const escalationsQuery = useQuery({
    enabled: Boolean(effectivePropertyId),
    queryKey: [
      ...homeManagementKeys.escalations(effectivePropertyId || undefined),
      { page, pageSize: ESCALATION_PAGE_SIZE },
    ],
    queryFn: () =>
      unwrap(
        homeManagementService.listEscalations(effectivePropertyId, {
          page,
          pageSize: ESCALATION_PAGE_SIZE,
        })
      ),
    placeholderData: keepPreviousData,
  });

  const escalations = useMemo(() => escalationsQuery.data?.items ?? [], [escalationsQuery.data]);
  const totalEscalations = escalationsQuery.data?.total ?? 0;
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
      toast.success('Escalation acknowledged and recorded in the service trail.');
    },
    onError: (error) => {
      toast.error(error.message || 'Unable to acknowledge this escalation.');
    },
  });

  const escalate = useMutation<{ id: string }, Error, { id: string }>({
    mutationFn: ({ id }) => unwrap(homeManagementService.escalateWorkOrder(id)),
    onSuccess: async () => {
      await invalidateEscalationViews();
      setEscalationConfirmation(null);
      toast.success('Work order escalated and recorded in the service trail.');
    },
    onError: (error) => {
      toast.error(error.message || 'Unable to escalate this work order.');
    },
  });

  const propertySelect = (
    <Select
      ariaLabel="Filter escalations by property"
      className="min-w-56"
      disabled={isPropertiesLoading}
      value={effectivePropertyId}
      onValueChange={(propertyId) => {
        setSelectedPropertyId(propertyId);
        setPage(1);
      }}
      placeholder={isPropertiesLoading ? 'Loading properties…' : 'Select a property'}
      options={properties.map((property) => ({
        value: property.id,
        label: propertyLabel(property),
      }))}
    />
  );

  // Nothing to coordinate: a work order list should not sit under a full-height empty panel.
  if (!isPropertiesLoading && properties.length === 0) return null;
  const selectedProperty = properties.find((property) => property.id === effectivePropertyId);
  if (
    selectedProperty &&
    !escalationsQuery.isLoading &&
    !escalationsQuery.isError &&
    totalEscalations === 0
  ) {
    return (
      <section
        aria-labelledby="escalation-queue-heading"
        className="flex flex-col gap-3 rounded-xl border border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex min-w-0 items-start gap-2.5 text-sm">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
          <p className="min-w-0 text-muted-foreground">
            <span id="escalation-queue-heading" className="font-medium text-foreground">
              No live escalations
            </span>{' '}
            at {propertyLabel(selectedProperty)}. Every open job there is within its service target.
          </p>
        </div>
        {properties.length > 1 && propertySelect}
      </section>
    );
  }

  return (
    <section aria-labelledby="escalation-queue-heading">
      <HomeManagementSectionHeading
        id="escalation-queue-heading"
        title="Live escalations"
        description="Jobs escalated by hand, routed as emergencies or past a service target, most urgent first."
        meta={
          totalEscalations > 0 ? (
            <Badge variant="danger">{totalEscalations} active</Badge>
          ) : undefined
        }
        actions={propertySelect}
      />

      <div className="mt-5">
        {isPropertiesLoading || (Boolean(effectivePropertyId) && escalationsQuery.isLoading) ? (
          <EscalationLoadingState />
        ) : properties.length === 0 ? (
          <EmptyState
            icon={ShieldAlert}
            title="Add a property before reviewing service risk"
            description="Escalations belong to a property, so add one first."
          />
        ) : !effectivePropertyId ? (
          <EmptyState
            icon={ShieldAlert}
            title="Select a property to review escalations"
            description="Choose a property to see its live escalations."
          />
        ) : escalationsQuery.isError && !escalationsQuery.data ? (
          <EmptyState
            icon={CircleAlert}
            title="Escalations could not be loaded"
            description="Refresh the page to try again."
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
            title="No live escalations"
            description={
              effectivePropertyId
                ? 'This property has no work orders currently outside their service target.'
                : 'Your active work orders are currently within their configured service targets.'
            }
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
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
                            {maintenanceCategoryLabel(escalation.category)}
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
                            : 'Acknowledge to record that you have seen this and are coordinating it.'}
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
        {totalEscalations > 0 && (
          <Pagination
            page={page}
            pageSize={ESCALATION_PAGE_SIZE}
            total={totalEscalations}
            onPageChange={setPage}
            className="rounded-b-2xl border border-border bg-card"
          />
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
            This records an escalation for{' '}
            <span className="font-medium text-foreground">
              {escalationConfirmation?.issueTitle}
            </span>{' '}
            and keeps it in the service history. It does not resolve the work order or change its
            approved spend.
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
    </section>
  );
}

function EscalationLoadingState() {
  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
      {Array.from({ length: 3 }, (_, index) => (
        <Skeleton key={index} className="h-36 rounded-xl" />
      ))}
    </div>
  );
}
