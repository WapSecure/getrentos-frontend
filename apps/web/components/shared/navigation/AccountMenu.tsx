'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, LogOut, type LucideIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@getrentos/ui';
import { ROUTES } from '@/lib/constants/auth';
import { logoutSession } from '@/lib/apiClient';
import { getInitials } from '@/lib/format';
import { RoleSwitcher } from './RoleSwitcher';

export interface AccountMenuLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface AccountMenuProps {
  user: { fullName?: string; email?: string } | null;
  /** The role's id, as RoleSwitcher knows it ("renter", "landlord" ...). */
  roleId: string;
  /** Shown under the name ("Renter", "Property Manager" ...). */
  roleLabel: string;
  links?: AccountMenuLink[];
}

/**
 * The account menu at the right of every role's top bar: who is signed in,
 * switching or adding a role, the role's own shortcuts, and signing out.
 */
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
          className="group flex min-h-11 items-center gap-3 rounded-xl p-1.5 pr-2 transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="sr-only">Open account menu</span>
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground"
          >
            {initials}
          </span>
          <span className="hidden text-left sm:block">
            <span className="block text-sm font-medium text-foreground">{fullName}</span>
            <span className="block text-xs text-muted-foreground">{roleLabel}</span>
          </span>
          <ChevronDown
            className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180"
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
