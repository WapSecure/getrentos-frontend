'use client';

import { Building2, Tag, Wallet } from '@sureground/icons';
import { StatCard } from '@sureground/ui';
import type { InvestmentMetrics } from '@/types/owner';

interface InvestmentStatsCardsProps {
  metrics: InvestmentMetrics[];
}

const sum = (values: (number | null | undefined)[]) => {
  const recorded = values.filter((v): v is number => typeof v === 'number');
  return { total: recorded.reduce((acc, v) => acc + v, 0), count: recorded.length };
};

/** Totals of recorded figures only. No card shows a value we would have to estimate. */
export const InvestmentStatsCards = ({ metrics }: InvestmentStatsCardsProps) => {
  const invested = sum(metrics.map((m) => m.purchasePrice));
  const asking = sum(metrics.map((m) => m.askingPrice));

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      <StatCard icon={Building2} label="Properties" value={metrics.length} accent="blue" />
      <StatCard
        icon={Wallet}
        label="Total invested"
        value={invested.count ? invested.total : '—'}
        isCurrency
        accent="emerald"
        subtitle={
          invested.count
            ? `Purchase prices on ${invested.count} of ${metrics.length}`
            : 'No purchase prices recorded'
        }
      />
      <StatCard
        icon={Tag}
        label="Listed for sale"
        value={asking.count ? asking.total : '—'}
        isCurrency
        accent="primary"
        subtitle={
          asking.count
            ? `Asking prices on ${asking.count} sale listing${asking.count === 1 ? '' : 's'}`
            : 'No sale listings yet'
        }
      />
    </div>
  );
};
