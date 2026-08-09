'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { RealtorNavbar } from '@/components/realtor/navigation/RealtorNavbar';
import { RealtorSidebar } from '@/components/realtor/dashboard/RealtorSidebar';
import { PageLoadingState } from '@/components/ui/Skeleton';
import {
  ROUTES,
  isAuthenticated,
  STORAGE_KEYS,
  getDashboardRoute,
  BACKEND_ROLE_TO_ID,
} from '@/lib/constants/auth';

export type RealtorUser = { fullName: string; email: string; role?: string; roles?: string[] };

const RealtorUserContext = createContext<RealtorUser | null>(null);

/** Returns the signed-in realtor's profile, populated once by the realtor layout's auth check. */
export const useRealtorUser = () => useContext(RealtorUserContext);

export default function RealtorLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<RealtorUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      if (!authenticated) {
        router.replace(ROUTES.LOGIN);
        return;
      }

      const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
      if (storedUser) {
        const parsedUser: RealtorUser = JSON.parse(storedUser);

        // A user can hold multiple roles (e.g. Renter + Realtor); gate on whether
        // ANY of them is realtor-equivalent, not just the primary `role` field.
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
