'use client';

import { RoleSidebar } from '@/components/shared/dashboard/GroupedSidebar';
import { renterNavigation } from '@/lib/navigation/roles/renter';

export const RenterSidebar = () => <RoleSidebar config={renterNavigation} />;
