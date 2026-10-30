'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Logo as BaseLogo } from '@getrentos/ui/Logo';
import {
  ROUTES,
  STORAGE_KEYS,
  isAuthenticated,
  getDashboardRoute,
  resolvePrimaryRoleId,
  Routes,
} from '@/lib/constants/auth';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

/** Portal path prefix -> the role id whose dashboard is that portal's home. */
const PORTAL_ROLE_BY_PREFIX: [string, string][] = [
  ['/landlord', 'landlord'],
  ['/agency', 'manager'],
  ['/resident', 'resident'],
  ['/gateman', 'gateman'],
  ['/estate', 'estate'],
  ['/owner', 'owner'],
  ['/agent', 'agent'],
  ['/realtor', 'realtor'],
  ['/buyer', 'buyer'],
  ['/renter', 'renter'],
];

/** The signed-in user's own home, from the stored session. */
function storedHomeRoleId(): string {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEYS.USER) || sessionStorage.getItem(STORAGE_KEYS.USER);
    const user = raw ? (JSON.parse(raw) as { role?: string; roles?: string[] }) : null;
    return user?.role || resolvePrimaryRoleId(user?.roles);
  } catch {
    return resolvePrimaryRoleId(null);
  }
}

export const Logo = (props: LogoProps) => {
  const pathname = usePathname();
  const [dashboardPath, setDashboardPath] = useState<Routes>(ROUTES.HOME);

  useEffect(() => {
    if (!isAuthenticated()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDashboardPath(ROUTES.HOME);
      return;
    }
    // Inside a portal the logo goes to that portal's home — the shell already
    // checked the user may be here. Elsewhere it goes to the user's own home.
    const portal = PORTAL_ROLE_BY_PREFIX.find(
      ([prefix]) => pathname === prefix || pathname?.startsWith(`${prefix}/`)
    );
    setDashboardPath(getDashboardRoute(portal ? portal[1] : storedHomeRoleId()) as Routes);
  }, [pathname]);

  return <BaseLogo href={dashboardPath} {...props} />;
};
