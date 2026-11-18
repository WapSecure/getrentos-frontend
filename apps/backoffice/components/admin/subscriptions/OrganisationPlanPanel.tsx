'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreditCard, Pencil } from '@sureground/icons';
import {
  Alert,
  Badge,
  Button,
  CardSkeleton,
  ConfirmDialog,
  CurrencyInput,
  DatePicker,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  NumberInput,
  Select,
  Textarea,
  useToast,
} from '@sureground/ui';
import { formatCurrency, formatDate, unwrap } from '@sureground/shared';
import { useAdminUser } from '@/app/(dashboard)/admin/layout';
import { hasAdminPermission } from '@/lib/adminAccess';
import { endOfLagosDay, lagosDayOf, planLabel, todayInLagos } from '@/lib/planDates';
import { adminSubscriptionService } from '@/services/adminSubscriptionService';
import type { PlanTier } from '@/types/admin';
import type { AdminOrganizationPlan, SetOrganizationPlanInput } from '@/types/subscription';

const TIER_OPTIONS: { value: PlanTier; label: string }[] = [
  { value: 'FREE', label: 'Free' },
  { value: 'PRO', label: 'Pro' },
  { value: 'ENTERPRISE', label: 'Enterprise' },
];

const planKey = (organizationId: string) => ['admin', 'organization-plan', organizationId];

export function OrganisationPlanPanel({
  organizationId,
  kind,
}: {
  organizationId: string;
  kind: 'agency' | 'estate';
}) {
  const user = useAdminUser();
  const canManage = hasAdminPermission(user?.roles, 'subscriptions.manage');
  const [editing, setEditing] = useState(false);

  const query = useQuery({
    queryKey: planKey(organizationId),
    queryFn: () => unwrap(adminSubscriptionService.getOrganizationPlan(organizationId)),
    throwOnError: false,
  });
  const plan = query.data;

  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-medium">
          <CreditCard className="h-4 w-4" /> Organisation plan
          {plan ? (
            <Badge variant={plan.tier === 'FREE' ? 'neutral' : 'primary'}>
              {planLabel(plan.tier)}
            </Badge>
          ) : null}
        </p>
        {canManage && plan ? (
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setEditing(true)}>
            <Pencil className="h-3.5 w-3.5" /> Edit plan
          </Button>
        ) : null}
      </div>

      {query.isLoading ? (
        <CardSkeleton lines={3} className="mt-3 border-0 p-0" />
      ) : query.isError || !plan ? (
        <Alert variant="danger" className="mt-3">
          Could not load the plan.{' '}
          <Button variant="link" className="h-auto p-0" onClick={() => query.refetch()}>
            Try again
          </Button>
        </Alert>
      ) : (
        <>
          {!plan.enforced ? (
            <p className="mt-2 text-xs text-muted-foreground">
              {kind === 'agency' ? 'Agency limits' : 'Plan limits'} are not applied yet
              {plan.enforcedFrom ? `. They apply from ${formatDate(plan.enforcedFrom)}` : ''}. Until
              then every organisation works as Enterprise, so the plan and limits shown here are
              Enterprise.
            </p>
          ) : null}
          <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm md:grid-cols-3">
            <PlanFact label="Seats" value={`${plan.seatsUsed} of ${plan.seats} used`} />
            {kind === 'agency' ? (
              <PlanFact label="Managed units" value={`${plan.unitsUsed} of ${plan.units} used`} />
            ) : null}
            <PlanFact label="Estates allowed" value={String(plan.estates)} />
            <PlanFact
              label="Agreed monthly price"
              value={
                plan.monthlyPriceKobo == null
                  ? 'Standard price'
                  : formatCurrency(plan.monthlyPriceKobo / 100)
              }
            />
            <PlanFact
              label="Ends"
              value={plan.currentPeriodEnd ? formatDate(plan.currentPeriodEnd) : 'No end date'}
            />
          </dl>
          {plan.notes ? (
            <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">{plan.notes}</p>
          ) : null}
        </>
      )}

      {editing && plan ? (
        <EditPlanDialog plan={plan} kind={kind} onClose={() => setEditing(false)} />
      ) : null}
    </div>
  );
}

function PlanFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  );
}

const toWhole = (value: string) => {
  const n = Number(value);
  return value.trim() && Number.isInteger(n) && n > 0 ? n : undefined;
};

function EditPlanDialog({
  plan,
  kind,
  onClose,
}: {
  plan: AdminOrganizationPlan;
  kind: 'agency' | 'estate';
  onClose: () => void;
}) {
  const client = useQueryClient();
  const toast = useToast();
  const [tier, setTier] = useState<PlanTier>(plan.tier);
  // Before limits apply the API reports Enterprise defaults, not the saved allowances.
  const known = (n: number) => (plan.enforced ? String(n) : '');
  const [seats, setSeats] = useState(known(plan.seats));
  const [units, setUnits] = useState(known(plan.units));
  const [estates, setEstates] = useState(known(plan.estates));
  const [priceNaira, setPriceNaira] = useState<number | ''>(
    plan.monthlyPriceKobo == null ? '' : Math.round(plan.monthlyPriceKobo / 100)
  );
  const [endDate, setEndDate] = useState(
    plan.currentPeriodEnd ? lagosDayOf(plan.currentPeriodEnd) : ''
  );
  const [notes, setNotes] = useState(plan.notes ?? '');
  const [confirming, setConfirming] = useState(false);

  const paid = tier !== 'FREE';
  const today = todayInLagos();
  const endDateInPast = paid && endDate !== '' && endDate < today;
  const invalidCount = [seats, kind === 'agency' ? units : '1', estates].some(
    (v) => v.trim() !== '' && toWhole(v) === undefined
  );

  const input: SetOrganizationPlanInput = {
    tier,
    seats: toWhole(seats),
    unitAllowance: kind === 'agency' ? toWhole(units) : undefined,
    estateAllowance: toWhole(estates),
    monthlyPriceKobo: priceNaira === '' ? undefined : priceNaira * 100,
    expiresAt: paid && endDate ? endOfLagosDay(endDate) : undefined,
    notes: notes.trim(),
  };

  const save = useMutation({
    mutationFn: () =>
      unwrap(adminSubscriptionService.setOrganizationPlan(plan.organizationId, input)),
    onSuccess: (updated) => {
      client.setQueryData(planKey(plan.organizationId), updated);
      toast.success('Plan saved.');
      setConfirming(false);
      onClose();
    },
    onError: (err: Error) => {
      setConfirming(false);
      toast.error(err.message || 'Could not save the plan.');
    },
  });

  const summary = [
    planLabel(tier),
    input.seats ? `${input.seats} seats` : 'default seats',
    kind === 'agency'
      ? input.unitAllowance
        ? `${input.unitAllowance} units`
        : 'default units'
      : null,
    input.estateAllowance ? `${input.estateAllowance} estates` : 'default estates',
    input.monthlyPriceKobo != null
      ? `${formatCurrency(input.monthlyPriceKobo / 100)} a month`
      : null,
    paid ? (endDate ? `ends ${formatDate(endDate)}` : 'no end date') : null,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <>
      <Dialog open={!confirming} onOpenChange={(open) => !open && onClose()}>
        <DialogContent size="lg">
          <DialogTitle className="font-semibold">Edit organisation plan</DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">
            {plan.organizationName}. Leave a limit empty to use the plan&apos;s default.
          </DialogDescription>
          <div className="mt-5 space-y-4">
            <Field label="Plan" required>
              <Select
                value={tier}
                onValueChange={(v) => {
                  setTier(v as PlanTier);
                  setSeats('');
                  setUnits('');
                  setEstates('');
                }}
                options={TIER_OPTIONS}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Seats">
                <NumberInput value={seats} onValueChange={setSeats} integer placeholder="Default" />
              </Field>
              {kind === 'agency' ? (
                <Field label="Managed units">
                  <NumberInput
                    value={units}
                    onValueChange={setUnits}
                    integer
                    placeholder="Default"
                  />
                </Field>
              ) : null}
              <Field label="Estates">
                <NumberInput
                  value={estates}
                  onValueChange={setEstates}
                  integer
                  placeholder="Default"
                />
              </Field>
            </div>
            {!plan.enforced ? (
              <Alert variant="info">
                Limits are not applied yet, so this form cannot show the plan saved before. Saving
                replaces it.
              </Alert>
            ) : null}
            {tier !== plan.tier ? (
              <p className="text-xs text-muted-foreground">
                Limits reset to the {planLabel(tier)} defaults. Enter numbers to agree different
                ones.
              </p>
            ) : null}
            {invalidCount ? (
              <p className="text-xs text-destructive">Limits must be whole numbers of 1 or more.</p>
            ) : null}
            <Field
              label="Agreed monthly price"
              optionalLabel="Optional"
              hint="In naira, VAT included. Leave empty for the standard price."
            >
              <CurrencyInput
                value={priceNaira}
                onValueChange={(v) => setPriceNaira(v)}
                prefix="₦"
                allowZero
                placeholder="Standard price"
              />
            </Field>
            {paid ? (
              <Field
                label="End date"
                optionalLabel="Optional"
                hint="Leave empty to keep the plan until someone changes it."
                error={endDateInPast ? 'Choose an end date in the future.' : undefined}
              >
                <DatePicker
                  value={endDate}
                  onChange={setEndDate}
                  min={today}
                  clearable
                  placeholder="No end date"
                />
              </Field>
            ) : null}
            <Field label="Notes" optionalLabel="Optional" hint="Only staff can see these.">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={2000}
                className="min-h-[80px]"
              />
            </Field>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => setConfirming(true)} disabled={invalidCount || endDateInPast}>
              Review change
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirming}
        onOpenChange={(open) => !open && !save.isPending && setConfirming(false)}
        title="Save this plan?"
        description={`${plan.organizationName} moves to ${summary}. The owner is told and the change is recorded in the audit trail.`}
        confirmLabel="Save plan"
        tone="primary"
        isLoading={save.isPending}
        onConfirm={() => (save.isPending ? undefined : save.mutateAsync())}
      />
    </>
  );
}
