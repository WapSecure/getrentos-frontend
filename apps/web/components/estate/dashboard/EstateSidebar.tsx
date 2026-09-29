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
  Timer,
  Footprints,
} from 'lucide-react';
import { ROUTES } from '@/lib/constants/auth';
import { ESTATE_MARKETPLACE_ROUTES } from '@/lib/constants/auth';
import { GroupedSidebar } from '@/components/shared/dashboard/GroupedSidebar';
import { useSelectedEstate } from '@/app/(dashboard)/estate/layout';
import { tierAtLeast, type PlanTier } from '@getrentos/shared';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

/**
 * Which plan each nav item's destination needs, where it needs one at all.
 *
 * Dashboard, Governance, and Households are only *partially* gated (one
 * section/action each), so they deliberately stay unlocked here.
 *
 * "Regular visitors" is the Enterprise one: issuing somebody a standing
 * authorisation is an operational convenience on top of the free visitor-pass
 * machinery, not a safety feature — a free estate can still screen arrivals and
 * turn people away, which is what must never be paywalled.
 */
const GATED_ROUTES: Partial<Record<string, PlanTier>> = {
  [ROUTES.ESTATE_MICROSITE]: 'PRO',
  [ROUTES.ESTATE_FINANCIALS]: 'PRO',
  [ROUTES.ESTATE_CONTRACTORS]: 'ENTERPRISE',
  // Enterprise for the same reason Regular visitors is, and it is the same
  // purchase: E2 records who is authorised to keep arriving, and this says how
  // long they actually stay. An estate reviewing one wants the other.
  [ROUTES.ESTATE_DWELL]: 'ENTERPRISE',
  // The same purchase again: dwell says how long a contractor stays, and this
  // says whether the patrol went out at all. Both are the estate's own
  // management, not a barrier's decision — the guard's scan is not gated, which
  // is why a locked nav item here means "you cannot change the schedule", never
  // "your guards cannot scan".
  [ROUTES.ESTATE_PATROL]: 'ENTERPRISE',
};

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
  // The other half of a standing authorisation, so it sits with the screen that
  // creates one: E2 records who is allowed to keep arriving, and this says how
  // long they actually stay. An estate reviewing one wants the other.
  { label: 'Dwell analytics', href: ROUTES.ESTATE_DWELL, icon: Timer },
  { label: 'Deliveries', href: ROUTES.ESTATE_DELIVERIES, icon: Package },
  // Beside the gate features rather than with the estate's records: a patrol is
  // what an estate promises and the checkpoint is what checks it, which is the
  // same promise the visitor passes and the watch list are making.
  { label: 'Patrols', href: ROUTES.ESTATE_PATROL, icon: Footprints },
  { label: 'Violations', href: ROUTES.ESTATE_VIOLATIONS, icon: TriangleAlert },
  { label: 'Incidents', href: ROUTES.ESTATE_INCIDENTS, icon: Siren },
  // Not in GATED_ROUTES, and deliberately not: raising the alarm and calling the
  // roll is free on every plan. An estate that had to pay to find out whether the
  // people inside its building are safe is one that would not find out.
  { label: 'Emergency', href: ROUTES.ESTATE_EMERGENCY, icon: Siren },
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
  { label: 'Residents and access', items: navItems.slice(3, 11) },
  { label: 'Safety and operations', items: navItems.slice(11, 15) },
  { label: 'Community', items: navItems.slice(15, 19) },
  { label: 'Administration', items: navItems.slice(19) },
];

export const EstateSidebar = () => {
  const { estate } = useSelectedEstate();
  /**
   * The ESTATE's plan, not the viewer's. A staff member's own subscription says
   * nothing about what the estate they work for has bought — and the backend
   * resolves entitlement through the estate owner, so reading the caller's tier
   * marked a paying estate's features as locked for its staff, and a free
   * estate's as open for a manager who happened to subscribe personally.
   *
   * Unknown (the field is absent) locks nothing. The page behind an unlocked
   * item still refuses with the real upsell, which is a far better failure than
   * hiding a feature the estate pays for.
   */
  const planTier = estate?.planTier;

  return (
    <GroupedSidebar
      ariaLabel="Estate administration navigation"
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
