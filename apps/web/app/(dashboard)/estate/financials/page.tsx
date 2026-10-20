'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { FileSpreadsheet, Check } from 'lucide-react';
import { Button, CardSkeleton, SegmentedControl } from '@getrentos/ui';
import { EstateFinancialStats } from '@/components/estate/financials/EstateFinancialStats';
import { EstateFinancialsChart } from '@/components/estate/financials/EstateFinancialsChart';
import {
  EstatePayoutAccountCard,
  EstateStatementsView,
} from '@/components/estate/financials/EstateStatementsView';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import { ROUTES } from '@/lib/constants/auth';
import { useSelectedEstate } from '@/app/(dashboard)/estate/layout';
import { useEstatePlan } from '@/hooks/useEstatePlan';
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
  const { isPro } = useEstatePlan();

  const { data: stats = EMPTY_STATS } = useQuery({
    queryKey: estateKeys.financialStats(estate?.id ?? '', period),
    queryFn: () => unwrap(estateService.getFinancialStats(estate!.id, period)),
    enabled: !!estate && isPro,
    placeholderData: keepPreviousData,
  });

  const exportMutation = useMutation({
    mutationFn: () => unwrap(estateService.exportFinancialsCsv(estate!.id)),
    onSuccess: () => {
      setExported(true);
      window.setTimeout(() => setExported(false), 2500);
    },
  });

  if (isEstateLoading) {
    return <CardSkeleton />;
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
            icon={
              exported ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <FileSpreadsheet className="w-3.5 h-3.5" />
              )
            }
            onClick={() => exportMutation.mutate()}
            isLoading={exportMutation.isPending}
          >
            {exported ? 'Exported' : 'Export CSV'}
          </Button>
        )}
      </div>

      <ProFeatureGate
        entitled={isPro}
        title="Financial reporting is a Pro feature"
        description="Upgrade to Pro to see dues collected, outstanding balances, and late fees by period, plus export your data as CSV."
      >
        <SegmentedControl
          aria-label="Report period"
          size="sm"
          className="mb-6"
          value={period}
          onValueChange={setPeriod}
          segments={periodOptions}
        />

        <EstateFinancialStats
          duesCollected={stats.duesCollected}
          duesOutstanding={stats.duesOutstanding}
          lateFeesCollected={stats.lateFeesCollected}
          householdsBilled={stats.householdsBilled}
        />

        <EstateFinancialsChart estateId={estate.id} />
      </ProFeatureGate>

      <div className="mt-10 pt-8 border-t border-border">
        <EstatePayoutAccountCard estateId={estate.id} />
        <EstateStatementsView estateId={estate.id} />
      </div>
    </>
  );
}
