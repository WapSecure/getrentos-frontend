'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, ShieldAlert } from 'lucide-react';
import { Button, EmptyState, Pagination } from '@getrentos/ui';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import { ROUTES } from '@/lib/constants/auth';
import { useSelectedEstate } from '@/app/(dashboard)/estate/layout';
import {
  AddWatchlistEntryModal,
  type AddWatchlistEntryInput,
} from '@/components/estate/watchlist/AddWatchlistEntryModal';
import { LiftWatchlistEntryModal } from '@/components/estate/watchlist/LiftWatchlistEntryModal';
import { WatchlistEntryRow } from '@/components/estate/watchlist/WatchlistEntryRow';
import type { WatchlistEntry, WatchlistStatus } from '@/types/estate';

const PAGE_SIZE = 10;

type StatusFilter = 'all' | 'active' | 'lifted';

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'In force' },
  { value: 'lifted', label: 'Lifted' },
];

/** The API expects the Prisma enum; the filter buttons read better in lower case. */
const toApiStatus = (filter: StatusFilter): WatchlistStatus | undefined =>
  filter === 'active' ? 'ACTIVE' : filter === 'lifted' ? 'LIFTED' : undefined;

export default function EstateWatchlistPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [lifting, setLifting] = useState<WatchlistEntry | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);

  const { estate, isLoading: isEstateLoading } = useSelectedEstate();
  const status = toApiStatus(statusFilter);

  const { data, isLoading } = useQuery({
    queryKey: [
      ...estateKeys.watchlist(estate?.id ?? '', statusFilter),
      { page, pageSize: PAGE_SIZE },
    ],
    queryFn: () =>
      unwrap(estateService.listWatchlist(estate!.id, { status, page, pageSize: PAGE_SIZE })),
    enabled: !!estate,
  });
  const entries = data?.items ?? [];
  const total = data?.total ?? 0;

  const invalidate = () => {
    if (!estate) return;
    queryClient.invalidateQueries({ queryKey: ['estate', estate.id, 'watchlist'] });
  };

  const addEntry = useMutation({
    mutationFn: (input: AddWatchlistEntryInput) =>
      unwrap(estateService.addWatchlistEntry(estate!.id, input)),
    onSuccess: () => {
      invalidate();
      setPage(1);
      setIsAddOpen(false);
    },
  });

  const liftEntry = useMutation({
    mutationFn: (input: { entryId: string; reason: string }) =>
      unwrap(estateService.liftWatchlistEntry(estate!.id, input.entryId, input.reason)),
    onSuccess: () => {
      invalidate();
      setLifting(null);
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
          <h1 className="text-2xl font-bold text-foreground">Watch list</h1>
          <p className="text-muted-foreground mt-1">
            {total} {total === 1 ? 'entry' : 'entries'} at {estate.name}
          </p>
        </div>
        <Button
          variant="primary"
          className="gap-2"
          onClick={() => {
            addEntry.reset();
            setIsAddOpen(true);
          }}
        >
          <Plus className="w-4 h-4" />
          Add to list
        </Button>
      </div>

      {/* Says what the list does, because a manager who assumes it is only a note
          would never rely on it — and one who assumes a WATCH entry stops
          somebody would find out at the barrier instead. */}
      <div className="bg-card rounded-2xl border border-border p-4 mb-6">
        <p className="text-sm text-muted-foreground">
          Everybody on this list is checked against at every way into the estate — a visitor pass
          being used, a pass being issued, a walk-in at the barrier, and a vehicle being logged — as
          well as by a guard searching the list. Names, phone numbers and plates are matched
          exactly, ignoring case, spacing and word order, so{' '}
          <span className="font-mono text-xs">lag 123 xy</span> matches{' '}
          <span className="font-mono text-xs">LAG-123-XY</span>.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          <span className="font-medium text-foreground">Do not admit</span> refuses entry. A guard
          who can see the person may still admit them, but only by giving a reason, and you are told
          either way. <span className="font-medium text-foreground">Watch only</span> lets them in
          and tells you.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {statusFilters.map((filter) => (
          <Button
            key={filter.value}
            variant={statusFilter === filter.value ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => {
              setStatusFilter(filter.value);
              setPage(1);
            }}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />
      ) : entries.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12">
          <EmptyState
            icon={ShieldAlert}
            title={statusFilter === 'all' ? 'Nobody is on the list' : 'Nothing here'}
            description={
              statusFilter === 'all'
                ? 'Add somebody the estate has decided should not be admitted, or someone it wants to be told about.'
                : 'No entries match this filter.'
            }
          />
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
          {entries.map((entry) => (
            <WatchlistEntryRow
              key={entry.id}
              entry={entry}
              onLift={() => {
                liftEntry.reset();
                setLifting(entry);
              }}
            />
          ))}
        </div>
      )}

      {total > 0 && (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
          className="mt-6"
        />
      )}

      <AddWatchlistEntryModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={(input) => addEntry.mutate(input)}
        isSubmitting={addEntry.isPending}
        error={addEntry.error instanceof Error ? addEntry.error.message : null}
      />

      <LiftWatchlistEntryModal
        isOpen={!!lifting}
        onClose={() => setLifting(null)}
        label={lifting?.label ?? ''}
        onSubmit={(reason) => {
          if (lifting) liftEntry.mutate({ entryId: lifting.id, reason });
        }}
        isSubmitting={liftEntry.isPending}
        error={liftEntry.error instanceof Error ? liftEntry.error.message : null}
      />
    </>
  );
}
