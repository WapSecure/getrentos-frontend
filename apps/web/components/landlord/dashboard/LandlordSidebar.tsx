'use client';

import { RoleSidebar } from '@/components/shared/dashboard/GroupedSidebar';
import { useViewerPlanLock } from '@/lib/navigation/gates';
import { landlordNavigation } from '@/lib/navigation/roles/landlord';

export const LandlordSidebar = () => {
  const isLocked = useViewerPlanLock();
  return <RoleSidebar config={landlordNavigation} gates={{ isLocked }} />;
};
