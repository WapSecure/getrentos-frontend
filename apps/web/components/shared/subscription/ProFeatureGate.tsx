'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { BadgeCheck } from '@sureground/icons';
import { Button, EmptyState } from '@sureground/ui';
import { usePlanTier } from '@/hooks/usePlanTier';
import { billingHrefFor } from '@/lib/planGate';

interface ProFeatureGateProps {
  title: string;
  description: string;
  upgradeHref?: string;
  /** Estate pages pass the estate's plan: the estate owner pays, not the manager. */
  entitled?: boolean;
  children: ReactNode;
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
    const href = upgradeHref ?? billingHrefFor(pathname);
    return (
      <EmptyState
        icon={BadgeCheck}
        title={title}
        description={description}
        action={
          <Button variant="primary" href={href}>
            {href === '/pricing' ? 'See plans' : 'Upgrade to Pro'}
          </Button>
        }
      />
    );
  }

  return <>{children}</>;
}
