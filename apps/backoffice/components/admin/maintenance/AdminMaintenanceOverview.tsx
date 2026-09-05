'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  ClipboardList,
  Clock3,
  Hammer,
  Receipt,
  RefreshCw,
  Scroll,
  ShieldAlert,
  Wrench,
} from 'lucide-react';
import { Button, StatCard } from '@getrentos/ui';
import { unwrap } from '@getrentos/shared';
import { adminKeys } from '@/lib/queryKeys';
import { adminMaintenanceService } from '@/services/adminMaintenanceService';
import type { AdminMaintenanceOverview as OverviewData } from '@/types/maintenance';
import { hasAdminPermission } from '@/lib/adminAccess';
import { useAdminUser } from '@/app/(dashboard)/admin/layout';

const EMPTY: OverviewData = {
  totalWorkOrders: 0,
  openWorkOrders: 0,
  inProgressWorkOrders: 0,
  resolvedWorkOrders: 0,
  cancelledWorkOrders: 0,
  urgentOpenWorkOrders: 0,
  pendingApprovalWorkOrders: 0,
  slaAtRiskWorkOrders: 0,
};

const modules = [
  {
    label: 'Work orders',
    description: 'Maintenance requests & SLA health',
    href: '/admin/maintenance/work-orders',
    icon: Wrench,
  },
  {
    label: 'SLA policies',
    description: 'Response/resolution targets',
    href: '/admin/maintenance/sla-policies',
    icon: Clock3,
  },
  {
    label: 'Preventive plans',
    description: 'Scheduled maintenance due',
    href: '/admin/maintenance/preventive-plans',
    icon: CalendarClock,
  },
  {
    label: 'Vendors',
    description: 'Directory & engagement',
    href: '/admin/maintenance/vendors',
    icon: Hammer,
  },
  {
    label: 'Quotes',
    description: 'Work-order vendor quotes',
    href: '/admin/maintenance/quotes',
    icon: Scroll,
  },
  {
    label: 'Invoices',
    description: 'Vendor invoice register',
    href: '/admin/maintenance/invoices',
    icon: Receipt,
  },
] as const;

export const AdminMaintenanceOverview = () => {
  const { data } = useQuery({
    queryKey: adminKeys.maintenanceOverview,
    queryFn: () => unwrap(adminMaintenanceService.overview()),
  });
  const stats = data ?? EMPTY;
  const user = useAdminUser();
  const canScan = hasAdminPermission(user?.roles, 'maintenance.moderate');
  const queryClient = useQueryClient();
  const [scanResult, setScanResult] = useState<string | null>(null);

  const scan = useMutation({
    mutationFn: () => unwrap(adminMaintenanceService.runSlaScan()),
    onSuccess: (result) => {
      setScanResult(
        result.notified > 0
          ? `Scan complete — ${result.notified} work order(s) notified of SLA breaches.`
          : 'Scan complete — no new SLA breaches to notify.'
      );
      queryClient.invalidateQueries({ queryKey: ['admin', 'maintenance'] });
    },
    onError: () => setScanResult('Scan failed. Please try again.'),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-accent/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-accent-foreground">
            <Wrench className="h-3 w-3" />
            Maintenance
          </span>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-foreground">
            Work orders, SLA &amp; vendors
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Platform-wide maintenance requests, service-level targets, vendors and invoices.
          </p>
        </div>
        {canScan && (
          <div className="flex flex-col items-end gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => scan.mutate()}
              disabled={scan.isPending}
            >
              <RefreshCw className={`mr-1.5 h-4 w-4 ${scan.isPending ? 'animate-spin' : ''}`} />
              {scan.isPending ? 'Scanning…' : 'Run SLA scan'}
            </Button>
            {scanResult && (
              <p className="max-w-xs text-right text-xs text-muted-foreground">{scanResult}</p>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          icon={ClipboardList}
          label="Total work orders"
          value={stats.totalWorkOrders}
          accent="blue"
          delay={0}
        />
        <StatCard
          icon={Wrench}
          label="Open"
          value={stats.openWorkOrders}
          accent="orange"
          delay={0.05}
        />
        <StatCard
          icon={RefreshCw}
          label="In progress"
          value={stats.inProgressWorkOrders}
          accent="primary"
          delay={0.1}
        />
        <StatCard
          icon={BadgeCheck}
          label="Resolved"
          value={stats.resolvedWorkOrders}
          accent="green"
          delay={0.15}
        />
        <StatCard
          icon={AlertTriangle}
          label="SLA at risk"
          value={stats.slaAtRiskWorkOrders}
          accent="red"
          delay={0.2}
        />
        <StatCard
          icon={ShieldAlert}
          label="Urgent open"
          value={stats.urgentOpenWorkOrders}
          accent="red"
          delay={0.25}
        />
        <StatCard
          icon={Clock3}
          label="Pending approval"
          value={stats.pendingApprovalWorkOrders}
          accent="purple"
          delay={0.3}
        />
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold tracking-[-0.01em] text-foreground">
            Maintenance queues
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Monitor work orders, service-level targets, vendors and invoices across every workspace.
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
    </div>
  );
};
