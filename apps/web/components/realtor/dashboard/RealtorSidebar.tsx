'use client';

import {
  LayoutDashboard,
  Users,
  Megaphone,
  UserPlus,
  CalendarClock,
  Handshake,
  Wallet,
  FolderOpen,
  MessageCircle,
  Star,
  BadgeCheck,
  Settings,
  KeyRound,
  Luggage,
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { TranslationKey } from '@/lib/i18n/translations';
import { ROUTES } from '@/lib/constants/auth';
import { createRoleNavigation, GroupedSidebar } from '@/components/shared/dashboard/GroupedSidebar';
import { usePlanTier } from '@/hooks/usePlanTier';

interface NavItem {
  labelKey?: TranslationKey;
  label?: string;
  href: string;
  icon: React.ElementType;
}

/** Nav items whose destination is entirely Pro-gated (see the Realtor/Owner gating extension). */
const PRO_GATED_ROUTES = new Set<string>([ROUTES.REALTOR_COMMISSIONS]);

export const navItems: NavItem[] = [
  { labelKey: 'sidebar.dashboard', href: ROUTES.REALTOR_DASHBOARD, icon: LayoutDashboard },
  { labelKey: 'sidebar.clients', href: ROUTES.REALTOR_CLIENTS, icon: Users },
  { labelKey: 'sidebar.listings', href: ROUTES.REALTOR_LISTINGS, icon: Megaphone },
  { labelKey: 'sidebar.leads', href: ROUTES.REALTOR_LEADS, icon: UserPlus },
  { labelKey: 'sidebar.viewings', href: ROUTES.REALTOR_VIEWINGS, icon: CalendarClock },
  { labelKey: 'sidebar.offers', href: ROUTES.REALTOR_OFFERS, icon: Handshake },
  { labelKey: 'sidebar.commissions', href: ROUTES.REALTOR_COMMISSIONS, icon: Wallet },
  { labelKey: 'sidebar.documents', href: ROUTES.REALTOR_DOCUMENTS, icon: FolderOpen },
  { labelKey: 'sidebar.messages', href: ROUTES.REALTOR_MESSAGES, icon: MessageCircle },
  { labelKey: 'sidebar.reviews', href: ROUTES.REALTOR_REVIEWS, icon: Star },
  { labelKey: 'sidebar.trust_profile', href: ROUTES.REALTOR_TRUST_PROFILE, icon: BadgeCheck },
  { label: 'Managed properties', href: ROUTES.REALTOR_MANAGED, icon: KeyRound },
  { label: 'My stays', href: ROUTES.REALTOR_BOOKINGS, icon: Luggage },
  { labelKey: 'sidebar.settings', href: ROUTES.REALTOR_SETTINGS, icon: Settings },
  { label: 'Billing', href: ROUTES.REALTOR_BILLING, icon: BadgeCheck },
  { label: 'Verification', href: ROUTES.REALTOR_VERIFICATION, icon: BadgeCheck },
];

/** Picks items by route, so a group can never drift from its label as items are added. */
const pick = (...hrefs: string[]) =>
  hrefs.flatMap((href) => navItems.filter((item) => item.href === href));

// Groups follow a realtor's work: winning business, closing deals and getting
// paid, records, and their professional standing (verification is a priority
// for a realtor, so it sits with their profile rather than under settings).
const baseNavGroups = [
  { label: 'Overview', items: pick(ROUTES.REALTOR_DASHBOARD) },
  {
    label: 'Clients and listings',
    items: pick(ROUTES.REALTOR_LISTINGS, ROUTES.REALTOR_CLIENTS, ROUTES.REALTOR_LEADS),
  },
  {
    label: 'Deals and commissions',
    items: pick(
      ROUTES.REALTOR_VIEWINGS,
      ROUTES.REALTOR_OFFERS,
      ROUTES.REALTOR_COMMISSIONS,
      ROUTES.REALTOR_MANAGED
    ),
  },
  {
    label: 'Messages and documents',
    items: pick(ROUTES.REALTOR_MESSAGES, ROUTES.REALTOR_DOCUMENTS),
  },
  {
    label: 'Professional profile',
    items: pick(ROUTES.REALTOR_VERIFICATION, ROUTES.REALTOR_TRUST_PROFILE, ROUTES.REALTOR_REVIEWS),
  },
  {
    label: 'Account',
    items: pick(ROUTES.REALTOR_SETTINGS, ROUTES.REALTOR_BILLING, ROUTES.REALTOR_BOOKINGS),
  },
];

export const navGroups = createRoleNavigation(
  baseNavGroups,
  [
    ROUTES.REALTOR_DASHBOARD,
    ROUTES.REALTOR_LISTINGS,
    ROUTES.REALTOR_CLIENTS,
    ROUTES.REALTOR_LEADS,
    ROUTES.REALTOR_OFFERS,
    ROUTES.REALTOR_MESSAGES,
  ],
  [ROUTES.REALTOR_SETTINGS, ROUTES.REALTOR_BILLING, ROUTES.REALTOR_BOOKINGS]
);

export const RealtorSidebar = () => {
  const { t } = useLanguage();
  const { isPro } = usePlanTier();
  return (
    <GroupedSidebar
      ariaLabel="Realtor navigation"
      workspaceLabel="Realtor"
      dashboardHref={ROUTES.REALTOR_DASHBOARD}
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
