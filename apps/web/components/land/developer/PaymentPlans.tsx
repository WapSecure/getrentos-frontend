'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge, Button, Card, ConfirmDialog, EmptyState } from '@getrentos/ui';
import { CalendarClock, Pencil, Plus, Power, PowerOff } from 'lucide-react';
import { unwrap } from '@/lib/apiHelpers';
import { formatCurrency } from '@/lib/format';
import { landDeveloperKeys } from '@/lib/landDeveloperQueryKeys';
import { landDeveloperService } from '@/services/landDeveloperService';
import type { LandPaymentPlan, LandPaymentPlanInput, OwnerLandLayout } from '@/types/landDeveloper';
import { errorMessage, type Notify } from './feedback';
import { formatBps, priceExample } from './planPricing';
import { PlanFormDialog } from './PlanFormDialog';

interface PaymentPlansProps {
  layout: OwnerLandLayout;
  notify: Notify;
}

const Term = ({ label, value }: { label: string; value: string }) => (
  <div>
    <dt className="text-xs text-muted-foreground">{label}</dt>
    <dd className="text-sm font-medium text-foreground">{value}</dd>
  </div>
);

/** The plans buyers can choose from, with an example on the cheapest available plot. */
export const PaymentPlans = ({ layout, notify }: PaymentPlansProps) => {
  const queryClient = useQueryClient();
  const propertyId = layout.propertyId;
  const [editing, setEditing] = useState<LandPaymentPlan | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [retiring, setRetiring] = useState<LandPaymentPlan | null>(null);
  const closed = layout.status === 'CLOSED';

  const { data: available } = useQuery({
    queryKey: landDeveloperKeys.plots(propertyId, { status: 'AVAILABLE' }),
    queryFn: () => unwrap(landDeveloperService.listPlots(propertyId, { status: 'AVAILABLE' })),
  });
  const samplePrice = useMemo(
    () => (available?.length ? Math.min(...available.map((plot) => plot.price)) : 0),
    [available]
  );

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: landDeveloperKeys.property(propertyId) });

  const save = useMutation({
    mutationFn: (input: LandPaymentPlanInput) =>
      editing
        ? unwrap(landDeveloperService.updatePlan(propertyId, editing.id, input))
        : unwrap(landDeveloperService.createPlan(propertyId, input)),
    onSuccess: (plan) => {
      refresh();
      setFormOpen(false);
      notify(editing ? `${plan.name} saved.` : `${plan.name} is now offered to buyers.`);
      setEditing(null);
    },
    onError: (reason) => notify(errorMessage(reason), 'error'),
  });

  const toggle = useMutation({
    mutationFn: ({ plan, active }: { plan: LandPaymentPlan; active: boolean }) =>
      unwrap(landDeveloperService.updatePlan(propertyId, plan.id, { active })),
    onSuccess: (plan) => {
      refresh();
      notify(plan.active ? `${plan.name} is offered again.` : `${plan.name} is no longer offered.`);
    },
    onError: (reason) => notify(errorMessage(reason), 'error'),
  });

  const plans = [...layout.paymentPlans].sort(
    (a, b) => Number(b.active) - Number(a.active) || a.durationMonths - b.durationMonths
  );

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-muted-foreground">
          Each purchase freezes the plan&apos;s terms when it starts, so editing or retiring a plan
          never changes a live contract.
          {samplePrice > 0 &&
            ` Examples use the cheapest available plot (${formatCurrency(samplePrice)}).`}
        </p>
        <Button
          variant="primary"
          rounded="lg"
          disabled={closed}
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          icon={<Plus className="h-4 w-4" />}
        >
          New plan
        </Button>
      </div>

      {plans.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="No payment plans yet"
          description="Offer at least one plan (outright or installments) before you publish the estate."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {plans.map((plan) => {
            const example =
              samplePrice > 0 ? priceExample(samplePrice, layout.fees.total, plan) : null;
            return (
              <Card key={plan.id} static className={`p-5 ${plan.active ? '' : 'opacity-70'}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-foreground">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {plan.durationMonths === 0
                        ? 'Outright purchase'
                        : `${plan.durationMonths} months, ${formatBps(plan.initialDepositBps)} deposit`}
                    </p>
                  </div>
                  <Badge variant={plan.active ? 'success' : 'neutral'}>
                    {plan.active ? 'Offered' : 'Retired'}
                  </Badge>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <Term label="Premium" value={formatBps(plan.priceUpliftBps)} />
                  <Term label="Grace" value={`${plan.gracePeriodDays} days`} />
                  <Term label="Late fee" value={formatBps(plan.lateFeeBps)} />
                  <Term label="Default after" value={`${plan.defaultAfterDays} days`} />
                  <Term label="Forfeiture" value={formatBps(plan.revocationChargeBps)} />
                </dl>
                {example && (
                  <p className="mt-4 rounded-lg bg-secondary/60 px-3 py-2 text-sm text-muted-foreground">
                    {example.durationMonths === 0 ? (
                      <>
                        Buyer pays{' '}
                        <span className="font-medium text-foreground">
                          {formatCurrency(example.totalPrice)}
                        </span>{' '}
                        up front.
                      </>
                    ) : (
                      <>
                        <span className="font-medium text-foreground">
                          {formatCurrency(example.initialPayment)}
                        </span>{' '}
                        to start, then{' '}
                        <span className="font-medium text-foreground">
                          {formatCurrency(example.monthlyInstallment)}
                        </span>{' '}
                        a month. Total {formatCurrency(example.totalPrice)}.
                      </>
                    )}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    rounded="lg"
                    disabled={closed}
                    onClick={() => {
                      setEditing(plan);
                      setFormOpen(true);
                    }}
                    icon={<Pencil className="h-4 w-4" />}
                  >
                    Edit
                  </Button>
                  {plan.active ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      rounded="lg"
                      onClick={() => setRetiring(plan)}
                      icon={<PowerOff className="h-4 w-4" />}
                    >
                      Stop offering
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      rounded="lg"
                      isLoading={toggle.isPending && toggle.variables?.plan.id === plan.id}
                      onClick={() => toggle.mutate({ plan, active: true })}
                      icon={<Power className="h-4 w-4" />}
                    >
                      Offer again
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <PlanFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        plan={editing}
        fees={layout.fees.total}
        samplePlotPrice={samplePrice}
        isSaving={save.isPending}
        onSubmit={(input) => save.mutate(input)}
      />

      <ConfirmDialog
        open={retiring !== null}
        onOpenChange={(open) => !open && setRetiring(null)}
        title={retiring ? `Stop offering ${retiring.name}?` : 'Stop offering plan?'}
        description="New buyers will not be able to choose this plan. Purchases already on it continue on their agreed terms. A published estate must keep at least one plan on offer."
        confirmLabel="Stop offering"
        isLoading={toggle.isPending}
        onConfirm={async () => {
          if (!retiring) return;
          try {
            await toggle.mutateAsync({ plan: retiring, active: false });
          } catch {
            // Reported by onError.
          }
        }}
      />
    </section>
  );
};
