'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, KeyRound, Car } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@getrentos/ui';
import { ROUTES } from '@/lib/constants/auth';
import { logoutSession } from '@/lib/apiClient';

interface GatemanNavbarProps {
  user: { fullName: string; email: string } | null;
}

const navItems = [
  { label: 'Check-In', href: ROUTES.GATEMAN_DASHBOARD, icon: KeyRound },
  { label: 'Vehicles', href: ROUTES.GATEMAN_VEHICLES, icon: Car },
];

export const GatemanNavbar = ({ user }: GatemanNavbarProps) => {
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    await logoutSession();
    router.push(ROUTES.LOGIN);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Logo size="md" />
          <div className="flex items-center gap-1 sm:gap-3">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-accent text-primary'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
            <span className="hidden lg:block text-sm text-muted-foreground">{user?.fullName}</span>
            <ThemeToggle />
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
