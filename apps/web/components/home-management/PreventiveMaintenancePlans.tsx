'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarCheck2,
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  ClipboardPlus,
  PauseCircle,
  Repeat2,
  Wrench,
} from 'lucide-react';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/Dialog';
import { DatePicker } from '@/components/ui/DatePicker';
import { EmptyState } from '@/components/ui/EmptyState';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Toast, type ToastVariant } from '@/components/ui/Toast';
import { unwrap } from '@/lib/apiHelpers';
import { formatDate } from '@/lib/format';
import { homeManagementKeys } from '@/lib/queryKeys';
import {
  homeManagementService,
  type CreatePreventivePlanInput,
  type HomeAsset,
  type HomeManagementMaintenanceCategory,
  type HomeManagementProperty,
  type HomeManagementVendor,
  type PreventiveMaintenancePlan,
} from '@/services/homeManagementService';

type PlanForm = {
  propertyId: string;
  unitId: string;
  assetId: string;
  title: string;
  category: HomeManagementMaintenanceCategory;
  frequencyDays: string;
  nextDueAt: string;
  assignedVendorId: string;
};

const initialPlanForm: PlanForm = {
  propertyId: '',
  unitId: '',
  assetId: '',
  title: '',
  category: 'OTHER',
  frequencyDays: '90',
  nextDueAt: '',
  assignedVendorId: '',
};

const categories: Array<{ value: HomeManagementMaintenanceCategory; label: string }> = [
  { value: 'PLUMBING', label: 'Plumbing' },
  { value: 'ELECTRICAL', label: 'Electrical' },
  { value: 'INTERNET', label: 'Internet' },
  { value: 'SECURITY', label: 'Security' },
  { value: 'APPLIANCES', label: 'Appliances' },
  { value: 'OTHER', label: 'Other' },
];

const planStatus: Record<
  PreventiveMaintenancePlan['status'],
  { label: string; variant: BadgeVariant }
> = {
  ACTIVE: { label: 'Active', variant: 'success' },
  PAUSED: { label: 'Paused', variant: 'warning' },
  COMPLETED: { label: 'Completed', variant: 'neutral' },
};

const propertyLabel = (property: HomeManagementProperty) =>
  property.title ?? property.name ?? 'Unnamed property';

const getPlanPropertyLabel = (
  plan: PreventiveMaintenancePlan,
  properties: HomeManagementProperty[]
) =>
  plan.property?.title ??
  plan.property?.name ??
  properties.find((property) => property.id === plan.propertyId)?.title ??
  properties.find((property) => property.id === plan.propertyId)?.name ??
  'Property';

const planIsDue = (plan: PreventiveMaintenancePlan) =>
  plan.status === 'ACTIVE' && new Date(plan.nextDueAt).getTime() <= Date.now();

const planIsDueSoon = (plan: PreventiveMaintenancePlan) => {
  const dueAt = new Date(plan.nextDueAt).getTime();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  return plan.status === 'ACTIVE' && dueAt > Date.now() && dueAt - Date.now() <= thirtyDays;
};

interface PreventiveMaintenancePlansProps {
  plans: PreventiveMaintenancePlan[];
  assets: HomeAsset[];
  properties: HomeManagementProperty[];
  vendors?: HomeManagementVendor[];
  isLoading?: boolean;
  error?: Error | null;
}

export function PreventiveMaintenancePlans({
  plans,
  assets,
  properties,
  vendors = [],
  isLoading = false,
  error,
}: PreventiveMaintenancePlansProps) {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState<PlanForm>(initialPlanForm);
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const unitsQuery = useQuery({
    enabled: isCreateOpen && Boolean(form.propertyId),
    queryKey: homeManagementKeys.units(form.propertyId),
    queryFn: () => unwrap(homeManagementService.listUnits(form.propertyId)),
  });
  const units = unitsQuery.data ?? [];

  const availableAssets = useMemo(
    () =>
      assets.filter(
        (asset) =>
          asset.propertyId === form.propertyId &&
          asset.status !== 'RETIRED' &&
          (asset.unitId ?? '') === form.unitId
      ),
    [assets, form.propertyId, form.unitId]
  );

  const createPlan = useMutation({
    mutationFn: (input: CreatePreventivePlanInput) =>
      unwrap(homeManagementService.createPlan(input)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: homeManagementKeys.plans });
      void queryClient.invalidateQueries({ queryKey: homeManagementKeys.assets() });
      void queryClient.invalidateQueries({ queryKey: homeManagementKeys.dashboard });
      setForm(initialPlanForm);
      setIsCreateOpen(false);
      setToast({ message: 'Preventive maintenance plan created.', variant: 'success' });
    },
    onError: (mutationError: Error) => {
      setToast({
        message: mutationError.message || 'Unable to create the care plan.',
        variant: 'error',
      });
    },
  });

  const completePlan = useMutation({
    mutationFn: (planId: string) => unwrap(homeManagementService.completePlan(planId)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: homeManagementKeys.plans });
      void queryClient.invalidateQueries({ queryKey: homeManagementKeys.assets() });
      void queryClient.invalidateQueries({ queryKey: homeManagementKeys.dashboard });
      setToast({
        message: 'Care completed and the next service has been scheduled.',
        variant: 'success',
      });
    },
    onError: (mutationError: Error) => {
      setToast({
        message: mutationError.message || 'Unable to complete this care plan.',
        variant: 'error',
      });
    },
  });

  const submitPlan = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const frequencyDays = Number(form.frequencyDays);
    if (
      !form.propertyId ||
      !form.title.trim() ||
      !form.nextDueAt ||
      !Number.isInteger(frequencyDays) ||
      frequencyDays < 1
    ) {
      return;
    }

    createPlan.mutate({
      propertyId: form.propertyId,
      unitId: form.unitId || undefined,
      assetId: form.assetId || undefined,
      title: form.title.trim(),
      category: form.category,
      frequencyDays,
      nextDueAt: form.nextDueAt,
      assignedVendorId: form.assignedVendorId || undefined,
    });
  };

  const duePlans = plans.filter(planIsDue).length;
  const dueSoonPlans = plans.filter(planIsDueSoon).length;
  const activePlans = plans.filter((plan) => plan.status === 'ACTIVE').length;
  const hasProperties = properties.length > 0;

  return (
    <section aria-labelledby="preventive-plans-heading" className="mt-10 pb-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Preventive care</p>
          <h2
            id="preventive-plans-heading"
            className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-foreground"
          >
            Plan work before it becomes an issue.
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Schedule recurring care, keep the right vendor accountable, and preserve the service
            history of every home.
          </p>
        </div>
        <Button
          icon={<ClipboardPlus className="h-4 w-4" />}
          rounded="md"
          disabled={!hasProperties}
          title={hasProperties ? undefined : 'Add a property before creating a care plan'}
          onClick={() => setIsCreateOpen(true)}
        >
          Create care plan
        </Button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <PlanSummary
          icon={<Repeat2 className="h-4 w-4" />}
          label="Active care plans"
          value={activePlans}
        />
        <PlanSummary
          icon={<CircleAlert className="h-4 w-4" />}
          label="Due now"
          value={duePlans}
          intent="urgent"
        />
        <PlanSummary
          icon={<CalendarClock className="h-4 w-4" />}
          label="Due within 30 days"
          value={dueSoonPlans}
        />
      </div>

      <div className="mt-5">
        {isLoading ? (
          <PlanLoadingState />
        ) : error ? (
          <EmptyState
            icon={CircleAlert}
            title="Care plans could not be loaded"
            description="Refresh the page to try again."
          />
        ) : plans.length === 0 ? (
          <EmptyState
            icon={CalendarCheck2}
            title={
              hasProperties
                ? 'No preventive care plans yet'
                : 'Add a property before creating a care plan'
            }
            description={
              hasProperties
                ? 'Create recurring care for systems like water, power, security, appliances, and internet.'
                : 'Care plans are tied to a property so the work, spend, and service history stay auditable.'
            }
            action={
              hasProperties ? (
                <Button size="sm" rounded="md" onClick={() => setIsCreateOpen(true)}>
                  Create the first plan
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="divide-y divide-border">
              {plans.map((plan) => {
                const status = planStatus[plan.status];
                const due = planIsDue(plan);
                const dueSoon = planIsDueSoon(plan);

                return (
                  <article
                    key={plan.id}
                    className="grid gap-4 px-5 py-5 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-foreground">{plan.title}</h3>
                        <Badge variant={due ? 'danger' : status.variant}>
                          {due ? 'Due now' : status.label}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {getPlanPropertyLabel(plan, properties)}
                        {plan.asset?.name ? ` · ${plan.asset.name}` : ''}
                        {plan.assignedVendor?.name ? ` · ${plan.assignedVendor.name}` : ''}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span className="rounded-full bg-secondary px-2.5 py-1">
                          {categories.find((category) => category.value === plan.category)?.label ??
                            plan.category}
                        </span>
                        <span className="rounded-full bg-secondary px-2.5 py-1">
                          Every {plan.frequencyDays} days
                        </span>
                        {plan.lastCompletedAt && (
                          <span className="rounded-full bg-secondary px-2.5 py-1">
                            Last completed {formatDate(plan.lastCompletedAt)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="rounded-xl bg-secondary/70 px-4 py-3 text-left lg:min-w-44 lg:text-right">
                      <p className="text-xs text-muted-foreground">Next service</p>
                      <p
                        className={
                          due
                            ? 'mt-1 font-semibold text-destructive'
                            : dueSoon
                              ? 'mt-1 font-semibold text-amber-700 dark:text-amber-400'
                              : 'mt-1 font-semibold text-foreground'
                        }
                      >
                        {formatDate(plan.nextDueAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 lg:justify-self-end">
                      {plan.status === 'ACTIVE' && (
                        <Button
                          size="sm"
                          variant="outline"
                          rounded="md"
                          icon={<CheckCircle2 className="h-4 w-4" />}
                          isLoading={completePlan.isPending && completePlan.variables === plan.id}
                          disabled={completePlan.isPending}
                          title="Record the care as complete and schedule the next service automatically"
                          onClick={() => completePlan.mutate(plan.id)}
                        >
                          Complete &amp; reschedule
                        </Button>
                      )}
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        {plan.status === 'PAUSED' ? (
                          <PauseCircle className="h-5 w-5" />
                        ) : (
                          <Wrench className="h-5 w-5" />
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

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={submitPlan} className="p-6">
            <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-foreground">
              Create a preventive care plan
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm text-muted-foreground">
              Establish a repeatable standard of care before a small maintenance need becomes an
              emergency.
            </DialogDescription>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Property" required>
                <Select
                  ariaLabel="Care plan property"
                  value={form.propertyId}
                  placeholder="Select a property"
                  onValueChange={(propertyId) =>
                    setForm((current) => ({
                      ...current,
                      propertyId,
                      unitId: '',
                      assetId: '',
                    }))
                  }
                  options={properties.map((property) => ({
                    value: property.id,
                    label: propertyLabel(property),
                  }))}
                />
              </Field>
              <Field
                label="Unit"
                hint={
                  !form.propertyId
                    ? 'Choose a property first.'
                    : unitsQuery.isLoading
                      ? 'Loading units. You can keep this plan at common-area level.'
                      : unitsQuery.isError
                        ? 'Units could not be loaded. You can still create common-area care.'
                        : units.length === 0
                          ? 'No units found. This plan will be tracked at common-area level.'
                          : 'Optional. Leave as common area for shared systems.'
                }
              >
                <Select
                  ariaLabel="Care plan unit"
                  value={form.unitId}
                  disabled={!form.propertyId}
                  placeholder={
                    !form.propertyId ? 'Choose a property first' : 'Common area / no unit'
                  }
                  onValueChange={(unitId) =>
                    setForm((current) => ({ ...current, unitId, assetId: '' }))
                  }
                  options={[
                    { value: '', label: 'Common area / no unit' },
                    ...units.map((unit) => ({ value: unit.id, label: unit.unitName })),
                  ]}
                />
              </Field>
              <Field
                label="Linked asset"
                hint={
                  !form.propertyId
                    ? 'Choose a property first.'
                    : availableAssets.length === 0
                      ? form.unitId
                        ? 'No active assets are registered for this unit.'
                        : 'No active common-area assets are registered for this property.'
                      : 'Optional, but useful for equipment history.'
                }
              >
                <Select
                  ariaLabel="Linked asset"
                  value={form.assetId}
                  disabled={!form.propertyId}
                  placeholder={form.propertyId ? 'No linked asset' : 'Choose a property first'}
                  onValueChange={(assetId) => setForm((current) => ({ ...current, assetId }))}
                  options={[
                    { value: '', label: 'No linked asset' },
                    ...availableAssets.map((asset) => ({ value: asset.id, label: asset.name })),
                  ]}
                />
              </Field>
              <Field label="Plan title" htmlFor="care-plan-title" required>
                <Input
                  id="care-plan-title"
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, title: event.target.value }))
                  }
                  placeholder="e.g. Quarterly inverter service"
                />
              </Field>
              <Field label="Care category" required>
                <Select
                  ariaLabel="Care category"
                  value={form.category}
                  onValueChange={(category) =>
                    setForm((current) => ({
                      ...current,
                      category: category as HomeManagementMaintenanceCategory,
                    }))
                  }
                  options={categories}
                />
              </Field>
              <Field
                label="Repeat every"
                htmlFor="care-plan-frequency"
                required
                hint="Number of days between services."
              >
                <Input
                  id="care-plan-frequency"
                  type="number"
                  min={1}
                  inputMode="numeric"
                  value={form.frequencyDays}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, frequencyDays: event.target.value }))
                  }
                  trailingIcon={<span className="text-xs">days</span>}
                />
              </Field>
              <Field label="First due date" required>
                <DatePicker
                  value={form.nextDueAt}
                  onChange={(value) => setForm((current) => ({ ...current, nextDueAt: value }))}
                />
              </Field>
              {vendors.length > 0 && (
                <Field label="Preferred vendor" hint="Optional">
                  <Select
                    ariaLabel="Preferred vendor"
                    value={form.assignedVendorId}
                    onValueChange={(assignedVendorId) =>
                      setForm((current) => ({ ...current, assignedVendorId }))
                    }
                    options={[
                      { value: '', label: 'Assign later' },
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
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-border pt-5">
              <Button
                type="button"
                variant="outline"
                rounded="md"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                rounded="md"
                isLoading={createPlan.isPending}
                disabled={
                  !form.propertyId ||
                  !form.title.trim() ||
                  !form.nextDueAt ||
                  Number(form.frequencyDays) < 1
                }
              >
                Create plan
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

function PlanSummary({
  icon,
  label,
  value,
  intent = 'default',
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  intent?: 'default' | 'urgent';
}) {
  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-3">
      <div
        className={
          intent === 'urgent'
            ? 'flex items-center gap-2 text-destructive'
            : 'flex items-center gap-2 text-muted-foreground'
        }
      >
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function PlanLoadingState() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="h-28 animate-pulse border-b border-border last:border-b-0" />
      ))}
    </div>
  );
}
