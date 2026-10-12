'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { STORAGE_KEYS, getDashboardRoute } from '@/lib/constants/auth';
import { getStoredUser, updateStoredUser } from '@/lib/authStorage';
import { unwrap } from '@/lib/apiHelpers';
import { accountRolesService, type AddableRoleId } from '@/services/accountRolesService';

/**
 * Adds a role to the signed-in account and moves into it: the saved user gets
 * the new role list (the role switcher reads it from there) and the new role
 * as the active one, then the browser goes to `to` or that role's dashboard.
 */
export function useAddRole() {
  const router = useRouter();
  return useMutation({
    mutationFn: ({ role }: { role: AddableRoleId; to?: string }) =>
      unwrap(accountRolesService.addRole(role)),
    onSuccess: (result, { role, to }) => {
      updateStoredUser({ roles: result.roles });
      const user = getStoredUser<Record<string, unknown>>();
      if (user) {
        const storage = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
          ? localStorage
          : sessionStorage;
        storage.setItem(STORAGE_KEYS.USER, JSON.stringify({ ...user, role }));
      }
      router.push(to ?? getDashboardRoute(role));
    },
  });
}
