'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Gavel,
  AlertTriangle,
  Landmark,
  ScrollText,
  FolderOpen,
  MessageCircle,
  BarChart3,
  Settings,
} from 'lucide-react';
import { ROUTES } from '@/lib/constants/auth';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: ROUTES.ADMIN_DASHBOARD, icon: LayoutDashboard },
  { label: 'Users', href: ROUTES.ADMIN_USERS, icon: Users },
  { label: 'Verifications', href: ROUTES.ADMIN_VERIFICATIONS, icon: ShieldCheck },
  { label: 'Disputes', href: ROUTES.ADMIN_DISPUTES, icon: Gavel },
  { label: 'Fraud & Risk', href: ROUTES.ADMIN_FRAUD, icon: AlertTriangle },
  { label: 'Escrow Oversight', href: ROUTES.ADMIN_ESCROW, icon: Landmark },
  { label: 'Audit Logs', href: ROUTES.ADMIN_AUDIT_LOGS, icon: ScrollText },
  { label: 'Documents', href: ROUTES.ADMIN_DOCUMENTS, icon: FolderOpen },
  { label: 'Messages', href: ROUTES.ADMIN_MESSAGES, icon: MessageCircle },
  { label: 'Reports', href: ROUTES.ADMIN_REPORTS, icon: BarChart3 },
  { label: 'Settings', href: ROUTES.ADMIN_SETTINGS, icon: Settings },
];

export const AdminSidebar = () => {
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
