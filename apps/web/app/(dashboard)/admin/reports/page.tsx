'use client';

import { useState, useEffect } from 'react';
import { DollarSign, Users, ShieldCheck, TrendingUp, FileSpreadsheet, Check } from 'lucide-react';
import { PlatformRevenueChart } from '@/components/admin/reports/PlatformRevenueChart';
import { Button } from '@/components/ui/Button';
import { StatCard, type StatCardAccent } from '@/components/ui/StatCard';
import { formatCurrency } from '@/lib/format';
import { adminService } from '@/services/adminService';
import type { RevenuePoint, RevenueBreakdown } from '@/types/admin';

interface ReportsStats {
  gmvYtd: number;
  activeUsers: number;
  avgTrustScore: number;
  momGrowthPct: number;
}

const EMPTY_STATS: ReportsStats = { gmvYtd: 0, activeUsers: 0, avgTrustScore: 0, momGrowthPct: 0 };

export default function AdminReportsPage() {
  const [exported, setExported] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [stats, setStats] = useState<ReportsStats>(EMPTY_STATS);
  const [revenueSeries, setRevenueSeries] = useState<RevenuePoint[]>([]);
  const [breakdown, setBreakdown] = useState<RevenueBreakdown[]>([]);

  useEffect(() => {
    const fetchReports = async () => {
      const [statsRes, seriesRes, breakdownRes] = await Promise.all([
        adminService.getReportsStats(),
        adminService.getRevenueSeries(6),
        adminService.getGmvBreakdown(),
      ]);
      if (statsRes.success && statsRes.data) setStats(statsRes.data);
      if (seriesRes.success && seriesRes.data) setRevenueSeries(seriesRes.data);
      if (breakdownRes.success && breakdownRes.data) setBreakdown(breakdownRes.data);
    };

    fetchReports();
  }, []);

  const statCards: Array<{
    icon: typeof DollarSign;
    label: string;
    value: string;
    accent: StatCardAccent;
  }> = [
    {
      icon: DollarSign,
      label: 'Platform GMV (YTD)',
      value: formatCurrency(stats.gmvYtd, { compact: true }),
      accent: 'primary',
    },
    {
      icon: Users,
      label: 'Active Users',
      value: stats.activeUsers.toLocaleString(),
      accent: 'blue',
    },
    {
      icon: ShieldCheck,
      label: 'Avg. Trust Score',
      value: String(stats.avgTrustScore),
      accent: 'green',
    },
    {
      icon: TrendingUp,
      label: 'Month-over-Month Growth',
      value: `${stats.momGrowthPct >= 0 ? '+' : ''}${stats.momGrowthPct}%`,
      accent: 'emerald',
    },
  ];

  const handleExport = async () => {
    setExporting(true);
    const response = await adminService.exportReportsCsv();
    setExporting(false);
    if (response.success) {
      setExported(true);
      window.setTimeout(() => setExported(false), 2500);
    }
  };

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
          className="gap-1.5"
          onClick={handleExport}
          disabled={exporting}
          isLoading={exporting}
        >
          {exported ? (
            <Check className="w-3.5 h-3.5 text-green-500" />
          ) : (
            <FileSpreadsheet className="w-3.5 h-3.5" />
          )}
          {exported ? 'Exported' : 'Export CSV'}
        </Button>
      </div>

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

      <div className="mb-6">
        <PlatformRevenueChart data={revenueSeries} />
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-5 border-b border-border">
          <h3 className="font-semibold text-foreground">GMV Breakdown by Category</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Year-to-date share of total platform GMV
          </p>
        </div>
        <div className="divide-y divide-border">
          {breakdown.map((row) => (
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
                    style={{ width: `${row.share}%` }}
                  />
                </div>
              </div>
              <span className="text-xs font-medium text-muted-foreground w-10 text-right shrink-0">
                {row.share}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
