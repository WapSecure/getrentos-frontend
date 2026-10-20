'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, KeyRound, Car, Package, Siren } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { PostSwitcher } from '@/components/gateman/PostSwitcher';
import { Button, ThemeToggle } from '@getrentos/ui';
import { ROUTES } from '@/lib/constants/auth';
import { logoutSession } from '@/lib/apiClient';

interface GatemanNavbarProps {
  user: { fullName: string; email: string } | null;
}

const navItems = [
  { label: 'Check-In', href: ROUTES.GATEMAN_DASHBOARD, icon: KeyRound },
  { label: 'Vehicles', href: ROUTES.GATEMAN_VEHICLES, icon: Car },
  { label: 'Deliveries', href: ROUTES.GATEMAN_DELIVERIES, icon: Package },
  { label: 'Incidents', href: ROUTES.GATEMAN_INCIDENTS, icon: Siren },
];

export const GatemanNavbar = ({ user }: GatemanNavbarProps) => {
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    await logoutSession();
    router.push(ROUTES.LOGIN);
  };

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-xl supports-backdrop-filter:bg-background/75">
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
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-accent text-primary'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  <item.icon className="w-4 h-4" aria-hidden="true" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
            <span className="hidden lg:block text-sm text-muted-foreground">{user?.fullName}</span>
            <PostSwitcher />
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              aria-label="Sign out"
              icon={<LogOut className="w-4 h-4" aria-hidden="true" />}
              className="text-destructive hover:bg-destructive-subtle hover:text-destructive"
            >
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};
