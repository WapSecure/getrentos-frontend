'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Clock3,
  Coins,
  Landmark,
  Receipt,
  ShieldAlert,
  Wallet,
} from 'lucide-react';
import { PageErrorState, PageLoadingState, StatCard } from '@getrentos/ui';
import { unwrap } from '@getrentos/shared';
import { adminKeys } from '@/lib/queryKeys';
import { adminRentFinanceService } from '@/services/adminRentFinanceService';
import type { AdminRentFinanceOverview as OverviewData } from '@/types/rentFinance';

const EMPTY: OverviewData = {
  totalPayments: 0,
  collectedCount: 0,
  collectedAmount: 0,
  heldEscrowCount: 0,
  heldEscrowAmount: 0,
  dueForSettlementCount: 0,
  dueForSettlementAmount: 0,
  pendingReviewCount: 0,
  pendingReviewAmount: 0,
  frozenCount: 0,
  frozenAmount: 0,
  releasedCount: 0,
  releasedAmount: 0,
  arrearsCount: 0,
  arrearsAmount: 0,
};

const naira = (value: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(value);

const modules = [
  {
    label: 'Payments',
    description: 'Rent payment ledger & escrow actions',
    href: '/admin/rent-finance/payments',
    icon: Wallet,
  },
  {
    label: 'Arrears',
    description: 'Live unpaid + past-due ledger',
    href: '/admin/rent-finance/arrears',
    icon: AlertTriangle,
  },
  {
    label: 'Owner statements',
    description: 'Statement register & line items',
    href: '/admin/rent-finance/statements',
    icon: Receipt,
  },
  {
    label: 'Payout accounts',
    description: 'Landlord disbursement readiness',
    href: '/admin/rent-finance/payout-accounts',
    icon: Landmark,
  },
  {
    label: 'Expenses',
    description: 'Property expense ledger',
    href: '/admin/rent-finance/expenses',
    icon: Coins,
  },
] as const;

export const AdminRentFinanceOverview = () => {
  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: adminKeys.rentFinanceOverview,
    queryFn: () => unwrap(adminRentFinanceService.overview()),
  });

  if (isLoading) return <PageLoadingState />;

  if (isError) {
    return (
      <PageErrorState
        title="Could not load rent finance"
        description="Payment and settlement totals are temporarily unavailable. No financial values are being estimated."
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    );
  }

  const stats = data ?? EMPTY;

  return (
    <div className="space-y-6">
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-accent/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-accent-foreground">
          <Wallet className="h-3 w-3" />
          Rent Finance
        </span>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-foreground">
          Rent payments, escrow &amp; reconciliation
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Platform-wide rent collections, escrow holds, settlement readiness and landlord payouts.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          icon={Coins}
          label={`Collected (${stats.collectedCount} payments)`}
          value={naira(stats.collectedAmount)}
          accent="green"
          delay={0}
        />
        <StatCard
          icon={Landmark}
          label={`Held escrow (${stats.heldEscrowCount})`}
          value={naira(stats.heldEscrowAmount)}
          accent="blue"
          delay={0.05}
        />
        <StatCard
          icon={Clock3}
          label={`Due for settlement (${stats.dueForSettlementCount})`}
          value={naira(stats.dueForSettlementAmount)}
          accent="orange"
          delay={0.1}
        />
        <StatCard
          icon={AlertTriangle}
          label={`Arrears (${stats.arrearsCount})`}
          value={naira(stats.arrearsAmount)}
          accent="red"
          delay={0.15}
        />
        <StatCard
          icon={ShieldAlert}
          label={`Under review (${stats.pendingReviewCount})`}
          value={naira(stats.pendingReviewAmount)}
          accent="purple"
          delay={0.2}
        />
        <StatCard
          icon={BadgeCheck}
          label={`Released to landlords (${stats.releasedCount})`}
          value={naira(stats.releasedAmount)}
          accent="emerald"
          delay={0.25}
        />
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold tracking-[-0.01em] text-foreground">
            Finance work queues
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Review collections, settle due escrow and reconcile owner payouts. Each queue can be
            exported to CSV.
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
