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
  UserRoundCheck,
  Wrench,
  Settings,
} from 'lucide-react';
import { ROUTES } from '@/lib/constants/auth';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: ROUTES.OWNER_DASHBOARD, icon: LayoutDashboard },
  { label: 'Properties', href: ROUTES.OWNER_PROPERTIES, icon: Building2 },
  { label: 'Sale Listings', href: ROUTES.OWNER_LISTINGS, icon: Megaphone },
  { label: 'Buyer Leads', href: ROUTES.OWNER_LEADS, icon: Users },
  { label: 'Offers', href: ROUTES.OWNER_OFFERS, icon: Handshake },
  { label: 'Transactions', href: ROUTES.OWNER_TRANSACTIONS, icon: ShieldCheck },
  { label: 'Investment Analytics', href: ROUTES.OWNER_ANALYTICS, icon: LineChart },
  { label: 'Home Management', href: ROUTES.OWNER_HOME_MANAGEMENT, icon: Wrench },
  { label: 'Documents', href: ROUTES.OWNER_DOCUMENTS, icon: FolderOpen },
  { label: 'Messages', href: ROUTES.OWNER_MESSAGES, icon: MessageCircle },
  { label: 'Realtor Access', href: ROUTES.OWNER_REALTORS, icon: UserRoundCheck },
  { label: 'Reviews', href: ROUTES.OWNER_REVIEWS, icon: Star },
  { label: 'Trust Profile', href: ROUTES.OWNER_TRUST_PROFILE, icon: BadgeCheck },
  { label: 'Settings', href: ROUTES.OWNER_SETTINGS, icon: Settings },
];

export const OwnerSidebar = () => {
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
