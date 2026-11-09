'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageLoadingState } from '@sureground/ui';
import { ROUTES } from '@/lib/constants/auth';

// Redirects after render: calling the router during render is rejected by React and left the page blank.
export function RedirectToEstateSetup() {
  const router = useRouter();
  useEffect(() => {
    router.replace(ROUTES.ESTATE_SETUP);
  }, [router]);
  return <PageLoadingState />;
}
