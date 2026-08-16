'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, CircleAlert, Clock3, Plus, Settings2, ShieldCheck } from 'lucide-react';
import { Badge, type BadgeVariant } from '@getrentos/ui';
import { Button } from '@getrentos/ui';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@getrentos/ui';
import { EmptyState } from '@getrentos/ui';
import { Field } from '@getrentos/ui';
import { Input } from '@getrentos/ui';
import { Select } from '@getrentos/ui';
import { Switch } from '@getrentos/ui';
import { Toast, type ToastVariant } from '@getrentos/ui';
import { unwrap } from '@/lib/apiHelpers';
import { homeManagementKeys } from '@/lib/queryKeys';
import {
  homeManagementService,
  type CreateHomeManagementSlaPolicyInput,
  type HomeManagementProperty,
  type HomeManagementSlaPolicy,
  type HomeManagementSlaPriority,
  type UpdateHomeManagementSlaPolicyInput,
} from '@/services/homeManagementService';

type SlaPolicyForm = {
  priority: HomeManagementSlaPriority;
  responseTargetMinutes: string;
  resolutionTargetMinutes: string;
  escalationTargetMinutes: string;
  emergencyRoutingEnabled: boolean;
  isActive: boolean;
};

type PolicyDialogState =
  | { mode: 'create'; priority: HomeManagementSlaPriority }
  | { mode: 'edit'; policy: HomeManagementSlaPolicy }
  | null;

const priorities: Array<{ value: HomeManagementSlaPriority; label: string }> = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
];

const priorityMeta: Record<
  HomeManagementSlaPriority,
  { label: string; variant: BadgeVariant; summary: string }
> = {
  LOW: {
    label: 'Low',
    variant: 'neutral',
    summary: 'Non-urgent care and planned improvements.',
  },
  MEDIUM: {
    label: 'Medium',
    variant: 'info',
    summary: 'Routine home operations that need timely attention.',
  },
  HIGH: {
    label: 'High',
    variant: 'warning',
    summary: 'Material disruption requiring expedited coordination.',
  },
  URGENT: {
    label: 'Urgent',
    variant: 'danger',
    summary: 'Safety, security, or habitability-sensitive events.',
  },
};

const defaultTargets: Record<
  HomeManagementSlaPriority,
  Pick<
    SlaPolicyForm,
    'responseTargetMinutes' | 'resolutionTargetMinutes' | 'escalationTargetMinutes'
  >
> = {
  LOW: {
    responseTargetMinutes: '1440',
    resolutionTargetMinutes: '4320',
    escalationTargetMinutes: '2880',
  },
  MEDIUM: {
    responseTargetMinutes: '240',
    resolutionTargetMinutes: '1440',
    escalationTargetMinutes: '480',
  },
  HIGH: {
    responseTargetMinutes: '60',
    resolutionTargetMinutes: '480',
    escalationTargetMinutes: '120',
  },
  URGENT: {
    responseTargetMinutes: '15',
    resolutionTargetMinutes: '120',
    escalationTargetMinutes: '30',
  },
};

const MAX_TARGET_MINUTES = 525_600;

const propertyLabel = (property: HomeManagementProperty) =>
  property.title ?? property.name ?? 'Unnamed property';

const createPolicyForm = (priority: HomeManagementSlaPriority): SlaPolicyForm => ({
  priority,
  ...defaultTargets[priority],
  emergencyRoutingEnabled: priority === 'URGENT',
  isActive: true,
});

const policyToForm = (policy: HomeManagementSlaPolicy): SlaPolicyForm => ({
  priority: policy.priority,
  responseTargetMinutes: String(policy.responseTargetMinutes),
  resolutionTargetMinutes: String(policy.resolutionTargetMinutes),
  escalationTargetMinutes: String(policy.escalationTargetMinutes),
  emergencyRoutingEnabled: policy.emergencyRoutingEnabled,
  isActive: policy.isActive,
});

const targetIsValid = (value: string) => {
  const minutes = Number(value);
  return Number.isInteger(minutes) && minutes >= 1 && minutes <= MAX_TARGET_MINUTES;
};

const formatMinutes = (minutes: number) => {
  if (minutes < 60) return `${minutes} min`;
  if (minutes % 1_440 === 0) {
    const days = minutes / 1_440;
    return `${days} day${days === 1 ? '' : 's'}`;
  }
  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return `${hours} hr${hours === 1 ? '' : 's'}`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours} hr ${remainingMinutes} min`;
};

const policyFormError = (form: SlaPolicyForm) => {
  if (
    !targetIsValid(form.responseTargetMinutes) ||
    !targetIsValid(form.resolutionTargetMinutes) ||
    !targetIsValid(form.escalationTargetMinutes)
  ) {
    return 'Use whole-minute targets between 1 minute and 365 days.';
  }

  const response = Number(form.responseTargetMinutes);
  const resolution = Number(form.resolutionTargetMinutes);
  const escalation = Number(form.escalationTargetMinutes);

  if (response > resolution) {
    return 'The response target cannot be longer than the resolution target.';
  }

  if (response > escalation) {
    return 'The response target must occur before the escalation target.';
  }

  if (escalation > resolution) {
    return 'The escalation target must occur no later than the resolution target.';
  }

  return null;
};

interface HomeManagementSlaPoliciesProps {
  properties: HomeManagementProperty[];
  isPropertiesLoading?: boolean;
}

/**
 * Per-property service objectives with explicit emergency-routing and active
 * states. Policy edits are intentionally scoped by property so an operator
 * cannot silently apply one home's service promise to another home.
 */
export function HomeManagementSlaPolicies({
  properties,
  isPropertiesLoading = false,
}: HomeManagementSlaPoliciesProps) {
  const queryClient = useQueryClient();
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [dialogState, setDialogState] = useState<PolicyDialogState>(null);
  const [form, setForm] = useState<SlaPolicyForm>(() => createPolicyForm('MEDIUM'));
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const effectivePropertyId =
    selectedPropertyId && properties.some((property) => property.id === selectedPropertyId)
      ? selectedPropertyId
      : (properties[0]?.id ?? '');

  const policiesQuery = useQuery({
    enabled: Boolean(effectivePropertyId),
    queryKey: homeManagementKeys.slaPolicies(effectivePropertyId),
    queryFn: () => unwrap(homeManagementService.listSlaPolicies(effectivePropertyId)),
  });

  const policies = useMemo(() => policiesQuery.data ?? [], [policiesQuery.data]);
  const activePolicies = useMemo(() => policies.filter((policy) => policy.isActive), [policies]);
  const configuredPriorities = useMemo(
    () => new Set(activePolicies.map((policy) => policy.priority)),
    [activePolicies]
  );
  const selectedProperty = properties.find((property) => property.id === effectivePropertyId);
  const validationError = policyFormError(form);
  const isEditing = dialogState?.mode === 'edit';

  const invalidatePolicyViews = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: homeManagementKeys.slaPolicies(effectivePropertyId),
      }),
      queryClient.invalidateQueries({ queryKey: ['home-management', 'escalations'] }),
      queryClient.invalidateQueries({ queryKey: homeManagementKeys.workOrders }),
      queryClient.invalidateQueries({ queryKey: homeManagementKeys.dashboard }),
    ]);
  };

  const createPolicy = useMutation<
    HomeManagementSlaPolicy,
    Error,
    CreateHomeManagementSlaPolicyInput
  >({
    mutationFn: (input) => unwrap(homeManagementService.createSlaPolicy(input)),
    onSuccess: async () => {
      await invalidatePolicyViews();
      setDialogState(null);
      setToast({ message: 'Service policy created and activated.', variant: 'success' });
    },
    onError: (error) => {
      setToast({
        message: error.message || 'Unable to create this service policy.',
        variant: 'error',
      });
    },
  });

  const updatePolicy = useMutation<
    HomeManagementSlaPolicy,
    Error,
    { id: string; data: UpdateHomeManagementSlaPolicyInput }
  >({
    mutationFn: ({ id, data }) => unwrap(homeManagementService.updateSlaPolicy(id, data)),
    onSuccess: async () => {
      await invalidatePolicyViews();
      setDialogState(null);
      setToast({ message: 'Service policy updated.', variant: 'success' });
    },
    onError: (error) => {
      setToast({
        message: error.message || 'Unable to update this service policy.',
        variant: 'error',
      });
    },
  });

  const mutationPending = createPolicy.isPending || updatePolicy.isPending;
  const remainingPriorities = priorities.filter(
    (priority) => !configuredPriorities.has(priority.value)
  );

  const openCreate = (priority = remainingPriorities[0]?.value) => {
    if (!priority || !effectivePropertyId) return;
    setForm(createPolicyForm(priority));
    setDialogState({ mode: 'create', priority });
  };

  const openEdit = (policy: HomeManagementSlaPolicy) => {
    setForm(policyToForm(policy));
    setDialogState({ mode: 'edit', policy });
  };

  const closeDialog = () => {
    if (!mutationPending) setDialogState(null);
  };

  const submitPolicy = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!dialogState || validationError || !effectivePropertyId) return;

    const data = {
      priority: form.priority,
      responseTargetMinutes: Number(form.responseTargetMinutes),
      resolutionTargetMinutes: Number(form.resolutionTargetMinutes),
      escalationTargetMinutes: Number(form.escalationTargetMinutes),
      emergencyRoutingEnabled: form.emergencyRoutingEnabled,
      isActive: form.isActive,
    };

    if (dialogState.mode === 'edit') {
      updatePolicy.mutate({ id: dialogState.policy.id, data });
      return;
    }

    createPolicy.mutate({ propertyId: effectivePropertyId, ...data });
  };

  return (
    <section aria-labelledby="sla-policies-heading" className="mt-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Service standards</p>
          <h2
            id="sla-policies-heading"
            className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-foreground"
          >
            Set the care promise for every home.
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Define response, resolution, and escalation windows before a maintenance issue puts a
            resident or asset at risk.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Select
            ariaLabel="Select property for service policies"
            className="min-w-56"
            disabled={isPropertiesLoading || properties.length === 0}
            value={effectivePropertyId}
            onValueChange={setSelectedPropertyId}
            placeholder={isPropertiesLoading ? 'Loading properties…' : 'Select a property'}
            options={properties.map((property) => ({
              value: property.id,
              label: propertyLabel(property),
            }))}
          />
          <Button
            icon={<Plus className="h-4 w-4" />}
            rounded="md"
            disabled={
              !effectivePropertyId || policiesQuery.isLoading || remainingPriorities.length === 0
            }
            title={
              remainingPriorities.length === 0
                ? 'Every priority already has a policy for this property'
                : undefined
            }
            onClick={() => openCreate()}
          >
            Add policy
          </Button>
        </div>
      </div>

      <div className="mt-5">
        {isPropertiesLoading || (Boolean(effectivePropertyId) && policiesQuery.isLoading) ? (
          <SlaPoliciesLoadingState />
        ) : properties.length === 0 ? (
          <EmptyState
            icon={Settings2}
            title="Add a property before defining service standards"
            description="SLA policies are isolated per property to keep operational commitments clear and auditable."
          />
        ) : policiesQuery.isError ? (
          <EmptyState
            icon={CircleAlert}
            title="Service policies could not be loaded"
            description="Refresh the page to try again. Your existing service commitments have not been changed."
            action={
              <Button
                size="sm"
                variant="outline"
                rounded="md"
                onClick={() => void policiesQuery.refetch()}
              >
                Retry
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {priorities.map((priority) => {
              const policy =
                activePolicies.find((item) => item.priority === priority.value) ??
                policies.find((item) => item.priority === priority.value);
              const meta = priorityMeta[priority.value];

              return policy ? (
                <article
                  key={priority.value}
                  className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                      <p className="mt-3 text-sm font-semibold text-foreground">
                        {policy.isActive ? 'Policy is active' : 'Policy is paused'}
                      </p>
                    </div>
                    <div
                      className={
                        policy.isActive
                          ? 'flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary'
                          : 'flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-muted-foreground'
                      }
                    >
                      {policy.isActive ? (
                        <ShieldCheck className="h-5 w-5" />
                      ) : (
                        <Settings2 className="h-5 w-5" />
                      )}
                    </div>
                  </div>

                  <p className="mt-2 min-h-10 text-xs leading-5 text-muted-foreground">
                    {meta.summary}
                  </p>

                  <dl className="mt-4 space-y-2 rounded-xl bg-secondary/70 p-3 text-sm">
                    <SlaMetric
                      label="Respond"
                      value={formatMinutes(policy.responseTargetMinutes)}
                    />
                    <SlaMetric
                      label="Resolve"
                      value={formatMinutes(policy.resolutionTargetMinutes)}
                    />
                    <SlaMetric
                      label="Escalate"
                      value={formatMinutes(policy.escalationTargetMinutes)}
                    />
                  </dl>

                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
                    <span className="inline-flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                      {policy.emergencyRoutingEnabled ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
                      ) : (
                        <Clock3 className="h-3.5 w-3.5 shrink-0" />
                      )}
                      <span className="truncate">
                        {policy.emergencyRoutingEnabled
                          ? 'Emergency routing on'
                          : 'Standard routing'}
                      </span>
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      rounded="md"
                      onClick={() => openEdit(policy)}
                    >
                      Edit
                    </Button>
                  </div>
                </article>
              ) : (
                <article
                  key={priority.value}
                  className="flex min-h-72 flex-col rounded-2xl border border-dashed border-border bg-secondary/30 p-5"
                >
                  <Badge variant={meta.variant} className="w-fit">
                    {meta.label}
                  </Badge>
                  <div className="mt-5 flex h-10 w-10 items-center justify-center rounded-xl bg-card text-muted-foreground">
                    <Clock3 className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-foreground">No policy configured</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{meta.summary}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    rounded="md"
                    className="mt-auto"
                    onClick={() => openCreate(priority.value)}
                  >
                    Configure {meta.label.toLowerCase()}
                  </Button>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={Boolean(dialogState)} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-lg p-6">
          <DialogTitle className="pr-8 text-xl font-semibold tracking-[-0.02em] text-foreground">
            {isEditing ? 'Edit service policy' : 'Configure service policy'}
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm leading-6 text-muted-foreground">
            {selectedProperty
              ? `These targets apply only to ${propertyLabel(selectedProperty)}.`
              : 'Set the service objective for this property.'}
          </DialogDescription>

          <form className="mt-6 space-y-5" onSubmit={submitPolicy}>
            <Field label="Priority" required>
              <Select
                ariaLabel="Service policy priority"
                value={form.priority}
                disabled={Boolean(isEditing) || mutationPending}
                onValueChange={(priority) => {
                  const nextPriority = priority as HomeManagementSlaPriority;
                  setForm((current) =>
                    isEditing
                      ? { ...current, priority: nextPriority }
                      : {
                          ...current,
                          priority: nextPriority,
                          ...defaultTargets[nextPriority],
                          emergencyRoutingEnabled: nextPriority === 'URGENT',
                        }
                  );
                }}
                options={priorities.map((priority) => ({
                  ...priority,
                  disabled:
                    !isEditing &&
                    priority.value !== form.priority &&
                    configuredPriorities.has(priority.value),
                }))}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field htmlFor="sla-response-target" label="Respond in" required hint="Minutes">
                <Input
                  id="sla-response-target"
                  type="number"
                  min={1}
                  max={MAX_TARGET_MINUTES}
                  inputMode="numeric"
                  value={form.responseTargetMinutes}
                  disabled={mutationPending}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      responseTargetMinutes: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field htmlFor="sla-resolution-target" label="Resolve in" required hint="Minutes">
                <Input
                  id="sla-resolution-target"
                  type="number"
                  min={1}
                  max={MAX_TARGET_MINUTES}
                  inputMode="numeric"
                  value={form.resolutionTargetMinutes}
                  disabled={mutationPending}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      resolutionTargetMinutes: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field htmlFor="sla-escalation-target" label="Escalate in" required hint="Minutes">
                <Input
                  id="sla-escalation-target"
                  type="number"
                  min={1}
                  max={MAX_TARGET_MINUTES}
                  inputMode="numeric"
                  value={form.escalationTargetMinutes}
                  disabled={mutationPending}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      escalationTargetMinutes: event.target.value,
                    }))
                  }
                />
              </Field>
            </div>

            {validationError && (
              <p className="rounded-xl bg-destructive/10 px-3 py-2 text-xs leading-5 text-destructive">
                {validationError}
              </p>
            )}

            <div className="space-y-3 rounded-2xl border border-border bg-secondary/40 p-4">
              <label className="flex cursor-pointer items-start justify-between gap-4">
                <span>
                  <span className="block text-sm font-medium text-foreground">
                    Emergency routing
                  </span>
                  <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                    Put breaches from this priority into the active escalation queue.
                  </span>
                </span>
                <Switch
                  aria-label="Enable emergency routing"
                  checked={form.emergencyRoutingEnabled}
                  disabled={mutationPending}
                  onCheckedChange={(emergencyRoutingEnabled) =>
                    setForm((current) => ({ ...current, emergencyRoutingEnabled }))
                  }
                />
              </label>
              <div className="h-px bg-border" />
              <label className="flex cursor-pointer items-start justify-between gap-4">
                <span>
                  <span className="block text-sm font-medium text-foreground">Policy active</span>
                  <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                    Pausing preserves the policy record but stops it from setting new targets.
                  </span>
                </span>
                <Switch
                  aria-label="Set policy active"
                  checked={form.isActive}
                  disabled={mutationPending}
                  onCheckedChange={(isActive) => setForm((current) => ({ ...current, isActive }))}
                />
              </label>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                rounded="md"
                disabled={mutationPending}
                onClick={closeDialog}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                rounded="md"
                isLoading={mutationPending}
                disabled={Boolean(validationError)}
              >
                {isEditing ? 'Save changes' : 'Activate policy'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </section>
  );
}

function SlaMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}

function SlaPoliciesLoadingState() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className="h-72 animate-pulse rounded-2xl border border-border bg-secondary/50"
        />
      ))}
    </div>
  );
}
