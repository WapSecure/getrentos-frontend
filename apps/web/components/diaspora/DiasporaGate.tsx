'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { PageLoadingState } from '@sureground/ui';
import { useDiasporaAvailability } from '@/hooks/useDiasporaAvailability';
import { ROUTES } from '@/lib/constants/auth';
import type { InvestorPortal } from '@/lib/constants/diasporaRoutes';

const DASHBOARD: Record<InvestorPortal, string> = {
  buyer: ROUTES.BUYER_DASHBOARD,
  owner: ROUTES.OWNER_DASHBOARD,
};

/** While Diaspora Invest is switched off its pages send the viewer back to their dashboard. */
export const DiasporaGate = ({
  portal,
  children,
}: {
  portal: InvestorPortal;
  children: ReactNode;
}) => {
  const router = useRouter();
  const { enabled, isLoading } = useDiasporaAvailability();

  useEffect(() => {
    if (!isLoading && !enabled) router.replace(DASHBOARD[portal]);
  }, [enabled, isLoading, portal, router]);

  if (isLoading) return <PageLoadingState />;
  if (!enabled) return null;
  return <>{children}</>;
};
