'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AdminNavbar } from '@/components/admin/navigation/AdminNavbar';
import { AdminSidebar } from '@/components/admin/dashboard/AdminSidebar';
import { PageLoadingState } from '@/components/ui/Skeleton';
import {
  ROUTES,
  isAuthenticated,
  getDashboardRoute,
  BACKEND_ROLE_TO_ID,
} from '@/lib/constants/auth';
import { getStoredUser } from '@/lib/authStorage';
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
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      if (!authenticated) {
        router.replace(ROUTES.LOGIN);
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
  }, [pathname, router]);

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
