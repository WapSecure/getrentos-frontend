'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
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
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { TranslationKey } from '@/lib/i18n/translations';
import { ROUTES } from '@/lib/constants/auth';

interface NavItem {
  labelKey: TranslationKey;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { labelKey: 'sidebar.dashboard', href: ROUTES.LANDLORD_DASHBOARD, icon: LayoutDashboard },
  { labelKey: 'sidebar.properties', href: ROUTES.LANDLORD_PROPERTIES, icon: Building2 },
  { labelKey: 'sidebar.units', href: ROUTES.LANDLORD_UNITS, icon: DoorOpen },
  { labelKey: 'sidebar.listings', href: ROUTES.LANDLORD_LISTINGS, icon: Megaphone },
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
  { labelKey: 'sidebar.documents', href: ROUTES.LANDLORD_DOCUMENTS, icon: FolderOpen },
  { labelKey: 'sidebar.messages', href: ROUTES.LANDLORD_MESSAGES, icon: MessageCircle },
  { labelKey: 'sidebar.realtor_access', href: ROUTES.LANDLORD_REALTORS, icon: UserRoundCheck },
  { labelKey: 'sidebar.reviews', href: ROUTES.LANDLORD_REVIEWS, icon: Star },
  { labelKey: 'sidebar.settings', href: ROUTES.LANDLORD_SETTINGS, icon: Settings },
];

export const LandlordSidebar = () => {
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
