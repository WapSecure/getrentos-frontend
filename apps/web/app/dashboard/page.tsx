'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageLoadingState } from '@getrentos/ui';
import { ROUTES, getDashboardRoute, getUserRole, isAuthenticated } from '@/lib/constants/auth';

/**
 * The generic `/dashboard` entry point (ROUTES.DASHBOARD). Signed-in users are
 * forwarded to their role-specific dashboard; unauthenticated visitors are
 * sent to the login screen. This guarantees ROUTES.DASHBOARD never 404s.
 */
export default function DashboardIndexPage() {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace(ROUTES.LOGIN);
      return;
    }
    router.replace(getDashboardRoute(getUserRole() || 'renter'));
  }, [router]);

  return <PageLoadingState />;
}
