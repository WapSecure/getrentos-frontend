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
  ShieldCheck,
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
  ROUTES.LANDLORD_FINANCIALS,
]);

interface NavItem {
  labelKey: TranslationKey;
  href: string;
  icon: React.ElementType;
}

const item = (labelKey: TranslationKey, href: string, icon: React.ElementType): NavItem => ({
  labelKey,
  href,
  icon,
});

// Payments (+ Arrears), Maintenance (+ Home Management) and Financials
// (+ Owner Statements) are tabbed hubs, so those folded entries have no row of their own.
export const navGroups = [
  {
    label: 'Overview',
    items: [item('sidebar.dashboard', ROUTES.LANDLORD_DASHBOARD, LayoutDashboard)],
  },
  {
    label: 'Portfolio and marketing',
    items: [
      item('sidebar.properties', ROUTES.LANDLORD_PROPERTIES, Building2),
      item('sidebar.units', ROUTES.LANDLORD_UNITS, DoorOpen),
      item('sidebar.listings', ROUTES.LANDLORD_LISTINGS, Megaphone),
      item('sidebar.shortlets', ROUTES.LANDLORD_SHORTLETS, BedDouble),
      item('sidebar.landlord_leads', ROUTES.LANDLORD_LEADS, UsersRound),
      item('sidebar.microsite', ROUTES.LANDLORD_MICROSITE, Globe),
    ],
  },
  {
    label: 'Tenancy operations',
    items: [
      item('sidebar.applications', ROUTES.LANDLORD_APPLICATIONS, FileText),
      item('sidebar.tenants', ROUTES.LANDLORD_TENANTS, Users),
      item('sidebar.leases', ROUTES.LANDLORD_LEASES, FileCheck),
      item('sidebar.payments', ROUTES.LANDLORD_PAYMENTS, CreditCard),
      item('sidebar.maintenance', ROUTES.LANDLORD_MAINTENANCE, Wrench),
      item('sidebar.vendors', ROUTES.LANDLORD_VENDORS, HardHat),
    ],
  },
  {
    label: 'Finance and compliance',
    items: [
      item('sidebar.financials', ROUTES.LANDLORD_FINANCIALS, PieChart),
      item('sidebar.evictions', ROUTES.LANDLORD_EVICTIONS, Gavel),
      item('sidebar.documents', ROUTES.LANDLORD_DOCUMENTS, FolderOpen),
    ],
  },
  {
    label: 'Communication and account',
    items: [
      item('sidebar.messages', ROUTES.LANDLORD_MESSAGES, MessageCircle),
      item('sidebar.realtor_access', ROUTES.LANDLORD_REALTORS, UserRoundCheck),
      item('sidebar.reviews', ROUTES.LANDLORD_REVIEWS, Star),
      item('sidebar.referrals', ROUTES.LANDLORD_REFERRALS, Gift),
      item('sidebar.settings', ROUTES.LANDLORD_SETTINGS, Settings),
      item('sidebar.billing', ROUTES.LANDLORD_BILLING, Sparkles),
      item('sidebar.verification', ROUTES.LANDLORD_VERIFICATION, ShieldCheck),
    ],
  },
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
          label: t(item.labelKey),
          locked: !isPro && PRO_GATED_ROUTES.has(item.href),
        })),
      }))}
    />
  );
};
