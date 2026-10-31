'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building2, Percent, PiggyBank, TrendingUp, Users } from 'lucide-react';
import {
  Alert,
  Button,
  EmptyState,
  PageErrorState,
  Select,
  StatCard,
  StatGridSkeleton,
  TableSkeleton,
} from '@getrentos/ui';
import { PropertyValueModal } from '@/components/landlord/properties/PropertyValueModal';
import { ProFeatureGate } from '@/components/shared/subscription/ProFeatureGate';
import { usePlanTier } from '@/hooks/usePlanTier';
import { formatCurrency } from '@/lib/format';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';
import { landlordService } from '@/services/landlordService';
import { PortfolioBriefingCard } from '@/components/landlord/financials/PortfolioBriefingCard';
import type { PropertyPerformance } from '@/types/landlord';

type SortKey = 'netOperatingIncome' | 'capRate' | 'occupancyRate' | 'yieldOnCost';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'netOperatingIncome', label: 'Net income' },
  { value: 'capRate', label: 'Cap rate' },
  { value: 'yieldOnCost', label: 'Yield on cost' },
  { value: 'occupancyRate', label: 'Occupancy' },
];

const percent = (value: number | null) => (value === null ? '—' : `${value.toFixed(1)}%`);

/** Compact naira that copes with billions and with a loss. */
const money = (value: number): string => {
  const sign = value < 0 ? '-' : '';
  const amount = Math.abs(value);
  if (amount >= 1_000_000_000) return `${sign}₦${(amount / 1_000_000_000).toFixed(2)}B`;
  return `${sign}${formatCurrency(amount, { compact: true })}`;
};

const DEFINITIONS: { term: string; meaning: string }[] = [
  { term: 'Net income', meaning: 'Rent you collected minus what you spent on the property.' },
  {
    term: 'Cap rate',
    meaning: 'Net income for the year divided by what the property is worth today.',
  },
  { term: 'Yield on cost', meaning: 'Net income for the year divided by what you paid for it.' },
  {
    term: 'Appreciation',
    meaning: 'How much the property is worth now compared with what you paid.',
  },
];

export function PortfolioView() {
  const { isPro } = usePlanTier();
  const [sortKey, setSortKey] = useState<SortKey>('netOperatingIncome');
  const [editing, setEditing] = useState<PropertyPerformance | null>(null);

  const query = useQuery({
    queryKey: landlordKeys.portfolioAnalytics,
    queryFn: () => unwrap(landlordService.getPortfolioAnalytics()),
    enabled: isPro,
  });

  const summary = query.data?.summary;
  const rows = [...(query.data?.properties ?? [])].sort(
    (a, b) => (b[sortKey] ?? -Infinity) - (a[sortKey] ?? -Infinity)
  );
  const unvalued = rows.filter((row) => row.missing.includes('estimatedValue')).length;

  const cards = summary
    ? [
        {
          icon: PiggyBank,
          label: 'Net income',
          value: money(summary.netOperatingIncome),
          hint: `${money(summary.rentCollected)} collected, ${money(summary.operatingExpenses)} spent`,
        },
        {
          icon: Percent,
          label: 'Cap rate',
          value: percent(summary.capRate),
          hint:
            summary.capRate === null
              ? 'Add property values to see this'
              : `Across ${summary.valuedPropertyCount} of ${summary.propertyCount} properties with a value`,
        },
        {
          icon: TrendingUp,
          label: 'Yield on cost',
          value: percent(summary.yieldOnCost),
          hint:
            summary.yieldOnCost === null ? 'Add purchase prices to see this' : 'On what you paid',
        },
        {
          icon: Users,
          label: 'Occupancy',
          value: percent(summary.occupancyRate),
          hint: `${summary.occupiedUnits} of ${summary.totalUnits} units let`,
        },
      ]
    : [];

  let body;
  if (query.isPending) {
    body = (
      <>
        <StatGridSkeleton className="mb-6 grid-cols-2" />
        <TableSkeleton rows={4} columns={6} />
      </>
    );
  } else if (!query.data) {
    body = (
      <PageErrorState
        title="Portfolio figures are unavailable"
        description="We could not load how your properties are performing. Nothing has changed."
        onRetry={() => void query.refetch()}
        isRetrying={query.isFetching}
      />
    );
  } else if (rows.length === 0) {
    body = (
      <EmptyState
        icon={Building2}
        title="No properties to compare yet"
        description="Add a property and let a unit, and its performance will show up here."
      />
    );
  } else {
    body = (
      <>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {cards.map((card) => (
            <StatCard
              key={card.label}
              icon={card.icon}
              label={card.label}
              value={card.value}
              subtitle={card.hint}
            />
          ))}
        </div>

        {unvalued > 0 && (
          <Alert variant="warning" className="mb-4">
            {unvalued === 1 ? '1 property has' : `${unvalued} properties have`} no current value, so{' '}
            {unvalued === 1 ? 'it is' : 'they are'} left out of the cap rate. Use “Add value” in the
            table below.
          </Alert>
        )}

        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">Properties compared</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span aria-hidden="true">Sort by</span>
            <div className="w-40">
              <Select
                value={sortKey}
                onValueChange={(value) => setSortKey(value as SortKey)}
                options={SORT_OPTIONS}
                ariaLabel="Sort by"
                searchable={false}
                controlSize="sm"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Property</th>
                <th className="px-3 py-3 text-right font-medium">Occupancy</th>
                <th className="px-3 py-3 text-right font-medium">Rent collected</th>
                <th className="px-3 py-3 text-right font-medium">Spent</th>
                <th className="px-3 py-3 text-right font-medium">Net income</th>
                <th className="px-3 py-3 text-right font-medium">Cap rate</th>
                <th className="px-3 py-3 text-right font-medium">Yield on cost</th>
                <th className="px-3 py-3 text-right font-medium">Appreciation</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {rows.map((row) => {
                const standing =
                  row.propertyId === summary?.bestCapRatePropertyId
                    ? 'Highest cap rate'
                    : row.propertyId === summary?.weakestCapRatePropertyId
                      ? 'Lowest cap rate'
                      : null;
                return (
                  <tr key={row.propertyId} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{row.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {row.city}
                        {standing && (
                          <span className="ml-2 font-medium text-foreground">· {standing}</span>
                        )}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-right">
                      {percent(row.occupancyRate)}
                      <p className="text-xs text-muted-foreground">
                        {row.occupiedUnits}/{row.totalUnits} units
                      </p>
                    </td>
                    <td className="px-3 py-3 text-right">{money(row.rentCollected)}</td>
                    <td className="px-3 py-3 text-right">{money(row.operatingExpenses)}</td>
                    <td
                      className={`px-3 py-3 text-right font-medium ${
                        row.netOperatingIncome < 0 ? 'text-destructive' : 'text-foreground'
                      }`}
                    >
                      {money(row.netOperatingIncome)}
                    </td>
                    <td className="px-3 py-3 text-right">
                      {row.capRate === null ? (
                        <Button
                          variant="link"
                          onClick={() => setEditing(row)}
                          className="text-xs font-medium"
                        >
                          Add value
                        </Button>
                      ) : (
                        <>
                          <span className="font-medium text-foreground">
                            {percent(row.capRate)}
                          </span>
                          {row.capRateVsPortfolio !== null && (
                            <p
                              className={`text-xs ${
                                row.capRateVsPortfolio < 0 ? 'text-destructive' : 'text-success'
                              }`}
                            >
                              {row.capRateVsPortfolio > 0 ? '+' : ''}
                              {row.capRateVsPortfolio.toFixed(1)} pts vs portfolio
                            </p>
                          )}
                        </>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right">
                      {row.yieldOnCost === null ? (
                        <Button
                          variant="link"
                          onClick={() => setEditing(row)}
                          className="text-xs font-medium"
                        >
                          Add price
                        </Button>
                      ) : (
                        percent(row.yieldOnCost)
                      )}
                    </td>
                    <td className="px-3 py-3 text-right">{percent(row.appreciation)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <dl className="mt-6 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
          {DEFINITIONS.map((item) => (
            <div key={item.term}>
              <dt className="inline font-medium text-foreground">{item.term}: </dt>
              <dd className="inline text-muted-foreground">{item.meaning}</dd>
            </div>
          ))}
        </dl>
      </>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Portfolio</h1>
        <p className="text-muted-foreground mt-1">
          How each property earns, side by side. Figures cover the last{' '}
          {summary?.windowMonths ?? 12} months.
        </p>
      </div>

      <ProFeatureGate
        title="Portfolio analytics is a Pro feature"
        description="Upgrade to Pro to compare your properties by net income, cap rate, yield and occupancy."
      >
        <PortfolioBriefingCard />
        {body}
      </ProFeatureGate>

      <PropertyValueModal property={editing} onClose={() => setEditing(null)} />
    </>
  );
}
