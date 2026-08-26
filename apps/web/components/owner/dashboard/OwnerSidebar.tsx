'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Building2,
  Megaphone,
  Users,
  Handshake,
  ShieldCheck,
  LineChart,
  FolderOpen,
  MessageCircle,
  Star,
  BadgeCheck,
  UserRoundCheck,
  Wrench,
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
  { labelKey: 'sidebar.dashboard', href: ROUTES.OWNER_DASHBOARD, icon: LayoutDashboard },
  { labelKey: 'sidebar.properties', href: ROUTES.OWNER_PROPERTIES, icon: Building2 },
  { labelKey: 'sidebar.land_marketplace', href: ROUTES.OWNER_LAND, icon: MapPinned },
  { labelKey: 'sidebar.shortlets', href: ROUTES.OWNER_SHORTLETS, icon: BedDouble },
  { labelKey: 'sidebar.sale_listings', href: ROUTES.OWNER_LISTINGS, icon: Megaphone },
  { labelKey: 'sidebar.buyer_leads', href: ROUTES.OWNER_LEADS, icon: Users },
  { labelKey: 'sidebar.offers', href: ROUTES.OWNER_OFFERS, icon: Handshake },
  { labelKey: 'sidebar.transactions', href: ROUTES.OWNER_TRANSACTIONS, icon: ShieldCheck },
  { labelKey: 'sidebar.investment_analytics', href: ROUTES.OWNER_ANALYTICS, icon: LineChart },
  { labelKey: 'sidebar.home_management', href: ROUTES.OWNER_HOME_MANAGEMENT, icon: Wrench },
  { labelKey: 'sidebar.documents', href: ROUTES.OWNER_DOCUMENTS, icon: FolderOpen },
  { labelKey: 'sidebar.messages', href: ROUTES.OWNER_MESSAGES, icon: MessageCircle },
  { labelKey: 'sidebar.realtor_access', href: ROUTES.OWNER_REALTORS, icon: UserRoundCheck },
  { labelKey: 'sidebar.reviews', href: ROUTES.OWNER_REVIEWS, icon: Star },
  { labelKey: 'sidebar.trust_profile', href: ROUTES.OWNER_TRUST_PROFILE, icon: BadgeCheck },
  { labelKey: 'sidebar.settings', href: ROUTES.OWNER_SETTINGS, icon: Settings },
];

export const OwnerSidebar = () => {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-background border-r border-border overflow-y-auto z-30 hidden lg:block">
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
                    ? 'bg-accent text-primary'
                    : 'text-muted-foreground hover:bg-secondary hover:text-gray-900 dark:hover:text-white'
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
