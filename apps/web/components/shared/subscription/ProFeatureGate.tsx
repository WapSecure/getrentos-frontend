'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { BadgeCheck } from 'lucide-react';
import { Button, EmptyState } from '@getrentos/ui';
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
  /**
   * Whether the feature is paid for, when that isn't the signed-in user's own
   * plan. Estate pages pass the estate's plan (`useEstatePlan`): the estate
   * owner pays, and a manager's personal plan is beside the point.
   */
  entitled?: boolean;
  children: ReactNode;
}

const BILLING_SECTIONS = ['landlord', 'estate', 'owner', 'realtor'] as const;

function sectionBillingHref(pathname: string | null): string | undefined {
  const section = pathname?.split('/')[1];
  return BILLING_SECTIONS.some((s) => s === section) ? `/${section}/billing` : undefined;
}

/**
 * Wraps a whole page/module that's entirely Pro-gated on the backend (e.g. a
 * class-level @RequiresPlan('PRO') controller): shows an upgrade empty-state
 * instead of letting the page render broken/empty from 403s on every query.
 * For a single gated action inside an otherwise-Free page, use
 * usePlanGateModal + UpgradeToProModal instead (see lib/planGate.ts).
 */
export function ProFeatureGate({
  title,
  description,
  upgradeHref,
  entitled,
  children,
}: ProFeatureGateProps) {
  const pathname = usePathname();
  const own = usePlanTier();
  const isPro = entitled ?? own.isPro;

  if (entitled === undefined && own.isLoading) return null;

  if (!isPro) {
    const href = upgradeHref ?? sectionBillingHref(pathname);
    return (
      <EmptyState
        icon={BadgeCheck}
        title={title}
        description={description}
        action={
          <Button
            variant="primary"
            href={href ?? 'mailto:hello@getrentos.com?subject=Upgrade%20to%20Pro'}
          >
            {href ? 'Upgrade to Pro' : 'Contact us to upgrade'}
          </Button>
        }
      />
    );
  }

  return <>{children}</>;
}
