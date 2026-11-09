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
  ReceiptText,
  RefreshCw,
  Scroll,
  ShieldAlert,
  Wrench,
} from '@sureground/icons';
import {
  Button,
  Card,
  ConfirmDialog,
  PageErrorState,
  PageLoadingState,
  PageHeader,
  StatCard,
  useToast,
} from '@sureground/ui';
import { unwrap } from '@sureground/shared';
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
    icon: ReceiptText,
  },
] as const;

export const AdminMaintenanceOverview = () => {
  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: adminKeys.maintenanceOverview,
    queryFn: () => unwrap(adminMaintenanceService.overview()),
  });
  const stats = data ?? EMPTY;
  const user = useAdminUser();
  const canScan = hasAdminPermission(user?.roles, 'maintenance.moderate');
  const queryClient = useQueryClient();
  const [showScanConfirm, setShowScanConfirm] = useState(false);
  const toast = useToast();

  const scan = useMutation({
    mutationFn: () => unwrap(adminMaintenanceService.runSlaScan()),
    onSuccess: (result) => {
      toast.success(
        result.notified > 0
          ? `Scan complete: ${result.notified} work order(s) notified of SLA breaches.`
          : 'Scan complete: no new SLA breaches to notify.'
      );
      queryClient.invalidateQueries({ queryKey: ['admin', 'maintenance'] });
    },
    onError: (error: Error) => toast.error(error.message || 'Scan failed. Please try again.'),
  });

  if (isLoading) return <PageLoadingState />;

  if (isError && !data) {
    return (
      <PageErrorState
        title="Could not load maintenance oversight"
        description="Work-order and SLA totals are temporarily unavailable. No operational values are being estimated."
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Maintenance operations"
        description="Work orders, service-level targets, preventive plans, vendors, quotes, and invoices."
        actions={
          canScan ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowScanConfirm(true)}
              isLoading={scan.isPending}
              loadingText="Scanning…"
              icon={<RefreshCw className="h-4 w-4" />}
            >
              Run SLA scan
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={ClipboardList}
          label="Total work orders"
          value={stats.totalWorkOrders}
          accent="blue"
          compact
        />
        <StatCard icon={Wrench} label="Open" value={stats.openWorkOrders} accent="orange" compact />
        <StatCard
          icon={RefreshCw}
          label="In progress"
          value={stats.inProgressWorkOrders}
          accent="primary"
          compact
        />
        <StatCard
          icon={BadgeCheck}
          label="Resolved"
          value={stats.resolvedWorkOrders}
          accent="green"
          compact
        />
        <StatCard
          icon={AlertTriangle}
          label="SLA at risk"
          value={stats.slaAtRiskWorkOrders}
          accent="red"
          compact
        />
        <StatCard
          icon={ShieldAlert}
          label="Urgent open"
          value={stats.urgentOpenWorkOrders}
          accent="red"
          compact
        />
        <StatCard
          icon={Clock3}
          label="Pending approval"
          value={stats.pendingApprovalWorkOrders}
          accent="purple"
          compact
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
            <Card key={module.href} interactive>
              <Link href={module.href} className="group flex items-center gap-3 p-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground">
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
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5" />
              </Link>
            </Card>
          ))}
        </div>
      </section>
      <ConfirmDialog
        open={showScanConfirm}
        onOpenChange={setShowScanConfirm}
        title="Run platform-wide SLA scan?"
        description="All open maintenance work orders will be checked now. Newly detected breaches may notify the responsible stakeholders."
        confirmLabel="Run SLA scan"
        onConfirm={() => scan.mutate()}
      />
    </div>
  );
};
