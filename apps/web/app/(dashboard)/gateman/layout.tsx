'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { GatemanNavbar } from '@/components/gateman/GatemanNavbar';
import { PageLoadingState } from '@getrentos/ui';
import {
  ROUTES,
  isAuthenticated,
  getDashboardRoute,
  BACKEND_ROLE_TO_ID,
} from '@/lib/constants/auth';
import { getStoredUser } from '@/lib/authStorage';
import { ensureValidSession } from '@/lib/apiClient';
import { useSessionTimeout } from '@getrentos/ui';

export type GatemanUser = { fullName: string; email: string; role?: string; roles?: string[] };

const GatemanUserContext = createContext<GatemanUser | null>(null);

/** Returns the signed-in gateman's profile, populated once by the gateman layout's auth check. */
export const useGatemanUser = () => useContext(GatemanUserContext);

export default function GatemanLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<GatemanUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  useSessionTimeout();

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
      <div className="min-h-screen bg-background">
        <GatemanNavbar user={user} />
        <main className="pt-16">
          <div className="max-w-lg mx-auto p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </GatemanUserContext.Provider>
  );
}
