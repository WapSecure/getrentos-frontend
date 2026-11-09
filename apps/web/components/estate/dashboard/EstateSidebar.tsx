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

/**
 * Which plan each nav item's destination needs, where it needs one at all.
 *
 * Dashboard, Governance, and Households are only *partially* gated (one
 * section/action each), so they deliberately stay unlocked here.
 *
 * "Regular visitors" is the Enterprise one: issuing somebody a standing
 * authorisation is an operational convenience on top of the free visitor-pass
 * machinery, not a safety feature: a free estate can still screen arrivals and
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
  // management, not a barrier's decision: the guard's scan is not gated, which
  // is why a locked nav item here means "you cannot change the schedule", never
  // "your guards cannot scan".
  [ROUTES.ESTATE_PATROL]: 'ENTERPRISE',
  // The same purchase as the three above it, for the reason in the programme
  // doc: this board says who is expected and the guest list fills it in, but the
  // pass PIN is still what admits anybody. A guard without it checks people in
  // exactly as before — the loss is a phone call, not an admission.
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
  // Directly after the passes it reads, because it is the outstanding half of
  // the same thing: Visitor Passes lists what was issued, and this answers the
  // question a guard actually asks — who is due today — across invitations,
  // standing authorisations and parcels at once.
  { label: 'Expected today', href: ROUTES.ESTATE_EXPECTED, icon: CalendarClock },
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
  { label: 'Incidents', href: ROUTES.ESTATE_INCIDENTS, icon: OctagonAlert },
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
  { label: 'Billing', href: ROUTES.ESTATE_BILLING, icon: BadgeCheck },
];

/** Picks items by route, so a group can never drift from its label as items are added. */
const pick = (...hrefs: string[]) =>
  hrefs.flatMap((href) => navItems.filter((item) => item.href === href));

// Groups follow the estate office's jobs. Picked by route, not by position in
// the list above, so inserting an item can no longer shift every group after it.
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
  /**
   * The ESTATE's plan, not the viewer's. A staff member's own subscription says
   * nothing about what the estate they work for has bought: and the backend
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
