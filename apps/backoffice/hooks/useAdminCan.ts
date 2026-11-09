'use client';

import { useAdminUser } from '@/app/(dashboard)/admin/layout';
import { hasAdminPermission } from '@/lib/adminAccess';
import type { AdminPermission } from '@/types/admin';

// Only hides actions the role cannot perform; the server still enforces every permission.
export function useAdminCan(permission: AdminPermission): boolean {
  const user = useAdminUser();
  return hasAdminPermission(user?.roles, permission);
}
