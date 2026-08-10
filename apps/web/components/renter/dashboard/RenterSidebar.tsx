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
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { TranslationKey } from '@/lib/i18n/translations';

interface NavItem {
  labelKey: TranslationKey;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { labelKey: 'sidebar.dashboard', href: '/renter/dashboard', icon: LayoutDashboard },
  { labelKey: 'sidebar.discover', href: '/renter/discover', icon: Search },
  { labelKey: 'sidebar.saved', href: '/renter/saved', icon: Heart },
  { labelKey: 'sidebar.applications', href: '/renter/applications', icon: FileText },
  { labelKey: 'sidebar.my_lease', href: '/renter/lease', icon: FileCheck },
  { labelKey: 'sidebar.payments', href: '/renter/payments', icon: CreditCard },
  { labelKey: 'sidebar.flex_financing', href: '/renter/financing', icon: Zap },
  { labelKey: 'sidebar.maintenance', href: '/renter/maintenance', icon: Wrench },
  { labelKey: 'sidebar.messages', href: '/renter/messages', icon: MessageCircle },
  { labelKey: 'sidebar.documents', href: '/renter/documents', icon: Home },
  { labelKey: 'sidebar.roommates', href: '/renter/roommates', icon: Users },
  { labelKey: 'sidebar.trust_score', href: '/renter/trust-score', icon: Star },
  { labelKey: 'sidebar.credit_report', href: '/renter/credit-report', icon: TrendingUp },
  { labelKey: 'sidebar.ussd_access', href: '/renter/ussd-access', icon: Smartphone },
  { labelKey: 'sidebar.notifications', href: '/renter/notifications', icon: Bell },
  { labelKey: 'sidebar.calendar', href: '/renter/calendar', icon: Calendar },
  { labelKey: 'sidebar.settings', href: '/renter/settings', icon: Settings },
  { labelKey: 'sidebar.help', href: '/renter/help', icon: HelpCircle },
];

export const RenterSidebar = () => {
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
