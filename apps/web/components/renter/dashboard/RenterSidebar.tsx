'use client';

import {
  LayoutDashboard,
  Search,
  Heart,
  FileText,
  CreditCard,
  MessageCircle,
  House,
  Wrench,
  Settings,
  HelpCircle,
  Users,
  Star,
  Calendar,
  BedDouble,
  Gift,
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { TranslationKey } from '@/lib/i18n/translations';
import { ROUTES } from '@/lib/constants/auth';
import { GroupedSidebar, isSidebarRouteActive } from '@/components/shared/dashboard/GroupedSidebar';

interface NavItem {
  labelKey?: TranslationKey;
  label?: string;
  href: string;
  icon: React.ElementType;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { labelKey: 'sidebar.dashboard', href: ROUTES.RENTER_DASHBOARD, icon: LayoutDashboard },
    ],
  },
  {
    label: 'Find a home',
    items: [
      { labelKey: 'sidebar.discover', href: ROUTES.RENTER_DISCOVER, icon: Search },
      { labelKey: 'sidebar.saved', href: ROUTES.RENTER_SAVED, icon: Heart },
      { labelKey: 'sidebar.shortlet_bookings', href: ROUTES.RENTER_BOOKINGS, icon: BedDouble },
      { labelKey: 'sidebar.applications', href: ROUTES.RENTER_APPLICATIONS, icon: FileText },
    ],
  },
  {
    label: 'Your tenancy',
    items: [
      // "My Home" is now a hub: Overview / Lease / Documents / Inspections tabs.
      { labelKey: 'sidebar.my_home', href: ROUTES.RENTER_HOME, icon: House },
      // "Payments" now carries a Flex Financing tab.
      { labelKey: 'sidebar.payments', href: ROUTES.RENTER_PAYMENTS, icon: CreditCard },
      { labelKey: 'sidebar.maintenance', href: ROUTES.RENTER_MAINTENANCE, icon: Wrench },
      { labelKey: 'sidebar.roommates', href: ROUTES.RENTER_ROOMMATES, icon: Users },
    ],
  },
  {
    label: 'Communication',
    items: [
      { labelKey: 'sidebar.messages', href: ROUTES.RENTER_MESSAGES, icon: MessageCircle },
      { labelKey: 'sidebar.calendar', href: ROUTES.RENTER_CALENDAR, icon: Calendar },
    ],
  },
  {
    label: 'Trust and support',
    items: [
      // "Trust & Credit" hub: Trust Score / Verification / Credit Report tabs.
      { label: 'Trust & Credit', href: ROUTES.RENTER_TRUST_SCORE, icon: Star },
      { labelKey: 'sidebar.referrals', href: ROUTES.RENTER_REFERRALS, icon: Gift },
      { labelKey: 'sidebar.settings', href: ROUTES.RENTER_SETTINGS, icon: Settings },
      // "Help" now carries a Legal Resources tab.
      { labelKey: 'sidebar.help', href: ROUTES.RENTER_HELP, icon: HelpCircle },
    ],
  },
];

export const isRenterRouteActive = (pathname: string, href: string) =>
  isSidebarRouteActive(pathname, href, ROUTES.RENTER_DASHBOARD);

export const RenterSidebar = () => {
  const { t } = useLanguage();
  return (
    <GroupedSidebar
      ariaLabel="Renter navigation"
      dashboardHref={ROUTES.RENTER_DASHBOARD}
      groups={navGroups.map((group) => ({
        ...group,
        items: group.items.map((item) => ({
          ...item,
          label: item.labelKey ? t(item.labelKey) : item.label,
        })),
      }))}
    />
  );
};
