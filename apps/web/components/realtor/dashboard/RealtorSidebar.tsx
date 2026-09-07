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
  { labelKey: 'sidebar.settings', href: ROUTES.REALTOR_SETTINGS, icon: Settings },
];

export const navGroups = [
  { label: 'Overview', items: navItems.slice(0, 1) },
  { label: 'Business development', items: navItems.slice(1, 4) },
  { label: 'Transactions', items: navItems.slice(4, 7) },
  { label: 'Communication', items: navItems.slice(7, 9) },
  { label: 'Trust and account', items: navItems.slice(9) },
];

export const RealtorSidebar = () => {
  const { t } = useLanguage();
  return (
    <GroupedSidebar
      ariaLabel="Realtor navigation"
      dashboardHref={ROUTES.REALTOR_DASHBOARD}
      groups={navGroups.map((group) => ({
        ...group,
        items: group.items.map((item) => ({ ...item, label: t(item.labelKey) })),
      }))}
    />
  );
};
