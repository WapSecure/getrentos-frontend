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
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/landlord/dashboard', icon: LayoutDashboard },
  { label: 'Properties', href: '/landlord/properties', icon: Building2 },
  { label: 'Units', href: '/landlord/units', icon: DoorOpen },
  { label: 'Listings', href: '/landlord/listings', icon: Megaphone },
  { label: 'Applications', href: '/landlord/applications', icon: FileText },
  { label: 'Tenants', href: '/landlord/tenants', icon: Users },
  { label: 'Leases', href: '/landlord/leases', icon: FileCheck },
  { label: 'Payments', href: '/landlord/payments', icon: CreditCard },
  { label: 'Maintenance', href: '/landlord/maintenance', icon: Wrench },
  { label: 'Vendors', href: '/landlord/vendors', icon: HardHat },
  { label: 'Financials', href: '/landlord/financials', icon: PieChart },
  { label: 'Documents', href: '/landlord/documents', icon: FolderOpen },
  { label: 'Messages', href: '/landlord/messages', icon: MessageCircle },
  { label: 'Reviews', href: '/landlord/reviews', icon: Star },
  { label: 'Settings', href: '/landlord/settings', icon: Settings },
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
