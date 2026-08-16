'use client';

import { LegacyInput } from '@getrentos/ui';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, RefreshCcw, BarChart3, X, Check } from 'lucide-react';
import { InvestmentStatsCards } from '@/components/owner/analytics/InvestmentStatsCards';
import { ROIComparisonChart } from '@/components/owner/analytics/ROIComparisonChart';
import { Button } from '@getrentos/ui';
import { ownerService } from '@/services/ownerService';
import { unwrap } from '@/lib/apiHelpers';
import { ownerKeys } from '@/lib/queryKeys';
import { formatCurrency } from '@/lib/format';
import type { InvestmentMetrics } from '@/types/owner';

export default function OwnerAnalyticsPage() {
  const { data: metrics = [] } = useQuery({
    queryKey: ownerKeys.analytics,
    queryFn: () => unwrap(ownerService.getAnalyticsMetrics()),
  });
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [isComparing, setIsComparing] = useState(false);
  const [convertingProperty, setConvertingProperty] = useState<InvestmentMetrics | null>(null);
  const [exported, setExported] = useState(false);

  const toggleCompare = (propertyId: string) => {
    setCompareIds((prev) =>
      prev.includes(propertyId) ? prev.filter((id) => id !== propertyId) : [...prev, propertyId]
    );
  };

  const totalInvested = metrics.reduce((sum, m) => sum + m.purchasePrice, 0);
  const totalCurrentValue = metrics.reduce((sum, m) => sum + m.currentValue, 0);
  const avgAppreciationRate = metrics.length
    ? metrics.reduce((sum, m) => sum + m.appreciationRate, 0) / metrics.length
    : 0;
  const avgRoiPercentage = metrics.length
    ? metrics.reduce((sum, m) => sum + m.roiPercentage, 0) / metrics.length
    : 0;

  const compareMetrics = metrics.filter((m) => compareIds.includes(m.propertyId));

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Investment Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Performance and ROI across your property portfolio
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={isComparing ? 'primary' : 'outline'}
            className="gap-2"
            onClick={() => setIsComparing((v) => !v)}
          >
            <BarChart3 className="w-4 h-4" />
            Compare
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              setExported(true);
              window.setTimeout(() => setExported(false), 2500);
            }}
          >
            {exported ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {exported ? 'Exported' : 'Export'}
          </Button>
        </div>
      </div>

      <InvestmentStatsCards
        totalInvested={totalInvested}
        totalCurrentValue={totalCurrentValue}
        avgAppreciationRate={avgAppreciationRate}
        avgRoiPercentage={avgRoiPercentage}
      />

      <div className="mb-6">
        <ROIComparisonChart metrics={metrics} />
      </div>

      {isComparing && compareMetrics.length > 0 && (
        <div className="mb-6 bg-accent border border-primary/30 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">
              Comparing {compareMetrics.length} propert
              {compareMetrics.length === 1 ? 'y' : 'ies'}
            </h3>
            <button
              onClick={() => setCompareIds([])}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {compareMetrics.map((m) => (
              <div key={m.propertyId} className="bg-card rounded-xl p-3 border border-border">
                <p className="text-sm font-medium text-foreground truncate">{m.propertyName}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Purchase: {formatCurrency(m.purchasePrice, { compact: true })}
                </p>
                <p className="text-xs text-gray-400">
                  Current: {formatCurrency(m.currentValue, { compact: true })}
                </p>
                <p className="text-sm font-bold text-primary mt-1">
                  {m.roiPercentage.toFixed(1)}% ROI
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                {isComparing && <th className="p-4 font-medium w-10"></th>}
                <th className="p-4 font-medium">Property</th>
                <th className="p-4 font-medium">Purchase Price</th>
                <th className="p-4 font-medium">Current Value</th>
                <th className="p-4 font-medium">Appreciation</th>
                <th className="p-4 font-medium">Rental Yield</th>
                <th className="p-4 font-medium">ROI</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {metrics.map((m) => (
                <tr key={m.propertyId} className="hover:bg-secondary transition-colors">
                  {isComparing && (
                    <td className="p-4">
                      <LegacyInput
                        type="checkbox"
                        checked={compareIds.includes(m.propertyId)}
                        onChange={() => toggleCompare(m.propertyId)}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                      />
                    </td>
                  )}
                  <td className="p-4 font-medium text-foreground whitespace-nowrap">
                    {m.propertyName}
                  </td>
                  <td className="p-4 text-muted-foreground whitespace-nowrap">
                    {formatCurrency(m.purchasePrice, { compact: true })}
                  </td>
                  <td className="p-4 text-muted-foreground whitespace-nowrap">
                    {formatCurrency(m.currentValue, { compact: true })}
                  </td>
                  <td
                    className={`p-4 font-medium whitespace-nowrap ${m.appreciationRate >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                  >
                    {m.appreciationRate >= 0 ? '+' : ''}
                    {m.appreciationRate.toFixed(1)}%
                  </td>
                  <td className="p-4 text-muted-foreground whitespace-nowrap">
                    {m.rentalYield !== undefined ? `${m.rentalYield.toFixed(1)}%` : '—'}
                  </td>
                  <td className="p-4 font-bold text-primary whitespace-nowrap">
                    {m.roiPercentage.toFixed(1)}%
                  </td>
                  <td className="p-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-gray-500"
                      onClick={() => setConvertingProperty(m)}
                    >
                      <RefreshCcw className="w-3.5 h-3.5" />
                      Convert to Rental
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {convertingProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card rounded-xl max-w-sm w-full overflow-hidden">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h3 className="font-semibold text-foreground">Convert to Rental</h3>
              <button
                onClick={() => setConvertingProperty(null)}
                className="p-1 rounded-lg hover:bg-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">
              <p className="text-sm text-muted-foreground">
                Convert <strong>{convertingProperty.propertyName}</strong> into a rental listing?
                This will make the property available to manage under your Landlord workspace,
                alongside any active sale listing.
              </p>
            </div>
            <div className="p-4 border-t border-border flex gap-3">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => setConvertingProperty(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => setConvertingProperty(null)}
              >
                Convert
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
