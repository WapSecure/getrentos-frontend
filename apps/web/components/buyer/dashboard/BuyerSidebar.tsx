'use client';

import { RoleSidebar } from '@/components/shared/dashboard/GroupedSidebar';
import { useNavigationFlags } from '@/lib/navigation/gates';
import { buyerNavigation } from '@/lib/navigation/roles/buyer';

export const BuyerSidebar = () => {
  const flags = useNavigationFlags();
  return <RoleSidebar config={buyerNavigation} gates={{ flags }} />;
};
