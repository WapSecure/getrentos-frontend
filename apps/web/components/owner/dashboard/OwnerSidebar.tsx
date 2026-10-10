'use client';

import {
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
  ClipboardCheck,
  PiggyBank,
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { TranslationKey } from '@/lib/i18n/translations';
import { ROUTES } from '@/lib/constants/auth';
import { ESTATE_MARKETPLACE_ROUTES } from '@/lib/constants/auth';
import { GroupedSidebar } from '@/components/shared/dashboard/GroupedSidebar';
import { usePlanTier } from '@/hooks/usePlanTier';

interface NavItem {
  labelKey?: TranslationKey;
  label?: string;
  href: string;
  icon: React.ElementType;
}

/**
 * Nav items whose destination is entirely Pro-gated. Home Management and
 * Shortlets were already backend-gated in Batch 7b (their controllers allow
 * both LANDLORD and PROPERTY_OWNER, and PlanTierGuard checks the caller's
 * own subscription regardless of role) but never got the lock-icon treatment
 * on this sidebar: fixed here alongside the new Analytics gate.
 */
const PRO_GATED_ROUTES = new Set<string>([ROUTES.OWNER_ANALYTICS, ROUTES.OWNER_HOME_MANAGEMENT]);

export const navItems: NavItem[] = [
  { labelKey: 'sidebar.dashboard', href: ROUTES.OWNER_DASHBOARD, icon: LayoutDashboard },
  { labelKey: 'sidebar.properties', href: ROUTES.OWNER_PROPERTIES, icon: Building2 },
  { labelKey: 'sidebar.land_marketplace', href: ROUTES.OWNER_LAND, icon: MapPinned },
  { labelKey: 'sidebar.shortlets', href: ROUTES.OWNER_SHORTLETS, icon: BedDouble },
  // Stays the owner booked as a guest, apart from the ones they host above.
  { label: 'My stays', href: ROUTES.OWNER_BOOKINGS, icon: Luggage },
  { labelKey: 'sidebar.sale_listings', href: ROUTES.OWNER_LISTINGS, icon: Megaphone },
  { labelKey: 'sidebar.buyer_leads', href: ROUTES.OWNER_LEADS, icon: Users },
  { labelKey: 'sidebar.offers', href: ROUTES.OWNER_OFFERS, icon: Handshake },
  { labelKey: 'sidebar.transactions', href: ROUTES.OWNER_TRANSACTIONS, icon: ShieldCheck },
  { labelKey: 'sidebar.investment_analytics', href: ROUTES.OWNER_ANALYTICS, icon: LineChart },
  { labelKey: 'sidebar.home_management', href: ROUTES.OWNER_HOME_MANAGEMENT, icon: Wrench },
  { labelKey: 'sidebar.vendors', href: ROUTES.OWNER_VENDORS, icon: HardHat },
  { labelKey: 'sidebar.inspections', href: ROUTES.OWNER_INSPECTIONS, icon: ClipboardCheck },
  { labelKey: 'sidebar.deposits', href: ROUTES.OWNER_DEPOSITS, icon: PiggyBank },
  { labelKey: 'sidebar.approvals', href: ROUTES.OWNER_APPROVALS, icon: ShieldCheck },
  { labelKey: 'sidebar.documents', href: ROUTES.OWNER_DOCUMENTS, icon: FolderOpen },
  { labelKey: 'sidebar.messages', href: ROUTES.OWNER_MESSAGES, icon: MessageCircle },
  { labelKey: 'sidebar.realtor_access', href: ROUTES.OWNER_REALTORS, icon: UserRoundCheck },
  { labelKey: 'sidebar.reviews', href: ROUTES.OWNER_REVIEWS, icon: Star },
  { labelKey: 'sidebar.trust_profile', href: ROUTES.OWNER_TRUST_PROFILE, icon: BadgeCheck },
  // Literal label (like Billing below): a mandate holder is not necessarily the
  // owner, so this is not phrased as one of the owner's own properties.
  { label: 'Managed properties', href: ROUTES.OWNER_MANAGED, icon: KeyRound },
  {
    label: 'Estate requests',
    href: ESTATE_MARKETPLACE_ROUTES.OWNER_ESTATE_AGREEMENTS,
    icon: Building2,
  },
  { labelKey: 'sidebar.settings', href: ROUTES.OWNER_SETTINGS, icon: Settings },
  { label: 'Billing', href: ROUTES.OWNER_BILLING, icon: BadgeCheck },
  { label: 'Verification', href: '/owner/verification', icon: ShieldCheck },
];

export const navGroups = [
  { label: 'Overview', items: navItems.slice(0, 1) },
  { label: 'Portfolio and listings', items: navItems.slice(1, 6) },
  { label: 'Sales and investment', items: navItems.slice(6, 15) },
  { label: 'Communication', items: navItems.slice(15, 18) },
  { label: 'Trust and account', items: navItems.slice(18) },
];

export const OwnerSidebar = () => {
  const { t } = useLanguage();
  const { isPro } = usePlanTier();
  return (
    <GroupedSidebar
      ariaLabel="Property owner navigation"
      dashboardHref={ROUTES.OWNER_DASHBOARD}
      groups={navGroups.map((group) => ({
        ...group,
        items: group.items.map((item) => ({
          ...item,
          label: item.labelKey ? t(item.labelKey) : item.label,
          locked: !isPro && PRO_GATED_ROUTES.has(item.href),
        })),
      }))}
    />
  );
};
