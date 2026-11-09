'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageLoadingState } from '@sureground/ui';
import { ROUTES } from '@/lib/constants/auth';

/**
 * Shown by an estate page when the manager has no estate yet. The redirect runs
 * after render: calling the router while rendering updates the Router during
 * another component's render, which React rejects and which left the page blank.
 */
export function RedirectToEstateSetup() {
  const router = useRouter();
  useEffect(() => {
    router.replace(ROUTES.ESTATE_SETUP);
  }, [router]);
  return <PageLoadingState />;
}
