'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageLoadingState } from '@sureground/ui';
import { ROUTES, getDashboardRoute, getUserRole, isAuthenticated } from '@/lib/constants/auth';

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
