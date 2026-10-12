'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Badge, PageErrorState } from '@getrentos/ui';
import { ArrowLeft, BadgeCheck, FileCheck2, MapPin, Receipt } from 'lucide-react';
import { unwrap } from '@/lib/apiHelpers';
import { formatCurrency } from '@/lib/format';
import { LAND_BUYER_ROUTES } from '@/lib/constants/landBuyerRoutes';
import { landLayoutKeys } from '@/lib/landSalesQueryKeys';
import { landLayoutService } from '@/services/landBuyerService';
import type { LandPlot } from '@/types/landBuyer';
import { PaymentPlanCard } from './PaymentPlanCard';
import { PlotGrid, PlotStatusLegend } from './PlotGrid';
import { PlotLayoutMap, hasPlotOutlines } from './PlotLayoutMap';
import { PlotReservePanel } from './PlotReservePanel';
import { plotLabel, quotePlot } from './landSaleLogic';

/** One estate: its facts, fees, plot map, plans and the reserve flow. */
export const LayoutDetailView = ({ layoutId }: { layoutId: string }) => {
  const searchParams = useSearchParams();
  const [chosenId, setChosenId] = useState<string | null>(null);
  const selectedId = chosenId ?? searchParams.get('plot');

  const {
    data: layout,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: landLayoutKeys.detail(layoutId),
    queryFn: () => unwrap(landLayoutService.get(layoutId)),
  });

  if (isLoading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="h-10 w-2/3 animate-pulse rounded-xl bg-secondary" />
        <div className="h-80 animate-pulse rounded-2xl bg-secondary" />
      </div>
    );
  }
  if (isError || !layout) {
    return (
      <PageErrorState
        title="This estate is not available"
        description={
          error instanceof Error
            ? error.message
            : 'It may have closed or its land is no longer verified.'
        }
        onRetry={() => refetch()}
        isRetrying={isRefetching}
      />
    );
  }

  const selected = layout.plots.find((p) => p.id === selectedId) ?? null;
  const select = (plot: LandPlot) => setChosenId(plot.id);
  const showMap = hasPlotOutlines(layout.plots);

  return (
    <div className="space-y-10">
      <div>
        <Link
          href={LAND_BUYER_ROUTES.LAYOUTS}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> All estates
        </Link>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge variant="success" icon={<BadgeCheck className="h-3.5 w-3.5" />}>
            Verified master parcel
          </Badge>
          {layout.layoutApprovalReference && (
            <Badge variant="info" icon={<FileCheck2 className="h-3.5 w-3.5" />}>
              Layout approval {layout.layoutApprovalReference}
            </Badge>
          )}
        </div>
        <h1 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-foreground sm:text-4xl">
          {layout.name}
        </h1>
        <p className="mt-2 flex items-center gap-1.5 text-muted-foreground">
          <MapPin className="h-4 w-4" aria-hidden />
          {layout.city}, {layout.state} · on {layout.propertyTitle}
        </p>
        {layout.description && (
          <p className="mt-4 max-w-3xl whitespace-pre-line text-muted-foreground">
            {layout.description}
          </p>
        )}
        <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat
            label="Plots available"
            value={`${layout.availablePlots} of ${layout.totalPlots}`}
          />
          <Stat
            label="Prices"
            value={
              layout.priceFrom !== undefined
                ? layout.priceTo !== undefined && layout.priceTo !== layout.priceFrom
                  ? `${formatCurrency(layout.priceFrom, { compact: true })} – ${formatCurrency(layout.priceTo, { compact: true })}`
                  : formatCurrency(layout.priceFrom)
                : 'Sold out'
            }
          />
          <Stat label="Reservation hold" value={`${layout.reservationHoldHours} hours`} />
          <Stat label="Fees per plot" value={formatCurrency(layout.fees.total)} />
        </dl>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section aria-labelledby="plots-heading" className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 id="plots-heading" className="text-xl font-semibold text-foreground">
              Plots
            </h2>
            <PlotStatusLegend />
          </div>
          {showMap && (
            <PlotLayoutMap plots={layout.plots} selectedId={selected?.id} onSelect={select} />
          )}
          <PlotGrid plots={layout.plots} selectedId={selected?.id} onSelect={select} />
        </section>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <PlotReservePanel layout={layout} plot={selected} />
          <FeesCard fees={layout.fees} />
        </aside>
      </div>

      <section aria-labelledby="plans-heading" className="space-y-4">
        <div>
          <h2 id="plans-heading" className="text-xl font-semibold text-foreground">
            Payment plans
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {selected
              ? `Worked for ${plotLabel(selected)}.`
              : 'Worked on the cheapest available plot. Choose a plot to see its own figures.'}
          </p>
        </div>
        {layout.paymentPlans.length === 0 ? (
          <p className="text-sm text-muted-foreground">No payment plan is open on this estate.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {layout.paymentPlans.map((plan) => (
              <PaymentPlanCard
                key={plan.id}
                plan={plan}
                quote={selected ? quotePlot(selected.price, layout.fees.total, plan) : null}
                quoteLabel={selected ? `For ${plotLabel(selected)}` : undefined}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl border border-border bg-card p-3">
    <dt className="text-xs text-muted-foreground">{label}</dt>
    <dd className="mt-1 font-semibold text-foreground">{value}</dd>
  </div>
);

const FeesCard = ({
  fees,
}: {
  fees: { documentationFee: number; surveyFee: number; developmentLevy: number; total: number };
}) => (
  <section aria-labelledby="fees-heading" className="rounded-2xl border border-border bg-card p-5">
    <h2 id="fees-heading" className="flex items-center gap-2 font-semibold text-foreground">
      <Receipt className="h-4 w-4 text-primary" aria-hidden /> Fees on every plot
    </h2>
    <dl className="mt-3 space-y-1.5 text-sm">
      {[
        ['Documentation', fees.documentationFee],
        ['Survey', fees.surveyFee],
        ['Development levy', fees.developmentLevy],
      ].map(([label, amount]) => (
        <div key={label} className="flex justify-between gap-3">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="text-foreground">{formatCurrency(Number(amount))}</dd>
        </div>
      ))}
      <div className="flex justify-between gap-3 border-t border-border pt-1.5 font-semibold">
        <dt className="text-foreground">Total</dt>
        <dd className="text-foreground">{formatCurrency(fees.total)}</dd>
      </div>
    </dl>
    <p className="mt-2 text-xs text-muted-foreground">Due with the deposit on every plan.</p>
  </section>
);
