'use client';

import { RedirectToEstateSetup } from '@/components/estate/shared/RedirectToEstateSetup';
import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, ShieldAlert } from '@sureground/icons';
import {
  Alert,
  Button,
  CardSkeleton,
  EmptyState,
  Pagination,
  ToggleChip,
  PageHeader,
} from '@sureground/ui';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import { useSelectedEstate } from '@/app/(dashboard)/estate/layout';
import {
  AddWatchlistEntryModal,
  type AddWatchlistEntryInput,
} from '@/components/estate/watchlist/AddWatchlistEntryModal';
import { LiftWatchlistEntryModal } from '@/components/estate/watchlist/LiftWatchlistEntryModal';
import { WatchlistEntryRow } from '@/components/estate/watchlist/WatchlistEntryRow';
import type { WatchlistEntry, WatchlistStatus } from '@/types/estate';
import {
  EstateFilterChips,
  EstateListSection,
  EstateListSkeleton,
  EstateRowList,
} from '@/components/estate/shared/EstateListSection';

const PAGE_SIZE = 10;

type StatusFilter = 'all' | 'active' | 'lifted';

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'In force' },
  { value: 'lifted', label: 'Lifted' },
];

const toApiStatus = (filter: StatusFilter): WatchlistStatus | undefined =>
  filter === 'active' ? 'ACTIVE' : filter === 'lifted' ? 'LIFTED' : undefined;

export default function EstateWatchlistPage() {
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
    placeholderData: keepPreviousData,
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
    return <CardSkeleton />;
  }

  if (!estate) return <RedirectToEstateSetup />;

  const activeFilter = statusFilters.find((filter) => filter.value === statusFilter)!;

  return (
    <>
      <PageHeader
        title="Watch list"
        description={`People and vehicles ${estate.name} has decided to refuse or keep an eye on.`}
        actions={
          <Button
            variant="primary"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => {
              addEntry.reset();
              setIsAddOpen(true);
            }}
          >
            Add to list
          </Button>
        }
      />

      <Alert variant="neutral" className="mb-6 rounded-2xl">
        <p>
          Everybody on this list is checked against at every way into the estate: a visitor pass
          being used, a pass being issued, a walk-in at the barrier, and a vehicle being logged, as
          well as by a guard searching the list. Names, phone numbers and plates are matched
          exactly, ignoring case, spacing and word order, so{' '}
          <span className="font-mono text-xs">lag 123 xy</span> matches{' '}
          <span className="font-mono text-xs">LAG-123-XY</span>.
        </p>
        <p className="mt-2">
          <span className="font-medium text-foreground">Do not admit</span> refuses entry. A guard
          who can see the person may still admit them, but only by giving a reason, and you are told
          either way. <span className="font-medium text-foreground">Watch only</span> lets them in
          and tells you.
        </p>
      </Alert>

      <EstateListSection
        id="watchlist"
        title={statusFilter === 'all' ? 'Everyone on the list' : activeFilter.label}
        count={isLoading ? undefined : total}
        countLabel={`${total} ${total === 1 ? 'entry' : 'entries'}`}
        description="Who is listed, why, and how they are matched at the gate."
        toolbar={
          <EstateFilterChips label="Filter watchlist by status">
            {statusFilters.map((filter) => (
              <ToggleChip
                key={filter.value}
                size="sm"
                pressed={statusFilter === filter.value}
                onPressedChange={() => {
                  setStatusFilter(filter.value);
                  setPage(1);
                }}
              >
                {filter.label}
              </ToggleChip>
            ))}
          </EstateFilterChips>
        }
        footer={
          total > PAGE_SIZE ? (
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
          ) : undefined
        }
      >
        {isLoading ? (
          <EstateListSkeleton />
        ) : entries.length === 0 ? (
          statusFilter === 'all' ? (
            <EmptyState
              bare
              icon={ShieldAlert}
              title="Nobody is on the list"
              description="Add somebody the estate has decided should not be admitted, or someone it wants to be told about."
            />
          ) : (
            <EmptyState
              bare
              size="compact"
              icon={ShieldAlert}
              title="Nothing here"
              description="No entries match this filter."
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStatusFilter('all');
                    setPage(1);
                  }}
                >
                  Show everyone
                </Button>
              }
            />
          )
        ) : (
          <EstateRowList>
            {entries.map((entry) => (
              <li key={entry.id}>
                <WatchlistEntryRow
                  entry={entry}
                  onLift={() => {
                    liftEntry.reset();
                    setLifting(entry);
                  }}
                />
              </li>
            ))}
          </EstateRowList>
        )}
      </EstateListSection>

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
