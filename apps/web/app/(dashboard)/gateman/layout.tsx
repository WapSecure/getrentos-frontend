'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { GatemanNavbar } from '@/components/gateman/GatemanNavbar';
import { GateQueueSync } from '@/components/gateman/GateQueueSync';
import { GatemanPostProvider } from '@/lib/gateman/GatemanPostProvider';
import { PageLoadingState } from '@getrentos/ui';
import {
  ROUTES,
  isAuthenticated,
  getDashboardRoute,
  BACKEND_ROLE_TO_ID,
} from '@/lib/constants/auth';
import { getStoredUser } from '@/lib/authStorage';
import { ensureValidSession } from '@/lib/apiClient';

export type GatemanUser = { fullName: string; email: string; role?: string; roles?: string[] };

const GatemanUserContext = createContext<GatemanUser | null>(null);

/** Returns the signed-in gateman's profile, populated once by the gateman layout's auth check. */
export const useGatemanUser = () => useContext(GatemanUserContext);

export default function GatemanLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<GatemanUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const checkAuth = async () => {
      await ensureValidSession();
      if (cancelled) return;
      const authenticated = isAuthenticated();
      if (!authenticated) {
        router.replace(ROUTES.LOGIN);
        return;
      }

      const parsedUser = getStoredUser<GatemanUser>();
      if (parsedUser) {
        const hasGatemanRole = (parsedUser.roles || []).some(
          (r) => BACKEND_ROLE_TO_ID[r] === 'gateman'
        );
        if (!hasGatemanRole) {
          router.replace(getDashboardRoute(parsedUser.role || 'renter'));
          return;
        }

        setUser(parsedUser);
      }

      setIsLoading(false);
    };

    checkAuth();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (isLoading) {
    return <PageLoadingState />;
  }

  return (
    <GatemanUserContext.Provider value={user}>
      {/* One estate and one barrier for the whole console. Mounted above the
          navbar so the switcher and every gate page read the same post — an
          arrival recorded from the vehicles page must be attributed to the same
          barrier as one recorded from check-in. */}
      <GatemanPostProvider>
        {/* Renders nothing. Mounted here so the offline queue drains while a
            guard is actually at the gate. */}
        <GateQueueSync />
        <div className="min-h-screen bg-background">
          <GatemanNavbar user={user} />
          <main className="pt-16">
            <div className="max-w-lg mx-auto p-6 lg:p-8">{children}</div>
          </main>
        </div>
      </GatemanPostProvider>
    </GatemanUserContext.Provider>
  );
}
