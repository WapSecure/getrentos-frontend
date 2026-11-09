'use client';

import { useState } from 'react';
import { AlertTriangle, CalendarClock, BadgeCheck } from 'lucide-react';
import { Alert, Badge, Button, Card } from '@sureground/ui';
import { formatCurrency } from '@sureground/shared';
import type { MyBilling } from '@/services/billingService';
import { useCardUpdateLink, useManageSubscription } from '@/hooks/useBilling';

const naira = (kobo: number | null | undefined) =>
  kobo == null ? null : formatCurrency(kobo / 100);

const asDate = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

export function ManageSubscriptionCard({ billing }: { billing?: MyBilling }) {
  const { cancel, reactivate, pending } = useManageSubscription();
  const cardUpdate = useCardUpdateLink();
  const [confirming, setConfirming] = useState(false);

  if (!billing?.isActive) return null;

  const price = naira(billing.priceKobo);
  const perPeriod = billing.cycle === 'ANNUAL' ? 'year' : 'month';
  const trialEnd = asDate(billing.trialEndsAt);
  const periodEnd = asDate(billing.currentPeriodEnd);
  const isTrialing = billing.status === 'TRIALING';
  const isPastDue = billing.status === 'PAST_DUE';
  const error = cancel.error ?? reactivate.error ?? cardUpdate.error;

  /** A comped or simulated Pro grant has no cycle, price or period end: never promise a charge or date, or interpolate a raw `null`. */
  const isBilled = Boolean(price && periodEnd);

  // A trial always shows its trial date; when cancelled, the detail line must stop promising a charge.
  const headline = isTrialing
    ? trialEnd
      ? `Trial ends ${trialEnd}`
      : 'Pro trial active'
    : billing.cancelAtPeriodEnd
      ? periodEnd
        ? `Pro ends ${periodEnd}`
        : 'Pro ends at the end of this period'
      : periodEnd
        ? `Pro renews ${periodEnd}`
        : 'Pro is active on your account';

  // Cancelling a trial ends access at the trial end (the first charge goes with it); otherwise access runs to the end of the paid period.
  const accessEnds = isTrialing ? trialEnd : periodEnd;

  const detail = isPastDue
    ? periodEnd
      ? `We couldn't take your last payment. Pro ends ${periodEnd} unless the card on file goes through.`
      : "We couldn't take your last payment. Update the card on file to keep Pro."
    : billing.cancelAtPeriodEnd
      ? isTrialing
        ? `Cancelled: your trial won't convert and nothing will be charged.${trialEnd ? ` You keep Pro until ${trialEnd}.` : ''}`
        : periodEnd
          ? `Your plan won't renew: you keep Pro until ${periodEnd}, then move to Free.`
          : "Your plan won't renew: you'll move to Free when the current period ends."
      : isTrialing
        ? trialEnd
          ? `We'll charge ${price ?? 'the plan price'} on ${trialEnd}. Cancel before then and you won't be charged.`
          : 'Your trial is active. Cancel before it ends and you won’t be charged.'
        : isBilled
          ? `We'll charge ${price} per ${perPeriod} on ${periodEnd}. Cancel any time and you keep Pro until then.`
          : 'No card charge is scheduled for this plan.';

  const storeManaged = billing.managedBy === 'app_store' || billing.managedBy === 'play_store';
  const storeName = billing.managedBy === 'play_store' ? 'Google Play' : 'App Store';

  return (
    <Card className="p-6">
      <div className="flex items-start gap-3">
        <div
          className={
            isPastDue
              ? 'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning-subtle text-warning'
              : 'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary'
          }
        >
          {isPastDue ? (
            <AlertTriangle className="h-5 w-5" />
          ) : (
            <CalendarClock className="h-5 w-5" />
          )}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-foreground">{headline}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{detail}</p>
          {billing.simulated && (
            <p className="mt-2">
              <Badge
                variant="neutral"
                icon={<BadgeCheck className="h-3 w-3" />}
                className="whitespace-normal"
              >
                Test mode: no real payment is taken
              </Badge>
            </p>
          )}
        </div>
      </div>

      {error instanceof Error && (
        <Alert variant="danger" className="mt-4">
          {error.message}
        </Alert>
      )}

      {storeManaged ? (
        // Bought in the mobile app: Apple/Google bill it, so it's changed there.
        <p className="mt-5 text-sm text-muted-foreground">
          You subscribed in the {storeName} app. Manage, update payment for or cancel Pro in your{' '}
          {storeName} subscription settings.
        </p>
      ) : (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          {isPastDue && !billing.cancelAtPeriodEnd && (
            <Button
              variant="primary"
              isLoading={cardUpdate.opening}
              loadingText="Opening…"
              onClick={cardUpdate.openCardUpdate}
            >
              Update card
            </Button>
          )}

          {billing.cancelAtPeriodEnd ? (
            <Button
              variant="primary"
              isLoading={pending}
              loadingText="Resuming…"
              onClick={() => reactivate.mutate()}
            >
              Resume plan
            </Button>
          ) : confirming ? (
            <>
              <Button
                variant="danger"
                isLoading={pending}
                loadingText="Cancelling…"
                onClick={() => {
                  setConfirming(false);
                  cancel.mutate();
                }}
              >
                Yes, cancel at period end
              </Button>
              <Button variant="ghost" disabled={pending} onClick={() => setConfirming(false)}>
                Keep my plan
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setConfirming(true)}>
              Cancel plan
            </Button>
          )}
        </div>
      )}

      {confirming && (
        <p className="mt-3 text-xs text-muted-foreground">
          You&apos;ll keep Pro until {accessEnds}: nothing is charged after that.
        </p>
      )}
    </Card>
  );
}
