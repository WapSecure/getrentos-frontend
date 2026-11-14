'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, Plus, ReceiptText } from '@sureground/icons';
import {
  SERVICE_CHARGE_CYCLE_LABELS,
  SERVICE_CHARGE_STATUS_LABELS,
  dayAfter,
  formatCurrency,
  type ServiceChargeBillingCycle,
  type ServiceChargeBudgetStatus,
  type ServiceChargeMethod,
} from '@sureground/shared';
import {
  Badge,
  Button,
  Card,
  DatePicker,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  EmptyState,
  Field,
  Input,
  SegmentedControl,
  Select,
  Skeleton,
  type BadgeVariant,
} from '@sureground/ui';
import { HomeManagementSectionHeading } from '@/components/home-management/HomeManagementSectionHeading';
import { unwrap } from '@/lib/apiHelpers';
import { homeManagementKeys } from '@/lib/queryKeys';
import type { HomeManagementProperty } from '@/services/homeManagementService';
import { serviceChargesService } from '@/services/serviceChargesService';
import { ServiceChargeBudgetView } from './ServiceChargeBudgetView';
import { propertyName } from './utilityForm';

export const STATUS_BADGE: Record<ServiceChargeBudgetStatus, BadgeVariant> = {
  DRAFT: 'neutral',
  PUBLISHED: 'success',
  CLOSED: 'info',
  VOIDED: 'danger',
};

/** A `YYYY-MM-DD` day as "1 Jan 2027", read at midday so no time zone moves it to another day. */
export function formatDay(day: string): string {
  return new Date(`${day}T12:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

interface ServiceChargePanelProps {
  propertyId?: string;
  properties: HomeManagementProperty[];
}

/** Service-charge budgets: set one up, check every unit's share, publish it, then follow what was billed. */
export function ServiceChargePanel({ propertyId, properties }: ServiceChargePanelProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const budgets = useQuery({
    queryKey: homeManagementKeys.utilities.serviceCharges(propertyId),
    queryFn: () => unwrap(serviceChargesService.list({ propertyId })),
  });

  if (openId) {
    return <ServiceChargeBudgetView budgetId={openId} onBack={() => setOpenId(null)} />;
  }

  const items = budgets.data?.items ?? [];
  return (
    <section aria-labelledby="service-charge-heading" className="space-y-5">
      <HomeManagementSectionHeading
        id="service-charge-heading"
        title="Service charge"
        description="Set a yearly budget for shared costs like diesel, security and cleaning. Each unit's share is billed to its tenant with their rent; a vacant unit's share is the owner's."
        actions={
          <Button onClick={() => setCreating(true)} icon={<Plus className="h-4 w-4" />}>
            New budget
          </Button>
        }
      />

      {budgets.isLoading ? (
        <Skeleton className="h-40 w-full rounded-2xl" />
      ) : budgets.isError ? (
        <EmptyState
          icon={ReceiptText}
          title="Budgets could not be loaded"
          description="Refresh the page to try again."
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title="No service charge budgets yet"
          description="Start a budget, add its lines and check each unit's share before anything is billed."
          action={<Button onClick={() => setCreating(true)}>New budget</Button>}
        />
      ) : (
        <ul className="space-y-3">
          {items.map((budget) => (
            <li key={budget.id}>
              <button
                type="button"
                onClick={() => setOpenId(budget.id)}
                className="w-full cursor-pointer text-left"
              >
                <Card className="flex items-center gap-4 rounded-2xl p-4 transition-colors hover:bg-secondary/60">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-foreground">{budget.title}</p>
                      <Badge variant={STATUS_BADGE[budget.status]}>
                        {SERVICE_CHARGE_STATUS_LABELS[budget.status]}
                      </Badge>
                    </div>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {budget.property.title} · {formatDay(budget.periodStart)} to{' '}
                      {formatDay(lastDayOf(budget.periodEnd))} ·{' '}
                      {SERVICE_CHARGE_CYCLE_LABELS[budget.billingCycle]}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{formatCurrency(budget.total)}</p>
                    <p className="text-xs text-muted-foreground">
                      {budget.unitsSharing} {budget.unitsSharing === 1 ? 'unit' : 'units'}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </Card>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent size="lg">
          <CreateBudgetForm
            properties={properties}
            defaultPropertyId={propertyId}
            onCreated={(id) => {
              setCreating(false);
              setOpenId(id);
            }}
          />
        </DialogContent>
      </Dialog>
    </section>
  );
}

/** The server's exclusive end, as the last day covered. */
function lastDayOf(periodEnd: string): string {
  const date = new Date(`${periodEnd}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

function CreateBudgetForm({
  properties,
  defaultPropertyId,
  onCreated,
}: {
  properties: HomeManagementProperty[];
  defaultPropertyId?: string;
  onCreated: (id: string) => void;
}) {
  const queryClient = useQueryClient();
  const nextYear = new Date().getFullYear() + 1;
  const [propertyId, setPropertyId] = useState(
    defaultPropertyId || (properties.length === 1 ? properties[0].id : '')
  );
  const [title, setTitle] = useState(`Service charge ${nextYear}`);
  const [start, setStart] = useState(`${nextYear}-01-01`);
  const [lastDay, setLastDay] = useState(`${nextYear}-12-31`);
  const [cycle, setCycle] = useState<ServiceChargeBillingCycle>('ANNUAL');
  const [method, setMethod] = useState<ServiceChargeMethod>('EQUAL');
  const valid =
    !!propertyId && title.trim().length >= 3 && !!start && !!lastDay && lastDay >= start;

  const create = useMutation({
    mutationFn: () =>
      unwrap(
        serviceChargesService.create({
          propertyId,
          title: title.trim(),
          periodStart: start,
          periodEnd: dayAfter(lastDay),
          billingCycle: cycle,
          method,
        })
      ),
    onSuccess: (budget) => {
      void queryClient.invalidateQueries({ queryKey: homeManagementKeys.utilities.all });
      onCreated(budget.id);
    },
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (valid) create.mutate();
      }}
    >
      <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-foreground">
        New service charge budget
      </DialogTitle>
      <DialogDescription className="mt-1 text-sm text-muted-foreground">
        Every unit on the property is added to share it. You add the lines and check each
        unit&apos;s share next; nothing is billed until you publish.
      </DialogDescription>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Field label="Property" required className="md:col-span-2">
          <Select
            ariaLabel="Property"
            value={propertyId}
            onValueChange={setPropertyId}
            placeholder="Select a property"
            options={properties.map((property) => ({
              value: property.id,
              label: propertyName(property),
            }))}
          />
        </Field>
        <Field label="Name" required className="md:col-span-2">
          <Input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} />
        </Field>
        <Field label="Covers from" required>
          <DatePicker value={start} onChange={setStart} ariaLabel="Covers from" />
        </Field>
        <Field label="Last day covered" required>
          <DatePicker
            value={lastDay}
            onChange={setLastDay}
            min={start}
            ariaLabel="Last day covered"
          />
        </Field>
        <Field label="Billed" required>
          <Select
            ariaLabel="Billed"
            value={cycle}
            onValueChange={(value) => setCycle(value as ServiceChargeBillingCycle)}
            options={(['ANNUAL', 'QUARTERLY', 'MONTHLY'] as const).map((value) => ({
              value,
              label: SERVICE_CHARGE_CYCLE_LABELS[value],
            }))}
          />
        </Field>
        <Field label="Shared" required>
          <SegmentedControl
            aria-label="How the budget is shared"
            value={method}
            onValueChange={setMethod}
            segments={[
              { value: 'EQUAL', label: 'Equally' },
              { value: 'WEIGHTED', label: 'By weight' },
            ]}
          />
        </Field>
      </div>
      {create.error && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {create.error.message}
        </p>
      )}
      <div className="mt-6 flex justify-end gap-2">
        <Button type="submit" disabled={!valid} isLoading={create.isPending}>
          Create budget
        </Button>
      </div>
    </form>
  );
}
