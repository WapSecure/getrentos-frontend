'use client';

import {
  LayoutDashboard,
  Users,
  Receipt,
  KeyRound,
  ShieldCheck,
  Megaphone,
  TriangleAlert,
  BookOpen,
  Car,
  Package,
  Siren,
  Hammer,
  Vote,
  CalendarCheck,
  Landmark,
  Globe,
  Sparkles,
} from 'lucide-react';
import { ROUTES } from '@/lib/constants/auth';
import { GroupedSidebar } from '@/components/shared/dashboard/GroupedSidebar';
import { usePlanTier } from '@/hooks/usePlanTier';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

/** Nav items whose destination is entirely Pro-gated (see Batch 7c). Dashboard,
 * Governance, and Households are only *partially* gated (one section/action
 * each), so they deliberately stay unlocked here. */
const PRO_GATED_ROUTES = new Set<string>([ROUTES.ESTATE_MICROSITE]);

export const navItems: NavItem[] = [
  { label: 'Dashboard', href: ROUTES.ESTATE_DASHBOARD, icon: LayoutDashboard },
  { label: 'Announcements', href: ROUTES.ESTATE_ANNOUNCEMENTS, icon: Megaphone },
  { label: 'Households', href: ROUTES.ESTATE_HOUSEHOLDS, icon: Users },
  { label: 'Dues', href: ROUTES.ESTATE_DUES, icon: Receipt },
  { label: 'Visitor Passes', href: ROUTES.ESTATE_VISITOR_PASSES, icon: KeyRound },
  { label: 'Vehicles', href: ROUTES.ESTATE_VEHICLES, icon: Car },
  { label: 'Deliveries', href: ROUTES.ESTATE_DELIVERIES, icon: Package },
  { label: 'Violations', href: ROUTES.ESTATE_VIOLATIONS, icon: TriangleAlert },
  { label: 'Incidents', href: ROUTES.ESTATE_INCIDENTS, icon: Siren },
  { label: 'Maintenance', href: ROUTES.ESTATE_MAINTENANCE, icon: Hammer },
  { label: 'Polls', href: ROUTES.ESTATE_POLLS, icon: Vote },
  { label: 'Amenities', href: ROUTES.ESTATE_AMENITIES, icon: CalendarCheck },
  { label: 'Governance', href: ROUTES.ESTATE_GOVERNANCE, icon: BookOpen },
  { label: 'Committee', href: ROUTES.ESTATE_COMMITTEE, icon: Landmark },
  { label: 'Microsite', href: ROUTES.ESTATE_MICROSITE, icon: Globe },
  { label: 'Staff', href: ROUTES.ESTATE_STAFF, icon: ShieldCheck },
  { label: 'Billing', href: ROUTES.ESTATE_BILLING, icon: Sparkles },
];

export const navGroups = [
  { label: 'Overview', items: navItems.slice(0, 2) },
  { label: 'Residents and access', items: navItems.slice(2, 7) },
  { label: 'Safety and operations', items: navItems.slice(7, 10) },
  { label: 'Community', items: navItems.slice(10, 14) },
  { label: 'Administration', items: navItems.slice(14) },
];

export const EstateSidebar = () => {
  const { isPro } = usePlanTier();
  return (
    <GroupedSidebar
      ariaLabel="Estate administration navigation"
      dashboardHref={ROUTES.ESTATE_DASHBOARD}
      groups={navGroups.map((group) => ({
        ...group,
        items: group.items.map((item) => ({
          ...item,
          locked: !isPro && PRO_GATED_ROUTES.has(item.href),
        })),
      }))}
    />
  );
};
