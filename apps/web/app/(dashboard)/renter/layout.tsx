'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { RenterNavbar } from '@/components/renter/navigation/RenterNavbar';
import { RenterSidebar } from '@/components/renter/dashboard/RenterSidebar';
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

export type RenterUser = {
  id?: string;
  fullName: string;
  email: string;
  role?: string;
  roles?: string[];
};

const RenterUserContext = createContext<RenterUser | null>(null);

/** Returns the signed-in renter's profile, populated once by the renter layout's auth check. */
export const useRenterUser = () => useContext(RenterUserContext);

export default function RenterLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<RenterUser | null>(null);
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

      const parsedUser = getStoredUser<RenterUser>();
      if (parsedUser) {
        const hasRenterRole = (parsedUser.roles || []).some(
          (r) => BACKEND_ROLE_TO_ID[r] === 'renter'
        );
        if (!hasRenterRole) {
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
    <RenterUserContext.Provider value={user}>
      <div className="min-h-screen bg-background">
        <a
          href="#main-content"
          className="fixed left-4 top-3 z-[100] -translate-y-20 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg transition-transform focus:translate-y-0"
        >
          Skip to main content
        </a>
        <RenterNavbar user={user} />
        <div className="flex">
          <RenterSidebar />
          <main
            id="main-content"
            tabIndex={-1}
            className="mt-32 flex-1 p-4 sm:p-6 md:mt-16 lg:ml-64 lg:p-8"
          >
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </RenterUserContext.Provider>
  );
}
