'use client';

import dynamic from 'next/dynamic';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Download, RefreshCcw, BarChart3, Check } from 'lucide-react';
import { InvestmentStatsCards } from '@/components/owner/analytics/InvestmentStatsCards';
import {
  Button,
  Alert,
  Checkbox,
  Dialog,
  DialogContent,
  DialogTitle,
  Skeleton,
  TableSkeleton,
} from '@getrentos/ui';
import { ownerService } from '@/services/ownerService';
import { unwrap } from '@/lib/apiHelpers';
import { updateStoredUser } from '@/lib/authStorage';
import { getDashboardRoute } from '@/lib/constants/auth';
import { ownerKeys } from '@/lib/queryKeys';
import { formatCurrency } from '@/lib/format';
import type { InvestmentMetrics } from '@/types/owner';
import { usePlanTier } from '@/hooks/usePlanTier';
import { ProFeatureGate } from '@/components/shared/subscription/ProFeatureGate';

// recharts is heavy: load it only when the analytics page mounts.
const ROIComparisonChart = dynamic(
  () => import('@/components/owner/analytics/ROIComparisonChart').then((m) => m.ROIComparisonChart),
  {
    ssr: false,
    loading: () => <Skeleton className="h-64 rounded-xl" />,
  }
);

export default function OwnerAnalyticsPage() {
  const { isPro } = usePlanTier();
  const { data: metrics = [], isLoading: isLoadingMetrics } = useQuery({
    queryKey: ownerKeys.analytics,
    queryFn: () => unwrap(ownerService.getAnalyticsMetrics()),
    enabled: isPro,
  });
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [isComparing, setIsComparing] = useState(false);
  const [convertingProperty, setConvertingProperty] = useState<InvestmentMetrics | null>(null);
  const router = useRouter();
  const convert = useMutation({
    mutationFn: (propertyId: string) => unwrap(ownerService.convertToRental(propertyId)),
    // The workspace switcher reads roles from the saved user, so refresh them.
    onSuccess: (res) => updateStoredUser({ roles: res.roles }),
  });
  const closeConvert = () => {
    setConvertingProperty(null);
    convert.reset();
  };
  const openLandlordWorkspace = () => {
    updateStoredUser({ role: 'landlord' });
    router.push(getDashboardRoute('landlord'));
  };
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
        {isPro && (
          <div className="flex gap-2">
            <Button
              variant={isComparing ? 'primary' : 'outline'}
              onClick={() => setIsComparing((v) => !v)}
              aria-pressed={isComparing}
              icon={<BarChart3 className="w-4 h-4" />}
            >
              Compare
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setExported(true);
                window.setTimeout(() => setExported(false), 2500);
              }}
              icon={
                exported ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <Download className="w-4 h-4" />
                )
              }
            >
              {exported ? 'Exported' : 'Export'}
            </Button>
          </div>
        )}
      </div>

      <ProFeatureGate
        title="Investment analytics is a Pro feature"
        description="Upgrade to Pro to see ROI, appreciation, and rental yield across your portfolio, plus market comparables."
      >
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
            <div className="flex items-center justify-between gap-2 mb-3">
              <h3 className="text-sm font-semibold text-foreground">
                Comparing {compareMetrics.length} propert
                {compareMetrics.length === 1 ? 'y' : 'ies'}
              </h3>
              <Button variant="ghost" size="xs" onClick={() => setCompareIds([])}>
                Clear
              </Button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {compareMetrics.map((m) => (
                <div key={m.propertyId} className="bg-card rounded-xl p-3 border border-border">
                  <p className="text-sm font-medium text-foreground truncate">{m.propertyName}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Purchase: {formatCurrency(m.purchasePrice, { compact: true })}
                  </p>
                  <p className="text-xs text-muted-foreground">
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

        {isLoadingMetrics ? (
          <TableSkeleton rows={4} columns={6} />
        ) : (
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
                          <Checkbox
                            checked={compareIds.includes(m.propertyId)}
                            onCheckedChange={() => toggleCompare(m.propertyId)}
                            aria-label={`Compare ${m.propertyName}`}
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
                        className={`p-4 font-medium whitespace-nowrap ${m.appreciationRate >= 0 ? 'text-success' : 'text-destructive'}`}
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
                          className="text-muted-foreground"
                          onClick={() => setConvertingProperty(m)}
                          icon={<RefreshCcw className="w-3.5 h-3.5" />}
                        >
                          Rent it out
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {convertingProperty && (
          <Dialog open onOpenChange={(open) => !open && closeConvert()}>
            <DialogContent className="max-w-sm p-0">
              <div className="p-4 pr-12 border-b border-border">
                <DialogTitle className="font-semibold text-foreground">
                  {convert.isSuccess ? 'Ready to rent out' : 'Rent this property out'}
                </DialogTitle>
              </div>
              <div className="p-4 space-y-2">
                {convert.isSuccess ? (
                  <p className="text-sm text-muted-foreground">
                    <strong>{convertingProperty.propertyName}</strong> is in your landlord
                    workspace. Add units, list it for rent and find tenants there. Switch between
                    workspaces any time from your profile menu.
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Manage <strong>{convertingProperty.propertyName}</strong> as a rental from the
                    landlord workspace. Your account gets the landlord workspace alongside this one,
                    and any sale listing stays as it is.
                  </p>
                )}
                {convert.error ? (
                  <Alert variant="danger">
                    {convert.error instanceof Error
                      ? convert.error.message
                      : 'Could not set this up. Try again.'}
                  </Alert>
                ) : null}
              </div>
              <div className="p-4 border-t border-border flex gap-3">
                <Button variant="ghost" className="flex-1" onClick={closeConvert}>
                  {convert.isSuccess ? 'Stay here' : 'Cancel'}
                </Button>
                {convert.isSuccess ? (
                  <Button variant="primary" className="flex-1" onClick={openLandlordWorkspace}>
                    Open landlord workspace
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    className="flex-1"
                    isLoading={convert.isPending}
                    onClick={() => convert.mutate(convertingProperty.propertyId)}
                  >
                    Rent it out
                  </Button>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </ProFeatureGate>
    </>
  );
}
