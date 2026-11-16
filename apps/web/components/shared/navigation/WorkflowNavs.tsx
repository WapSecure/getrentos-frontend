'use client';

import {
  CalendarCheck,
  CalendarClock,
  ClipboardCheck,
  FileCheck,
  FileText,
  Handshake,
  Heart,
  Megaphone,
  PiggyBank,
  ScanSearch,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  Users,
  UsersRound,
  Video,
  Wallet,
} from '@sureground/icons';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { ROUTES } from '@/lib/constants/auth';
import { VISIT_ROUTES } from '@/lib/constants/visitRoutes';
import { SectionNav } from './SectionNav';

export function LandlordLettingsNav() {
  const { t } = useLanguage();
  return (
    <SectionNav
      ariaLabel="Lettings"
      items={[
        { label: t('sidebar.listings'), href: ROUTES.LANDLORD_LISTINGS, icon: Megaphone },
        {
          label: t('sidebar.viewing_requests'),
          href: ROUTES.LANDLORD_VIEWING_REQUESTS,
          icon: CalendarCheck,
        },
        { label: t('sidebar.applications'), href: ROUTES.LANDLORD_APPLICATIONS, icon: FileText },
        { label: t('sidebar.offers'), href: ROUTES.LANDLORD_OFFERS, icon: Handshake },
        { label: t('sidebar.landlord_leads'), href: ROUTES.LANDLORD_LEADS, icon: UsersRound },
      ]}
    />
  );
}

export function OwnerSellingNav() {
  const { t } = useLanguage();
  return (
    <SectionNav
      ariaLabel="Selling"
      items={[
        { label: t('sidebar.sale_listings'), href: ROUTES.OWNER_LISTINGS, icon: Megaphone },
        { label: t('sidebar.buyer_leads'), href: ROUTES.OWNER_LEADS, icon: Users },
        { label: t('sidebar.viewings'), href: ROUTES.OWNER_VIEWINGS, icon: CalendarClock },
        { label: 'Video tours', href: VISIT_ROUTES.OWNER_TOURS, icon: Video },
        { label: t('sidebar.offers'), href: ROUTES.OWNER_OFFERS, icon: Handshake },
        { label: t('sidebar.transactions'), href: ROUTES.OWNER_TRANSACTIONS, icon: ShieldCheck },
      ]}
    />
  );
}

export function LandlordTenanciesNav() {
  const { t } = useLanguage();
  return (
    <SectionNav
      ariaLabel="Tenancies"
      items={[
        { label: t('sidebar.tenants'), href: ROUTES.LANDLORD_TENANTS, icon: Users },
        { label: t('sidebar.leases'), href: ROUTES.LANDLORD_LEASES, icon: FileCheck },
        {
          label: t('sidebar.inspections'),
          href: ROUTES.LANDLORD_INSPECTIONS,
          icon: ClipboardCheck,
        },
        { label: t('sidebar.deposits'), href: ROUTES.LANDLORD_DEPOSITS, icon: PiggyBank },
        { label: t('sidebar.notices'), href: ROUTES.LANDLORD_NOTICES, icon: ShieldAlert },
      ]}
    />
  );
}

export function RealtorPipelineNav() {
  const { t } = useLanguage();
  return (
    <SectionNav
      ariaLabel="Deals"
      items={[
        { label: t('sidebar.leads'), href: ROUTES.REALTOR_LEADS, icon: UserPlus },
        { label: t('sidebar.viewings'), href: ROUTES.REALTOR_VIEWINGS, icon: CalendarClock },
        { label: t('sidebar.offers'), href: ROUTES.REALTOR_OFFERS, icon: Handshake },
        { label: t('sidebar.commissions'), href: ROUTES.REALTOR_COMMISSIONS, icon: Wallet },
      ]}
    />
  );
}

export function BuyerPurchaseNav() {
  const { t } = useLanguage();
  return (
    <SectionNav
      ariaLabel="Buying"
      items={[
        { label: t('sidebar.saved_properties'), href: ROUTES.BUYER_SAVED, icon: Heart },
        { label: t('sidebar.viewing_requests'), href: ROUTES.BUYER_VIEWINGS, icon: CalendarClock },
        { label: 'Video tours', href: VISIT_ROUTES.BUYER_TOURS, icon: Video },
        { label: 'Inspections', href: VISIT_ROUTES.BUYER_INSPECTIONS, icon: ScanSearch },
        { label: t('sidebar.offers'), href: ROUTES.BUYER_OFFERS, icon: Handshake },
        { label: t('sidebar.transactions'), href: ROUTES.BUYER_TRANSACTIONS, icon: ShieldCheck },
      ]}
    />
  );
}
