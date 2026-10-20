'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Users, ShieldCheck, TrendingUp, FileSpreadsheet, Check } from 'lucide-react';
import { NairaSign } from '@getrentos/ui/NairaSign';
import { Button, PageErrorState, Skeleton, StatGridSkeleton, useToast } from '@getrentos/ui';
import { StatCard, type StatCardAccent } from '@getrentos/ui';
import { formatCurrency } from '@getrentos/shared';
import { adminService } from '@/services/adminService';
import { unwrap } from '@getrentos/shared';
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
          label: 'Active Users',
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
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports &amp; Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Platform-wide performance and revenue insights
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          isLoading={exportMutation.isPending}
          icon={
            exported ? (
              <Check className="w-3.5 h-3.5 text-success" />
            ) : (
              <FileSpreadsheet className="w-3.5 h-3.5" />
            )
          }
        >
          {exported ? 'Exported' : 'Export CSV'}
        </Button>
      </div>

      {statsQuery.isLoading ? (
        <StatGridSkeleton className="mb-6 grid-cols-2 gap-4 lg:grid-cols-4" />
      ) : statsQuery.isError || !statsQuery.data ? (
        <PageErrorState
          title="Report totals unavailable"
          description="Current totals could not be loaded. Revenue and category reports may still be available."
          onRetry={() => statsQuery.refetch()}
          isRetrying={statsQuery.isFetching}
          className="mb-6 min-h-52"
        />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statCards.map((stat, index) => (
            <StatCard
              key={stat.label}
              icon={stat.icon}
              label={stat.label}
              value={stat.value}
              accent={stat.accent}
              delay={index * 0.05}
            />
          ))}
        </div>
      )}

      <div className="mb-6">
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

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-5 border-b border-border">
          <h3 className="font-semibold text-foreground">GMV Breakdown by Category</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Year-to-date share of total platform GMV
          </p>
        </div>
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
      </div>
    </>
  );
}
