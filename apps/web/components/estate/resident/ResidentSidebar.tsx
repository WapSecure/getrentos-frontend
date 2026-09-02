'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Receipt,
  KeyRound,
  Megaphone,
  TriangleAlert,
  Package,
  Contact,
} from 'lucide-react';
import { ROUTES } from '@/lib/constants/auth';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

export const residentNavItems: NavItem[] = [
  { label: 'Dashboard', href: ROUTES.RESIDENT_DASHBOARD, icon: LayoutDashboard },
  { label: 'Announcements', href: ROUTES.RESIDENT_ANNOUNCEMENTS, icon: Megaphone },
  { label: 'Dues', href: ROUTES.RESIDENT_DUES, icon: Receipt },
  { label: 'Visitor Passes', href: ROUTES.RESIDENT_VISITOR_PASSES, icon: KeyRound },
  { label: 'Deliveries', href: ROUTES.RESIDENT_DELIVERIES, icon: Package },
  { label: 'Violations', href: ROUTES.RESIDENT_VIOLATIONS, icon: TriangleAlert },
  { label: 'Directory', href: ROUTES.RESIDENT_DIRECTORY, icon: Contact },
];

export const ResidentSidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-16 bottom-0 z-30 hidden w-64 overflow-y-auto border-r border-border/70 bg-card/55 backdrop-blur-xl supports-backdrop-filter:bg-card/65 lg:block">
      <nav className="p-4 space-y-1">
        {residentNavItems.map((item, index) => {
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
                    ? 'bg-accent text-primary shadow-sm'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
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
