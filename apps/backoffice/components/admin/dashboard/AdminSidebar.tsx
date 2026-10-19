'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { adminManagedService } from '@/services/adminManagedService';
import {
  LayoutDashboard,
  Eye,
  UserCheck,
  Users,
  ShieldCheck,
  Fingerprint,
  Gavel,
  BadgeCheck,
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
  Sparkles,
  ClipboardCheck,
  Navigation,
  TrendingUp,
  Gauge,
  MessageSquareText,
  MessageSquare,
  ShieldAlert,
  Handshake,
  FileSignature,
  CircleAlert,
  RotateCcw,
  BookOpenCheck,
  ArrowRightLeft,
  GitCompareArrows,
  FileCheck2,
  MessageCircleQuestion,
} from 'lucide-react';
import { ROUTES, unwrap } from '@getrentos/shared';
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
    label: 'Tier 3 Grants',
    href: '/admin/trust/tier-grants',
    icon: KeyRound,
    permission: 'verifications.approve',
  },
  {
    label: 'Trust Appeals',
    href: '/admin/trust/appeals',
    icon: Gavel,
    permission: 'verifications.review',
  },
  {
    label: 'Property Authorities',
    href: '/admin/property-authorities',
    icon: Building2,
    permission: 'verifications.approve',
  },
  {
    label: 'Agencies',
    href: '/admin/agencies',
    icon: Briefcase,
    permission: 'verifications.review',
  },
  {
    label: 'GetRentos Managed',
    href: '/admin/managed-mandates',
    icon: Sparkles,
    permission: 'managed.view',
  },
  {
    label: 'Managed Intake',
    href: '/admin/managed-intakes',
    icon: ClipboardCheck,
    permission: 'managed.view',
  },
  {
    label: 'Field Operations',
    href: '/admin/field-operations',
    icon: Navigation,
    permission: 'managed.view',
  },
  {
    label: 'Owner Questions',
    href: '/admin/owner-queries',
    icon: MessageSquareText,
    permission: 'managed.view',
  },
  {
    label: 'Managed P&L',
    href: '/admin/managed-pnl',
    icon: TrendingUp,
    permission: 'managed.view',
  },
  {
    label: 'Management KPIs',
    href: '/admin/pm-kpis',
    icon: Gauge,
    permission: 'managed.view',
  },
  {
    label: 'Manager Changes',
    href: '/admin/manager-changes',
    icon: ArrowRightLeft,
    permission: 'managed.view',
  },
  {
    label: 'Partner Commercials',
    href: '/admin/partner-commercials',
    icon: Handshake,
    permission: 'rentfinance.view',
  },
  {
    label: 'Unmatched Payments',
    href: '/admin/unmatched-payments',
    icon: CircleAlert,
    permission: 'rentfinance.view',
  },
  {
    label: 'Credit Refunds',
    href: '/admin/credit-refunds',
    icon: RotateCcw,
    permission: 'rentfinance.view',
  },
  {
    label: 'Rent Journal',
    href: '/admin/rent-journal',
    icon: BookOpenCheck,
    permission: 'rentfinance.view',
  },
  {
    label: 'Rent Reconciliation',
    href: '/admin/rent-reconciliation',
    icon: GitCompareArrows,
    permission: 'rentfinance.view',
  },
  {
    label: 'Payout Runs',
    href: '/admin/payout-runs',
    icon: Landmark,
    permission: 'rentfinance.view',
  },
  {
    label: 'Land Diligence',
    href: '/admin/land/diligence',
    icon: MapPinned,
    permission: 'verifications.review',
  },
  {
    label: 'Land Purchases',
    href: '/admin/land/purchases',
    icon: FileSignature,
    permission: 'sales.view',
  },
  {
    label: 'Title Perfection',
    href: '/admin/land/perfection',
    icon: FileCheck2,
    permission: 'sales.view',
  },
  {
    label: 'Land Resales',
    href: '/admin/land/resales',
    icon: ScrollText,
    permission: 'sales.view',
  },
  {
    label: 'Inspection Questions',
    href: '/admin/land/inspection-questions',
    icon: MessageCircleQuestion,
    permission: 'verifications.review',
  },
  {
    label: 'Land Disputes',
    href: '/admin/land/disputes',
    icon: Gavel,
    permission: 'verifications.review',
  },
  {
    label: 'Seller Authority',
    href: '/admin/land/authority',
    icon: UserCheck,
    permission: 'verifications.review',
  },
  {
    label: 'Land Professionals',
    href: '/admin/land/professionals',
    icon: BadgeCheck,
    permission: 'verifications.review',
  },
  {
    label: 'Land Watch',
    href: '/admin/land/watch',
    icon: Eye,
    permission: 'verifications.review',
  },
  {
    label: 'Land Fraud Signals',
    href: '/admin/land/fraud',
    icon: ShieldAlert,
    permission: 'fraud.review',
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
    label: 'Impersonation Reports',
    href: '/admin/impersonation-reports',
    icon: ShieldAlert,
    permission: 'fraud.review',
  },
  {
    label: 'Escrow Oversight',
    href: ROUTES.ADMIN_ESCROW,
    icon: Landmark,
    permission: 'escrow.view',
  },
  {
    // Beside escrow because it is the same question asked from the other end:
    // escrow is money moving, this is whether money we already hold is still
    // there. Gated on the same permission for that reason.
    label: 'Client Money',
    href: '/admin/client-money',
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
    label: 'Text Messaging',
    href: '/admin/text-messaging',
    icon: MessageSquare,
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

/**
 * Each group starts at a named item, so adding an item to a group (the land
 * screens keep growing) cannot push its neighbours into the next group, as
 * fixed slice indices did.
 */
const startOf = (label: string) => navItems.findIndex((item) => item.label === label);
const groupStarts: [group: string, firstItem: string][] = [
  ['Overview', 'Dashboard'],
  ['People and trust', 'Users'],
  ['Marketplace operations', 'Property Authorities'],
  ['Risk and finance', 'Land Diligence'],
  ['Support and insights', 'Shortlets'],
  ['Platform administration', 'Rent Finance'],
];
const navGroups = groupStarts.map(([label, first], index) => ({
  label,
  items: navItems.slice(
    startOf(first),
    index + 1 < groupStarts.length ? startOf(groupStarts[index + 1][1]) : undefined
  ),
}));

const hasAccess = (roles: string[] | undefined, item: NavItem) =>
  item.href === ROUTES.ADMIN_ACCESS
    ? hasStaffAccess(roles)
    : hasAdminPermission(roles, item.permission);

const MANAGED_HREF = '/admin/managed-mandates';

export const AdminSidebar = ({ roles }: { roles?: string[] }) => {
  const pathname = usePathname();

  // The managed queues drive a "work waiting" badge. Only fetched for staff who
  // can act on them, and polled gently so the badge stays roughly current
  // without the sidebar hammering the API.
  const canSeeManaged = hasAdminPermission(roles, 'managed.view');
  const queueCounts = useQuery({
    queryKey: ['admin', 'managed-queue-counts'],
    queryFn: () => unwrap(adminManagedService.queueCounts()),
    enabled: canSeeManaged,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
  const managedWaiting =
    (queueCounts.data?.awaitingActivation ?? 0) + (queueCounts.data?.terminationRequests ?? 0);

  return (
    <aside className="fixed bottom-0 left-0 top-16 z-30 hidden w-64 overflow-y-auto border-r border-border bg-background lg:block">
      <nav className="space-y-6 px-3 py-5" aria-label="Administration navigation">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter((item) => hasAccess(roles, item));
          if (visibleItems.length === 0) return null;
          const headingId = `admin-sidebar-${group.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
          return (
            <section key={group.label} aria-labelledby={headingId}>
              <h2
                id={headingId}
                className="mb-2 px-3 text-[11px] font-semibold tracking-[0.04em] text-muted-foreground"
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
                      className={`relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-card text-foreground shadow-xs ring-1 ring-border before:absolute before:bottom-2 before:left-0 before:top-2 before:w-0.5 before:rounded-full before:bg-primary'
                          : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground'
                      }`}
                    >
                      <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span className="min-w-0 truncate">{item.label}</span>
                      {item.href === MANAGED_HREF && managedWaiting > 0 && (
                        <span
                          className="ml-auto inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground"
                          aria-label={`${managedWaiting} waiting`}
                        >
                          {managedWaiting}
                        </span>
                      )}
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
                    className={`flex items-center gap-3 rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${isActive ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground'}`}
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
