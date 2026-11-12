'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { KeyRound, Car, Package, Siren } from '@sureground/icons';
import { Logo } from '@/components/ui/Logo';
import { PostSwitcher } from '@/components/gateman/PostSwitcher';
import { ThemeToggle } from '@sureground/ui';
import { ROUTES } from '@/lib/constants/auth';
import { AccountMenu } from '@/components/shared/navigation/AccountMenu';
import {
  TopBarAccount,
  TopBarDivider,
  WorkspacePill,
} from '@/components/shared/navigation/TopBarParts';

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
          className={`flex min-h-11 min-w-11 items-center justify-center rounded-lg font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            compact ? 'flex-col gap-0.5 px-1 py-1.5 text-2xs' : 'gap-2 px-3 py-2 text-sm'
          } ${
            isActive
              ? 'bg-primary/10 font-semibold text-primary ring-1 ring-inset ring-primary/20'
              : 'text-muted-foreground hover:bg-card hover:text-foreground'
          }`}
        >
          <item.icon className="h-4.5 w-4.5" aria-hidden="true" />
          <span>{item.label}</span>
        </Link>
      );
    });

  return (
    <nav aria-label="Gate console" className="workspace-navbar sticky top-0 z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center gap-2 h-16">
          <div className="flex min-w-0 shrink-0 items-center gap-3">
            <Logo size="md" className="shrink-0 [&>span]:sr-only sm:[&>span]:not-sr-only" />
            <TopBarDivider className="hidden xl:block" />
            <WorkspacePill label="Gate console" className="hidden xl:inline-flex" />
          </div>
          <div className="flex min-w-0 items-center gap-1 lg:gap-2">
            <div className="hidden items-center gap-1 rounded-xl border border-border bg-secondary/60 p-1 lg:flex">
              {links(false)}
            </div>
            <PostSwitcher />
            <ThemeToggle />
            <TopBarDivider className="mx-1 hidden sm:block" />
            <TopBarAccount>
              <AccountMenu user={user} roleId="gateman" roleLabel="Gate" />
            </TopBarAccount>
          </div>
        </div>
        <div className="mb-2 grid grid-cols-4 gap-1 rounded-xl border border-border bg-secondary/60 p-1 lg:hidden">
          {links(true)}
        </div>
      </div>
    </nav>
  );
};
