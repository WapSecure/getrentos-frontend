'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AdminNavbar } from '@/components/admin/navigation/AdminNavbar';
import { AdminSidebar } from '@/components/admin/dashboard/AdminSidebar';
import { PageLoadingState } from '@getrentos/ui';
import {
  ROUTES,
  isAuthenticated,
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

      const parsedUser = getStoredUser<AdminUser>();
      const isAdmin = (parsedUser?.roles ?? []).some(
        (role) => BACKEND_ROLE_TO_ID[role] === 'admin'
      );

      // Signed out, signed in as someone without a back-office role, or holding
      // only an identity-less session — the refresh cookie is not port-scoped, so
      // this app can silently restore a session from the main app's cookie and
      // end up with no profile at all. All three are treated as "not an admin".
      //
      // They go to the admin sign-in rather than getDashboardRoute(), which
      // returns main-app paths such as /renter/dashboard: those do not exist here
      // and dropped the visitor on a 404.
      if (!isAuthenticated() || !parsedUser || !isAdmin) {
        router.replace(ROUTES.ADMIN_LOGIN);
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
          {/* min-w-0: without it this flex item grows to its widest child (e.g. a
              tab strip) and the whole page scrolls sideways instead of that child. */}
          <main className="min-w-0 flex-1 lg:ml-64 mt-16 p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </AdminUserContext.Provider>
  );
}
