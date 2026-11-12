'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Download, RefreshCcw, BarChart3, Building2, Check } from '@sureground/icons';
import { InvestmentStatsCards } from '@/components/owner/analytics/InvestmentStatsCards';
import {
  Button,
  Alert,
  Checkbox,
  DataTable,
  Dialog,
  DialogContent,
  DialogTitle,
  EmptyState,
  TableSkeleton,
  PageHeader,
  type Column,
} from '@sureground/ui';
import { ownerService } from '@/services/ownerService';
import { unwrap } from '@/lib/apiHelpers';
import { updateStoredUser } from '@/lib/authStorage';
import { getDashboardRoute } from '@/lib/constants/auth';
import { ownerKeys } from '@/lib/queryKeys';
import { formatCurrency } from '@/lib/format';
import type { InvestmentMetrics } from '@/types/owner';
import { usePlanTier } from '@/hooks/usePlanTier';
import { ProFeatureGate } from '@/components/shared/subscription/ProFeatureGate';

const money = (amount: number | null | undefined) =>
  typeof amount === 'number' ? formatCurrency(amount, { compact: true }) : null;
const percent = (value: number | null | undefined) =>
  typeof value === 'number' ? `${value.toFixed(1)}%` : '—';

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

  const compareMetrics = metrics.filter((m) => compareIds.includes(m.propertyId));

  const columns: Column<InvestmentMetrics>[] = [
    ...(isComparing
      ? [
          {
            key: 'compare',
            header: '',
            srHeader: 'Compare',
            className: 'w-10',
            render: (m: InvestmentMetrics) => (
              <Checkbox
                checked={compareIds.includes(m.propertyId)}
                onCheckedChange={() => toggleCompare(m.propertyId)}
                aria-label={`Compare ${m.propertyName}`}
              />
            ),
          },
        ]
      : []),
    {
      key: 'property',
      header: 'Property',
      className: 'font-medium text-foreground whitespace-nowrap',
      render: (m) => m.propertyName,
    },
    {
      key: 'purchasePrice',
      header: 'Purchase price',
      numeric: true,
      className: 'text-muted-foreground whitespace-nowrap',
      render: (m) => money(m.purchasePrice) ?? 'No price recorded',
    },
    {
      key: 'askingPrice',
      header: 'Asking price',
      numeric: true,
      className: 'text-muted-foreground whitespace-nowrap',
      render: (m) => money(m.askingPrice) ?? 'Not listed',
    },
    {
      key: 'rentalYield',
      header: 'Net yield (12 months)',
      numeric: true,
      className: 'font-medium text-foreground whitespace-nowrap',
      render: (m) => percent(m.rentalYield),
    },
    {
      key: 'actions',
      header: '',
      srHeader: 'Actions',
      align: 'right',
      render: (m) => (
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={() => setConvertingProperty(m)}
          icon={<RefreshCcw className="w-3.5 h-3.5" />}
        >
          Rent it out
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Investment analytics"
        description="Figures from your records. We don't estimate property value yet."
        actions={
          isPro ? (
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
          ) : undefined
        }
      />

      <ProFeatureGate
        title="Investment analytics is a Pro feature"
        description="Upgrade to Pro to see purchase prices, asking prices and rental yield across your portfolio, plus market comparables."
      >
        <InvestmentStatsCards metrics={metrics} />

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
                    Purchase: {money(m.purchasePrice) ?? 'No price recorded'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Asking: {money(m.askingPrice) ?? 'Not listed'}
                  </p>
                  <p className="text-sm font-semibold text-foreground mt-1">
                    Net rental yield {percent(m.rentalYield)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {isLoadingMetrics ? (
          <TableSkeleton rows={4} columns={4} />
        ) : (
          <DataTable
            caption="Investment performance by property"
            columns={columns}
            data={metrics}
            getRowKey={(m) => m.propertyId}
            emptyState={
              <EmptyState
                icon={Building2}
                title="No properties yet"
                description="Add a property and its purchase price to see it here."
              />
            }
          />
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
