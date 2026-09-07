'use client';

import {
  LayoutDashboard,
  Receipt,
  KeyRound,
  Megaphone,
  TriangleAlert,
  Package,
  Contact,
  Wrench,
  Vote,
  CalendarCheck,
  Landmark,
  BookOpen,
} from 'lucide-react';
import { ROUTES } from '@/lib/constants/auth';
import { GroupedSidebar } from '@/components/shared/dashboard/GroupedSidebar';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

export const residentNavItems: NavItem[] = [
  { label: 'Dashboard', href: ROUTES.RESIDENT_DASHBOARD, icon: LayoutDashboard },
  { label: 'Announcements', href: ROUTES.RESIDENT_ANNOUNCEMENTS, icon: Megaphone },
  { label: 'Dues', href: ROUTES.RESIDENT_DUES, icon: Receipt },
  { label: 'Visitor Passes', href: ROUTES.RESIDENT_VISITOR_PASSES, icon: KeyRound },
  { label: 'Deliveries', href: ROUTES.RESIDENT_DELIVERIES, icon: Package },
  { label: 'Violations', href: ROUTES.RESIDENT_VIOLATIONS, icon: TriangleAlert },
  { label: 'Directory', href: ROUTES.RESIDENT_DIRECTORY, icon: Contact },
  { label: 'Maintenance', href: ROUTES.RESIDENT_MAINTENANCE, icon: Wrench },
  { label: 'Polls', href: ROUTES.RESIDENT_POLLS, icon: Vote },
  { label: 'Amenities', href: ROUTES.RESIDENT_AMENITIES, icon: CalendarCheck },
  { label: 'Committee', href: ROUTES.RESIDENT_COMMITTEE, icon: Landmark },
  { label: 'Governance', href: ROUTES.RESIDENT_GOVERNANCE, icon: BookOpen },
];

export const residentNavGroups = [
  { label: 'Overview', items: residentNavItems.slice(0, 2) },
  { label: 'Access and services', items: residentNavItems.slice(2, 8) },
  { label: 'Community', items: residentNavItems.slice(8) },
];

export const ResidentSidebar = () => {
  return (
    <GroupedSidebar
      ariaLabel="Resident navigation"
      dashboardHref={ROUTES.RESIDENT_DASHBOARD}
      groups={residentNavGroups}
    />
  );
};
