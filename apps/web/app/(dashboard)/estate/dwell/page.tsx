'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Button, Select } from '@getrentos/ui';
import { tierAtLeast } from '@getrentos/shared';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import { ROUTES } from '@/lib/constants/auth';
import { useSelectedEstate } from '@/app/(dashboard)/estate/layout';
import { EstateFeatureGate } from '@/components/estate/shared/EstateFeatureGate';
import { OnSiteBoard } from '@/components/estate/dwell/OnSiteBoard';
import { AuthorisationDwellPanel } from '@/components/estate/dwell/AuthorisationDwellPanel';

/**
 * How often the on-site board re-reads itself.
 *
 * Longer than the gate console's fifteen seconds and deliberately so: this screen
 * is watched while something is being decided, not while somebody is standing at
 * a barrier, and a visit's elapsed time changes by the minute at most. Half a
 * minute keeps the numbers honest without making the office a load generator.
 */
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

/**
 * Dwell analytics: who is still inside, and how long visits actually run.
 *
 * ENTERPRISE, and the only feature in this programme that is — the gating rule in
 * `docs/estate-gate-programme.md` is that an estate without it makes slower
 * decisions, where an estate without the watchlist or mustering admits somebody
 * it banned or loses track of who was in the building. That is why this is the
 * page with an upsell on it and those two are not.
 *
 * Two halves on one screen because they answer the same question at different
 * distances: the board is now, and the report is the period somebody is deciding
 * about. A manager never needs one without being one click from the other.
 */
export default function EstateDwellPage() {
  const router = useRouter();
  const { estate, isLoading: isEstateLoading } = useSelectedEstate();
  const [rangeDays, setRangeDays] = useState('30');
  const [sort, setSort] = useState<'dwell' | 'visits'>('dwell');

  /**
   * Held in state beside the range rather than derived during render.
   *
   * `new Date(Date.now() - n)` in the render body produces a different instant
   * every time, and it is in the query key — so react-query would see a brand new
   * window on each render and fetch forever. The pair only moves when the manager
   * picks a different range, which is exactly when it should.
   */
  const [from, setFrom] = useState(() => windowStart('30'));

  const selectRange = (days: string) => {
    setRangeDays(days);
    setFrom(windowStart(days));
  };

  /**
   * Whether it is worth asking the API at all.
   *
   * A known shortfall is not worth two guaranteed 403s on every visit — and in a
   * browser console they are two red errors that make a real one harder to spot.
   * An UNKNOWN tier is not a shortfall, so it still asks: the rule everywhere in
   * this codebase is that an absent plan fails open, and the gate then shows the
   * upsell from whatever the API refuses with.
   */
  const entitled = !estate?.planTier || tierAtLeast(estate.planTier, 'ENTERPRISE');

  const boardQuery = useQuery({
    queryKey: estateKeys.onSiteBoard(estate?.id ?? ''),
    queryFn: () => unwrap(estateService.getOnSiteBoard(estate!.id)),
    enabled: !!estate && entitled,
    // Polls only while there is a board to poll. An empty estate has nothing to
    // watch, and a page left open on a quiet desk should not keep asking.
    refetchInterval: (query) => (query.state.data?.entries.length ? BOARD_POLL_MS : false),
  });

  const reportQuery = useQuery({
    queryKey: estateKeys.authorisationDwell(estate?.id ?? '', from, undefined, sort),
    queryFn: () => unwrap(estateService.getAuthorisationDwell(estate!.id, { from, sort })),
    enabled: !!estate && entitled,
  });

  if (isEstateLoading) {
    return <div className="h-32 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />;
  }

  if (!estate) {
    router.replace(ROUTES.ESTATE_SETUP);
    return null;
  }

  // Either query can carry the refusal, because the gate fails open on an unknown
  // tier and lets the API be the authority.
  const refusal = boardQuery.error ?? reportQuery.error;

  return (
    <EstateFeatureGate feature="Dwell analytics" error={refusal}>
      <>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dwell analytics</h1>
            <p className="text-muted-foreground mt-1">
              Who is still inside, and how long visits run at {estate.name}
            </p>
          </div>
          <Button
            variant="secondary"
            className="gap-2"
            disabled={boardQuery.isFetching}
            onClick={() => {
              void boardQuery.refetch();
              void reportQuery.refetch();
            }}
          >
            {boardQuery.isFetching ? 'Refreshing…' : 'Refresh now'}
          </Button>
        </div>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-foreground mb-1">Still inside</h2>
          <p className="text-sm text-muted-foreground mb-4">
            The gate console knows who went in. This is the other half of the same question — who
            never came back out — and it is where a visit that has outstayed the estate&rsquo;s own
            authorisation shows up.
          </p>
          <OnSiteBoard board={boardQuery.data} isLoading={boardQuery.isLoading} />
        </section>

        <section>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-1">
            <h2 className="text-lg font-semibold text-foreground">How long visits run</h2>
            <div className="flex gap-2">
              <div className="w-40">
                <Select value={rangeDays} onValueChange={selectRange} options={RANGE_OPTIONS} />
              </div>
              <div className="w-48">
                <Select
                  value={sort}
                  onValueChange={(value) => setSort(value as 'dwell' | 'visits')}
                  options={SORT_OPTIONS}
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
