'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  SegmentedControl,
  Skeleton,
} from '@sureground/ui';
import { formatCurrency } from '@sureground/shared';
import { unwrap } from '@/lib/apiHelpers';
import { formatDate } from '@/lib/format';
import { estateKeys } from '@/lib/queryKeys';
import {
  estatePlanService,
  type EstatePlan,
  type EstateProCycle,
} from '@/services/estatePlanService';

const naira = (kobo: number) => formatCurrency(kobo / 100);

export const estatePlanKey = (estateId: string) => ['estate', estateId, 'plan'] as const;

/** Renders nothing until Estate Pro is switched on, or on an API without the plan endpoint. */
export function EstateProCard({ estateId }: { estateId: string }) {
  const plan = useQuery({
    queryKey: estatePlanKey(estateId),
    queryFn: () => unwrap(estatePlanService.get(estateId)),
    retry: false,
  });
  if (plan.isPending) return <Skeleton className="h-40" />;
  if (!plan.data?.billing.available) return null;
  return <EstateProBody estateId={estateId} plan={plan.data} />;
}

function EstateProBody({ estateId, plan }: { estateId: string; plan: EstatePlan }) {
  const queryClient = useQueryClient();
  const [cycle, setCycle] = useState<EstateProCycle>('MONTHLY');
  const [confirmCancel, setConfirmCancel] = useState(false);
  const b = plan.billing;
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: estatePlanKey(estateId) });
    void queryClient.invalidateQueries({ queryKey: estateKeys.myEstates });
  };

  const checkout = useMutation({
    mutationFn: () => unwrap(estatePlanService.checkout(estateId, cycle)),
    onSuccess: ({ authorizationUrl }) => window.location.assign(authorizationUrl),
  });
  const cancel = useMutation({
    mutationFn: () => unwrap(estatePlanService.cancel(estateId)),
    onSuccess: () => {
      setConfirmCancel(false);
      refresh();
    },
  });
  const reactivate = useMutation({
    mutationFn: () => unwrap(estatePlanService.reactivate(estateId)),
    onSuccess: refresh,
  });

  const price = cycle === 'ANNUAL' ? b.prices.annualKobo : b.prices.monthlyKobo;
  const error = checkout.error ?? cancel.error ?? reactivate.error;

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-foreground">Estate Pro</h2>
        {b.inForce && (
          <Badge variant={b.status === 'PAST_DUE' ? 'warning' : 'primary'}>
            {b.status === 'TRIALING'
              ? 'Free trial'
              : b.status === 'PAST_DUE'
                ? 'Payment due'
                : 'Active'}
          </Badge>
        )}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Pro tools for this estate, billed to the estate rather than anyone&apos;s personal plan, for
        up to {b.prices.maxHouseholds} households. {naira(b.prices.monthlyKobo)} a month or{' '}
        {naira(b.prices.annualKobo)} a year.
      </p>

      <p className="mt-3 text-sm text-foreground">
        {plan.householdCap === null
          ? `${plan.households} households`
          : `${plan.households} of ${plan.householdCap} households`}
      </p>

      {plan.carryOverEndsAt && !b.inForce && plan.tier !== 'FREE' && (
        <Alert variant="info" className="mt-4">
          Your personal Pro plan covers this estate until {formatDate(plan.carryOverEndsAt)}. Move
          it to Estate Pro before then to keep its Pro tools.
        </Alert>
      )}

      {b.inForce ? (
        <div className="mt-4 space-y-3 text-sm">
          <p className="text-foreground">
            {b.status === 'TRIALING' && b.trialEndsAt
              ? `Free until ${formatDate(b.trialEndsAt)}, then ${naira(b.priceKobo ?? b.prices.monthlyKobo)} ${b.cycle === 'ANNUAL' ? 'a year' : 'a month'}.`
              : b.cancelAtPeriodEnd && b.currentPeriodEnd
                ? `Cancelled. Estate Pro ends on ${formatDate(b.currentPeriodEnd)}.`
                : b.status === 'PAST_DUE'
                  ? 'The last payment failed. Update the card on your Paystack receipt email within 7 days to keep Estate Pro.'
                  : b.currentPeriodEnd
                    ? `Renews on ${formatDate(b.currentPeriodEnd)}.`
                    : 'Active.'}
          </p>
          {plan.canManageBilling ? (
            b.cancelAtPeriodEnd ? (
              <Button
                variant="primary"
                isLoading={reactivate.isPending}
                onClick={() => reactivate.mutate()}
              >
                Keep Estate Pro
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setConfirmCancel(true)}>
                Cancel Estate Pro
              </Button>
            )
          ) : (
            <p className="text-muted-foreground">
              Only the estate&apos;s owner can change its plan.
            </p>
          )}
        </div>
      ) : plan.canManageBilling ? (
        <div className="mt-4 space-y-3">
          <SegmentedControl
            aria-label="Billing period"
            value={cycle}
            onValueChange={setCycle}
            segments={[
              { value: 'MONTHLY', label: `Monthly, ${naira(b.prices.monthlyKobo)}` },
              { value: 'ANNUAL', label: `Yearly, ${naira(b.prices.annualKobo)}` },
            ]}
          />
          <Button
            variant="primary"
            isLoading={checkout.isPending}
            onClick={() => checkout.mutate()}
          >
            {b.trialAvailable
              ? `Start a ${b.prices.trialDays}-day free trial`
              : `Move to Estate Pro for ${naira(price)}`}
          </Button>
          {b.trialAvailable && (
            <p className="text-xs text-muted-foreground">
              We take a small refundable amount to check the card, and charge {naira(price)} when
              the trial ends unless you cancel.
            </p>
          )}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          Only the estate&apos;s owner can change its plan.
        </p>
      )}

      {error && (
        <Alert variant="danger" className="mt-4">
          {error.message}
        </Alert>
      )}

      {b.status !== 'NONE' && <EstateProReceipts estateId={estateId} />}

      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="Cancel Estate Pro?"
        description={
          b.currentPeriodEnd
            ? `It stays on until ${formatDate(b.currentPeriodEnd)}, then this estate moves to Free (30 households).`
            : 'This estate moves to Free at the end of the paid period.'
        }
        confirmLabel="Cancel Estate Pro"
        tone="danger"
        isLoading={cancel.isPending}
        onConfirm={() => cancel.mutate()}
      />
    </Card>
  );
}

function EstateProReceipts({ estateId }: { estateId: string }) {
  const receipts = useQuery({
    queryKey: [...estatePlanKey(estateId), 'receipts'],
    queryFn: () => unwrap(estatePlanService.receipts(estateId)),
    retry: false,
  });
  const items = receipts.data?.items ?? [];
  if (items.length === 0) return null;
  return (
    <div className="mt-6 border-t border-border pt-4">
      <h3 className="text-sm font-semibold text-foreground">Payments</h3>
      <ul className="mt-2 divide-y divide-border text-sm">
        {items.map((receipt) => (
          <li key={receipt.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
            <div className="min-w-0">
              <p className="text-foreground">{receipt.description}</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(receipt.paidAt ?? receipt.createdAt)} · {receipt.number}
              </p>
            </div>
            <p className="tabular-nums text-foreground">
              {naira(receipt.amountKobo)}
              {receipt.status !== 'PAID' && (
                <span className="ml-2 text-xs text-muted-foreground">
                  {receipt.status === 'REFUNDED' ? 'Refunded' : 'Failed'}
                </span>
              )}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
