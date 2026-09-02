'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
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

export const RealtorSidebar = () => {
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
