'use client';

import {
  CalendarClock,
  LayoutDashboard,
  Building2,
  Megaphone,
  Users,
  Handshake,
  ShieldCheck,
  LineChart,
  FolderOpen,
  MessageCircle,
  Star,
  BadgeCheck,
  UserRoundCheck,
  Wrench,
  HardHat,
  Settings,
  MapPinned,
  BedDouble,
  Luggage,
  KeyRound,
  History,
  MessageSquareText,
  ClipboardCheck,
  PiggyBank,
  ReceiptText,
  ListChecks,
  Wallet,
  IdCard,
  Landmark,
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { TranslationKey } from '@/lib/i18n/translations';
import { ROUTES } from '@/lib/constants/auth';
import { ESTATE_MARKETPLACE_ROUTES } from '@/lib/constants/auth';
import { OWNER_LAND_SALES_ROUTE } from '@/lib/constants/landDeveloperRoutes';
import { useLandAvailability } from '@/hooks/useLandAvailability';
import { createRoleNavigation, GroupedSidebar } from '@/components/shared/dashboard/GroupedSidebar';
import { usePlanTier } from '@/hooks/usePlanTier';

interface NavItem {
  labelKey?: TranslationKey;
  label?: string;
  href: string;
  icon: React.ElementType;
}

const PRO_GATED_ROUTES = new Set<string>([ROUTES.OWNER_ANALYTICS, ROUTES.OWNER_HOME_MANAGEMENT]);
const LAND_ROUTES = new Set<string>([ROUTES.OWNER_LAND, OWNER_LAND_SALES_ROUTE]);

export const navItems: NavItem[] = [
  { labelKey: 'sidebar.dashboard', href: ROUTES.OWNER_DASHBOARD, icon: LayoutDashboard },
  { labelKey: 'sidebar.properties', href: ROUTES.OWNER_PROPERTIES, icon: Building2 },
  { labelKey: 'sidebar.land_marketplace', href: ROUTES.OWNER_LAND, icon: MapPinned },
  { label: 'Plot sales', href: OWNER_LAND_SALES_ROUTE, icon: ReceiptText },
  { labelKey: 'sidebar.shortlets', href: ROUTES.OWNER_SHORTLETS, icon: BedDouble },
  { label: 'My stays', href: ROUTES.OWNER_BOOKINGS, icon: Luggage },
  { labelKey: 'sidebar.sale_listings', href: ROUTES.OWNER_LISTINGS, icon: Megaphone },
  { labelKey: 'sidebar.buyer_leads', href: ROUTES.OWNER_LEADS, icon: Users },
  { labelKey: 'sidebar.viewings', href: ROUTES.OWNER_VIEWINGS, icon: CalendarClock },
  { labelKey: 'sidebar.offers', href: ROUTES.OWNER_OFFERS, icon: Handshake },
  { labelKey: 'sidebar.transactions', href: ROUTES.OWNER_TRANSACTIONS, icon: ShieldCheck },
  { labelKey: 'sidebar.investment_analytics', href: ROUTES.OWNER_ANALYTICS, icon: LineChart },
  { labelKey: 'sidebar.home_management', href: ROUTES.OWNER_HOME_MANAGEMENT, icon: Wrench },
  { labelKey: 'sidebar.vendors', href: ROUTES.OWNER_VENDORS, icon: HardHat },
  { labelKey: 'sidebar.inspections', href: ROUTES.OWNER_INSPECTIONS, icon: ClipboardCheck },
  { labelKey: 'sidebar.deposits', href: ROUTES.OWNER_DEPOSITS, icon: PiggyBank },
  { labelKey: 'sidebar.approvals', href: ROUTES.OWNER_APPROVALS, icon: ListChecks },
  { labelKey: 'sidebar.documents', href: ROUTES.OWNER_DOCUMENTS, icon: FolderOpen },
  { labelKey: 'sidebar.messages', href: ROUTES.OWNER_MESSAGES, icon: MessageCircle },
  { labelKey: 'sidebar.realtor_access', href: ROUTES.OWNER_REALTORS, icon: UserRoundCheck },
  { labelKey: 'sidebar.reviews', href: ROUTES.OWNER_REVIEWS, icon: Star },
  { labelKey: 'sidebar.trust_profile', href: ROUTES.OWNER_TRUST_PROFILE, icon: BadgeCheck },
  // Literal label: a mandate holder is not necessarily the owner.
  { label: 'Managed properties', href: ROUTES.OWNER_MANAGED, icon: KeyRound },
  { labelKey: 'sidebar.activity', href: ROUTES.OWNER_ACTIVITY, icon: History },
  { labelKey: 'sidebar.queries', href: ROUTES.OWNER_QUERIES, icon: MessageSquareText },
  {
    label: 'Estate requests',
    href: ESTATE_MARKETPLACE_ROUTES.OWNER_ESTATE_AGREEMENTS,
    icon: Landmark,
  },
  { labelKey: 'sidebar.settings', href: ROUTES.OWNER_SETTINGS, icon: Settings },
  { label: 'Billing', href: ROUTES.OWNER_BILLING, icon: Wallet },
  { label: 'Verification', href: '/owner/verification', icon: IdCard },
];

const pick = (...hrefs: string[]) =>
  hrefs.flatMap((href) => navItems.filter((item) => item.href === href));

const baseNavGroups = [
  { label: 'Overview', items: pick(ROUTES.OWNER_DASHBOARD, ROUTES.OWNER_PROPERTIES) },
  {
    label: 'Selling',
    items: pick(
      ROUTES.OWNER_LISTINGS,
      ROUTES.OWNER_LEADS,
      ROUTES.OWNER_VIEWINGS,
      ROUTES.OWNER_OFFERS,
      ROUTES.OWNER_TRANSACTIONS,
      ROUTES.OWNER_REALTORS
    ),
  },
  { label: 'Land', items: pick(ROUTES.OWNER_LAND, OWNER_LAND_SALES_ROUTE) },
  { label: 'Short stays', items: pick(ROUTES.OWNER_SHORTLETS) },
  {
    label: 'Property care',
    items: pick(
      ROUTES.OWNER_HOME_MANAGEMENT,
      ROUTES.OWNER_VENDORS,
      ROUTES.OWNER_INSPECTIONS,
      ROUTES.OWNER_DEPOSITS
    ),
  },
  {
    label: 'Money and records',
    items: pick(
      ROUTES.OWNER_ANALYTICS,
      ROUTES.OWNER_DOCUMENTS,
      ROUTES.OWNER_APPROVALS,
      ROUTES.OWNER_ACTIVITY
    ),
  },
  {
    label: 'Managers and partners',
    items: pick(
      ROUTES.OWNER_MESSAGES,
      ROUTES.OWNER_MANAGED,
      ROUTES.OWNER_QUERIES,
      ESTATE_MARKETPLACE_ROUTES.OWNER_ESTATE_AGREEMENTS,
      ROUTES.OWNER_REVIEWS
    ),
  },
  {
    label: 'Account',
    items: pick(
      ROUTES.OWNER_SETTINGS,
      ROUTES.OWNER_BILLING,
      '/owner/verification',
      ROUTES.OWNER_TRUST_PROFILE,
      ROUTES.OWNER_BOOKINGS
    ),
  },
];

export const navGroups = createRoleNavigation(
  baseNavGroups,
  [
    ROUTES.OWNER_DASHBOARD,
    ROUTES.OWNER_PROPERTIES,
    ROUTES.OWNER_LISTINGS,
    ROUTES.OWNER_OFFERS,
    ROUTES.OWNER_TRANSACTIONS,
    ROUTES.OWNER_MESSAGES,
  ],
  [
    ROUTES.OWNER_SETTINGS,
    ROUTES.OWNER_BILLING,
    '/owner/verification',
    ROUTES.OWNER_TRUST_PROFILE,
    ROUTES.OWNER_BOOKINGS,
  ]
);

export const OwnerSidebar = () => {
  const land = useLandAvailability();
  const { t } = useLanguage();
  const { isPro } = usePlanTier();
  return (
    <GroupedSidebar
      ariaLabel="Property owner navigation"
      workspaceLabel="Property owner"
      dashboardHref={ROUTES.OWNER_DASHBOARD}
      groups={navGroups.map((group) => ({
        ...group,
        items: group.items
          .filter((item) => land.owners || !LAND_ROUTES.has(item.href))
          .map((item) => ({
            ...item,
            label: item.labelKey ? t(item.labelKey) : item.label,
            locked: !isPro && PRO_GATED_ROUTES.has(item.href),
          })),
      }))}
    />
  );
};
