'use client';

import type { ReactNode } from 'react';
import { BadgeCheck } from '@sureground/icons';
import type { PlanTier } from '@sureground/shared';
import { Alert, Button, Card, TableSkeleton, PageHeader } from '@sureground/ui';
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
import { TRIAL_ALREADY_USED_COPY } from '@/services/billingService';

// Price and the Free-vs-Pro matrix come from the backend pricing catalog, so the offer always matches what is charged.
export function BillingPage({
  persona,
  title = 'Billing & plan',
  description = "See what's included on Free and what Pro unlocks.",
  onUpgrade,
  upgrading,
  planLabel = 'Your current plan',
  planTier,
  planNote,
  children,
}: {
  persona: PlanPersona;
  title?: string;
  description?: string;
  onUpgrade?: (cycle: BillingCycle) => void;
  upgrading?: boolean;
  /** Whose plan the top card shows; checkout below always buys the viewer's own plan. */
  planLabel?: string;
  planTier?: PlanTier;
  planNote?: string;
  /** Extra offers shown after the comparison, such as the estate Enterprise card. */
  children?: ReactNode;
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
            <p className="text-sm text-muted-foreground">{planLabel}</p>
            <div className="mt-0.5">
              <PlanBadge tier={planTier} />
            </div>
          </div>
        </div>
        {planNote && <p className="mt-3 text-sm text-muted-foreground">{planNote}</p>}
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
          {checkout.error && !onUpgrade && !checkout.trialRefusedCycle && (
            <Alert variant="danger">{checkout.error}</Alert>
          )}
          {checkout.trialRefusedCycle && !onUpgrade && (
            <Alert
              variant="warning"
              action={
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={checkout.upgrading}
                  loadingText="Opening secure checkout…"
                  onClick={checkout.subscribeWithoutTrial}
                >
                  Subscribe without a trial
                </Button>
              }
            >
              {TRIAL_ALREADY_USED_COPY}
            </Alert>
          )}
        </>
      )}

      {isLoading && rows.length === 0 ? (
        <TableSkeleton rows={6} columns={3} />
      ) : (
        <PlanComparisonTable rows={rows} />
      )}

      {children}

      {/* Outside the tier checks on purpose: receipts are not a Pro feature. */}
      <BillingHistoryCard />
    </div>
  );
}
