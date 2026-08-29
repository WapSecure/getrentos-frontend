'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ResidentNavbar } from '@/components/estate/resident/ResidentNavbar';
import { ResidentSidebar } from '@/components/estate/resident/ResidentSidebar';
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

export type ResidentUser = { fullName: string; email: string; role?: string; roles?: string[] };

const ResidentUserContext = createContext<ResidentUser | null>(null);

/** Returns the signed-in resident's profile, populated once by the resident layout's auth check. */
export const useResidentUser = () => useContext(ResidentUserContext);

export default function ResidentLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<ResidentUser | null>(null);
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

      const parsedUser = getStoredUser<ResidentUser>();
      if (parsedUser) {
        const hasResidentRole = (parsedUser.roles || []).some(
          (r) => BACKEND_ROLE_TO_ID[r] === 'resident'
        );
        if (!hasResidentRole) {
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
    <ResidentUserContext.Provider value={user}>
      <div className="min-h-screen bg-background">
        <ResidentNavbar user={user} />
        <div className="flex">
          <ResidentSidebar />
          <main className="flex-1 lg:ml-64 mt-16 p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </ResidentUserContext.Provider>
  );
}
