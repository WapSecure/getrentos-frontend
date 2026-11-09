'use client';

import { RedirectToEstateSetup } from '@/components/estate/shared/RedirectToEstateSetup';
import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Button, CardSkeleton, Select, PageHeader } from '@sureground/ui';
import { tierAtLeast } from '@sureground/shared';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import { useSelectedEstate } from '@/app/(dashboard)/estate/layout';
import { EstateFeatureGate } from '@/components/estate/shared/EstateFeatureGate';
import { OnSiteBoard } from '@/components/estate/dwell/OnSiteBoard';
import { AuthorisationDwellPanel } from '@/components/estate/dwell/AuthorisationDwellPanel';

const BOARD_POLL_MS = 30_000;

const DAY_MS = 24 * 60 * 60_000;

const RANGE_OPTIONS = [
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: '365', label: 'Last 12 months' },
];

const SORT_OPTIONS = [
  { value: 'dwell', label: 'Longest stays first' },
  { value: 'visits', label: 'Most visits first' },
];

const windowStart = (days: string) => new Date(Date.now() - Number(days) * DAY_MS).toISOString();

export default function EstateDwellPage() {
  const { estate, isLoading: isEstateLoading } = useSelectedEstate();
  const [rangeDays, setRangeDays] = useState('30');
  const [sort, setSort] = useState<'dwell' | 'visits'>('dwell');

  // Held in state, not derived in render: the window is in the query key, so a fresh Date each render would refetch forever.
  const [from, setFrom] = useState(() => windowStart('30'));

  const selectRange = (days: string) => {
    setRangeDays(days);
    setFrom(windowStart(days));
  };

  // Skip the API on a known shortfall; an unknown tier still asks, since an absent plan fails open.
  const entitled = !estate?.planTier || tierAtLeast(estate.planTier, 'ENTERPRISE');

  const boardQuery = useQuery({
    queryKey: estateKeys.onSiteBoard(estate?.id ?? ''),
    queryFn: () => unwrap(estateService.getOnSiteBoard(estate!.id)),
    enabled: !!estate && entitled,
    refetchInterval: (query) => (query.state.data?.entries.length ? BOARD_POLL_MS : false),
  });

  const reportQuery = useQuery({
    queryKey: estateKeys.authorisationDwell(estate?.id ?? '', from, undefined, sort),
    queryFn: () => unwrap(estateService.getAuthorisationDwell(estate!.id, { from, sort })),
    enabled: !!estate && entitled,
    placeholderData: keepPreviousData,
  });

  if (isEstateLoading) {
    return <CardSkeleton />;
  }

  if (!estate) return <RedirectToEstateSetup />;

  const refusal = boardQuery.error ?? reportQuery.error;

  return (
    <EstateFeatureGate feature="Dwell analytics" error={refusal}>
      <>
        <PageHeader
          title="Dwell analytics"
          description={<>Who is still inside, and how long visits run at {estate.name}</>}
          actions={
            <Button
              variant="secondary"
              className="gap-2"
              isLoading={boardQuery.isFetching}
              loadingText="Refreshing…"
              onClick={() => {
                void boardQuery.refetch();
                void reportQuery.refetch();
              }}
            >
              Refresh now
            </Button>
          }
        />

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-foreground mb-1">Still inside</h2>
          <p className="text-sm text-muted-foreground mb-4">
            The gate console knows who went in. This is the other half of the same question: who
            never came back out: and it is where a visit that has outstayed the estate&rsquo;s own
            authorisation shows up.
          </p>
          <OnSiteBoard board={boardQuery.data} isLoading={boardQuery.isLoading} />
        </section>

        <section>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-1">
            <h2 className="text-lg font-semibold text-foreground">How long visits run</h2>
            <div className="flex flex-wrap gap-2">
              <div className="w-40">
                <Select
                  value={rangeDays}
                  onValueChange={selectRange}
                  options={RANGE_OPTIONS}
                  ariaLabel="Period"
                />
              </div>
              <div className="w-48">
                <Select
                  value={sort}
                  onValueChange={(value) => setSort(value as 'dwell' | 'visits')}
                  options={SORT_OPTIONS}
                  ariaLabel="Sort order"
                />
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Measured per standing authorisation, because that is where the estate wrote down what it
            expected: &ldquo;Tuesdays until 17:00&rdquo; is a rule, and a visit that ran to midnight
            is a fact about it.
          </p>
          <AuthorisationDwellPanel report={reportQuery.data} isLoading={reportQuery.isLoading} />
        </section>
      </>
    </EstateFeatureGate>
  );
}
