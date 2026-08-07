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
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/renter/dashboard', icon: LayoutDashboard },
  { label: 'Discover', href: '/renter/discover', icon: Search },
  { label: 'Saved', href: '/renter/saved', icon: Heart },
  { label: 'Applications', href: '/renter/applications', icon: FileText },
  { label: 'My Lease', href: '/renter/lease', icon: FileCheck },
  { label: 'Payments', href: '/renter/payments', icon: CreditCard },
  { label: 'Maintenance', href: '/renter/maintenance', icon: Wrench },
  { label: 'Messages', href: '/renter/messages', icon: MessageCircle },
  { label: 'Documents', href: '/renter/documents', icon: Home },
  { label: 'Roommates', href: '/renter/roommates', icon: Users },
  { label: 'Trust Score', href: '/renter/trust-score', icon: Star },
  { label: 'Notifications', href: '/renter/notifications', icon: Bell },
  { label: 'Calendar', href: '/renter/calendar', icon: Calendar },
  { label: 'Settings', href: '/renter/settings', icon: Settings },
  { label: 'Help', href: '/renter/help', icon: HelpCircle },
];

export const RenterSidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-white dark:bg-[#0a1a1f] border-r border-gray-200 dark:border-white/10 overflow-y-auto z-30 hidden lg:block">
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
                    ? 'bg-[#c4a747]/10 text-[#c4a747]'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white'
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
