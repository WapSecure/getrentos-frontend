'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Wallet, Clock, CheckCircle2, TrendingUp, FileSpreadsheet, Check } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  PageErrorState,
  Pagination,
  StatCard,
  StatGridSkeleton,
  TableSkeleton,
  type BadgeVariant,
} from '@getrentos/ui';
import { formatCurrency, formatDate } from '@/lib/format';
import { unwrap } from '@/lib/apiHelpers';
import { realtorService } from '@/services/realtorService';
import { realtorKeys } from '@/lib/queryKeys';
import { RealtorPayoutSection } from '@/components/realtor/commissions/RealtorPayoutSection';
import { AgencyAgentSelfPayout } from '@/components/agency/AgencyAgentSelfPayout';
import type { CommissionSide, CommissionStatus } from '@/types/realtor';
import { usePlanTier } from '@/hooks/usePlanTier';
import { ProFeatureGate } from '@/components/shared/subscription/ProFeatureGate';

const PAGE_SIZE = 10;

/**
 * The ledger's own states. `available` is money earned and withdrawable today;
 * `paid` has reached the bank; `void` is a sale reversed before any payout
 * claimed it, so it keeps its reason rather than disappearing.
 */
const statusConfig: Record<CommissionStatus, { label: string; variant: BadgeVariant }> = {
  available: { label: 'Available', variant: 'info' },
  paid: { label: 'Paid', variant: 'success' },
  void: { label: 'Void', variant: 'danger' },
};

const SIDE_LABEL: Record<CommissionSide, string> = {
  listing: 'Listing side',
  buyer: 'Buyer side',
};

export default function RealtorCommissionsPage() {
  const [page, setPage] = useState(1);
  const { isPro, isLoading: isPlanLoading } = usePlanTier();
  const commissionsQuery = useQuery({
    queryKey: [...realtorKeys.commissions, { page, pageSize: PAGE_SIZE }],
    queryFn: () => unwrap(realtorService.getCommissions({ page, pageSize: PAGE_SIZE })),
    enabled: isPro,
    placeholderData: keepPreviousData,
  });
  const { data, isLoading } = commissionsQuery;
  const summaryQuery = useQuery({
    queryKey: [...realtorKeys.commissions, 'summary'],
    queryFn: () => unwrap(realtorService.getCommissionsSummary()),
    enabled: isPro,
  });
  const { data: summary } = summaryQuery;
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
      accent: 'primary',
    },
    {
      icon: Clock,
      label: 'Pending',
      value: formatCurrency(summary?.pending ?? 0, { compact: true }),
      accent: 'blue',
    },
    {
      icon: CheckCircle2,
      label: 'Paid',
      value: formatCurrency(summary?.paid ?? 0, { compact: true }),
      accent: 'green',
    },
    {
      icon: TrendingUp,
      label: 'Deals Closed',
      value: summary?.dealsClosed ?? 0,
      accent: 'emerald',
    },
  ] as const;

  if (isPlanLoading || (isPro && isLoading)) {
    return (
      <div className="space-y-6">
        <StatGridSkeleton />
        <TableSkeleton rows={5} columns={6} />
      </div>
    );
  }

  if (isPro && ((commissionsQuery.isError && !data) || (summaryQuery.isError && !summary))) {
    return (
      <PageErrorState
        title="Commission records are unavailable"
        description="We could not load your earnings and payout totals. No balances have been changed."
        onRetry={() => {
          void commissionsQuery.refetch();
          void summaryQuery.refetch();
        }}
        isRetrying={commissionsQuery.isFetching || summaryQuery.isFetching}
      />
    );
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
          <Button
            variant="outline"
            size="sm"
            icon={
              exported ? (
                <Check className="w-3.5 h-3.5 text-success" />
              ) : (
                <FileSpreadsheet className="w-3.5 h-3.5" />
              )
            }
            onClick={handleExport}
          >
            {exported ? 'Exported' : 'Export current page'}
          </Button>
        )}
      </div>

      <ProFeatureGate
        title="Commission tracking is a Pro feature"
        description="Upgrade to Pro to track earnings from closed deals, see totals by status, and export your commission report."
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>

        <RealtorPayoutSection />

        <Card>
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
                          <Badge variant={status.variant}>{status.label}</Badge>
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
        </Card>

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

      {/* Outside the Pro gate: a firm's share owed to this realtor is never paywalled. */}
      <AgencyAgentSelfPayout standalone />
    </>
  );
}
