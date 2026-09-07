'use client';

import {
  LayoutDashboard,
  Search,
  Heart,
  CalendarClock,
  Handshake,
  ShieldCheck,
  FolderOpen,
  MessageCircle,
  Star,
  BadgeCheck,
  Settings,
  MapPinned,
  BedDouble,
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { TranslationKey } from '@/lib/i18n/translations';
import { ROUTES } from '@/lib/constants/auth';
import { GroupedSidebar } from '@/components/shared/dashboard/GroupedSidebar';

interface NavItem {
  labelKey: TranslationKey;
  href: string;
  icon: React.ElementType;
}

export const navItems: NavItem[] = [
  { labelKey: 'sidebar.dashboard', href: ROUTES.BUYER_DASHBOARD, icon: LayoutDashboard },
  { labelKey: 'sidebar.discover', href: ROUTES.BUYER_DISCOVER, icon: Search },
  { labelKey: 'sidebar.land_marketplace', href: ROUTES.BUYER_LAND, icon: MapPinned },
  { labelKey: 'sidebar.shortlet_bookings', href: ROUTES.BUYER_BOOKINGS, icon: BedDouble },
  { labelKey: 'sidebar.saved_properties', href: ROUTES.BUYER_SAVED, icon: Heart },
  { labelKey: 'sidebar.viewing_requests', href: ROUTES.BUYER_VIEWINGS, icon: CalendarClock },
  { labelKey: 'sidebar.offers', href: ROUTES.BUYER_OFFERS, icon: Handshake },
  { labelKey: 'sidebar.transactions', href: ROUTES.BUYER_TRANSACTIONS, icon: ShieldCheck },
  { labelKey: 'sidebar.documents', href: ROUTES.BUYER_DOCUMENTS, icon: FolderOpen },
  { labelKey: 'sidebar.messages', href: ROUTES.BUYER_MESSAGES, icon: MessageCircle },
  { labelKey: 'sidebar.reviews', href: ROUTES.BUYER_REVIEWS, icon: Star },
  { labelKey: 'sidebar.trust_profile', href: ROUTES.BUYER_TRUST_PROFILE, icon: BadgeCheck },
  { labelKey: 'sidebar.settings', href: ROUTES.BUYER_SETTINGS, icon: Settings },
];

export const navGroups = [
  { label: 'Overview', items: navItems.slice(0, 1) },
  { label: 'Find property', items: navItems.slice(1, 5) },
  { label: 'Buying journey', items: navItems.slice(5, 8) },
  { label: 'Communication', items: navItems.slice(8, 10) },
  { label: 'Trust and account', items: navItems.slice(10) },
];

export const BuyerSidebar = () => {
  const { t } = useLanguage();
  return (
    <GroupedSidebar
      ariaLabel="Buyer navigation"
      dashboardHref={ROUTES.BUYER_DASHBOARD}
      groups={navGroups.map((group) => ({
        ...group,
        items: group.items.map((item) => ({ ...item, label: t(item.labelKey) })),
      }))}
    />
  );
};
