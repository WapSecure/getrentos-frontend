'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { EstateNavbar } from '@/components/estate/navigation/EstateNavbar';
import { EstateSidebar } from '@/components/estate/dashboard/EstateSidebar';
import { PageErrorState, PageLoadingState } from '@sureground/ui';
import {
  ROUTES,
  isAuthenticated,
  getDashboardRoute,
  BACKEND_ROLE_TO_ID,
  resolvePrimaryRoleId,
} from '@/lib/constants/auth';
import { getStoredUser } from '@/lib/authStorage';
import { ensureValidSession } from '@/lib/apiClient';
import { estateService } from '@/services/estateService';

import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import type { Estate } from '@/types/estate';

export type EstateUser = { fullName: string; email: string; role?: string; roles?: string[] };

const EstateUserContext = createContext<EstateUser | null>(null);

export const useEstateUser = () => useContext(EstateUserContext);

const SELECTED_ESTATE_STORAGE_KEY = 'sureground:selectedEstateId';

interface SelectedEstateValue {
  estate: Estate | null;
  estates: Estate[];
  isLoading: boolean;
  loadFailed: boolean;
  retry: () => void;
  selectEstate: (id: string) => void;
}

const SelectedEstateContext = createContext<SelectedEstateValue | null>(null);

// Manager pages read this, not estateService.getMyEstate(), which resolves only the first estate (kept for gateman/resident).
export const useSelectedEstate = () => {
  const ctx = useContext(SelectedEstateContext);
  if (!ctx) throw new Error('useSelectedEstate must be used within the estate layout');
  return ctx;
};

function SelectedEstateProvider({ children }: { children: ReactNode }) {
  const {
    data: estates,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: estateKeys.myEstates,
    queryFn: () => unwrap(estateService.listMyEstates()),
    // Thrown, this took down the whole layout, top bar and sidebar included.
    throwOnError: false,
  });
  const loadFailed = isError && !estates;
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
      // ignore: the in-memory selection still works for this session
    }
  };

  const managed = (estates ?? []).filter((candidate) => candidate.capacity !== 'GATE');
  const guardsOnly = !isLoading && (estates?.length ?? 0) > 0 && managed.length === 0;
  const router = useRouter();
  useEffect(() => {
    if (!guardsOnly) return;
    const roles = getStoredUser<EstateUser>()?.roles ?? [];
    const canUseGateConsole = roles.some((r) => BACKEND_ROLE_TO_ID[r] === 'gateman');
    router.replace(
      canUseGateConsole ? ROUTES.GATEMAN_DASHBOARD : getDashboardRoute(resolvePrimaryRoleId(roles))
    );
  }, [guardsOnly, router]);

  const estate = managed.find((candidate) => candidate.id === selectedId) ?? managed[0] ?? null;

  if (guardsOnly) return <PageLoadingState />;

  return (
    <SelectedEstateContext.Provider
      value={{
        estate,
        estates: managed,
        isLoading,
        loadFailed,
        retry: () => void refetch(),
        selectEstate,
      }}
    >
      {children}
    </SelectedEstateContext.Provider>
  );
}

// Without the estate list a page would read "no estate" and send the manager to setup.
function EstateContent({ children }: { children: ReactNode }) {
  const { loadFailed, retry } = useSelectedEstate();
  if (loadFailed) return <PageErrorState title="Couldn’t load your estates" onRetry={retry} />;
  return <>{children}</>;
}

export default function EstateLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<EstateUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
          router.replace(getDashboardRoute(resolvePrimaryRoleId(parsedUser.roles)));
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
            <main
              id="main-content"
              tabIndex={-1}
              className="min-w-0 flex-1 workspace-main p-4 sm:p-6 lg:p-8"
            >
              <div className="max-w-7xl mx-auto">
                <EstateContent>{children}</EstateContent>
              </div>
            </main>
          </div>
        </div>
      </SelectedEstateProvider>
    </EstateUserContext.Provider>
  );
}
