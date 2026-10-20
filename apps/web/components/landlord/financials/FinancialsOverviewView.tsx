'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { keepPreviousData, useQuery, useMutation } from '@tanstack/react-query';
import { FileSpreadsheet, Check } from 'lucide-react';
import { FinancialStats } from '@/components/landlord/financials/FinancialStats';
import { ExpensesPanel } from '@/components/landlord/financials/ExpensesPanel';
import { Button, Skeleton, StatGridSkeleton, Tabs, TabsList, TabsTrigger } from '@getrentos/ui';
import {
  landlordService,
  type FinancialStats as FinancialStatsData,
} from '@/services/landlordService';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';
import { usePlanTier } from '@/hooks/usePlanTier';
import { ProFeatureGate } from '@/components/shared/subscription/ProFeatureGate';

// recharts is heavy: load it only when the financials tab is rendered.
const FinancialChart = dynamic(
  () => import('@/components/landlord/financials/FinancialChart').then((m) => m.FinancialChart),
  {
    ssr: false,
    loading: () => <Skeleton className="h-64 w-full rounded-xl" />,
  }
);

type ReportPeriod = 'monthly' | 'quarterly' | 'yearly';

const periodOptions: { value: ReportPeriod; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

const EMPTY_STATS: FinancialStatsData = {
  rentalIncome: 0,
  outstandingRent: 0,
  maintenanceCosts: 0,
  netProfit: 0,
};

export function FinancialsOverviewView() {
  const [period, setPeriod] = useState<ReportPeriod>('monthly');
  const [exported, setExported] = useState(false);
  const { isPro } = usePlanTier();

  const { data: stats = EMPTY_STATS, isLoading: statsLoading } = useQuery({
    queryKey: landlordKeys.financialStats(period),
    queryFn: () => unwrap(landlordService.getFinancialStats(period)),
    enabled: isPro,
    placeholderData: keepPreviousData,
  });

  const { data: chartData = [] } = useQuery({
    queryKey: landlordKeys.financialChart,
    queryFn: () => unwrap(landlordService.getFinancialChart()),
    enabled: isPro,
  });

  const { data: propertiesData } = useQuery({
    queryKey: [...landlordKeys.properties, { page: 1, pageSize: 100 }],
    queryFn: () => unwrap(landlordService.listProperties({ page: 1, pageSize: 100 })),
  });
  const properties = propertiesData?.items ?? [];

  const exportMutation = useMutation({
    mutationFn: () => unwrap(landlordService.exportFinancialsCsv()),
    onSuccess: () => {
      setExported(true);
      window.setTimeout(() => setExported(false), 2500);
    },
  });

  const handleExport = () => exportMutation.mutate();

  const { rentalIncome, outstandingRent, maintenanceCosts, netProfit } = stats;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Financials</h1>
          <p className="text-muted-foreground mt-1">Track income, expenses, and profitability</p>
        </div>
        {isPro && (
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              className="gap-1.5"
              onClick={handleExport}
              isLoading={exportMutation.isPending}
            >
              {exported ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <FileSpreadsheet className="w-3.5 h-3.5" />
              )}
              {exported ? 'Exported' : 'Export CSV'}
            </Button>
          </div>
        )}
      </div>

      <ProFeatureGate
        title="Financial analytics is a Pro feature"
        description="Upgrade to Pro to see income, expenses, profitability trends, and export your data as CSV."
      >
        <Tabs
          value={period}
          onValueChange={(value) => setPeriod(value as ReportPeriod)}
          className="mb-6"
        >
          <TabsList>
            {periodOptions.map((option) => (
              <TabsTrigger key={option.value} value={option.value}>
                {option.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {statsLoading ? (
          <StatGridSkeleton className="mb-6 grid-cols-2" />
        ) : (
          <FinancialStats
            rentalIncome={rentalIncome}
            outstandingRent={outstandingRent}
            maintenanceCosts={maintenanceCosts}
            netProfit={netProfit}
          />
        )}

        <FinancialChart data={chartData} />
      </ProFeatureGate>

      <ExpensesPanel properties={properties} />
    </>
  );
}
