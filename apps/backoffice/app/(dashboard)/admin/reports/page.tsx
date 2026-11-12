'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Users, ShieldCheck, TrendingUp, FileSpreadsheet, Check } from '@sureground/icons';
import { NairaSign } from '@sureground/ui/NairaSign';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  PageErrorState,
  PageHeader,
  Skeleton,
  StatGridSkeleton,
  useToast,
} from '@sureground/ui';
import { StatCard, type StatCardAccent } from '@sureground/ui';
import { formatCurrency } from '@sureground/shared';
import { adminService } from '@/services/adminService';
import { unwrap } from '@sureground/shared';
import { adminKeys } from '@/lib/queryKeys';

// recharts is heavy: load it only when the reports page mounts.
const PlatformRevenueChart = dynamic(
  () =>
    import('@/components/admin/reports/PlatformRevenueChart').then((m) => m.PlatformRevenueChart),
  {
    ssr: false,
    loading: () => <Skeleton className="h-64 w-full rounded-xl" />,
  }
);

export default function AdminReportsPage() {
  const [exported, setExported] = useState(false);
  const toast = useToast();

  const statsQuery = useQuery({
    queryKey: adminKeys.reportsStats,
    queryFn: () => unwrap(adminService.getReportsStats()),
  });

  const revenueQuery = useQuery({
    queryKey: adminKeys.revenueSeries(6),
    queryFn: () => unwrap(adminService.getRevenueSeries(6)),
  });

  const breakdownQuery = useQuery({
    queryKey: adminKeys.gmvBreakdown,
    queryFn: () => unwrap(adminService.getGmvBreakdown()),
  });

  const statCards: Array<{
    icon: typeof NairaSign;
    label: string;
    value: string;
    accent: StatCardAccent;
  }> = statsQuery.data
    ? [
        {
          icon: NairaSign,
          label: 'Platform GMV (YTD)',
          value: formatCurrency(statsQuery.data.gmvYtd, { compact: true }),
          accent: 'primary',
        },
        {
          icon: Users,
          label: 'Active users',
          value: statsQuery.data.activeUsers.toLocaleString(),
          accent: 'blue',
        },
        {
          icon: ShieldCheck,
          label: 'Avg. Trust Score',
          value: String(statsQuery.data.avgTrustScore),
          accent: 'green',
        },
        {
          icon: TrendingUp,
          label: 'Month-over-Month Growth',
          value: `${statsQuery.data.momGrowthPct >= 0 ? '+' : ''}${statsQuery.data.momGrowthPct}%`,
          accent: 'emerald',
        },
      ]
    : [];

  const exportMutation = useMutation({
    mutationFn: () => unwrap(adminService.exportReportsCsv()),
    onSuccess: () => {
      setExported(true);
      toast.success('CSV export downloaded successfully.');
      window.setTimeout(() => setExported(false), 2500);
    },
    onError: (error: Error) => {
      setExported(false);
      toast.error(error.message || 'The CSV export could not be downloaded.');
    },
  });

  const handleExport = () => exportMutation.mutate();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports and analytics"
        description="Platform performance, transaction volume, and category-level reporting."
        actions={
          <Button
            variant="outline"
            onClick={handleExport}
            isLoading={exportMutation.isPending}
            icon={
              exported ? (
                <Check className="h-4 w-4 text-success" />
              ) : (
                <FileSpreadsheet className="h-4 w-4" />
              )
            }
          >
            {exported ? 'Exported' : 'Export CSV'}
          </Button>
        }
      />

      {statsQuery.isLoading ? (
        <StatGridSkeleton className="grid-cols-2 gap-3 lg:grid-cols-4" />
      ) : statsQuery.isError || !statsQuery.data ? (
        <PageErrorState
          title="Report totals unavailable"
          description="Current totals could not be loaded. Revenue and category reports may still be available."
          onRetry={() => statsQuery.refetch()}
          isRetrying={statsQuery.isFetching}
          className="min-h-52"
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {statCards.map((stat) => (
            <StatCard
              key={stat.label}
              icon={stat.icon}
              label={stat.label}
              value={stat.value}
              accent={stat.accent}
            />
          ))}
        </div>
      )}

      <div>
        {revenueQuery.isLoading ? (
          <Skeleton className="h-72 w-full rounded-xl" />
        ) : revenueQuery.isError && !revenueQuery.data ? (
          <PageErrorState
            title="Revenue chart unavailable"
            description="The revenue series could not be loaded."
            onRetry={() => revenueQuery.refetch()}
            isRetrying={revenueQuery.isFetching}
            className="min-h-72"
          />
        ) : (
          <PlatformRevenueChart data={revenueQuery.data ?? []} />
        )}
      </div>

      <Card>
        <CardHeader className="border-b border-border pb-4">
          <CardTitle>GMV breakdown by category</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Year-to-date share of total platform GMV
          </p>
        </CardHeader>
        <div className="divide-y divide-border">
          {breakdownQuery.isLoading ? (
            <div
              className="space-y-4 p-5"
              role="status"
              aria-label="Loading GMV category breakdown"
            >
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : breakdownQuery.isError && !breakdownQuery.data ? (
            <PageErrorState
              title="Category breakdown unavailable"
              description="The GMV category breakdown could not be loaded."
              onRetry={() => breakdownQuery.refetch()}
              isRetrying={breakdownQuery.isFetching}
              className="min-h-64 border-0"
            />
          ) : !breakdownQuery.data?.length ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              No GMV category data is available yet.
            </p>
          ) : (
            breakdownQuery.data.map((row) => (
              <div key={row.category} className="flex items-center gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <p className="text-sm font-medium text-foreground truncate">{row.category}</p>
                    <p className="text-sm font-semibold text-foreground whitespace-nowrap">
                      {formatCurrency(row.amount, { compact: true })}
                    </p>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.min(100, Math.max(0, row.share))}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs font-medium text-muted-foreground w-10 text-right shrink-0">
                  {row.share}%
                </span>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
