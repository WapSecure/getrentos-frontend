'use client';

import { useState } from 'react';
import { AlertTriangle, CalendarClock, Sparkles } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { formatCurrency } from '@getrentos/shared';
import type { MyBilling } from '@/services/billingService';
import { useManageSubscription } from '@/hooks/useBilling';

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

/**
 * Shows the live state of the customer's Pro plan and lets them stop or resume
 * the renewal.
 *
 * Cancelling never removes access early — the copy states the exact date and
 * amount so there is no ambiguity about what happens next.
 */
export function ManageSubscriptionCard({ billing }: { billing?: MyBilling }) {
  const { cancel, reactivate, pending } = useManageSubscription();
  const [confirming, setConfirming] = useState(false);

  if (!billing?.isActive) return null;

  const price = naira(billing.priceKobo);
  const perPeriod = billing.cycle === 'ANNUAL' ? 'year' : 'month';
  const trialEnd = asDate(billing.trialEndsAt);
  const periodEnd = asDate(billing.currentPeriodEnd);
  const isTrialing = billing.status === 'TRIALING';
  const isPastDue = billing.status === 'PAST_DUE';
  const error = cancel.error ?? reactivate.error;

  // A trial always shows its trial date; the cancelled state is carried by the
  // detail line, which must stop promising a charge that will not happen.
  const headline = isTrialing
    ? `Trial ends ${trialEnd}`
    : billing.cancelAtPeriodEnd
      ? `Pro ends ${periodEnd}`
      : `Pro renews ${periodEnd}`;

  // Cancelling a trial always ends access at the trial end (the first charge is
  // cancelled with it); otherwise access runs to the end of the paid period.
  const accessEnds = isTrialing ? trialEnd : periodEnd;

  const detail = isPastDue
    ? `We couldn't take your last payment. Pro ends ${periodEnd} unless the card on file goes through.`
    : billing.cancelAtPeriodEnd
      ? isTrialing
        ? `Cancelled — your trial won't convert and nothing will be charged. You keep Pro until ${trialEnd}.`
        : `Your plan won't renew — you keep Pro until ${periodEnd}, then move to Free.`
      : isTrialing
        ? `We'll charge ${price} on ${trialEnd}. Cancel before then and you won't be charged.`
        : `We'll charge ${price} per ${perPeriod} on ${periodEnd}. Cancel any time and you keep Pro until then.`;

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-start gap-3">
        <div
          className={
            isPastDue
              ? 'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400'
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
            <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3" /> Test mode — no real payment is taken
            </p>
          )}
        </div>
      </div>

      {error instanceof Error && (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {error.message}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {billing.cancelAtPeriodEnd ? (
          <Button variant="primary" disabled={pending} onClick={() => reactivate.mutate()}>
            {pending ? 'Resuming…' : 'Resume plan'}
          </Button>
        ) : confirming ? (
          <>
            <Button
              variant="danger"
              disabled={pending}
              onClick={() => {
                setConfirming(false);
                cancel.mutate();
              }}
            >
              {pending ? 'Cancelling…' : 'Yes, cancel at period end'}
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

      {confirming && (
        <p className="mt-3 text-xs text-muted-foreground">
          You&apos;ll keep Pro until {accessEnds} — nothing is charged after that.
        </p>
      )}
    </div>
  );
}
