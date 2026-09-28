'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Wallet, Clock, CheckCircle2, TrendingUp, FileSpreadsheet, Check } from 'lucide-react';
import { Button, Pagination } from '@getrentos/ui';
import { formatCurrency, formatDate } from '@/lib/format';
import { unwrap } from '@/lib/apiHelpers';
import { realtorService } from '@/services/realtorService';
import { realtorKeys } from '@/lib/queryKeys';
import { RealtorPayoutSection } from '@/components/realtor/commissions/RealtorPayoutSection';
import type { CommissionSide, CommissionStatus } from '@/types/realtor';
import { usePlanTier } from '@/hooks/usePlanTier';
import { ProFeatureGate } from '@/components/shared/subscription/ProFeatureGate';

const PAGE_SIZE = 10;

/**
 * The ledger's own states. `available` is money earned and withdrawable today;
 * `paid` has reached the bank; `void` is a sale reversed before any payout
 * claimed it, so it keeps its reason rather than disappearing.
 */
const statusConfig: Record<CommissionStatus, { label: string; className: string }> = {
  available: {
    label: 'Available',
    className: 'text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20',
  },
  paid: {
    label: 'Paid',
    className: 'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20',
  },
  void: {
    label: 'Void',
    className: 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/20',
  },
};

const SIDE_LABEL: Record<CommissionSide, string> = {
  listing: 'Listing side',
  buyer: 'Buyer side',
};

export default function RealtorCommissionsPage() {
  const [page, setPage] = useState(1);
  const { isPro, isLoading: isPlanLoading } = usePlanTier();
  const { data, isLoading } = useQuery({
    queryKey: [...realtorKeys.commissions, { page, pageSize: PAGE_SIZE }],
    queryFn: () => unwrap(realtorService.getCommissions({ page, pageSize: PAGE_SIZE })),
    enabled: isPro,
  });
  const { data: summary } = useQuery({
    queryKey: [...realtorKeys.commissions, 'summary'],
    queryFn: () => unwrap(realtorService.getCommissionsSummary()),
    enabled: isPro,
  });
  const commissions = data?.items ?? [];
  const total = data?.total ?? 0;
  const [exported, setExported] = useState(false);

  const handleExport = () => {
    if (commissions.length === 0) return;
    const header = [
      'Property',
      'Side',
      'Client',
      'Deal Value',
      'Rate (%)',
      'Commission Amount',
      'Status',
      'Earned',
    ];
    const rows = commissions.map((c) => [
      c.propertyTitle,
      SIDE_LABEL[c.side],
      c.clientName,
      c.dealValue,
      c.ratePct,
      c.amount,
      c.status,
      c.earnedAt.slice(0, 10),
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `getrentos-commissions-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setExported(true);
    window.setTimeout(() => setExported(false), 2500);
  };

  const stats = [
    {
      icon: Wallet,
      label: 'Available to withdraw',
      value: formatCurrency(summary?.available ?? 0, { compact: true }),
      color: 'gold',
    },
    {
      icon: Clock,
      label: 'Pending',
      value: formatCurrency(summary?.pending ?? 0, { compact: true }),
      color: 'blue',
    },
    {
      icon: CheckCircle2,
      label: 'Paid',
      value: formatCurrency(summary?.paid ?? 0, { compact: true }),
      color: 'green',
    },
    { icon: TrendingUp, label: 'Deals Closed', value: summary?.dealsClosed ?? 0, color: 'emerald' },
  ];

  const colorClasses = {
    blue: { bg: 'bg-blue-50 dark:bg-blue-950/20', icon: 'text-blue-600 dark:text-blue-400' },
    gold: { bg: 'bg-accent', icon: 'text-primary' },
    green: { bg: 'bg-green-50 dark:bg-green-950/20', icon: 'text-green-600 dark:text-green-400' },
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/20',
      icon: 'text-emerald-600 dark:text-emerald-400',
    },
  } as const;

  if (isPlanLoading || (isPro && isLoading)) {
    return <div className="p-10 text-center text-muted-foreground">Loading commissions…</div>;
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Commissions</h1>
          <p className="text-muted-foreground mt-1">
            Earned when a sale settles, not when an offer is accepted
          </p>
        </div>
        {isPro && (
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport}>
            {exported ? (
              <Check className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <FileSpreadsheet className="w-3.5 h-3.5" />
            )}
            {exported ? 'Exported' : 'Export current page'}
          </Button>
        )}
      </div>

      <ProFeatureGate
        title="Commission tracking is a Pro feature"
        description="Upgrade to Pro to track earnings from closed deals, see totals by status, and export your commission report."
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map((stat) => {
            const colors = colorClasses[stat.color as keyof typeof colorClasses];
            return (
              <div key={stat.label} className="rounded-2xl bg-card border border-border p-4">
                <div className={`inline-flex p-2.5 rounded-xl ${colors.bg} mb-3`}>
                  <stat.icon className={`w-5 h-5 ${colors.icon}`} />
                </div>
                <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                <p className="text-xl font-bold text-foreground tracking-tight">{stat.value}</p>
              </div>
            );
          })}
        </div>

        <RealtorPayoutSection />

        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-5 pt-5">
            <h3 className="text-sm font-semibold text-foreground">Earned commission</h3>
          </div>
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="p-4 font-medium">Property</th>
                  <th className="p-4 font-medium">Side</th>
                  <th className="p-4 font-medium">Client</th>
                  <th className="p-4 font-medium">Deal Value</th>
                  <th className="p-4 font-medium">Rate</th>
                  <th className="p-4 font-medium">Commission</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {commissions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-10 text-center text-sm text-muted-foreground">
                      No commission yet. It appears here once a sale you brokered settles and the
                      buyer&apos;s money is released to the seller.
                    </td>
                  </tr>
                ) : (
                  commissions.map((c) => {
                    const status = statusConfig[c.status];
                    return (
                      <tr key={c.id} className="hover:bg-secondary transition-colors">
                        <td className="p-4 font-medium text-foreground whitespace-nowrap">
                          {c.propertyTitle}
                        </td>
                        <td className="p-4 text-muted-foreground whitespace-nowrap">
                          {SIDE_LABEL[c.side]}
                        </td>
                        <td className="p-4 text-muted-foreground whitespace-nowrap">
                          {c.clientName}
                        </td>
                        <td className="p-4 text-muted-foreground whitespace-nowrap">
                          {formatCurrency(c.dealValue, { compact: true })}
                        </td>
                        <td className="p-4 text-muted-foreground whitespace-nowrap">
                          {c.ratePct}%
                        </td>
                        <td className="p-4 font-bold text-primary whitespace-nowrap">
                          {formatCurrency(c.amount, { compact: true })}
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium ${status.className}`}
                          >
                            {status.label}
                          </span>
                          {/* A reversed sale keeps its reason, rather than vanishing. */}
                          {c.status === 'void' && c.voidReason && (
                            <span className="block text-xs text-muted-foreground mt-1">
                              {c.voidReason}
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-muted-foreground whitespace-nowrap">
                          {formatDate(c.earnedAt)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {total > 0 && (
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            onPageChange={setPage}
            className="mt-6"
          />
        )}
      </ProFeatureGate>
    </>
  );
}
