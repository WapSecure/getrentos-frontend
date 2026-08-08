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

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/realtor/dashboard', icon: LayoutDashboard },
  { label: 'Clients', href: '/realtor/clients', icon: Users },
  { label: 'Listings', href: '/realtor/listings', icon: Megaphone },
  { label: 'Leads', href: '/realtor/leads', icon: UserPlus },
  { label: 'Viewings', href: '/realtor/viewings', icon: CalendarClock },
  { label: 'Offers', href: '/realtor/offers', icon: Handshake },
  { label: 'Commissions', href: '/realtor/commissions', icon: Wallet },
  { label: 'Documents', href: '/realtor/documents', icon: FolderOpen },
  { label: 'Messages', href: '/realtor/messages', icon: MessageCircle },
  { label: 'Reviews', href: '/realtor/reviews', icon: Star },
  { label: 'Trust Profile', href: '/realtor/trust-profile', icon: BadgeCheck },
  { label: 'Settings', href: '/realtor/settings', icon: Settings },
];

export const RealtorSidebar = () => {
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
