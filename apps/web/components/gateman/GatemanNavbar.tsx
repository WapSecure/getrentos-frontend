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

  const links = (compact: boolean) =>
    navItems.map((item) => {
      const isActive = pathname === item.href;
      return (
        <Link
          key={item.href}
          href={item.href}
          aria-current={isActive ? 'page' : undefined}
          className={`flex min-h-11 min-w-11 items-center justify-center rounded-lg font-medium transition-colors ${
            compact ? 'flex-col gap-0.5 px-1 py-1.5 text-[11px]' : 'gap-1.5 px-2.5 py-2 text-sm'
          } ${
            isActive
              ? 'bg-accent text-primary'
              : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
          }`}
        >
          <item.icon className="w-4 h-4" aria-hidden="true" />
          <span>{item.label}</span>
        </Link>
      );
    });

  return (
    <nav
      aria-label="Gate console"
      className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-xl supports-backdrop-filter:bg-background/75"
    >
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center gap-2 h-16">
          <Logo size="md" className="shrink-0 [&>span]:sr-only sm:[&>span]:not-sr-only" />
          <div className="flex min-w-0 items-center gap-1 lg:gap-3">
            <div className="hidden lg:flex items-center gap-1">{links(false)}</div>
            <span className="hidden lg:block text-sm text-muted-foreground">{user?.fullName}</span>
            <PostSwitcher />
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              aria-label="Sign out"
              icon={<LogOut className="w-4 h-4" aria-hidden="true" />}
              className="min-h-11 min-w-11 shrink-0 text-destructive hover:bg-destructive-subtle hover:text-destructive"
            >
              <span className="hidden lg:inline">Sign out</span>
            </Button>
          </div>
        </div>
        {/* Below desktop the four gate tasks get a row of their own, so the bar
            reflows on the phones and tablets guards actually carry. */}
        <div className="grid grid-cols-4 gap-1 pb-2 lg:hidden">{links(true)}</div>
      </div>
    </nav>
  );
};
