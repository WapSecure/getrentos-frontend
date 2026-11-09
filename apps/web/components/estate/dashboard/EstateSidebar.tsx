'use client';

import {
  LayoutDashboard,
  Building2,
  Users,
  ReceiptText,
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
  BadgeCheck,
  PieChart,
  UserCheck,
  Timer,
  Footprints,
  CalendarClock,
  OctagonAlert,
} from 'lucide-react';
import { ROUTES } from '@/lib/constants/auth';
import { ESTATE_MARKETPLACE_ROUTES } from '@/lib/constants/auth';
import { createRoleNavigation, GroupedSidebar } from '@/components/shared/dashboard/GroupedSidebar';
import { useSelectedEstate } from '@/app/(dashboard)/estate/layout';
import { tierAtLeast, type PlanTier } from '@sureground/shared';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

// Dashboard, Governance and Households are only partly gated, so they stay unlocked; screening arrivals must never be paywalled.
const GATED_ROUTES: Partial<Record<string, PlanTier>> = {
  [ROUTES.ESTATE_MICROSITE]: 'PRO',
  [ROUTES.ESTATE_FINANCIALS]: 'PRO',
  [ROUTES.ESTATE_CONTRACTORS]: 'ENTERPRISE',
  [ROUTES.ESTATE_DWELL]: 'ENTERPRISE',
  // Gates changing the schedule only; the guard's scan is never gated.
  [ROUTES.ESTATE_PATROL]: 'ENTERPRISE',
  [ROUTES.ESTATE_EXPECTED]: 'ENTERPRISE',
};

export const navItems: NavItem[] = [
  { label: 'Dashboard', href: ROUTES.ESTATE_DASHBOARD, icon: LayoutDashboard },
  { label: 'Marketplace', href: ESTATE_MARKETPLACE_ROUTES.ESTATE_MARKETPLACE, icon: Building2 },
  { label: 'Enquiries', href: ESTATE_MARKETPLACE_ROUTES.ESTATE_LEADS, icon: Inbox },
  { label: 'Announcements', href: ROUTES.ESTATE_ANNOUNCEMENTS, icon: Megaphone },
  { label: 'Households', href: ROUTES.ESTATE_HOUSEHOLDS, icon: Users },
  { label: 'Dues', href: ROUTES.ESTATE_DUES, icon: ReceiptText },
  { label: 'Visitor passes', href: ROUTES.ESTATE_VISITOR_PASSES, icon: KeyRound },
  { label: 'Expected today', href: ROUTES.ESTATE_EXPECTED, icon: CalendarClock },
  { label: 'Vehicles', href: ROUTES.ESTATE_VEHICLES, icon: Car },
  { label: 'Watch list', href: ROUTES.ESTATE_WATCHLIST, icon: ShieldAlert },
  { label: 'Regular visitors', href: ROUTES.ESTATE_CONTRACTORS, icon: UserCheck },
  { label: 'Dwell analytics', href: ROUTES.ESTATE_DWELL, icon: Timer },
  { label: 'Deliveries', href: ROUTES.ESTATE_DELIVERIES, icon: Package },
  { label: 'Patrols', href: ROUTES.ESTATE_PATROL, icon: Footprints },
  { label: 'Violations', href: ROUTES.ESTATE_VIOLATIONS, icon: TriangleAlert },
  { label: 'Incidents', href: ROUTES.ESTATE_INCIDENTS, icon: OctagonAlert },
  // Deliberately not gated: raising the alarm and calling the roll is free on every plan.
  { label: 'Emergency', href: ROUTES.ESTATE_EMERGENCY, icon: Siren },
  { label: 'Maintenance', href: ROUTES.ESTATE_MAINTENANCE, icon: Hammer },
  { label: 'Polls', href: ROUTES.ESTATE_POLLS, icon: Vote },
  { label: 'Amenities', href: ROUTES.ESTATE_AMENITIES, icon: CalendarCheck },
  { label: 'Governance', href: ROUTES.ESTATE_GOVERNANCE, icon: BookOpen },
  { label: 'Committee', href: ROUTES.ESTATE_COMMITTEE, icon: Landmark },
  { label: 'Microsite', href: ROUTES.ESTATE_MICROSITE, icon: Globe },
  { label: 'Financials', href: ROUTES.ESTATE_FINANCIALS, icon: PieChart },
  { label: 'Staff', href: ROUTES.ESTATE_STAFF, icon: ShieldCheck },
  { label: 'Billing', href: ROUTES.ESTATE_BILLING, icon: BadgeCheck },
];

const pick = (...hrefs: string[]) =>
  hrefs.flatMap((href) => navItems.filter((item) => item.href === href));

const baseNavGroups = [
  { label: 'Overview', items: pick(ROUTES.ESTATE_DASHBOARD) },
  {
    label: 'Marketplace',
    items: pick(
      ESTATE_MARKETPLACE_ROUTES.ESTATE_MARKETPLACE,
      ESTATE_MARKETPLACE_ROUTES.ESTATE_LEADS
    ),
  },
  {
    label: 'Residents',
    items: pick(ROUTES.ESTATE_ANNOUNCEMENTS, ROUTES.ESTATE_HOUSEHOLDS, ROUTES.ESTATE_DUES),
  },
  {
    label: 'Gate and visitors',
    items: pick(
      ROUTES.ESTATE_VISITOR_PASSES,
      ROUTES.ESTATE_EXPECTED,
      ROUTES.ESTATE_VEHICLES,
      ROUTES.ESTATE_WATCHLIST,
      ROUTES.ESTATE_CONTRACTORS,
      ROUTES.ESTATE_DWELL,
      ROUTES.ESTATE_DELIVERIES
    ),
  },
  {
    label: 'Safety',
    items: pick(
      ROUTES.ESTATE_PATROL,
      ROUTES.ESTATE_VIOLATIONS,
      ROUTES.ESTATE_INCIDENTS,
      ROUTES.ESTATE_EMERGENCY
    ),
  },
  {
    label: 'Community',
    items: pick(
      ROUTES.ESTATE_MAINTENANCE,
      ROUTES.ESTATE_POLLS,
      ROUTES.ESTATE_AMENITIES,
      ROUTES.ESTATE_GOVERNANCE
    ),
  },
  {
    label: 'Administration',
    items: pick(
      ROUTES.ESTATE_COMMITTEE,
      ROUTES.ESTATE_MICROSITE,
      ROUTES.ESTATE_FINANCIALS,
      ROUTES.ESTATE_STAFF,
      ROUTES.ESTATE_BILLING
    ),
  },
];

export const navGroups = createRoleNavigation(
  baseNavGroups,
  [
    ROUTES.ESTATE_DASHBOARD,
    ROUTES.ESTATE_HOUSEHOLDS,
    ROUTES.ESTATE_VISITOR_PASSES,
    ROUTES.ESTATE_EXPECTED,
    ROUTES.ESTATE_INCIDENTS,
    ROUTES.ESTATE_EMERGENCY,
  ],
  [ROUTES.ESTATE_BILLING]
);

export const EstateSidebar = () => {
  const { estate } = useSelectedEstate();
  /** The estate's plan, not the viewer's: entitlement comes from the estate owner. Unknown locks nothing; the page still refuses with the real upsell. */
  const planTier = estate?.planTier;

  return (
    <GroupedSidebar
      ariaLabel="Estate administration navigation"
      workspaceLabel={estate?.name ?? 'Estate administration'}
      dashboardHref={ROUTES.ESTATE_DASHBOARD}
      groups={navGroups.map((group) => ({
        ...group,
        items: group.items.map((item) => {
          const required = GATED_ROUTES[item.href];
          const locked = Boolean(planTier && required && !tierAtLeast(planTier, required));
          return { ...item, locked, lockedPlan: required };
        }),
      }))}
    />
  );
};
