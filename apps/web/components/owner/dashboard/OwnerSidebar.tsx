'use client';

import { RoleSidebar } from '@/components/shared/dashboard/GroupedSidebar';
import { useNavigationFlags, useViewerPlanLock } from '@/lib/navigation/gates';
import { ownerNavigation } from '@/lib/navigation/roles/owner';

export const OwnerSidebar = () => {
  const flags = useNavigationFlags();
  const isLocked = useViewerPlanLock();
  return <RoleSidebar config={ownerNavigation} gates={{ isLocked, flags }} />;
};
