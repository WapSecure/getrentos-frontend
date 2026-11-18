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
import {
  endOfLagosDay,
  initialStaffGrantDay,
  isStaffGrantDayAllowed,
  latestStaffGrantDay,
  MAX_GRANT_REASON,
  MIN_GRANT_REASON,
  planLabel,
  tomorrowInLagos,
} from '@/lib/planDates';
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
              then every organisation works as Enterprise, so the limits in use are Enterprise.
            </p>
          ) : null}
          <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            In use now
          </p>
          <dl className="mt-1 grid grid-cols-2 gap-x-6 gap-y-2 text-sm md:grid-cols-3">
            <PlanFact label="Plan" value={planLabel(plan.tier)} />
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
          <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Saved plan
          </p>
          {plan.saved ? (
            <dl className="mt-1 grid grid-cols-2 gap-x-6 gap-y-2 text-sm md:grid-cols-3">
              <PlanFact label="Plan" value={planLabel(plan.saved.tier)} />
              <PlanFact label="Seats" value={limitLabel(plan.saved.seats)} />
              {kind === 'agency' ? (
                <PlanFact label="Managed units" value={limitLabel(plan.saved.unitAllowance)} />
              ) : null}
              <PlanFact label="Estates" value={limitLabel(plan.saved.estateAllowance)} />
            </dl>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">
              Nothing saved. The organisation is on Free with default limits.
            </p>
          )}
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

const limitLabel = (value: number | null) => (value == null ? 'Default' : `${value} (custom)`);

const asField = (value: number | null | undefined) => (value == null ? '' : String(value));

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
  const savedTier: PlanTier = plan.saved?.tier ?? 'FREE';
  const [tier, setTier] = useState<PlanTier>(savedTier);
  const [seats, setSeats] = useState(asField(plan.saved?.seats));
  const [units, setUnits] = useState(asField(plan.saved?.unitAllowance));
  const [estates, setEstates] = useState(asField(plan.saved?.estateAllowance));
  const [priceNaira, setPriceNaira] = useState<number | ''>(
    plan.monthlyPriceKobo == null ? '' : Math.round(plan.monthlyPriceKobo / 100)
  );
  const [endDate, setEndDate] = useState(() => initialStaffGrantDay(plan.currentPeriodEnd));
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState(plan.notes ?? '');
  const [confirming, setConfirming] = useState(false);

  const paid = tier !== 'FREE';
  const endDateInvalid = paid && !isStaffGrantDayAllowed(endDate);
  const reasonInvalid = reason.trim().length < MIN_GRANT_REASON;
  const invalidCount =
    paid && [seats, units, estates].some((v) => v.trim() !== '' && toWhole(v) === undefined);

  // Free carries no limits; the server clears them.
  const input: SetOrganizationPlanInput = {
    tier,
    seats: paid ? toWhole(seats) : undefined,
    unitAllowance: paid ? toWhole(units) : undefined,
    estateAllowance: paid ? toWhole(estates) : undefined,
    monthlyPriceKobo: priceNaira === '' ? undefined : priceNaira * 100,
    expiresAt: paid && endDate ? endOfLagosDay(endDate) : undefined,
    reason: reason.trim(),
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
    paid ? (input.seats ? `${input.seats} seats` : 'default seats') : null,
    paid && kind === 'agency'
      ? input.unitAllowance
        ? `${input.unitAllowance} units`
        : 'default units'
      : null,
    paid ? (input.estateAllowance ? `${input.estateAllowance} estates` : 'default estates') : null,
    input.monthlyPriceKobo != null
      ? `${formatCurrency(input.monthlyPriceKobo / 100)} a month`
      : null,
    paid && endDate ? `ends ${formatDate(endDate)}` : null,
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
            {paid ? (
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Seats">
                  <NumberInput
                    value={seats}
                    onValueChange={setSeats}
                    integer
                    placeholder="Default"
                  />
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
            ) : (
              <p className="text-xs text-muted-foreground">Free uses the default limits.</p>
            )}
            {paid && tier !== savedTier ? (
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
                required
                hint="A plan granted by staff must end within 12 months."
                error={
                  endDate && endDateInvalid
                    ? 'Choose a date from tomorrow up to 12 months from today.'
                    : undefined
                }
              >
                <DatePicker
                  value={endDate}
                  onChange={setEndDate}
                  min={tomorrowInLagos()}
                  max={latestStaffGrantDay()}
                  placeholder="Choose an end date"
                />
              </Field>
            ) : null}
            <Field
              label="Reason"
              required
              hint={`Recorded in the audit trail. At least ${MIN_GRANT_REASON} characters.`}
            >
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={MAX_GRANT_REASON}
                placeholder="Why this plan is changing"
                className="min-h-[60px]"
              />
            </Field>
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
            <Button
              onClick={() => setConfirming(true)}
              disabled={invalidCount || endDateInvalid || reasonInvalid}
            >
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
