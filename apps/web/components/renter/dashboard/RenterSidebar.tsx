'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
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
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { TranslationKey } from '@/lib/i18n/translations';
import { ROUTES } from '@/lib/constants/auth';

interface NavItem {
  labelKey?: TranslationKey;
  label?: string;
  href: string;
  icon: React.ElementType;
}

export const navItems: NavItem[] = [
  { labelKey: 'sidebar.dashboard', href: ROUTES.RENTER_DASHBOARD, icon: LayoutDashboard },
  { labelKey: 'sidebar.discover', href: ROUTES.RENTER_DISCOVER, icon: Search },
  { labelKey: 'sidebar.saved', href: ROUTES.RENTER_SAVED, icon: Heart },
  { labelKey: 'sidebar.referrals', href: ROUTES.RENTER_REFERRALS, icon: Gift },
  { labelKey: 'sidebar.shortlet_bookings', href: ROUTES.RENTER_BOOKINGS, icon: BedDouble },
  { labelKey: 'sidebar.applications', href: ROUTES.RENTER_APPLICATIONS, icon: FileText },
  { labelKey: 'sidebar.my_lease', href: ROUTES.RENTER_LEASE, icon: FileCheck },
  { labelKey: 'sidebar.payments', href: ROUTES.RENTER_PAYMENTS, icon: CreditCard },
  { labelKey: 'sidebar.flex_financing', href: ROUTES.RENTER_FINANCING, icon: Zap },
  { labelKey: 'sidebar.my_home', href: ROUTES.RENTER_HOME, icon: House },
  { labelKey: 'sidebar.maintenance', href: ROUTES.RENTER_MAINTENANCE, icon: Wrench },
  { labelKey: 'sidebar.messages', href: ROUTES.RENTER_MESSAGES, icon: MessageCircle },
  { labelKey: 'sidebar.documents', href: ROUTES.RENTER_DOCUMENTS, icon: Home },
  {
    labelKey: 'sidebar.legal_resources',
    href: ROUTES.RENTER_LEGAL_RESOURCES,
    icon: Scale,
  },
  { labelKey: 'sidebar.roommates', href: ROUTES.RENTER_ROOMMATES, icon: Users },
  { labelKey: 'sidebar.trust_score', href: ROUTES.RENTER_TRUST_SCORE, icon: Star },
  { labelKey: 'sidebar.credit_report', href: ROUTES.RENTER_CREDIT_REPORT, icon: TrendingUp },
  { labelKey: 'sidebar.ussd_access', href: ROUTES.RENTER_USSD_ACCESS, icon: Smartphone },
  { labelKey: 'sidebar.notifications', href: ROUTES.RENTER_NOTIFICATIONS, icon: Bell },
  { labelKey: 'sidebar.calendar', href: ROUTES.RENTER_CALENDAR, icon: Calendar },
  { labelKey: 'sidebar.settings', href: ROUTES.RENTER_SETTINGS, icon: Settings },
  { labelKey: 'sidebar.help', href: ROUTES.RENTER_HELP, icon: HelpCircle },
];

export const RenterSidebar = () => {
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
                {item.labelKey ? t(item.labelKey) : item.label}
              </Link>
            </motion.div>
          );
        })}
      </nav>
    </aside>
  );
};
