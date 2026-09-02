'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
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
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import type { Estate } from '@/types/estate';

export type EstateUser = { fullName: string; email: string; role?: string; roles?: string[] };

const EstateUserContext = createContext<EstateUser | null>(null);

/** Returns the signed-in estate manager's profile, populated once by the estate layout's auth check. */
export const useEstateUser = () => useContext(EstateUserContext);

const SELECTED_ESTATE_STORAGE_KEY = 'getrentos:selectedEstateId';

interface SelectedEstateValue {
  estate: Estate | null;
  estates: Estate[];
  isLoading: boolean;
  selectEstate: (id: string) => void;
}

const SelectedEstateContext = createContext<SelectedEstateValue | null>(null);

/**
 * A manager's currently-selected estate out of their whole portfolio.
 * Every manager-facing estate page should read from this instead of
 * calling estateService.getMyEstate() directly — that endpoint only
 * resolves a single ("first") estate and stays reserved for the
 * gateman/resident personas, who are always tied to exactly one.
 */
export const useSelectedEstate = () => {
  const ctx = useContext(SelectedEstateContext);
  if (!ctx) throw new Error('useSelectedEstate must be used within the estate layout');
  return ctx;
};

function SelectedEstateProvider({ children }: { children: ReactNode }) {
  const { data: estates, isLoading } = useQuery({
    queryKey: estateKeys.myEstates,
    queryFn: () => unwrap(estateService.listMyEstates()),
  });
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(SELECTED_ESTATE_STORAGE_KEY);
    } catch {
      return null;
    }
  });

  const selectEstate = (id: string) => {
    setSelectedId(id);
    try {
      localStorage.setItem(SELECTED_ESTATE_STORAGE_KEY, id);
    } catch {
      // ignore — the in-memory selection still works for this session
    }
  };

  const estate = estates?.find((candidate) => candidate.id === selectedId) ?? estates?.[0] ?? null;

  return (
    <SelectedEstateContext.Provider
      value={{ estate, estates: estates ?? [], isLoading, selectEstate }}
    >
      {children}
    </SelectedEstateContext.Provider>
  );
}

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
      <SelectedEstateProvider>
        <div className="min-h-screen bg-background">
          <EstateNavbar user={user} />
          <div className="flex">
            <EstateSidebar />
            <main className="flex-1 lg:ml-64 mt-16 p-6 lg:p-8">
              <div className="max-w-7xl mx-auto">{children}</div>
            </main>
          </div>
        </div>
      </SelectedEstateProvider>
    </EstateUserContext.Provider>
  );
}
