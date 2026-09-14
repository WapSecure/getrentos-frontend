'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { usePlanTier } from '@/hooks/usePlanTier';

interface ProFeatureGateProps {
  title: string;
  description: string;
  /**
   * Where "Upgrade to Pro" should send the user. Defaults to the billing page
   * for the section they're in (e.g. `/realtor/billing`), where they can
   * actually buy the plan; sections with no billing page fall back to a
   * mailto so the gate is never a dead end.
   */
  upgradeHref?: string;
  children: ReactNode;
}

const BILLING_SECTIONS = ['landlord', 'estate', 'owner', 'realtor'] as const;

function sectionBillingHref(pathname: string | null): string | undefined {
  const section = pathname?.split('/')[1];
  return BILLING_SECTIONS.some((s) => s === section) ? `/${section}/billing` : undefined;
}

/**
 * Wraps a whole page/module that's entirely Pro-gated on the backend (e.g. a
 * class-level @RequiresPlan('PRO') controller) — shows an upgrade empty-state
 * instead of letting the page render broken/empty from 403s on every query.
 * For a single gated action inside an otherwise-Free page, use
 * usePlanGateModal + UpgradeToProModal instead (see lib/planGate.ts).
 */
export function ProFeatureGate({ title, description, upgradeHref, children }: ProFeatureGateProps) {
  const pathname = usePathname();
  const { isPro, isLoading } = usePlanTier();

  if (isLoading) return null;

  if (!isPro) {
    const href = upgradeHref ?? sectionBillingHref(pathname);
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-primary">
          <Sparkles className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-foreground">{title}</h2>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
        <Button
          variant="primary"
          className="mt-6"
          href={href ?? 'mailto:hello@getrentos.com?subject=Upgrade%20to%20Pro'}
        >
          {href ? 'Upgrade to Pro' : 'Contact us to upgrade'}
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
