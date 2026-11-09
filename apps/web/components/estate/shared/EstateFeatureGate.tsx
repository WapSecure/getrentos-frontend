'use client';

import type { ReactNode } from 'react';
import { BadgeCheck } from '@sureground/icons';
import { Button } from '@sureground/ui';
import { PlanGateError } from '@sureground/shared';
import { tierAtLeast, type PlanTier } from '@sureground/shared';
import { useSelectedEstate } from '@/app/(dashboard)/estate/layout';
import { ROUTES } from '@/lib/constants/auth';

interface EstateFeatureGateProps {
  feature: string;
  required?: PlanTier;
  /** A 403 from the page's own query is enough to show the upsell: the API is the authority. */
  error?: unknown;
  children: ReactNode;
}

const ESTATE_BILLING_HREF = ROUTES.ESTATE_BILLING;

// Not ProFeatureGate: that reads the caller's plan and knows only Pro, while estate features come from the estate owner's plan. An unknown tier fails open.
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
    const needed = refusal?.required ?? required;
    const current = refusal?.current ?? tier;

    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-primary">
          <BadgeCheck className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-lg font-semibold text-foreground">{feature}</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {feature} is an {needed} feature.
          {current ? ` ${estate?.name ?? 'This estate'} is on ${current}.` : ''} Nothing here is a
          safety feature: an estate without it makes slower decisions about who is on site, not
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
