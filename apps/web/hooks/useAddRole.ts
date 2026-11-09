'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { getDashboardRoute } from '@/lib/constants/auth';
import { updateStoredUser } from '@/lib/authStorage';
import { unwrap } from '@/lib/apiHelpers';
import { accountRolesService, type AddableRoleId } from '@/services/accountRolesService';

export function useAddRole() {
  const router = useRouter();
  return useMutation({
    mutationFn: ({ role }: { role: AddableRoleId; to?: string }) =>
      unwrap(accountRolesService.addRole(role)),
    onSuccess: (result, { role, to }) => {
      updateStoredUser({ roles: result.roles, role });
      router.push(to ?? getDashboardRoute(role));
    },
  });
}
