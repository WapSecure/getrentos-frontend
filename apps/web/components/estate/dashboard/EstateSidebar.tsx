'use client';

import {
  LayoutDashboard,
  Building2,
  Users,
  Receipt,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  Megaphone,
  TriangleAlert,
  BookOpen,
  Car,
  Package,
  Siren,
  Hammer,
  Vote,
  CalendarCheck,
  Inbox,
  Landmark,
  Globe,
  Sparkles,
  PieChart,
  UserCheck,
} from 'lucide-react';
import { ROUTES } from '@/lib/constants/auth';
import { ESTATE_MARKETPLACE_ROUTES } from '@/lib/constants/auth';
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
const PRO_GATED_ROUTES = new Set<string>([ROUTES.ESTATE_MICROSITE, ROUTES.ESTATE_FINANCIALS]);

export const navItems: NavItem[] = [
  { label: 'Dashboard', href: ROUTES.ESTATE_DASHBOARD, icon: LayoutDashboard },
  { label: 'Marketplace', href: ESTATE_MARKETPLACE_ROUTES.ESTATE_MARKETPLACE, icon: Building2 },
  { label: 'Enquiries', href: ESTATE_MARKETPLACE_ROUTES.ESTATE_LEADS, icon: Inbox },
  { label: 'Announcements', href: ROUTES.ESTATE_ANNOUNCEMENTS, icon: Megaphone },
  { label: 'Households', href: ROUTES.ESTATE_HOUSEHOLDS, icon: Users },
  { label: 'Dues', href: ROUTES.ESTATE_DUES, icon: Receipt },
  { label: 'Visitor Passes', href: ROUTES.ESTATE_VISITOR_PASSES, icon: KeyRound },
  { label: 'Vehicles', href: ROUTES.ESTATE_VEHICLES, icon: Car },
  { label: 'Watch list', href: ROUTES.ESTATE_WATCHLIST, icon: ShieldAlert },
  // Next to the watch list because the two answer the same question from
  // opposite sides: who must not be admitted, and who is already allowed to keep
  // coming back.
  { label: 'Regular visitors', href: ROUTES.ESTATE_CONTRACTORS, icon: UserCheck },
  { label: 'Deliveries', href: ROUTES.ESTATE_DELIVERIES, icon: Package },
  { label: 'Violations', href: ROUTES.ESTATE_VIOLATIONS, icon: TriangleAlert },
  { label: 'Incidents', href: ROUTES.ESTATE_INCIDENTS, icon: Siren },
  { label: 'Maintenance', href: ROUTES.ESTATE_MAINTENANCE, icon: Hammer },
  { label: 'Polls', href: ROUTES.ESTATE_POLLS, icon: Vote },
  { label: 'Amenities', href: ROUTES.ESTATE_AMENITIES, icon: CalendarCheck },
  { label: 'Governance', href: ROUTES.ESTATE_GOVERNANCE, icon: BookOpen },
  { label: 'Committee', href: ROUTES.ESTATE_COMMITTEE, icon: Landmark },
  { label: 'Microsite', href: ROUTES.ESTATE_MICROSITE, icon: Globe },
  { label: 'Financials', href: ROUTES.ESTATE_FINANCIALS, icon: PieChart },
  { label: 'Staff', href: ROUTES.ESTATE_STAFF, icon: ShieldCheck },
  { label: 'Billing', href: ROUTES.ESTATE_BILLING, icon: Sparkles },
];

// The groups are positional slices of `navItems`, so inserting an item means
// moving the boundaries below with it — otherwise every group after the
// insertion point silently shifts by one.
export const navGroups = [
  { label: 'Overview', items: navItems.slice(0, 3) },
  { label: 'Residents and access', items: navItems.slice(3, 10) },
  { label: 'Safety and operations', items: navItems.slice(10, 13) },
  { label: 'Community', items: navItems.slice(13, 17) },
  { label: 'Administration', items: navItems.slice(17) },
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
