'use client';

import { useRouter } from 'next/navigation';
import { Check, Plus } from '@sureground/icons';
import { DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@sureground/ui';
import { openAddRoleDialog } from './AddRoleDialog';
import { BACKEND_ROLE_TO_ID, ROLES, getDashboardRoute } from '@/lib/constants/auth';
import { getStoredUser, updateStoredUser } from '@/lib/authStorage';

interface RoleSwitcherProps {
  currentRoleId?: string;
}

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
    updateStoredUser({ role: roleId });
    router.push(getDashboardRoute(roleId));
  };

  return (
    <>
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
