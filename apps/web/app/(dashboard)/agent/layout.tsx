'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AgentNavbar } from '@/components/agent/navigation/AgentNavbar';
import { AgentSidebar } from '@/components/agent/dashboard/AgentSidebar';
import { AgentOfflineQueueSync } from '@/components/agent/AgentOfflineQueueSync';
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

export type AgentUser = {
  id?: string;
  fullName: string;
  email: string;
  role?: string;
  roles?: string[];
};

const AgentUserContext = createContext<AgentUser | null>(null);

/** Returns the signed-in agent's profile, populated once by the agent layout's auth check. */
export const useAgentUser = () => useContext(AgentUserContext);

export default function AgentLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AgentUser | null>(null);
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

      const parsedUser = getStoredUser<AgentUser>();
      if (parsedUser) {
        const hasAgentRole = (parsedUser.roles || []).some(
          (r) => BACKEND_ROLE_TO_ID[r] === 'agent'
        );
        if (!hasAgentRole) {
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
    <AgentUserContext.Provider value={user}>
      <div className="min-h-screen bg-background">
        <AgentOfflineQueueSync />
        <AgentNavbar user={user} />
        <div className="flex">
          <AgentSidebar />
          <main className="flex-1 lg:ml-64 mt-16 p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </AgentUserContext.Provider>
  );
}
