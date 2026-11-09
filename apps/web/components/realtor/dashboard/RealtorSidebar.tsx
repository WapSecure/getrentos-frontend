'use client';

import { RoleSidebar } from '@/components/shared/dashboard/GroupedSidebar';
import { useViewerPlanLock } from '@/lib/navigation/gates';
import { realtorNavigation } from '@/lib/navigation/roles/realtor';

export const RealtorSidebar = () => {
  const isLocked = useViewerPlanLock();
  return <RoleSidebar config={realtorNavigation} gates={{ isLocked }} />;
};
