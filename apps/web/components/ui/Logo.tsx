'use client';

import { useState, useEffect } from 'react';
import { Logo as BaseLogo } from '@getrentos/ui';
import {
  ROUTES,
  isAuthenticated,
  getUserRole,
  getDashboardRoute,
  Routes,
} from '@/lib/constants/auth';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const Logo = (props: LogoProps) => {
  const [dashboardPath, setDashboardPath] = useState<Routes>(ROUTES.HOME);

  useEffect(() => {
    const authenticated = isAuthenticated();

    if (authenticated) {
      const userRole = getUserRole();
      const route = getDashboardRoute(userRole || 'renter') as Routes;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDashboardPath(route);
    } else {
      setDashboardPath(ROUTES.HOME);
    }
  }, []);

  return <BaseLogo href={dashboardPath} {...props} />;
};
