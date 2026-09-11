'use client';

import { useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { formatCurrency } from '@getrentos/shared';
import type { BillingCycle, PlanPricing } from '@/services/subscriptionService';

const naira = (kobo: number) => formatCurrency(kobo / 100);

/**
 * The Pro offer card: price (monthly/annual), trial and CTA. Reads its numbers
 * from the backend pricing catalog so the displayed price always equals the
 * charged price. `onUpgrade` (wired to checkout) takes precedence; when absent
 * it falls back to the contact-us CTA.
 */
export function ProPriceCard({
  pricing,
  isPro = false,
  onUpgrade,
  upgrading = false,
}: {
  pricing?: PlanPricing;
  isPro?: boolean;
  onUpgrade?: (cycle: BillingCycle) => void;
  upgrading?: boolean;
}) {
  const [cycle, setCycle] = useState<BillingCycle>('MONTHLY');

  if (!pricing) {
    return <div className="h-40 animate-pulse rounded-2xl border border-border bg-card" />;
  }

  const amount = cycle === 'ANNUAL' ? pricing.annualKobo : pricing.monthlyKobo;
  // What we take purely to prove the card works; refunded immediately.
  const capture = pricing.trialTokenizeKobo ? naira(pricing.trialTokenizeKobo) : null;

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-primary">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold text-foreground">GetRentos Pro</p>
          <p className="text-xs text-muted-foreground">
            {pricing.trialDays}-day free trial · cancel anytime
          </p>
        </div>
        {isPro && (
          <span className="ml-auto rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            Current plan
          </span>
        )}
      </div>

      <div className="mt-5 flex items-baseline gap-1">
        <span className="text-3xl font-bold tracking-tight text-foreground">{naira(amount)}</span>
        <span className="text-sm text-muted-foreground">
          /{cycle === 'ANNUAL' ? 'year' : 'month'}
        </span>
        {cycle === 'ANNUAL' && pricing.annualSavingPercent > 0 && (
          <span className="ml-2 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            Save {pricing.annualSavingPercent}%
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {pricing.currency}
        {pricing.vatInclusive
          ? ' · VAT included — no surprises at checkout'
          : ' · VAT added at checkout'}
      </p>

      <div className="mt-4 inline-flex rounded-lg border border-border bg-card p-1 text-sm">
        {(['MONTHLY', 'ANNUAL'] as const).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCycle(c)}
            className={
              cycle === c
                ? 'rounded-md bg-primary px-3 py-1.5 font-medium text-primary-foreground'
                : 'rounded-md px-3 py-1.5 text-muted-foreground hover:bg-secondary'
            }
          >
            {c === 'MONTHLY' ? 'Monthly' : 'Annual'}
          </button>
        ))}
      </div>

      {!isPro && (
        <div className="mt-5">
          {onUpgrade ? (
            <Button
              variant="primary"
              fullWidth
              disabled={upgrading}
              onClick={() => onUpgrade(cycle)}
            >
              {upgrading ? 'Starting checkout…' : `Start ${pricing.trialDays}-day free trial`}
            </Button>
          ) : (
            <Button
              variant="primary"
              fullWidth
              href="mailto:hello@getrentos.com?subject=Upgrade%20to%20Pro"
            >
              Contact us to upgrade
            </Button>
          )}
          <p className="mt-2 flex items-start justify-center gap-1.5 text-center text-xs text-muted-foreground">
            <Check className="mt-0.5 h-3 w-3 shrink-0" />
            <span>
              {capture
                ? `We take ${capture} now just to verify your card, refund it straight away, and ${naira(
                    amount
                  )} only starts when your trial ends.`
                : `Card required — ${naira(amount)} starts when your trial ends.`}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
