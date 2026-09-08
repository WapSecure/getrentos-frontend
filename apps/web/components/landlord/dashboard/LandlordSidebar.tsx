'use client';

import {
  LayoutDashboard,
  Building2,
  DoorOpen,
  Megaphone,
  FileText,
  Users,
  FileCheck,
  CreditCard,
  Wrench,
  HardHat,
  PieChart,
  FileBarChart,
  AlertTriangle,
  FolderOpen,
  MessageCircle,
  Star,
  Settings,
  UserRoundCheck,
  Gavel,
  UsersRound,
  BedDouble,
  Globe,
  Gift,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { TranslationKey } from '@/lib/i18n/translations';
import { ROUTES } from '@/lib/constants/auth';
import { GroupedSidebar } from '@/components/shared/dashboard/GroupedSidebar';
import { usePlanTier } from '@/hooks/usePlanTier';

/** Nav items whose destination page is gated behind the Pro plan (see Batch 7b). */
const PRO_GATED_ROUTES = new Set<string>([
  ROUTES.LANDLORD_SHORTLETS,
  ROUTES.LANDLORD_MICROSITE,
  ROUTES.LANDLORD_HOME_MANAGEMENT,
  ROUTES.LANDLORD_FINANCIALS,
  ROUTES.LANDLORD_OWNER_STATEMENTS,
]);

interface NavItem {
  labelKey?: TranslationKey;
  label?: string;
  href: string;
  icon: React.ElementType;
}

export const navItems: NavItem[] = [
  { labelKey: 'sidebar.dashboard', href: ROUTES.LANDLORD_DASHBOARD, icon: LayoutDashboard },
  { labelKey: 'sidebar.properties', href: ROUTES.LANDLORD_PROPERTIES, icon: Building2 },
  { labelKey: 'sidebar.units', href: ROUTES.LANDLORD_UNITS, icon: DoorOpen },
  { labelKey: 'sidebar.listings', href: ROUTES.LANDLORD_LISTINGS, icon: Megaphone },
  { labelKey: 'sidebar.shortlets', href: ROUTES.LANDLORD_SHORTLETS, icon: BedDouble },
  { labelKey: 'sidebar.landlord_leads', href: ROUTES.LANDLORD_LEADS, icon: UsersRound },
  { labelKey: 'sidebar.microsite', href: ROUTES.LANDLORD_MICROSITE, icon: Globe },
  { labelKey: 'sidebar.referrals', href: ROUTES.LANDLORD_REFERRALS, icon: Gift },
  { labelKey: 'sidebar.applications', href: ROUTES.LANDLORD_APPLICATIONS, icon: FileText },
  { labelKey: 'sidebar.tenants', href: ROUTES.LANDLORD_TENANTS, icon: Users },
  { labelKey: 'sidebar.leases', href: ROUTES.LANDLORD_LEASES, icon: FileCheck },
  { labelKey: 'sidebar.payments', href: ROUTES.LANDLORD_PAYMENTS, icon: CreditCard },
  { labelKey: 'sidebar.maintenance', href: ROUTES.LANDLORD_MAINTENANCE, icon: Wrench },
  { labelKey: 'sidebar.home_management', href: ROUTES.LANDLORD_HOME_MANAGEMENT, icon: Wrench },
  { labelKey: 'sidebar.vendors', href: ROUTES.LANDLORD_VENDORS, icon: HardHat },
  { labelKey: 'sidebar.financials', href: ROUTES.LANDLORD_FINANCIALS, icon: PieChart },
  {
    labelKey: 'sidebar.owner_statements',
    href: ROUTES.LANDLORD_OWNER_STATEMENTS,
    icon: FileBarChart,
  },
  { labelKey: 'sidebar.arrears', href: ROUTES.LANDLORD_ARREARS, icon: AlertTriangle },
  { labelKey: 'sidebar.evictions', href: ROUTES.LANDLORD_EVICTIONS, icon: Gavel },
  { labelKey: 'sidebar.documents', href: ROUTES.LANDLORD_DOCUMENTS, icon: FolderOpen },
  { labelKey: 'sidebar.messages', href: ROUTES.LANDLORD_MESSAGES, icon: MessageCircle },
  { labelKey: 'sidebar.realtor_access', href: ROUTES.LANDLORD_REALTORS, icon: UserRoundCheck },
  { labelKey: 'sidebar.reviews', href: ROUTES.LANDLORD_REVIEWS, icon: Star },
  { labelKey: 'sidebar.settings', href: ROUTES.LANDLORD_SETTINGS, icon: Settings },
  { label: 'Billing', href: ROUTES.LANDLORD_BILLING, icon: Sparkles },
  { label: 'Verification', href: '/landlord/verification', icon: FileCheck },
];

export const navGroups = [
  { label: 'Overview', items: navItems.slice(0, 1) },
  { label: 'Portfolio and marketing', items: navItems.slice(1, 8) },
  { label: 'Tenancy operations', items: navItems.slice(8, 15) },
  { label: 'Finance and compliance', items: navItems.slice(15, 19) },
  { label: 'Communication and account', items: navItems.slice(19) },
];

export const LandlordSidebar = () => {
  const { t } = useLanguage();
  const { isPro } = usePlanTier();
  return (
    <GroupedSidebar
      ariaLabel="Landlord navigation"
      dashboardHref={ROUTES.LANDLORD_DASHBOARD}
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
