'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { KeyRound, Car, Package, Siren } from '@sureground/icons';
import { Logo } from '@/components/ui/Logo';
import { PostSwitcher } from '@/components/gateman/PostSwitcher';
import { ThemeToggle } from '@sureground/ui';
import { ROUTES } from '@/lib/constants/auth';
import { AccountMenu } from '@/components/shared/navigation/AccountMenu';

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
  const pathname = usePathname();

  const links = (compact: boolean) =>
    navItems.map((item) => {
      const isActive = pathname === item.href;
      return (
        <Link
          key={item.href}
          href={item.href}
          aria-current={isActive ? 'page' : undefined}
          className={`flex min-h-11 min-w-11 items-center justify-center rounded-lg font-medium transition-colors ${
            compact ? 'flex-col gap-0.5 px-1 py-1.5 text-2xs' : 'gap-1.5 px-2.5 py-2 text-sm'
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
    <nav aria-label="Gate console" className="workspace-navbar sticky top-0 z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center gap-2 h-16">
          <Logo size="md" className="shrink-0 [&>span]:sr-only sm:[&>span]:not-sr-only" />
          <div className="flex min-w-0 items-center gap-1 lg:gap-3">
            <div className="hidden lg:flex items-center gap-1">{links(false)}</div>
            <PostSwitcher />
            <ThemeToggle />
            <AccountMenu user={user} roleId="gateman" roleLabel="Gate" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-1 pb-2 lg:hidden">{links(true)}</div>
      </div>
    </nav>
  );
};
