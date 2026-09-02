'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
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

export const BuyerSidebar = () => {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <aside className="fixed left-0 top-16 bottom-0 z-30 hidden w-64 overflow-y-auto border-r border-border/70 bg-card/55 backdrop-blur-xl supports-backdrop-filter:bg-card/65 lg:block">
      <nav className="p-4 space-y-1">
        {navItems.map((item, index) => {
          const isActive = pathname === item.href;
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.02, duration: 0.3 }}
            >
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-accent text-primary shadow-sm'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {t(item.labelKey)}
              </Link>
            </motion.div>
          );
        })}
      </nav>
    </aside>
  );
};
