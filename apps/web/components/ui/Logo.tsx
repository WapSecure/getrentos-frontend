'use client';

import Link from 'next/link';
import { Shield } from 'lucide-react';
import { useState, useEffect } from 'react';
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

export const Logo = ({ className = '', size = 'md', showText = true }: LogoProps) => {
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

  const sizeClasses = {
    sm: {
      container: 'w-6 h-6',
      icon: 'w-3 h-3',
      text: 'text-lg',
    },
    md: {
      container: 'w-8 h-8',
      icon: 'w-4 h-4',
      text: 'text-xl',
    },
    lg: {
      container: 'w-10 h-10',
      icon: 'w-5 h-5',
      text: 'text-2xl',
    },
  };

  const currentSize = sizeClasses[size];

  return (
    <Link href={dashboardPath} className={`flex items-center gap-2 group ${className}`}>
      <div
        className={`${currentSize.container} bg-primary rounded-xl flex items-center justify-center transition-transform group-hover:scale-105`}
      >
        <Shield className={`${currentSize.icon} text-background`} />
      </div>
      {showText && (
        <span
          className={`font-bold ${currentSize.text} text-foreground group-hover:text-primary transition-colors`}
        >
          GetRentos
        </span>
      )}
    </Link>
  );
};
