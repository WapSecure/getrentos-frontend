'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { BadgeCheck } from '@sureground/icons';
import { Button, EmptyState } from '@sureground/ui';
import { usePlanTier } from '@/hooks/usePlanTier';

interface ProFeatureGateProps {
  title: string;
  description: string;
  upgradeHref?: string;
  /** Estate pages pass the estate's plan: the estate owner pays, not the manager. */
  entitled?: boolean;
  children: ReactNode;
}

const BILLING_SECTIONS = ['landlord', 'estate', 'owner', 'realtor'] as const;

function sectionBillingHref(pathname: string | null): string | undefined {
  const section = pathname?.split('/')[1];
  return BILLING_SECTIONS.some((s) => s === section) ? `/${section}/billing` : undefined;
}

/** For a page entirely Pro-gated on the backend; for one gated action use usePlanGateModal + UpgradeToProModal (lib/planGate.ts). */
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
            href={href ?? 'mailto:hello@getsureground.io?subject=Upgrade%20to%20Pro'}
          >
            {href ? 'Upgrade to Pro' : 'Contact us to upgrade'}
          </Button>
        }
      />
    );
  }

  return <>{children}</>;
}
