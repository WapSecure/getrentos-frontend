'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { PageLoadingState } from '@sureground/ui';
import { ensureValidSession } from '@/lib/apiClient';
import { isAuthenticated } from '@/lib/constants/auth';
import { signInThen } from '@/lib/constants/landBuyerRoutes';

// Session check only: reviewers are engaged by seat, not account type, and the API refuses anything outside the caller's seat.
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
