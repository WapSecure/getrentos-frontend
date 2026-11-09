'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, LogOut, type SgIcon } from '@sureground/icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@sureground/ui';
import { ROUTES } from '@/lib/constants/auth';
import { logoutSession } from '@/lib/apiClient';
import { getInitials } from '@/lib/format';
import { RoleSwitcher } from './RoleSwitcher';

export interface AccountMenuLink {
  href: string;
  label: string;
  icon: SgIcon;
}

interface AccountMenuProps {
  user: { fullName?: string; email?: string } | null;
  roleId: string;
  roleLabel: string;
  links?: AccountMenuLink[];
}

export const AccountMenu = ({ user, roleId, roleLabel, links = [] }: AccountMenuProps) => {
  const router = useRouter();
  const fullName = user?.fullName || 'User';
  const initials = getInitials(fullName);

  const handleSignOut = async () => {
    await logoutSession();
    router.push(ROUTES.LOGIN);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="group flex min-h-11 items-center gap-2 rounded-xl p-1.5 pr-1.5 transition-colors xl:gap-3 xl:pr-2 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="sr-only">Open account menu</span>
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground"
          >
            {initials}
          </span>
          <span className="hidden text-left xl:block">
            <span className="block text-sm font-medium text-foreground">{fullName}</span>
            <span className="block text-xs text-muted-foreground">{roleLabel}</span>
          </span>
          <ChevronDown
            className="hidden h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180 sm:block"
            aria-hidden="true"
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-[min(18rem,calc(100vw-2rem))]">
        <DropdownMenuLabel className="px-3 py-2.5">
          <span className="block truncate text-sm font-semibold text-foreground">{fullName}</span>
          <span className="block truncate text-xs font-normal text-muted-foreground">
            {user?.email || `${roleLabel} account`}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <RoleSwitcher currentRoleId={roleId} />

        {links.length > 0 && (
          <>
            {links.map(({ href, label, icon: Icon }) => (
              <DropdownMenuItem key={href} asChild>
                <Link href={href}>
                  <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  {label}
                </Link>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem
          onSelect={() => void handleSignOut()}
          className="text-destructive hover:bg-destructive-subtle focus:bg-destructive-subtle"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
