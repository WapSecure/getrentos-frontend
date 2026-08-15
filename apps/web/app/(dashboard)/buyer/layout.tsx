'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { BuyerNavbar } from '@/components/buyer/navigation/BuyerNavbar';
import { BuyerSidebar } from '@/components/buyer/dashboard/BuyerSidebar';
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

export type BuyerUser = { fullName: string; email: string; role?: string; roles?: string[] };

const BuyerUserContext = createContext<BuyerUser | null>(null);

/** Returns the signed-in buyer's profile, populated once by the buyer layout's auth check. */
export const useBuyerUser = () => useContext(BuyerUserContext);

export default function BuyerLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<BuyerUser | null>(null);
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

      const parsedUser = getStoredUser<BuyerUser>();
      if (parsedUser) {
        const hasBuyerRole = (parsedUser.roles || []).some(
          (r) => BACKEND_ROLE_TO_ID[r] === 'buyer'
        );
        if (!hasBuyerRole) {
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
    <BuyerUserContext.Provider value={user}>
      <div className="min-h-screen bg-background">
        <BuyerNavbar user={user} />
        <div className="flex">
          <BuyerSidebar />
          <main className="flex-1 lg:ml-64 mt-16 p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </BuyerUserContext.Provider>
  );
}
