'use client';

import {
  CalendarCheck,
  CalendarClock,
  FileText,
  Handshake,
  Megaphone,
  ShieldCheck,
  Users,
  UsersRound,
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { ROUTES } from '@/lib/constants/auth';
import { SectionNav } from './SectionNav';

/**
 * The landlord's lettings pipeline, in the order a let happens: advertise,
 * show the place, take applications, agree terms, follow up leads. Labels come
 * from the same translations as the sidebar, so the two always agree.
 */
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

/** The owner's sales pipeline: list, take enquiries, show, agree, complete in escrow. */
export function OwnerSellingNav() {
  const { t } = useLanguage();
  return (
    <SectionNav
      ariaLabel="Selling"
      items={[
        { label: t('sidebar.sale_listings'), href: ROUTES.OWNER_LISTINGS, icon: Megaphone },
        { label: t('sidebar.buyer_leads'), href: ROUTES.OWNER_LEADS, icon: Users },
        { label: t('sidebar.viewings'), href: ROUTES.OWNER_VIEWINGS, icon: CalendarClock },
        { label: t('sidebar.offers'), href: ROUTES.OWNER_OFFERS, icon: Handshake },
        { label: t('sidebar.transactions'), href: ROUTES.OWNER_TRANSACTIONS, icon: ShieldCheck },
      ]}
    />
  );
}
