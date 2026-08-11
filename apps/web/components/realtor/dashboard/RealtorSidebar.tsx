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
import { ROUTES } from '@/lib/constants/auth';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: ROUTES.REALTOR_DASHBOARD, icon: LayoutDashboard },
  { label: 'Clients', href: ROUTES.REALTOR_CLIENTS, icon: Users },
  { label: 'Listings', href: ROUTES.REALTOR_LISTINGS, icon: Megaphone },
  { label: 'Leads', href: ROUTES.REALTOR_LEADS, icon: UserPlus },
  { label: 'Viewings', href: ROUTES.REALTOR_VIEWINGS, icon: CalendarClock },
  { label: 'Offers', href: ROUTES.REALTOR_OFFERS, icon: Handshake },
  { label: 'Commissions', href: ROUTES.REALTOR_COMMISSIONS, icon: Wallet },
  { label: 'Documents', href: ROUTES.REALTOR_DOCUMENTS, icon: FolderOpen },
  { label: 'Messages', href: ROUTES.REALTOR_MESSAGES, icon: MessageCircle },
  { label: 'Reviews', href: ROUTES.REALTOR_REVIEWS, icon: Star },
  { label: 'Trust Profile', href: ROUTES.REALTOR_TRUST_PROFILE, icon: BadgeCheck },
  { label: 'Settings', href: ROUTES.REALTOR_SETTINGS, icon: Settings },
];

export const RealtorSidebar = () => {
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
