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
  Siren,
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
  // Last, and outside the groups above it, because it is not a place you browse
  // to — it is where a banner sends you when the estate is calling the roll.
  { label: 'Emergency', href: ROUTES.RESIDENT_EMERGENCY, icon: Siren },
];

// Positional slices, like the estate sidebar's: moving an item means moving the
// boundaries. The emergency screen gets a group of its own rather than a place in
// "Community", because it is not a place a resident browses to — it is where the
// banner sends them when the estate is calling the roll.
export const residentNavGroups = [
  { label: 'Overview', items: residentNavItems.slice(0, 2) },
  { label: 'Access and services', items: residentNavItems.slice(2, 8) },
  { label: 'Community', items: residentNavItems.slice(8, 12) },
  { label: 'Emergency', items: residentNavItems.slice(12) },
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
