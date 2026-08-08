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

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Verifications', href: '/admin/verifications', icon: ShieldCheck },
  { label: 'Disputes', href: '/admin/disputes', icon: Gavel },
  { label: 'Fraud & Risk', href: '/admin/fraud', icon: AlertTriangle },
  { label: 'Escrow Oversight', href: '/admin/escrow', icon: Landmark },
  { label: 'Audit Logs', href: '/admin/audit-logs', icon: ScrollText },
  { label: 'Documents', href: '/admin/documents', icon: FolderOpen },
  { label: 'Messages', href: '/admin/messages', icon: MessageCircle },
  { label: 'Reports', href: '/admin/reports', icon: BarChart3 },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

export const AdminSidebar = () => {
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
