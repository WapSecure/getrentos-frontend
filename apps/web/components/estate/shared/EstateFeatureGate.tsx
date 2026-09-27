'use client';

import type { ReactNode } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { PlanGateError } from '@getrentos/shared';
import { tierAtLeast, type PlanTier } from '@getrentos/shared';
import { useSelectedEstate } from '@/app/(dashboard)/estate/layout';
import { ROUTES } from '@/lib/constants/auth';

interface EstateFeatureGateProps {
  /** Named in the copy, e.g. "Dwell analytics". */
  feature: string;
  /** Defaults to ENTERPRISE, which is what every gate feature above Pro is. */
  required?: PlanTier;
  /**
   * The page's own refusal, when it has one.
   *
   * The API is the authority, so a 403 is enough on its own to show the upsell —
   * that is the path taken whenever the tier was not known when the page first
   * rendered.
   */
  error?: unknown;
  children: ReactNode;
}

/** The estate's own billing page, where the tier can actually be bought. */
const ESTATE_BILLING_HREF = ROUTES.ESTATE_BILLING;

/**
 * Gates a whole estate page on the ESTATE's plan.
 *
 * Deliberately not `ProFeatureGate`, for two reasons that both matter here:
 *
 *  - That one reads the CALLER's subscription. An estate feature is entitled from
 *    the estate owner's plan, so a manager who happens to subscribe personally
 *    would unlock a page their estate has not paid for, and a manager of a paying
 *    estate would be locked out of one it has — the same mistake the sidebar made
 *    once and the backend never makes.
 *  - That one only knows about Pro, and every remaining gate feature is
 *    Enterprise. A Pro estate would sail past it and then watch every query on
 *    the page fail with a 403, which reads as a broken feature rather than an
 *    unpurchased one.
 *
 * An UNKNOWN tier fails OPEN. `planTier` is absent when it could not be resolved,
 * which is not the same as FREE, and hiding a feature inside an outage is a worse
 * failure than showing a page that then refuses with an accurate upsell.
 */
export function EstateFeatureGate({
  feature,
  required = 'ENTERPRISE',
  error,
  children,
}: EstateFeatureGateProps) {
  const { estate, isLoading } = useSelectedEstate();

  const refusal = error instanceof PlanGateError ? error : null;
  const tier = estate?.planTier;
  const knownShortfall = Boolean(tier && !tierAtLeast(tier, required));

  if (isLoading && !refusal) return null;

  if (knownShortfall || refusal) {
    // Prefer what the API said, because it is the authority and it resolves the
    // tier itself; fall back to the tier on the estate we were given.
    const needed = refusal?.required ?? required;
    const current = refusal?.current ?? tier;

    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-primary">
          <Sparkles className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-lg font-semibold text-foreground">{feature}</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {feature} is an {needed} feature.
          {current ? ` ${estate?.name ?? 'This estate'} is on ${current}.` : ''} Nothing here is a
          safety feature — an estate without it makes slower decisions about who is on site, not
          unsafe ones.
        </p>
        <Button variant="primary" className="mt-6" href={ESTATE_BILLING_HREF}>
          See plans
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
