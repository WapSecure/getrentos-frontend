'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { FileSpreadsheet, Check } from 'lucide-react';
import { FinancialStats } from '@/components/landlord/financials/FinancialStats';
import { FinancialChart } from '@/components/landlord/financials/FinancialChart';
import { Button } from '@/components/ui/Button';
import {
  landlordService,
  type FinancialStats as FinancialStatsData,
} from '@/services/landlordService';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';

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

export default function LandlordFinancialsPage() {
  const [period, setPeriod] = useState<ReportPeriod>('monthly');
  const [exported, setExported] = useState(false);

  const { data: stats = EMPTY_STATS } = useQuery({
    queryKey: landlordKeys.financialStats(period),
    queryFn: () => unwrap(landlordService.getFinancialStats(period)),
  });

  const { data: chartData = [] } = useQuery({
    queryKey: landlordKeys.financialChart,
    queryFn: () => unwrap(landlordService.getFinancialChart()),
  });

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
        <div className="flex gap-2">
          <Button
            variant="primary"
            size="sm"
            className="gap-1.5"
            onClick={handleExport}
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
        </div>
      </div>

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

      <FinancialStats
        rentalIncome={rentalIncome}
        outstandingRent={outstandingRent}
        maintenanceCosts={maintenanceCosts}
        netProfit={netProfit}
      />

      <FinancialChart data={chartData} />
    </>
  );
}
