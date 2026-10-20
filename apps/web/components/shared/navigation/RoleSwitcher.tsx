'use client';

import { useRouter } from 'next/navigation';
import { Check, Plus } from 'lucide-react';
import { DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@getrentos/ui';
import { openAddRoleDialog } from './AddRoleDialog';
import { BACKEND_ROLE_TO_ID, ROLES, STORAGE_KEYS, getDashboardRoute } from '@/lib/constants/auth';
import { getStoredUser } from '@/lib/authStorage';

interface RoleSwitcherProps {
  currentRoleId?: string;
}

/** The account's roles as menu items; renders inside an AccountMenu. */
export const RoleSwitcher = ({ currentRoleId }: RoleSwitcherProps) => {
  const router = useRouter();

  const user = getStoredUser<{ role?: string; roles?: string[] }>();
  const roleDefs = Object.values(ROLES);
  const userRoleIds = Array.from(
    new Set((user?.roles || []).map((r) => BACKEND_ROLE_TO_ID[r]).filter(Boolean))
  );

  const activeRoleId = currentRoleId ?? user?.role ?? 'renter';
  const activeDef = roleDefs.find((r) => r.id === activeRoleId);
  const otherRoles = userRoleIds
    .filter((id) => id !== activeRoleId)
    .map((id) => roleDefs.find((r) => r.id === id))
    .filter((r): r is (typeof roleDefs)[number] => Boolean(r));

  const handleSwitchRole = (roleId: string) => {
    const parsed = getStoredUser<Record<string, unknown>>();
    if (parsed) {
      const storage = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) ? localStorage : sessionStorage;
      storage.setItem(STORAGE_KEYS.USER, JSON.stringify({ ...parsed, role: roleId }));
    }
    router.push(getDashboardRoute(roleId));
  };

  return (
    <>
      {/* A single-role account has nothing to switch to, but can still add a role. */}
      {userRoleIds.length > 1 && (
        <>
          <DropdownMenuLabel className="px-3 pb-1 pt-2 text-xs font-medium text-muted-foreground">
            Switch role
          </DropdownMenuLabel>
          <DropdownMenuItem disabled className="justify-between data-disabled:opacity-100">
            {activeDef?.name ?? 'Renter'}
            <Check className="h-4 w-4 text-primary" aria-label="(current)" />
          </DropdownMenuItem>
          {otherRoles.map((role) => (
            <DropdownMenuItem key={role.id} onSelect={() => handleSwitchRole(role.id)}>
              {role.name}
            </DropdownMenuItem>
          ))}
        </>
      )}
      <DropdownMenuItem onSelect={openAddRoleDialog} className="text-primary">
        <Plus className="h-4 w-4" aria-hidden="true" />
        Add a role
      </DropdownMenuItem>
      <DropdownMenuSeparator />
    </>
  );
};
