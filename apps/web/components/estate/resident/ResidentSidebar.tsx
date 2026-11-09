'use client';

import { RoleSidebar } from '@/components/shared/dashboard/GroupedSidebar';
import { residentNavigation } from '@/lib/navigation/roles/resident';

export const ResidentSidebar = () => <RoleSidebar config={residentNavigation} />;
