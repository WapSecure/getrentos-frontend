'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { OwnerNavbar } from '@/components/owner/navigation/OwnerNavbar';
import { OwnerSidebar } from '@/components/owner/dashboard/OwnerSidebar';
import { PageLoadingState } from '@/components/ui/Skeleton';
import {
  ROUTES,
  isAuthenticated,
  getDashboardRoute,
  BACKEND_ROLE_TO_ID,
} from '@/lib/constants/auth';
import { getStoredUser } from '@/lib/authStorage';

export type OwnerUser = { fullName: string; email: string; role?: string; roles?: string[] };

const OwnerUserContext = createContext<OwnerUser | null>(null);

/** Returns the signed-in owner's profile, populated once by the owner layout's auth check. */
export const useOwnerUser = () => useContext(OwnerUserContext);

export default function OwnerLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<OwnerUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      if (!authenticated) {
        router.replace(ROUTES.LOGIN);
        return;
      }

      const parsedUser = getStoredUser<OwnerUser>();
      if (parsedUser) {

        const hasOwnerRole = (parsedUser.roles || []).some(
          (r) => BACKEND_ROLE_TO_ID[r] === 'owner'
        );
        if (!hasOwnerRole) {
          router.replace(getDashboardRoute(parsedUser.role || 'renter'));
          return;
        }

        setUser(parsedUser);
      }

      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return <PageLoadingState />;
  }

  return (
    <OwnerUserContext.Provider value={user}>
      <div className="min-h-screen bg-background">
        <OwnerNavbar user={user} />
        <div className="flex">
          <OwnerSidebar />
          <main className="flex-1 lg:ml-64 mt-16 p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </OwnerUserContext.Provider>
  );
}
