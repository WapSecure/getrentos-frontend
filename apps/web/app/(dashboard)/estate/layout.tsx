'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { EstateNavbar } from '@/components/estate/navigation/EstateNavbar';
import { EstateSidebar } from '@/components/estate/dashboard/EstateSidebar';
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

export type EstateUser = { fullName: string; email: string; role?: string; roles?: string[] };

const EstateUserContext = createContext<EstateUser | null>(null);

/** Returns the signed-in estate manager's profile, populated once by the estate layout's auth check. */
export const useEstateUser = () => useContext(EstateUserContext);

export default function EstateLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<EstateUser | null>(null);
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

      const parsedUser = getStoredUser<EstateUser>();
      if (parsedUser) {
        const hasEstateRole = (parsedUser.roles || []).some(
          (r) => BACKEND_ROLE_TO_ID[r] === 'estate'
        );
        if (!hasEstateRole) {
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
    <EstateUserContext.Provider value={user}>
      <div className="min-h-screen bg-background">
        <EstateNavbar user={user} />
        <div className="flex">
          <EstateSidebar />
          <main className="flex-1 lg:ml-64 mt-16 p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </EstateUserContext.Provider>
  );
}
