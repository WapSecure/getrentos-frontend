'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Fingerprint,
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
  Store,
  Briefcase,
  ClipboardList,
  Warehouse,
  CreditCard,
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
    label: 'Trust Reviews',
    href: '/admin/trust/review-cases',
    icon: Fingerprint,
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
    label: 'Units & Tenants',
    href: '/admin/rentals/units',
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
    label: 'Marketplace',
    href: '/admin/marketplace',
    icon: Store,
    permission: 'sales.view',
  },
  {
    label: 'Realtors',
    href: '/admin/realtors',
    icon: Briefcase,
    permission: 'sales.view',
  },
  {
    label: 'Agents',
    href: '/admin/agents',
    icon: ClipboardList,
    permission: 'sales.view',
  },
  {
    label: 'Estates',
    href: '/admin/estates',
    icon: Warehouse,
    permission: 'estate.view',
  },
  {
    label: 'Subscriptions',
    href: ROUTES.ADMIN_SUBSCRIPTIONS,
    icon: CreditCard,
    permission: 'subscriptions.view',
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

const navGroups = [
  { label: 'Overview', items: navItems.slice(0, 1) },
  { label: 'People and trust', items: navItems.slice(1, 5) },
  { label: 'Marketplace operations', items: navItems.slice(5, 14) },
  { label: 'Risk and finance', items: navItems.slice(14, 18) },
  { label: 'Support and insights', items: navItems.slice(18, 21) },
  { label: 'Platform administration', items: navItems.slice(21) },
];

const hasAccess = (roles: string[] | undefined, item: NavItem) =>
  item.href === ROUTES.ADMIN_ACCESS
    ? hasStaffAccess(roles)
    : hasAdminPermission(roles, item.permission);

export const AdminSidebar = ({ roles }: { roles?: string[] }) => {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-16 bottom-0 z-30 hidden w-64 overflow-y-auto border-r border-border/70 bg-card/55 backdrop-blur-xl supports-backdrop-filter:bg-card/65 lg:block">
      <nav className="space-y-5 p-4" aria-label="Administration navigation">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter((item) => hasAccess(roles, item));
          if (visibleItems.length === 0) return null;
          const headingId = `admin-sidebar-${group.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
          return (
            <section key={group.label} aria-labelledby={headingId}>
              <h2
                id={headingId}
                className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/75"
              >
                {group.label}
              </h2>
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== ROUTES.ADMIN_DASHBOARD && pathname.startsWith(`${item.href}/`));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={isActive ? 'page' : undefined}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-accent text-primary shadow-sm'
                          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                      }`}
                    >
                      <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span className="min-w-0 truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </nav>
    </aside>
  );
};

export const AdminMobileNavigation = ({
  roles,
  onNavigate,
}: {
  roles?: string[];
  onNavigate: () => void;
}) => {
  const pathname = usePathname();
  return (
    <nav className="space-y-5 p-4" aria-label="Administration mobile navigation">
      {navGroups.map((group) => {
        const visibleItems = group.items.filter((item) => hasAccess(roles, item));
        if (visibleItems.length === 0) return null;
        return (
          <div key={group.label}>
            <h2 className="mb-1.5 px-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/75">
              {group.label}
            </h2>
            <div className="space-y-1">
              {visibleItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== ROUTES.ADMIN_DASHBOARD && pathname.startsWith(`${item.href}/`));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={onNavigate}
                    className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${isActive ? 'bg-accent text-primary' : 'text-foreground hover:bg-secondary'}`}
                  >
                    <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="min-w-0 truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
};
