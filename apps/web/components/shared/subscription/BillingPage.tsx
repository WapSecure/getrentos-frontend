'use client';

import { BadgeCheck } from 'lucide-react';
import { Alert, Card, TableSkeleton, PageHeader } from '@sureground/ui';
import { usePlanTier } from '@/hooks/usePlanTier';
import { usePlanPricing } from '@/hooks/usePlanPricing';
import { useProCheckout } from '@/hooks/useProCheckout';
import { useBilling } from '@/hooks/useBilling';
import { PlanBadge } from '@/components/shared/subscription/PlanBadge';
import { PlanComparisonTable } from '@/components/shared/subscription/PlanComparisonTable';
import { ProPriceCard } from '@/components/shared/subscription/ProPriceCard';
import { ManageSubscriptionCard } from '@/components/shared/subscription/ManageSubscriptionCard';
import { BillingHistoryCard } from '@/components/shared/subscription/BillingHistoryCard';
import type { BillingCycle, PlanPersona } from '@/services/subscriptionService';

// Price and the Free-vs-Pro matrix come from the backend pricing catalog, so the offer always matches what is charged.
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
      <PageHeader title={title} description={description} />

      <Card className="p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-primary">
            <BadgeCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Your current plan</p>
            <div className="mt-0.5">
              <PlanBadge />
            </div>
          </div>
        </div>
      </Card>

      {isPro && <ManageSubscriptionCard billing={billing} />}

      {!isPro && (
        <>
          <ProPriceCard
            pricing={pricing}
            isPro={isPro}
            // Until billing state arrives, show the trial offer as a new customer sees it; the backend refuses a second trial anyway.
            trialAvailable={billing?.trialAvailable ?? true}
            onUpgrade={upgrade}
            upgrading={isUpgrading}
          />
          {checkout.error && !onUpgrade && <Alert variant="danger">{checkout.error}</Alert>}
        </>
      )}

      {isLoading && rows.length === 0 ? (
        <TableSkeleton rows={6} columns={3} />
      ) : (
        <PlanComparisonTable rows={rows} />
      )}

      {/* Outside the tier checks on purpose: receipts are not a Pro feature. */}
      <BillingHistoryCard />
    </div>
  );
}
