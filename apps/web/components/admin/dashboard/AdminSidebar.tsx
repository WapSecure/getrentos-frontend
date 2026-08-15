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
  KeyRound,
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { TranslationKey } from '@/lib/i18n/translations';
import { ROUTES } from '@/lib/constants/auth';
import { hasAdminPermission, hasStaffAccess } from '@/lib/adminAccess';
import type { AdminPermission } from '@/types/admin';

interface NavItem {
  labelKey: TranslationKey;
  href: string;
  icon: React.ElementType;
  permission: AdminPermission;
}

const navItems: NavItem[] = [
  {
    labelKey: 'sidebar.dashboard',
    href: ROUTES.ADMIN_DASHBOARD,
    icon: LayoutDashboard,
    permission: 'dashboard.view',
  },
  { labelKey: 'sidebar.users', href: ROUTES.ADMIN_USERS, icon: Users, permission: 'users.view' },
  {
    labelKey: 'sidebar.verifications',
    href: ROUTES.ADMIN_VERIFICATIONS,
    icon: ShieldCheck,
    permission: 'verifications.review',
  },
  {
    labelKey: 'sidebar.disputes',
    href: ROUTES.ADMIN_DISPUTES,
    icon: Gavel,
    permission: 'disputes.review',
  },
  {
    labelKey: 'sidebar.fraud_risk',
    href: ROUTES.ADMIN_FRAUD,
    icon: AlertTriangle,
    permission: 'fraud.review',
  },
  {
    labelKey: 'sidebar.escrow_oversight',
    href: ROUTES.ADMIN_ESCROW,
    icon: Landmark,
    permission: 'escrow.view',
  },
  {
    labelKey: 'sidebar.audit_logs',
    href: ROUTES.ADMIN_AUDIT_LOGS,
    icon: ScrollText,
    permission: 'audit.view',
  },
  {
    labelKey: 'sidebar.documents',
    href: ROUTES.ADMIN_DOCUMENTS,
    icon: FolderOpen,
    permission: 'documents.manage',
  },
  {
    labelKey: 'sidebar.messages',
    href: ROUTES.ADMIN_MESSAGES,
    icon: MessageCircle,
    permission: 'messages.manage',
  },
  {
    labelKey: 'sidebar.reports',
    href: ROUTES.ADMIN_REPORTS,
    icon: BarChart3,
    permission: 'reports.view',
  },
  {
    labelKey: 'sidebar.settings',
    href: ROUTES.ADMIN_SETTINGS,
    icon: Settings,
    permission: 'platform.configure',
  },
  {
    labelKey: 'sidebar.access_roles',
    href: ROUTES.ADMIN_ACCESS,
    icon: KeyRound,
    permission: 'staff.manage',
  },
];

const hasAccess = (roles: string[] | undefined, item: NavItem) =>
  item.href === ROUTES.ADMIN_ACCESS
    ? hasStaffAccess(roles)
    : hasAdminPermission(roles, item.permission);

export const AdminSidebar = ({ roles }: { roles?: string[] }) => {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-background border-r border-border overflow-y-auto z-30 hidden lg:block">
      <nav className="p-4 space-y-1">
        {navItems
          .filter((item) => hasAccess(roles, item))
          .map((item, index) => {
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
                  {t(item.labelKey)}
                </Link>
              </motion.div>
            );
          })}
      </nav>
    </aside>
  );
};
