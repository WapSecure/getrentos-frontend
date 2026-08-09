'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, Check } from 'lucide-react';
import { FinancialStats } from '@/components/landlord/financials/FinancialStats';
import { FinancialChart } from '@/components/landlord/financials/FinancialChart';
import { Button } from '@/components/ui/Button';

type ReportPeriod = 'monthly' | 'quarterly' | 'yearly';

const periodOptions: { value: ReportPeriod; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

export default function LandlordFinancialsPage() {
  const [period, setPeriod] = useState<ReportPeriod>('monthly');
  const [exportedFormat, setExportedFormat] = useState<'csv' | 'pdf' | null>(null);

  const handleExport = (format: 'csv' | 'pdf') => {
    setExportedFormat(format);
    window.setTimeout(() => setExportedFormat(null), 2500);
  };

  // Mock values scale slightly with the selected reporting period for realism
  const periodMultiplier = period === 'monthly' ? 1 : period === 'quarterly' ? 3 : 12;
  const rentalIncome = 3_750_000 * periodMultiplier;
  const outstandingRent = 380_000;
  const maintenanceCosts = 705_000 * periodMultiplier;
  const netProfit = rentalIncome - maintenanceCosts;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Financials</h1>
          <p className="text-muted-foreground mt-1">Track income, expenses, and profitability</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => handleExport('csv')}
          >
            {exportedFormat === 'csv' ? (
              <Check className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <FileSpreadsheet className="w-3.5 h-3.5" />
            )}
            {exportedFormat === 'csv' ? 'Exported' : 'Export CSV'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="gap-1.5"
            onClick={() => handleExport('pdf')}
          >
            {exportedFormat === 'pdf' ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            {exportedFormat === 'pdf' ? 'Downloaded' : 'Download PDF'}
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

      <FinancialChart />
    </>
  );
}
