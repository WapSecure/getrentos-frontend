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
  Settings,
  MapPinned,
  BedDouble,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { TranslationKey } from '@/lib/i18n/translations';
import { ROUTES } from '@/lib/constants/auth';
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
 * on this sidebar — fixed here alongside the new Analytics gate.
 */
const PRO_GATED_ROUTES = new Set<string>([
  ROUTES.OWNER_ANALYTICS,
  ROUTES.OWNER_HOME_MANAGEMENT,
  ROUTES.OWNER_SHORTLETS,
]);

export const navItems: NavItem[] = [
  { labelKey: 'sidebar.dashboard', href: ROUTES.OWNER_DASHBOARD, icon: LayoutDashboard },
  { labelKey: 'sidebar.properties', href: ROUTES.OWNER_PROPERTIES, icon: Building2 },
  { labelKey: 'sidebar.land_marketplace', href: ROUTES.OWNER_LAND, icon: MapPinned },
  { labelKey: 'sidebar.shortlets', href: ROUTES.OWNER_SHORTLETS, icon: BedDouble },
  { labelKey: 'sidebar.sale_listings', href: ROUTES.OWNER_LISTINGS, icon: Megaphone },
  { labelKey: 'sidebar.buyer_leads', href: ROUTES.OWNER_LEADS, icon: Users },
  { labelKey: 'sidebar.offers', href: ROUTES.OWNER_OFFERS, icon: Handshake },
  { labelKey: 'sidebar.transactions', href: ROUTES.OWNER_TRANSACTIONS, icon: ShieldCheck },
  { labelKey: 'sidebar.investment_analytics', href: ROUTES.OWNER_ANALYTICS, icon: LineChart },
  { labelKey: 'sidebar.home_management', href: ROUTES.OWNER_HOME_MANAGEMENT, icon: Wrench },
  { labelKey: 'sidebar.documents', href: ROUTES.OWNER_DOCUMENTS, icon: FolderOpen },
  { labelKey: 'sidebar.messages', href: ROUTES.OWNER_MESSAGES, icon: MessageCircle },
  { labelKey: 'sidebar.realtor_access', href: ROUTES.OWNER_REALTORS, icon: UserRoundCheck },
  { labelKey: 'sidebar.reviews', href: ROUTES.OWNER_REVIEWS, icon: Star },
  { labelKey: 'sidebar.trust_profile', href: ROUTES.OWNER_TRUST_PROFILE, icon: BadgeCheck },
  { labelKey: 'sidebar.settings', href: ROUTES.OWNER_SETTINGS, icon: Settings },
  { label: 'Billing', href: ROUTES.OWNER_BILLING, icon: Sparkles },
  { label: 'Verification', href: '/owner/verification', icon: ShieldCheck },
];

export const navGroups = [
  { label: 'Overview', items: navItems.slice(0, 1) },
  { label: 'Portfolio and listings', items: navItems.slice(1, 5) },
  { label: 'Sales and investment', items: navItems.slice(5, 10) },
  { label: 'Communication', items: navItems.slice(10, 13) },
  { label: 'Trust and account', items: navItems.slice(13) },
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
