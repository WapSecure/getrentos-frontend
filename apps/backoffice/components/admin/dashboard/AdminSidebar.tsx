'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';
import { adminManagedService } from '@/services/adminManagedService';
import {
  Percent,
  LayoutDashboard,
  LayoutGrid,
  Webhook,
  HandCoins,
  Scale,
  Eye,
  UserCheck,
  Users,
  ShieldCheck,
  Fingerprint,
  Construction,
  Gavel,
  PiggyBank,
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
  Cpu,
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
  DisclosureCaret,
  Ruler,
} from '@sureground/icons';
import { ROUTES, unwrap } from '@sureground/shared';
import { SidebarRailToggle, useSidebarRail } from '@sureground/ui';
import { hasAdminPermission, hasStaffAccess } from '@/lib/adminAccess';
import type { AdminPermission } from '@/types/admin';

interface NavItem {
  label: string;
  mobileLabel?: string;
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
    label: 'Trust reviews',
    href: '/admin/trust/review-cases',
    icon: Fingerprint,
    permission: 'verifications.review',
  },
  {
    label: 'Tier 3 grants',
    href: '/admin/trust/tier-grants',
    icon: KeyRound,
    permission: 'verifications.approve',
  },
  {
    label: 'Trust appeals',
    href: '/admin/trust/appeals',
    icon: Gavel,
    permission: 'verifications.review',
  },
  {
    label: 'Diaspora operations',
    href: '/admin/diaspora',
    icon: ClipboardList,
    permission: 'diaspora.ops',
  },
  {
    label: 'Property authorities',
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
    label: 'Sureground Managed',
    href: '/admin/managed-mandates',
    icon: Sparkles,
    permission: 'managed.view',
  },
  {
    label: 'Fee changes',
    href: '/admin/fee-amendments',
    icon: Percent,
    permission: 'managed.view',
  },
  {
    label: 'Managed intake',
    href: '/admin/managed-intakes',
    icon: ClipboardCheck,
    permission: 'managed.view',
  },
  {
    label: 'Field operations',
    href: '/admin/field-operations',
    icon: Navigation,
    permission: 'managed.view',
  },
  {
    label: 'Owner questions',
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
    label: 'Manager changes',
    href: '/admin/manager-changes',
    icon: ArrowRightLeft,
    permission: 'managed.view',
  },
  {
    label: 'Partner commercials',
    href: '/admin/partner-commercials',
    icon: Handshake,
    permission: 'rentfinance.view',
  },
  {
    label: 'Unmatched payments',
    mobileLabel: 'Payments',
    href: '/admin/unmatched-payments',
    icon: CircleAlert,
    permission: 'rentfinance.view',
  },
  {
    label: 'Payment events',
    href: '/admin/payment-events',
    icon: Webhook,
    permission: 'rentfinance.view',
  },
  {
    label: 'Payment corrections',
    href: '/admin/payment-corrections',
    icon: ClipboardCheck,
    permission: 'rentfinance.view',
  },
  {
    label: 'Payouts needing attention',
    href: '/admin/payout-issues',
    icon: HandCoins,
    permission: 'rentfinance.view',
  },
  {
    label: 'Payment providers',
    href: '/admin/payment-providers',
    icon: CreditCard,
    permission: 'rentfinance.view',
  },
  {
    label: 'Chargebacks',
    href: '/admin/chargebacks',
    icon: ShieldAlert,
    permission: 'rentfinance.view',
  },
  {
    label: 'Collections reconciliation',
    href: '/admin/collections-reconciliation',
    icon: Scale,
    permission: 'rentfinance.view',
  },
  {
    label: 'Credit refunds',
    href: '/admin/credit-refunds',
    icon: RotateCcw,
    permission: 'rentfinance.view',
  },
  {
    label: 'Rent journal',
    href: '/admin/rent-journal',
    icon: BookOpenCheck,
    permission: 'rentfinance.view',
  },
  {
    label: 'Rent reconciliation',
    href: '/admin/rent-reconciliation',
    icon: GitCompareArrows,
    permission: 'rentfinance.view',
  },
  {
    label: 'Payout runs',
    href: '/admin/payout-runs',
    icon: Landmark,
    permission: 'rentfinance.view',
  },
  {
    label: 'Land diligence',
    href: '/admin/land/diligence',
    icon: MapPinned,
    permission: 'verifications.review',
  },
  {
    label: 'Land purchases',
    href: '/admin/land/purchases',
    icon: FileSignature,
    permission: 'sales.view',
  },
  {
    label: 'Title perfection',
    href: '/admin/land/perfection',
    icon: FileCheck2,
    permission: 'sales.view',
  },
  {
    label: 'Land resales',
    href: '/admin/land/resales',
    icon: ScrollText,
    permission: 'sales.view',
  },
  {
    label: 'Inspection questions',
    href: '/admin/land/inspection-questions',
    icon: MessageCircleQuestion,
    permission: 'verifications.review',
  },
  {
    label: 'Estate infrastructure',
    href: '/admin/land/infrastructure',
    icon: Construction,
    permission: 'verifications.review',
  },
  {
    label: 'Land disputes',
    href: '/admin/land/disputes',
    icon: Gavel,
    permission: 'verifications.review',
  },
  {
    label: 'Seller authority',
    href: '/admin/land/authority',
    icon: UserCheck,
    permission: 'verifications.review',
  },
  {
    label: 'Land professionals',
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
    label: 'Land fraud signals',
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
    label: 'Units & tenants',
    href: '/admin/rentals/units',
    icon: Building2,
    permission: 'rentals.view',
  },
  {
    label: 'Rent finance',
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
    label: 'Caution deposits',
    href: '/admin/deposits',
    icon: PiggyBank,
    permission: 'disputes.review',
  },
  {
    label: 'Fraud & risk',
    href: ROUTES.ADMIN_FRAUD,
    icon: AlertTriangle,
    permission: 'fraud.review',
  },
  {
    label: 'Impersonation reports',
    href: '/admin/impersonation-reports',
    icon: ShieldAlert,
    permission: 'fraud.review',
  },
  {
    label: 'Escrow oversight',
    href: ROUTES.ADMIN_ESCROW,
    icon: Landmark,
    permission: 'escrow.view',
  },
  {
    // Gated like escrow: the same question from the other end, whether money we hold is still there.
    label: 'Client money',
    href: '/admin/client-money',
    icon: Landmark,
    permission: 'escrow.view',
  },
  {
    label: 'Audit logs',
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
    label: 'Media',
    href: ROUTES.ADMIN_MEDIA,
    icon: ShieldCheck,
    permission: 'documents.manage',
  },
  {
    label: 'Messages',
    href: ROUTES.ADMIN_MESSAGES,
    icon: MessageCircle,
    permission: 'messages.manage',
  },
  {
    label: 'Text messaging',
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
    label: 'Listing funnel',
    href: '/admin/showroom-funnel',
    icon: TrendingUp,
    permission: 'reports.view',
  },
  {
    label: 'Showroom collections',
    href: '/admin/showroom-collections',
    icon: LayoutGrid,
    permission: 'collections.manage',
  },
  {
    label: 'Floor plan checks',
    href: '/admin/floor-plans',
    icon: Ruler,
    permission: 'verifications.review',
  },
  {
    label: 'Development checks',
    href: '/admin/developments',
    icon: Building2,
    permission: 'verifications.review',
  },
  {
    label: 'Automation usage',
    href: '/admin/ai-usage',
    icon: Cpu,
    permission: 'ai.observe',
  },
  {
    label: 'Settings',
    href: ROUTES.ADMIN_SETTINGS,
    icon: Settings,
    permission: 'platform.configure',
  },
  {
    label: 'Access & roles',
    href: ROUTES.ADMIN_ACCESS,
    icon: KeyRound,
    permission: 'staff.manage',
  },
];

// Groups list their pages by name; ranges let newly added pages drift into the wrong group.
const groupItems: [group: string, items: string[]][] = [
  ['Reports', ['Dashboard', 'Reports', 'Listing funnel', 'Automation usage']],
  [
    'People and identity',
    [
      'Users',
      'Verifications',
      'Trust reviews',
      'Tier 3 grants',
      'Trust appeals',
      'Agencies',
      'Realtors',
      'Agents',
      'Impersonation reports',
    ],
  ],
  [
    'Properties and listings',
    [
      'Property authorities',
      'Marketplace',
      'Rentals',
      'Units & tenants',
      'Shortlets',
      'Estates',
      'Maintenance',
      'Floor plan checks',
      'Development checks',
    ],
  ],
  [
    'Managed services',
    [
      'Sureground Managed',
      'Managed intake',
      'Field operations',
      'Owner questions',
      'Managed P&L',
      'Management KPIs',
      'Manager changes',
      'Partner commercials',
    ],
  ],
  [
    'Payments in',
    [
      'Unmatched payments',
      'Payment events',
      'Payment corrections',
      'Payment providers',
      'Chargebacks',
      'Credit refunds',
      'Subscriptions',
    ],
  ],
  [
    'Payouts and ledgers',
    [
      'Payouts needing attention',
      'Payout runs',
      'Collections reconciliation',
      'Rent journal',
      'Rent reconciliation',
      'Rent finance',
      'Escrow oversight',
      'Client money',
    ],
  ],
  [
    'Land',
    [
      'Land diligence',
      'Land purchases',
      'Title perfection',
      'Land resales',
      'Inspection questions',
      'Estate infrastructure',
      'Land disputes',
      'Seller authority',
      'Land professionals',
      'Land Watch',
      'Land fraud signals',
    ],
  ],
  ['Risk and disputes', ['Disputes', 'Caution deposits', 'Fraud & risk', 'Audit logs']],
  ['Communications', ['Messages', 'Text messaging', 'Documents']],
  ['Platform', ['Settings', 'Access & roles']],
];
const baseNavGroups = groupItems.map(([label, labels]) => ({
  label,
  items: labels.flatMap((name) => navItems.filter((item) => item.label === name)),
}));

const primaryLabels = [
  'Dashboard',
  'Users',
  'Verifications',
  'Unmatched payments',
  'Disputes',
  'Fraud & risk',
];
const utilityLabels = ['Settings', 'Access & roles'];
const promotedLabels = new Set([...primaryLabels, ...utilityLabels]);
const itemsByLabel = (labels: string[]) =>
  labels.flatMap((label) => {
    const match = navItems.find((item) => item.label === label);
    return match ? [match] : [];
  });
const navGroups = [
  { label: 'Primary', kind: 'primary' as const, items: itemsByLabel(primaryLabels) },
  ...baseNavGroups
    .map((group) => ({
      ...group,
      kind: 'contextual' as const,
      items: group.items.filter((item) => !promotedLabels.has(item.label)),
    }))
    .filter((group) => group.items.length > 0),
  {
    label: 'Account and platform',
    kind: 'utility' as const,
    items: itemsByLabel(utilityLabels),
  },
];

const hasAccess = (roles: string[] | undefined, item: NavItem) =>
  item.href === ROUTES.ADMIN_ACCESS
    ? hasStaffAccess(roles)
    : hasAdminPermission(roles, item.permission);

// The one link for this page: the most specific match, so a page nested under
// another (/admin/rentals/units under /admin/rentals) does not light up both.
const activeAdminHref = (pathname: string): string | undefined =>
  navItems
    .map((item) => item.href)
    .filter(
      (href) =>
        pathname === href || (href !== ROUTES.ADMIN_DASHBOARD && pathname.startsWith(`${href}/`))
    )
    .sort((a, b) => b.length - a.length)[0];

// Paths no entry covers are left to the page; Settings is open to everyone because it holds the person's own profile.
export function hasRouteAccess(roles: string[] | undefined, pathname: string): boolean {
  if (pathname === ROUTES.ADMIN_SETTINGS || pathname.startsWith(`${ROUTES.ADMIN_SETTINGS}/`)) {
    return true;
  }
  const match = navItems
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];
  return match ? hasAccess(roles, match) : true;
}

const MANAGED_HREF = '/admin/managed-mandates';
const adminNavPreferences = new Map<string, boolean>();
const adminNavListeners = new Set<() => void>();
const subscribeAdminNav = (listener: () => void) => {
  adminNavListeners.add(listener);
  return () => adminNavListeners.delete(listener);
};
const readAdminNavPreference = (key: string) => {
  if (adminNavPreferences.has(key)) return adminNavPreferences.get(key) ?? false;
  const value = window.localStorage.getItem(key) === 'true';
  adminNavPreferences.set(key, value);
  return value;
};
const writeAdminNavPreference = (key: string, value: boolean) => {
  adminNavPreferences.set(key, value);
  window.localStorage.setItem(key, String(value));
  adminNavListeners.forEach((listener) => listener());
};

function AdminNavigationGroup({
  label,
  kind,
  items,
  pathname,
  managedWaiting = 0,
  onNavigate,
}: {
  label: string;
  kind: 'primary' | 'contextual' | 'utility';
  items: NavItem[];
  pathname: string;
  managedWaiting?: number;
  onNavigate?: () => void;
}) {
  const activeHref = activeAdminHref(pathname);
  const containsCurrentPage = items.some((item) => item.href === activeHref);
  const preferenceKey = `sureground.admin-nav.expanded:${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  const expandedPreference = useSyncExternalStore(
    subscribeAdminNav,
    () => readAdminNavPreference(preferenceKey),
    () => false
  );
  const expanded = kind === 'primary' || containsCurrentPage || expandedPreference;

  const links = (
    <div className="space-y-1">
      {items.map((item) => {
        const isActive = item.href === activeHref;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            onClick={onNavigate}
            className="sidebar-item"
          >
            <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="sidebar-item-label min-w-0 truncate">{item.label}</span>
            {item.href === MANAGED_HREF && managedWaiting > 0 && (
              <span
                className="sidebar-item-extra ml-auto inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground"
                aria-label={`${managedWaiting} waiting`}
              >
                {managedWaiting}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );

  if (kind === 'primary') return <section aria-label="Primary navigation">{links}</section>;

  const headingId = `admin-sidebar-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return (
    <section
      aria-labelledby={headingId}
      className={kind === 'utility' ? 'border-t border-border pt-4' : undefined}
    >
      <h2 className="sidebar-label">
        <button
          type="button"
          id={headingId}
          className="sidebar-group-toggle"
          aria-expanded={expanded}
          aria-controls={`${headingId}-items`}
          onClick={() => {
            writeAdminNavPreference(preferenceKey, !expanded);
          }}
        >
          <span className="min-w-0 flex-1 truncate">{label}</span>
          <DisclosureCaret
            className={`h-3.5 w-3.5 shrink-0 transition-transform ${expanded ? '' : '-rotate-90'}`}
            aria-hidden="true"
          />
        </button>
      </h2>
      <div id={`${headingId}-items`} hidden={!expanded}>
        {links}
      </div>
    </section>
  );
}

export const AdminSidebar = ({ roles }: { roles?: string[] }) => {
  const pathname = usePathname();

  const canSeeManaged = hasAdminPermission(roles, 'managed.view');
  const queueCounts = useQuery({
    queryKey: ['admin', 'managed-queue-counts'],
    // Header/sidebar chrome: a failure here must never take down the page.
    throwOnError: false,
    queryFn: () => unwrap(adminManagedService.queueCounts()),
    enabled: canSeeManaged,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
  const managedWaiting =
    (queueCounts.data?.awaitingActivation ?? 0) + (queueCounts.data?.terminationRequests ?? 0);
  const primaryItems = navGroups[0].items.filter((item) => hasAccess(roles, item));
  const mobilePrimaryItems = primaryItems.slice(0, 5);
  const { rail, setRail } = useSidebarRail();
  const currentHref = activeAdminHref(pathname);
  const isCurrent = (item: NavItem) => item.href === currentHref;
  const railCurrent = primaryItems.some(isCurrent)
    ? undefined
    : navGroups
        .slice(1)
        .flatMap((group) => group.items)
        .filter((item) => hasAccess(roles, item) && isCurrent(item))
        .sort((a, b) => b.href.length - a.href.length)[0];

  return (
    <>
      <aside
        data-rail={rail || undefined}
        className={`workspace-sidebar fixed bottom-0 left-0 top-16 z-30 hidden border-r border-border lg:block ${rail ? '' : 'overflow-y-auto'}`}
      >
        {rail ? (
          <nav className="space-y-1 px-3 py-4" aria-label="Administration navigation">
            <AdminNavigationGroup
              label="Primary"
              kind="primary"
              items={railCurrent ? [...primaryItems, railCurrent] : primaryItems}
              pathname={pathname}
              managedWaiting={managedWaiting}
            />
            <div className="sidebar-rail-separator" aria-hidden="true" />
            <SidebarRailToggle rail onToggle={setRail} />
          </nav>
        ) : (
          <nav className="space-y-5 px-3 py-4" aria-label="Administration navigation">
            <div className="px-3 pb-1">
              <p className="text-2xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Workspace
              </p>
              <p className="mt-1 truncate text-sm font-semibold text-foreground">Operations</p>
            </div>
            {navGroups.map((group) => {
              const visibleItems = group.items.filter((item) => hasAccess(roles, item));
              if (visibleItems.length === 0) return null;
              return (
                <AdminNavigationGroup
                  key={group.label}
                  label={group.label}
                  kind={group.kind}
                  items={visibleItems}
                  pathname={pathname}
                  managedWaiting={managedWaiting}
                />
              );
            })}
            <div className="border-t border-border pt-3">
              <SidebarRailToggle rail={false} onToggle={setRail} />
            </div>
          </nav>
        )}
      </aside>
      {mobilePrimaryItems.length > 0 && (
        <nav
          className="mobile-primary-nav fixed inset-x-0 bottom-0 z-50 grid border-t border-border bg-card sm:hidden"
          style={{ gridTemplateColumns: `repeat(${mobilePrimaryItems.length}, minmax(0, 1fr))` }}
          aria-label="Administration primary navigation"
        >
          {mobilePrimaryItems.map((item) => {
            const active = item.href === currentHref;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className="mobile-primary-nav-item"
              >
                <item.icon className="h-5 w-5" aria-hidden="true" />
                <span className="max-w-full truncate">{item.mobileLabel ?? item.label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </>
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
      <div className="border-b border-border px-3 pb-4">
        <p className="text-xs font-medium text-muted-foreground">Current workspace</p>
        <p className="mt-1 font-semibold text-foreground">Operations</p>
      </div>
      {navGroups.map((group) => {
        const visibleItems = group.items.filter((item) => hasAccess(roles, item));
        if (visibleItems.length === 0) return null;
        return (
          <AdminNavigationGroup
            key={group.label}
            label={group.label}
            kind={group.kind}
            items={visibleItems}
            pathname={pathname}
            onNavigate={onNavigate}
          />
        );
      })}
    </nav>
  );
};
