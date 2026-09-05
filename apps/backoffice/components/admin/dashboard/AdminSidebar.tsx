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
  MapPinned,
  BedDouble,
  Building2,
  Wallet,
  Wrench,
} from 'lucide-react';
import { ROUTES } from '@getrentos/shared';
import { hasAdminPermission, hasStaffAccess } from '@/lib/adminAccess';
import type { AdminPermission } from '@/types/admin';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  permission: AdminPermission;
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: ROUTES.ADMIN_DASHBOARD,
    icon: LayoutDashboard,
    permission: 'dashboard.view',
  },
  { label: 'Users', href: ROUTES.ADMIN_USERS, icon: Users, permission: 'users.view' },
  {
    label: 'Verifications',
    href: ROUTES.ADMIN_VERIFICATIONS,
    icon: ShieldCheck,
    permission: 'verifications.review',
  },
  {
    label: 'Land Diligence',
    href: '/admin/land/diligence',
    icon: MapPinned,
    permission: 'verifications.review',
  },
  {
    label: 'Shortlets',
    href: ROUTES.ADMIN_SHORTLETS,
    icon: BedDouble,
    permission: 'shortlet.view',
  },
  {
    label: 'Rentals',
    href: '/admin/rentals',
    icon: Building2,
    permission: 'rentals.view',
  },
  {
    label: 'Rent Finance',
    href: '/admin/rent-finance',
    icon: Wallet,
    permission: 'rentfinance.view',
  },
  {
    label: 'Maintenance',
    href: '/admin/maintenance',
    icon: Wrench,
    permission: 'maintenance.view',
  },
  {
    label: 'Disputes',
    href: ROUTES.ADMIN_DISPUTES,
    icon: Gavel,
    permission: 'disputes.review',
  },
  {
    label: 'Fraud & Risk',
    href: ROUTES.ADMIN_FRAUD,
    icon: AlertTriangle,
    permission: 'fraud.review',
  },
  {
    label: 'Escrow Oversight',
    href: ROUTES.ADMIN_ESCROW,
    icon: Landmark,
    permission: 'escrow.view',
  },
  {
    label: 'Audit Logs',
    href: ROUTES.ADMIN_AUDIT_LOGS,
    icon: ScrollText,
    permission: 'audit.view',
  },
  {
    label: 'Documents',
    href: ROUTES.ADMIN_DOCUMENTS,
    icon: FolderOpen,
    permission: 'documents.manage',
  },
  {
    label: 'Messages',
    href: ROUTES.ADMIN_MESSAGES,
    icon: MessageCircle,
    permission: 'messages.manage',
  },
  {
    label: 'Reports',
    href: ROUTES.ADMIN_REPORTS,
    icon: BarChart3,
    permission: 'reports.view',
  },
  {
    label: 'Settings',
    href: ROUTES.ADMIN_SETTINGS,
    icon: Settings,
    permission: 'platform.configure',
  },
  {
    label: 'Access & Roles',
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

  return (
    <aside className="fixed left-0 top-16 bottom-0 z-30 hidden w-64 overflow-y-auto border-r border-border/70 bg-card/55 backdrop-blur-xl supports-backdrop-filter:bg-card/65 lg:block">
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
