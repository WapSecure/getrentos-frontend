'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  FolderOpen,
  Handshake,
  Home,
  Landmark,
  Megaphone,
  RefreshCw,
  ScrollText,
  ShieldCheck,
  Users,
  Wallet,
  Wrench,
} from 'lucide-react';
import {
  Button,
  ConfirmDialog,
  PageErrorState,
  PageLoadingState,
  StatCard,
  Toast,
  type ToastVariant,
} from '@getrentos/ui';
import { unwrap, formatCurrency } from '@getrentos/shared';
import { adminKeys } from '@/lib/queryKeys';
import { adminEstateService } from '@/services/adminEstateService';
import type { AdminEstateOverview as OverviewData } from '@/types/estate';
import { hasAdminPermission } from '@/lib/adminAccess';
import { useAdminUser } from '@/app/(dashboard)/admin/layout';

const EMPTY: OverviewData = {
  estateOrganizationCount: 0,
  totalEstates: 0,
  totalHouseholds: 0,
  activeHouseholds: 0,
  residentLinkedHouseholds: 0,
  collectedDueAmount: 0,
  outstandingDueAmount: 0,
  overdueDueCount: 0,
  openIncidentCount: 0,
  openMaintenanceCount: 0,
  openPollCount: 0,
  activeMicrositeCount: 0,
};

const modules = [
  {
    label: 'Estates',
    description: 'Register & case 360',
    href: '/admin/estates/register',
    icon: Landmark,
  },
  {
    label: 'Households',
    description: 'Units & residents',
    href: '/admin/estates/households',
    icon: Home,
  },
  {
    label: 'Dues & levies',
    description: 'Household levy ledger',
    href: '/admin/estates/dues',
    icon: Wallet,
  },
  {
    label: 'Incidents',
    description: 'Security / safety reports',
    href: '/admin/estates/incidents',
    icon: ShieldCheck,
  },
  {
    label: 'Maintenance',
    description: 'Resident tickets',
    href: '/admin/estates/maintenance',
    icon: Wrench,
  },
  {
    label: 'Polls',
    description: 'Community votes',
    href: '/admin/estates/polls',
    icon: Handshake,
  },
  {
    label: 'Announcements',
    description: 'Estate notices',
    href: '/admin/estates/announcements',
    icon: Megaphone,
  },
  {
    label: 'Staff & access',
    description: 'Managers, gatemen, residents',
    href: '/admin/estates/staff',
    icon: Users,
  },
  {
    label: 'Governance',
    description: 'Bylaws & minutes',
    href: '/admin/estates/governance',
    icon: ScrollText,
  },
] as const;

export const AdminEstateOverview = () => {
  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: adminKeys.estateOverview,
    queryFn: () => unwrap(adminEstateService.overview()),
  });
  const stats = data ?? EMPTY;
  const user = useAdminUser();
  const canScan = hasAdminPermission(user?.roles, 'estate.moderate');
  const queryClient = useQueryClient();
  const [showScanConfirm, setShowScanConfirm] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const scan = useMutation({
    mutationFn: () => unwrap(adminEstateService.runDueScan()),
    onSuccess: (result) => {
      setToast({
        message:
          result.flagged > 0 || result.generated > 0
            ? `Scan complete — ${result.flagged} due(s) flagged overdue, ${result.generated} recurring due(s) generated.`
            : 'Scan complete — no overdue flags or recurring dues to generate.',
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'estates'] });
    },
    onError: (error: Error) =>
      setToast({ message: error.message || 'Scan failed. Please try again.', variant: 'error' }),
  });

  if (isLoading) return <PageLoadingState />;

  if (isError) {
    return (
      <PageErrorState
        title="Could not load estate oversight"
        description="Estate and community totals are temporarily unavailable. No operational values are being estimated."
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-accent/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-accent-foreground">
            <Landmark className="h-3 w-3" />
            Estate administration
          </span>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-foreground">
            Estates, households &amp; community ops
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Platform-wide gated communities — households, dues, incidents, polls and governance.
          </p>
        </div>
        {canScan && (
          <div className="flex flex-col items-stretch gap-1 sm:items-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowScanConfirm(true)}
              disabled={scan.isPending}
            >
              <RefreshCw className={`mr-1.5 h-4 w-4 ${scan.isPending ? 'animate-spin' : ''}`} />
              {scan.isPending ? 'Scanning…' : 'Run due scan'}
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          icon={Building2}
          label="Estate orgs"
          value={stats.estateOrganizationCount}
          accent="blue"
        />
        <StatCard icon={Landmark} label="Estates" value={stats.totalEstates} accent="primary" />
        <StatCard
          icon={Home}
          label="Households"
          value={stats.totalHouseholds}
          accent="purple"
          subtitle={`${stats.activeHouseholds} active · ${stats.residentLinkedHouseholds} resident-linked`}
        />
        <StatCard
          icon={BadgeCheck}
          label="Dues collected"
          value={formatCurrency(stats.collectedDueAmount, { compact: true })}
          accent="green"
        />
        <StatCard
          icon={Wallet}
          label="Dues outstanding"
          value={formatCurrency(stats.outstandingDueAmount, { compact: true })}
          accent="orange"
          subtitle={`${stats.overdueDueCount} overdue`}
        />
        <StatCard
          icon={ShieldCheck}
          label="Open incidents"
          value={stats.openIncidentCount}
          accent="red"
        />
        <StatCard
          icon={Wrench}
          label="Open maintenance"
          value={stats.openMaintenanceCount}
          accent="orange"
        />
        <StatCard icon={Handshake} label="Open polls" value={stats.openPollCount} accent="purple" />
        <StatCard
          icon={FolderOpen}
          label="Active microsites"
          value={stats.activeMicrositeCount}
          accent="blue"
        />
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold tracking-[-0.01em] text-foreground">
            Estate queues
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Monitor estates, households, dues and community operations across every workspace.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {modules.map((module) => (
            <Link
              key={module.href}
              href={module.href}
              className="group flex items-center gap-3 rounded-xl border border-border/90 bg-card p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-primary transition-transform duration-300 group-hover:scale-105">
                <module.icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-foreground">
                  {module.label}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {module.description}
                </span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </section>
      <ConfirmDialog
        open={showScanConfirm}
        onOpenChange={setShowScanConfirm}
        title="Run platform-wide due scan?"
        description="All estate household dues will be checked now: overdue levies will be flagged and recurring dues will be generated for the next period."
        confirmLabel="Run due scan"
        onConfirm={() => scan.mutate()}
      />
      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </div>
  );
};
