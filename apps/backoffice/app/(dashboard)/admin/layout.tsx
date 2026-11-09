'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AdminNavbar } from '@/components/admin/navigation/AdminNavbar';
import { AdminSidebar, hasRouteAccess } from '@/components/admin/dashboard/AdminSidebar';
import { EmptyState, PageLoadingState } from '@sureground/ui';
import { Lock } from 'lucide-react';
import {
  ROUTES,
  isAuthenticated,
  BACKEND_ROLE_TO_ID,
  getStoredUser,
  ensureValidSession,
} from '@sureground/shared';
import { hasStaffAccess } from '@/lib/adminAccess';
import { StaffTwoFactorGate } from '@/components/security/StaffTwoFactorGate';
import { usePathname } from 'next/navigation';

export type AdminUser = {
  id?: string;
  fullName: string;
  email: string;
  role?: string;
  roles?: string[];
};

const AdminUserContext = createContext<AdminUser | null>(null);

export const useAdminUser = () => useContext(AdminUserContext);

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const checkAuth = async () => {
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

      // The refresh cookie is not port-scoped, so a session restored from the main app may have no admin profile; send it to the admin sign-in, since getDashboardRoute() returns main-app paths that 404 here.
      if (!isAuthenticated() || !parsedUser || !isAdmin) {
        router.replace(ROUTES.ADMIN_LOGIN);
        return;
      }

      const needsStaffAccess = pathname === ROUTES.ADMIN_ACCESS;
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
        {/* Without two-factor every admin route is refused, so the set-up screen stands in for the page. */}
        <StaffTwoFactorGate>
          <div className="flex">
            <AdminSidebar roles={user?.roles} />
            {/* min-w-0 stops this flex item growing to its widest child and scrolling the whole page sideways. */}
            <main className="min-w-0 flex-1 workspace-main p-6 lg:p-8">
              <div className="max-w-7xl mx-auto">
                {hasRouteAccess(user?.roles, pathname) ? (
                  children
                ) : (
                  <EmptyState
                    icon={Lock}
                    title="You do not have access to this area"
                    description="Your staff role does not include this part of the back office. Ask an administrator if you need it."
                  />
                )}
              </div>
            </main>
          </div>
        </StaffTwoFactorGate>
      </div>
    </AdminUserContext.Provider>
  );
}
