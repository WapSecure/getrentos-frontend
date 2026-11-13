'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Wallet, Clock, CheckCircle2, TrendingUp, FileSpreadsheet, Check } from '@sureground/icons';
import {
  Badge,
  Button,
  DataTable,
  EmptyState,
  PageErrorState,
  Pagination,
  StatCard,
  StatGridSkeleton,
  TableSkeleton,
  type BadgeVariant,
  type Column,
  PageHeader,
} from '@sureground/ui';
import { formatCurrency, formatDate } from '@/lib/format';
import { unwrap } from '@/lib/apiHelpers';
import { realtorService } from '@/services/realtorService';
import { realtorKeys } from '@/lib/queryKeys';
import { RealtorPayoutSection } from '@/components/realtor/commissions/RealtorPayoutSection';
import { AgencyAgentSelfPayout } from '@/components/agency/AgencyAgentSelfPayout';
import type { Commission, CommissionSide, CommissionStatus } from '@/types/realtor';
import { usePlanTier } from '@/hooks/usePlanTier';
import { ProFeatureGate } from '@/components/shared/subscription/ProFeatureGate';

const PAGE_SIZE = 10;

const statusConfig: Record<CommissionStatus, { label: string; variant: BadgeVariant }> = {
  available: { label: 'Available', variant: 'info' },
  paid: { label: 'Paid', variant: 'success' },
  void: { label: 'Void', variant: 'danger' },
};

const SIDE_LABEL: Record<CommissionSide, string> = {
  listing: 'Listing side',
  buyer: 'Buyer side',
};

const commissionColumns: Column<Commission>[] = [
  {
    key: 'property',
    header: 'Property',
    className: 'font-medium text-foreground whitespace-nowrap',
    render: (c) => c.propertyTitle,
  },
  {
    key: 'side',
    header: 'Side',
    className: 'text-muted-foreground whitespace-nowrap',
    render: (c) => SIDE_LABEL[c.side],
  },
  {
    key: 'client',
    header: 'Client',
    className: 'text-muted-foreground whitespace-nowrap',
    render: (c) => c.clientName,
  },
  {
    key: 'dealValue',
    header: 'Deal value',
    numeric: true,
    className: 'text-muted-foreground whitespace-nowrap',
    render: (c) => formatCurrency(c.dealValue, { compact: true }),
  },
  {
    key: 'rate',
    header: 'Rate',
    numeric: true,
    className: 'text-muted-foreground whitespace-nowrap',
    render: (c) => `${c.ratePct}%`,
  },
  {
    key: 'commission',
    header: 'Commission',
    numeric: true,
    className: 'font-bold text-primary whitespace-nowrap',
    render: (c) => formatCurrency(c.amount, { compact: true }),
  },
  {
    key: 'status',
    header: 'Status',
    className: 'whitespace-nowrap',
    render: (c) => {
      const status = statusConfig[c.status];
      return (
        <>
          <Badge variant={status.variant}>{status.label}</Badge>
          {c.status === 'void' && c.voidReason && (
            <span className="block text-xs text-muted-foreground mt-1">{c.voidReason}</span>
          )}
        </>
      );
    },
  },
  {
    key: 'earned',
    header: 'Earned',
    className: 'text-muted-foreground whitespace-nowrap',
    render: (c) => formatDate(c.earnedAt),
  },
];

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
      'Deal value',
      'Rate (%)',
      'Commission amount',
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
    link.download = `sureground-commissions-${new Date().toISOString().slice(0, 10)}.csv`;
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
      label: 'Deals closed',
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
      <PageHeader
        eyebrow="Work"
        title="Commissions"
        description="Earned when a sale settles, not when an offer is accepted"
        actions={
          isPro ? (
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
          ) : undefined
        }
      />

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

        <section>
          <h3 className="mb-3 text-sm font-semibold text-foreground">Earned commission</h3>
          <DataTable
            caption="Earned commission"
            columns={commissionColumns}
            data={commissions}
            getRowKey={(c) => c.id}
            emptyState={
              <EmptyState
                icon={Wallet}
                size="compact"
                title="No commission yet"
                description="It appears here once a sale you brokered settles and the buyer's money is released to the seller."
              />
            }
          />
        </section>

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
