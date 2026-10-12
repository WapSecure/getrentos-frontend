'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { PageLoadingState } from '@getrentos/ui';
import { ensureValidSession } from '@/lib/apiClient';
import { isAuthenticated } from '@/lib/constants/auth';
import { signInThen } from '@/lib/constants/landBuyerRoutes';

/**
 * Signed-in only, whatever the role. A reviewer is engaged by seat, not by
 * account type: a surveyor may hold a renter or buyer account, or none of the
 * dashboard roles at all, so this sits outside the role dashboards and only
 * checks for a session (the same client-side check the role layouts use). The
 * API refuses anything outside the caller's own seat.
 */
export const ReviewerAuthGate = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await ensureValidSession();
      if (cancelled) return;
      if (!isAuthenticated()) {
        router.replace(signInThen(pathname || '/land/reviews'));
        return;
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [router, pathname]);

  return ready ? <>{children}</> : <PageLoadingState />;
};
