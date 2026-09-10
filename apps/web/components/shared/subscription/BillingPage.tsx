'use client';

import { Sparkles } from 'lucide-react';
import { usePlanTier } from '@/hooks/usePlanTier';
import { usePlanPricing } from '@/hooks/usePlanPricing';
import { useProCheckout } from '@/hooks/useProCheckout';
import { useBilling } from '@/hooks/useBilling';
import { PlanBadge } from '@/components/shared/subscription/PlanBadge';
import { PlanComparisonTable } from '@/components/shared/subscription/PlanComparisonTable';
import { ProPriceCard } from '@/components/shared/subscription/ProPriceCard';
import { ManageSubscriptionCard } from '@/components/shared/subscription/ManageSubscriptionCard';
import type { BillingCycle, PlanPersona } from '@/services/subscriptionService';

/**
 * Shared billing & plan page for every persona. Price and the Free-vs-Pro
 * matrix are read from the backend pricing catalog (single source of truth),
 * so the offer is described identically everywhere and always matches what we
 * charge. Checkout starts a real Pro trial; pass `onUpgrade` only to override
 * that (tests/storybook).
 */
export function BillingPage({
  persona,
  title = 'Billing & plan',
  description = "See what's included on Free and what Pro unlocks.",
  onUpgrade,
  upgrading,
}: {
  persona: PlanPersona;
  title?: string;
  description?: string;
  onUpgrade?: (cycle: BillingCycle) => void;
  upgrading?: boolean;
}) {
  const { isPro } = usePlanTier();
  const { pricing, entitlementsFor, isLoading } = usePlanPricing();
  const { billing } = useBilling();
  const checkout = useProCheckout();
  const rows = entitlementsFor(persona);

  const upgrade = onUpgrade ?? checkout.startCheckout;
  const isUpgrading = upgrading ?? checkout.upgrading;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <p className="text-muted-foreground mt-1">{description}</p>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Your current plan</p>
            <div className="mt-0.5">
              <PlanBadge />
            </div>
          </div>
        </div>
      </div>

      {isPro && <ManageSubscriptionCard billing={billing} />}

      {!isPro && (
        <>
          <ProPriceCard
            pricing={pricing}
            isPro={isPro}
            onUpgrade={upgrade}
            upgrading={isUpgrading}
          />
          {checkout.error && !onUpgrade && (
            <p className="text-sm text-destructive" role="alert">
              {checkout.error}
            </p>
          )}
        </>
      )}

      {isLoading && rows.length === 0 ? (
        <div className="h-64 animate-pulse rounded-2xl border border-border bg-card" />
      ) : (
        <PlanComparisonTable rows={rows} />
      )}
    </div>
  );
}
