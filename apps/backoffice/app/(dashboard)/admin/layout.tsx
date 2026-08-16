'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AdminNavbar } from '@/components/admin/navigation/AdminNavbar';
import { AdminSidebar } from '@/components/admin/dashboard/AdminSidebar';
import { PageLoadingState, useSessionTimeout } from '@getrentos/ui';
import {
  ROUTES,
  isAuthenticated,
  getDashboardRoute,
  BACKEND_ROLE_TO_ID,
  getStoredUser,
  ensureValidSession,
} from '@getrentos/shared';
import { hasStaffAccess } from '@/lib/adminAccess';
import { usePathname } from 'next/navigation';

export type AdminUser = { fullName: string; email: string; role?: string; roles?: string[] };

const AdminUserContext = createContext<AdminUser | null>(null);

/** Returns the signed-in admin's profile, populated once by the admin layout's auth check. */
export const useAdminUser = () => useContext(AdminUserContext);

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  useSessionTimeout(undefined, ROUTES.ADMIN_LOGIN);

  useEffect(() => {
    let cancelled = false;
    const checkAuth = async () => {
      // The dedicated admin sign-in page is exempt from the auth gate.
      if (pathname === ROUTES.ADMIN_LOGIN) {
        setIsLoading(false);
        return;
      }
      await ensureValidSession();
      if (cancelled) return;
      const authenticated = isAuthenticated();
      if (!authenticated) {
        router.replace(ROUTES.ADMIN_LOGIN);
        return;
      }

      const parsedUser = getStoredUser<AdminUser>();
      if (parsedUser) {
        const isAdmin = (parsedUser.roles || []).some((r) => BACKEND_ROLE_TO_ID[r] === 'admin');
        if (!isAdmin) {
          router.replace(getDashboardRoute(parsedUser.role || 'renter'));
          return;
        }

        const needsStaffAccess = pathname === ROUTES.ADMIN_ACCESS;
        // Anyone who can manage, create, or approve staff may open the page;
        // the sections render according to what they are allowed to do.
        if (needsStaffAccess && !hasStaffAccess(parsedUser.roles)) {
          router.replace(ROUTES.ADMIN_DASHBOARD);
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
  }, [pathname, router]);

  // The admin sign-in page renders without the auth gate or the admin chrome.
  if (pathname === ROUTES.ADMIN_LOGIN) {
    return <>{children}</>;
  }

  if (isLoading) {
    return <PageLoadingState />;
  }

  return (
    <AdminUserContext.Provider value={user}>
      <div className="min-h-screen bg-background">
        <AdminNavbar user={user} />
        <div className="flex">
          <AdminSidebar roles={user?.roles} />
          <main className="flex-1 lg:ml-64 mt-16 p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </AdminUserContext.Provider>
  );
}
