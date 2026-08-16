'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { RealtorNavbar } from '@/components/realtor/navigation/RealtorNavbar';
import { RealtorSidebar } from '@/components/realtor/dashboard/RealtorSidebar';
import { PageLoadingState } from '@getrentos/ui';
import {
  ROUTES,
  isAuthenticated,
  getDashboardRoute,
  BACKEND_ROLE_TO_ID,
} from '@/lib/constants/auth';
import { getStoredUser } from '@/lib/authStorage';
import { ensureValidSession } from '@/lib/apiClient';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';

export type RealtorUser = { fullName: string; email: string; role?: string; roles?: string[] };

const RealtorUserContext = createContext<RealtorUser | null>(null);

/** Returns the signed-in realtor's profile, populated once by the realtor layout's auth check. */
export const useRealtorUser = () => useContext(RealtorUserContext);

export default function RealtorLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<RealtorUser | null>(null);
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

      const parsedUser = getStoredUser<RealtorUser>();
      if (parsedUser) {
        const hasRealtorRole = (parsedUser.roles || []).some(
          (r) => BACKEND_ROLE_TO_ID[r] === 'realtor'
        );
        if (!hasRealtorRole) {
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
    <RealtorUserContext.Provider value={user}>
      <div className="min-h-screen bg-background">
        <RealtorNavbar user={user} />
        <div className="flex">
          <RealtorSidebar />
          <main className="flex-1 lg:ml-64 mt-16 p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </RealtorUserContext.Provider>
  );
}
