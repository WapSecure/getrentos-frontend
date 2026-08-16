'use client';

import { useRouter } from 'next/navigation';
import { Check, Repeat } from 'lucide-react';
import { BACKEND_ROLE_TO_ID, ROLES, STORAGE_KEYS, getDashboardRoute } from '@/lib/constants/auth';
import { getStoredUser } from '@/lib/authStorage';

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

  if (userRoleIds.length <= 1) return null;

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
    <div className="py-2 border-b border-border">
      <p className="px-4 pb-1 text-xs font-medium text-muted-foreground flex items-center gap-1.5">
        <Repeat className="w-3 h-3" />
        Switch role
      </p>
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
        disabled
      >
        <span>{activeDef?.name ?? 'Renter'}</span>
        <Check className="w-3.5 h-3.5 text-primary" />
      </button>
      {otherRoles.map((role) => (
        <button
          key={role.id}
          type="button"
          onClick={() => handleSwitchRole(role.id)}
          className="w-full flex items-center px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
        >
          {role.name}
        </button>
      ))}
    </div>
  );
};
