'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Search,
  Heart,
  CalendarClock,
  Handshake,
  ShieldCheck,
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
  { label: 'Dashboard', href: '/buyer/dashboard', icon: LayoutDashboard },
  { label: 'Discover', href: '/buyer/discover', icon: Search },
  { label: 'Saved Properties', href: '/buyer/saved', icon: Heart },
  { label: 'Viewing Requests', href: '/buyer/viewings', icon: CalendarClock },
  { label: 'Offers', href: '/buyer/offers', icon: Handshake },
  { label: 'Transactions', href: '/buyer/transactions', icon: ShieldCheck },
  { label: 'Documents', href: '/buyer/documents', icon: FolderOpen },
  { label: 'Messages', href: '/buyer/messages', icon: MessageCircle },
  { label: 'Reviews', href: '/buyer/reviews', icon: Star },
  { label: 'Trust Profile', href: '/buyer/trust-profile', icon: BadgeCheck },
  { label: 'Settings', href: '/buyer/settings', icon: Settings },
];

export const BuyerSidebar = () => {
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
