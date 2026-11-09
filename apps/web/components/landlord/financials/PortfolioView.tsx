'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building2, Percent, PiggyBank, TrendingUp, Users } from 'lucide-react';
import {
  Alert,
  Button,
  DataTable,
  EmptyState,
  PageErrorState,
  Select,
  StatCard,
  StatGridSkeleton,
  TableSkeleton,
  PageHeader,
} from '@sureground/ui';
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

        <DataTable
          caption="Properties compared"
          minWidth="820px"
          data={rows}
          getRowKey={(row) => row.propertyId}
          columns={[
            {
              key: 'property',
              header: 'Property',
              render: (row) => {
                const standing =
                  row.propertyId === summary?.bestCapRatePropertyId
                    ? 'Highest cap rate'
                    : row.propertyId === summary?.weakestCapRatePropertyId
                      ? 'Lowest cap rate'
                      : null;
                return (
                  <>
                    <p className="font-medium text-foreground">{row.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.city}
                      {standing && (
                        <span className="ml-2 font-medium text-foreground">· {standing}</span>
                      )}
                    </p>
                  </>
                );
              },
            },
            {
              key: 'occupancy',
              header: 'Occupancy',
              numeric: true,
              render: (row) => (
                <>
                  {percent(row.occupancyRate)}
                  <p className="text-xs text-muted-foreground">
                    {row.occupiedUnits}/{row.totalUnits} units
                  </p>
                </>
              ),
            },
            {
              key: 'rentCollected',
              header: 'Rent collected',
              numeric: true,
              render: (row) => money(row.rentCollected),
            },
            {
              key: 'spent',
              header: 'Spent',
              numeric: true,
              render: (row) => money(row.operatingExpenses),
            },
            {
              key: 'netIncome',
              header: 'Net income',
              numeric: true,
              render: (row) => (
                <span
                  className={`font-medium ${
                    row.netOperatingIncome < 0 ? 'text-destructive' : 'text-foreground'
                  }`}
                >
                  {money(row.netOperatingIncome)}
                </span>
              ),
            },
            {
              key: 'capRate',
              header: 'Cap rate',
              numeric: true,
              render: (row) =>
                row.capRate === null ? (
                  <Button
                    variant="link"
                    onClick={() => setEditing(row)}
                    className="text-xs font-medium"
                  >
                    Add value
                  </Button>
                ) : (
                  <>
                    <span className="font-medium text-foreground">{percent(row.capRate)}</span>
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
                ),
            },
            {
              key: 'yieldOnCost',
              header: 'Yield on cost',
              numeric: true,
              render: (row) =>
                row.yieldOnCost === null ? (
                  <Button
                    variant="link"
                    onClick={() => setEditing(row)}
                    className="text-xs font-medium"
                  >
                    Add price
                  </Button>
                ) : (
                  percent(row.yieldOnCost)
                ),
            },
            {
              key: 'appreciation',
              header: 'Appreciation',
              numeric: true,
              render: (row) => percent(row.appreciation),
            },
          ]}
        />

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
      <PageHeader
        title="Portfolio"
        description={
          <>
            How each property earns, side by side. Figures cover the last{' '}
            {summary?.windowMonths ?? 12} months.
          </>
        }
      />

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
