'use client';

import {
  LayoutDashboard,
  Search,
  Heart,
  FileText,
  CreditCard,
  MessageCircle,
  Home,
  House,
  Wrench,
  Settings,
  HelpCircle,
  FileCheck,
  Users,
  Star,
  Bell,
  Calendar,
  Zap,
  TrendingUp,
  Smartphone,
  Scale,
  BedDouble,
  Gift,
  ShieldCheck,
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
      { labelKey: 'sidebar.my_lease', href: ROUTES.RENTER_LEASE, icon: FileCheck },
      { labelKey: 'sidebar.payments', href: ROUTES.RENTER_PAYMENTS, icon: CreditCard },
      { labelKey: 'sidebar.flex_financing', href: ROUTES.RENTER_FINANCING, icon: Zap },
      { labelKey: 'sidebar.my_home', href: ROUTES.RENTER_HOME, icon: House },
      { labelKey: 'sidebar.maintenance', href: ROUTES.RENTER_MAINTENANCE, icon: Wrench },
      { labelKey: 'sidebar.roommates', href: ROUTES.RENTER_ROOMMATES, icon: Users },
    ],
  },
  {
    label: 'Communication',
    items: [
      { labelKey: 'sidebar.messages', href: ROUTES.RENTER_MESSAGES, icon: MessageCircle },
      { labelKey: 'sidebar.documents', href: ROUTES.RENTER_DOCUMENTS, icon: Home },
      { labelKey: 'sidebar.calendar', href: ROUTES.RENTER_CALENDAR, icon: Calendar },
      { labelKey: 'sidebar.notifications', href: ROUTES.RENTER_NOTIFICATIONS, icon: Bell },
    ],
  },
  {
    label: 'Trust and support',
    items: [
      { label: 'Verification', href: '/renter/verification', icon: ShieldCheck },
      { labelKey: 'sidebar.trust_score', href: ROUTES.RENTER_TRUST_SCORE, icon: Star },
      { labelKey: 'sidebar.credit_report', href: ROUTES.RENTER_CREDIT_REPORT, icon: TrendingUp },
      { labelKey: 'sidebar.legal_resources', href: ROUTES.RENTER_LEGAL_RESOURCES, icon: Scale },
      { labelKey: 'sidebar.referrals', href: ROUTES.RENTER_REFERRALS, icon: Gift },
      { labelKey: 'sidebar.ussd_access', href: ROUTES.RENTER_USSD_ACCESS, icon: Smartphone },
      { labelKey: 'sidebar.settings', href: ROUTES.RENTER_SETTINGS, icon: Settings },
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
