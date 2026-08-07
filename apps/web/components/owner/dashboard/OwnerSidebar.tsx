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
  Settings,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/owner/dashboard', icon: LayoutDashboard },
  { label: 'Properties', href: '/owner/properties', icon: Building2 },
  { label: 'Sale Listings', href: '/owner/listings', icon: Megaphone },
  { label: 'Buyer Leads', href: '/owner/leads', icon: Users },
  { label: 'Offers', href: '/owner/offers', icon: Handshake },
  { label: 'Transactions', href: '/owner/transactions', icon: ShieldCheck },
  { label: 'Investment Analytics', href: '/owner/analytics', icon: LineChart },
  { label: 'Documents', href: '/owner/documents', icon: FolderOpen },
  { label: 'Messages', href: '/owner/messages', icon: MessageCircle },
  { label: 'Reviews', href: '/owner/reviews', icon: Star },
  { label: 'Trust Profile', href: '/owner/trust-profile', icon: BadgeCheck },
  { label: 'Settings', href: '/owner/settings', icon: Settings },
];

export const OwnerSidebar = () => {
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
