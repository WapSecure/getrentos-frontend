'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { FileSpreadsheet, Check } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { EstateFinancialStats } from '@/components/estate/financials/EstateFinancialStats';
import { EstateFinancialsChart } from '@/components/estate/financials/EstateFinancialsChart';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import { ROUTES } from '@/lib/constants/auth';
import { useSelectedEstate } from '@/app/(dashboard)/estate/layout';
import { usePlanTier } from '@/hooks/usePlanTier';
import { ProFeatureGate } from '@/components/shared/subscription/ProFeatureGate';
import type { EstateFinancialStats as EstateFinancialStatsData } from '@/types/estate';

type ReportPeriod = 'monthly' | 'quarterly' | 'yearly';

const periodOptions: { value: ReportPeriod; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

const EMPTY_STATS: EstateFinancialStatsData = {
  duesCollected: 0,
  duesOutstanding: 0,
  lateFeesCollected: 0,
  householdsBilled: 0,
};

export default function EstateFinancialsPage() {
  const router = useRouter();
  const [period, setPeriod] = useState<ReportPeriod>('monthly');
  const [exported, setExported] = useState(false);
  const { estate, isLoading: isEstateLoading } = useSelectedEstate();
  const { isPro } = usePlanTier();

  const { data: stats = EMPTY_STATS } = useQuery({
    queryKey: estateKeys.financialStats(estate?.id ?? '', period),
    queryFn: () => unwrap(estateService.getFinancialStats(estate!.id, period)),
    enabled: !!estate && isPro,
  });

  const exportMutation = useMutation({
    mutationFn: () => unwrap(estateService.exportFinancialsCsv(estate!.id)),
    onSuccess: () => {
      setExported(true);
      window.setTimeout(() => setExported(false), 2500);
    },
  });

  if (isEstateLoading) {
    return <div className="h-32 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />;
  }

  if (!estate) {
    router.replace(ROUTES.ESTATE_SETUP);
    return null;
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Financials</h1>
          <p className="text-muted-foreground mt-1">
            Track dues collected, outstanding, and late fees for {estate.name}
          </p>
        </div>
        {isPro && (
          <Button
            variant="primary"
            size="sm"
            className="gap-1.5"
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending}
            isLoading={exportMutation.isPending}
          >
            {exported ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <FileSpreadsheet className="w-3.5 h-3.5" />
            )}
            {exported ? 'Exported' : 'Export CSV'}
          </Button>
        )}
      </div>

      <ProFeatureGate
        title="Financial reporting is a Pro feature"
        description="Upgrade to Pro to see dues collected, outstanding balances, and late fees by period, plus export your data as CSV."
      >
        <div className="flex gap-1 p-1 bg-secondary rounded-lg w-fit mb-6">
          {periodOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setPeriod(option.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                period === option.value
                  ? 'bg-card text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <EstateFinancialStats
          duesCollected={stats.duesCollected}
          duesOutstanding={stats.duesOutstanding}
          lateFeesCollected={stats.lateFeesCollected}
          householdsBilled={stats.householdsBilled}
        />

        <EstateFinancialsChart estateId={estate.id} />
      </ProFeatureGate>
    </>
  );
}
