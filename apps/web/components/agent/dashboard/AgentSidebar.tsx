'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  ClipboardList,
  ClipboardCheck,
  UserCheck,
  RefreshCw,
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
  { label: 'Dashboard', href: '/agent/dashboard', icon: LayoutDashboard },
  { label: 'Tasks', href: '/agent/tasks', icon: ClipboardList },
  { label: 'Inspections', href: '/agent/inspections', icon: ClipboardCheck },
  { label: 'Verifications', href: '/agent/verifications', icon: UserCheck },
  { label: 'Sync Center', href: '/agent/sync', icon: RefreshCw },
  { label: 'Documents', href: '/agent/documents', icon: FolderOpen },
  { label: 'Messages', href: '/agent/messages', icon: MessageCircle },
  { label: 'Reviews', href: '/agent/reviews', icon: Star },
  { label: 'Trust Profile', href: '/agent/trust-profile', icon: BadgeCheck },
  { label: 'Settings', href: '/agent/settings', icon: Settings },
];

export const AgentSidebar = () => {
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
