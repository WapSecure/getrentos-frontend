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
  FolderOpen,
  MessageCircle,
  Star,
  Settings,
  UserRoundCheck,
} from 'lucide-react';
import { ROUTES } from '@/lib/constants/auth';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: ROUTES.LANDLORD_DASHBOARD, icon: LayoutDashboard },
  { label: 'Properties', href: ROUTES.LANDLORD_PROPERTIES, icon: Building2 },
  { label: 'Units', href: ROUTES.LANDLORD_UNITS, icon: DoorOpen },
  { label: 'Listings', href: ROUTES.LANDLORD_LISTINGS, icon: Megaphone },
  { label: 'Applications', href: ROUTES.LANDLORD_APPLICATIONS, icon: FileText },
  { label: 'Tenants', href: ROUTES.LANDLORD_TENANTS, icon: Users },
  { label: 'Leases', href: ROUTES.LANDLORD_LEASES, icon: FileCheck },
  { label: 'Payments', href: ROUTES.LANDLORD_PAYMENTS, icon: CreditCard },
  { label: 'Maintenance', href: ROUTES.LANDLORD_MAINTENANCE, icon: Wrench },
  { label: 'Home Management', href: ROUTES.LANDLORD_HOME_MANAGEMENT, icon: Wrench },
  { label: 'Vendors', href: ROUTES.LANDLORD_VENDORS, icon: HardHat },
  { label: 'Financials', href: ROUTES.LANDLORD_FINANCIALS, icon: PieChart },
  { label: 'Documents', href: ROUTES.LANDLORD_DOCUMENTS, icon: FolderOpen },
  { label: 'Messages', href: ROUTES.LANDLORD_MESSAGES, icon: MessageCircle },
  { label: 'Realtor Access', href: ROUTES.LANDLORD_REALTORS, icon: UserRoundCheck },
  { label: 'Reviews', href: ROUTES.LANDLORD_REVIEWS, icon: Star },
  { label: 'Settings', href: ROUTES.LANDLORD_SETTINGS, icon: Settings },
];

export const LandlordSidebar = () => {
  const pathname = usePathname();

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
                {item.label}
              </Link>
            </motion.div>
          );
        })}
      </nav>
    </aside>
  );
};
