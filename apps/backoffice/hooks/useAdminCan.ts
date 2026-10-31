'use client';

import { useAdminUser } from '@/app/(dashboard)/admin/layout';
import { hasAdminPermission } from '@/lib/adminAccess';
import type { AdminPermission } from '@/types/admin';

/**
 * Whether the signed-in staff member holds `permission`. Used to leave out
 * actions their role cannot perform, so they are not offered a button that can
 * only end in a 403. The server still enforces every permission.
 */
export function useAdminCan(permission: AdminPermission): boolean {
  const user = useAdminUser();
  return hasAdminPermission(user?.roles, permission);
}
