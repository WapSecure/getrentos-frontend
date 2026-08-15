'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { LandlordNavbar } from '@/components/landlord/navigation/LandlordNavbar';
import { LandlordSidebar } from '@/components/landlord/dashboard/LandlordSidebar';
import { PageLoadingState } from '@/components/ui/Skeleton';
import {
  ROUTES,
  isAuthenticated,
  getDashboardRoute,
  BACKEND_ROLE_TO_ID,
} from '@/lib/constants/auth';
import { getStoredUser } from '@/lib/authStorage';
import { ensureValidSession } from '@/lib/apiClient';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';

export type LandlordUser = { fullName: string; email: string; role?: string; roles?: string[] };

const LandlordUserContext = createContext<LandlordUser | null>(null);

/** Returns the signed-in landlord's profile, populated once by the landlord layout's auth check. */
export const useLandlordUser = () => useContext(LandlordUserContext);

export default function LandlordLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<LandlordUser | null>(null);
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

      const parsedUser = getStoredUser<LandlordUser>();
      if (parsedUser) {
        const hasLandlordRole = (parsedUser.roles || []).some(
          (r) => BACKEND_ROLE_TO_ID[r] === 'landlord'
        );
        if (!hasLandlordRole) {
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
    <LandlordUserContext.Provider value={user}>
      <div className="min-h-screen bg-background">
        <LandlordNavbar user={user} />
        <div className="flex">
          <LandlordSidebar />
          <main className="flex-1 lg:ml-64 mt-16 p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </LandlordUserContext.Provider>
  );
}
