'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  PageErrorState,
  Pagination,
  SearchInput,
  StatGridSkeleton,
  TableSkeleton,
  ToggleChip,
  PageHeader,
} from '@getrentos/ui';
import { RentCollectionStats } from '@/components/landlord/payments/RentCollectionStats';
import { PaymentsTable } from '@/components/landlord/payments/PaymentsTable';
import { PaymentDetailsModal } from '@/components/landlord/payments/PaymentDetailsModal';
import {
  landlordService,
  type RentCollectionStats as RentCollectionStatsData,
} from '@/services/landlordService';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import type { RentPayment, RentPaymentStatus } from '@/types/landlord';

const EMPTY_STATS: RentCollectionStatsData = {
  totalCollected: 0,
  outstandingBalance: 0,
  escrowPending: 0,
  upcomingPayments: 0,
};

const statusFilters: { value: 'all' | RentPaymentStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'paid', label: 'Paid' },
  { value: 'pending', label: 'Due' },
  { value: 'overdue', label: 'Overdue' },
];

const PAGE_SIZE = 10;

export function PaymentsView() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | RentPaymentStatus>('all');
  const [selectedPayment, setSelectedPayment] = useState<RentPayment | null>(null);

  // The server searches every page (tenant, property, reference), so the term
  // is sent once typing pauses rather than on every keystroke.
  const search = useDebouncedValue(searchQuery.trim());
  const paymentsQuery = useQuery({
    queryKey: [
      ...landlordKeys.payments(),
      {
        page,
        pageSize: PAGE_SIZE,
        status: filter === 'all' ? undefined : filter,
        search: search || undefined,
      },
    ],
    queryFn: () =>
      unwrap(
        landlordService.listPayments({
          status: filter === 'all' ? undefined : filter,
          page,
          pageSize: PAGE_SIZE,
          search: search || undefined,
        })
      ),
    placeholderData: keepPreviousData,
  });
  const { data } = paymentsQuery;
  const payments = data?.items ?? [];
  const total = data?.total ?? 0;

  const statsQuery = useQuery({
    queryKey: landlordKeys.rentCollectionStats,
    queryFn: () => unwrap(landlordService.getRentCollectionStats()),
  });
  const stats = statsQuery.data ?? EMPTY_STATS;

  const { totalCollected, outstandingBalance, escrowPending, upcomingPayments } = stats;

  return (
    <>
      <PageHeader
        title="Payments"
        description="Track rent collection and when it is paid out to you"
      />

      {statsQuery.isLoading ? (
        <StatGridSkeleton className="mb-6 grid-cols-2" />
      ) : (
        statsQuery.data && (
          <RentCollectionStats
            totalCollected={totalCollected}
            outstandingBalance={outstandingBalance}
            escrowPending={escrowPending}
            upcomingPayments={upcomingPayments}
          />
        )
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <SearchInput
          className="flex-1 max-w-sm"
          value={searchQuery}
          onValueChange={(value) => {
            setSearchQuery(value);
            setPage(1);
          }}
          placeholder="Search by tenant, property or reference..."
          label="Search payments by tenant, property or reference"
        />
        <div
          className="flex max-w-full gap-1 overflow-x-auto pb-1"
          role="group"
          aria-label="Filter payments by status"
        >
          {statusFilters.map((option) => (
            <ToggleChip
              key={option.value}
              size="sm"
              pressed={filter === option.value}
              onPressedChange={() => {
                setFilter(option.value);
                setPage(1);
              }}
            >
              {option.label}
            </ToggleChip>
          ))}
        </div>
      </div>

      {search && data && (
        <p className="-mt-3 mb-4 text-xs text-muted-foreground" role="status">
          {total === 1 ? '1 payment matches' : `${total} payments match`} &ldquo;{search}&rdquo;.
        </p>
      )}

      {paymentsQuery.isLoading ? (
        <TableSkeleton rows={5} columns={6} />
      ) : !data || (statsQuery.isError && !statsQuery.data) ? (
        <PageErrorState
          title="Payment records are unavailable"
          description="We could not load your collections and balances. No figures have been changed."
          onRetry={() => {
            void paymentsQuery.refetch();
            void statsQuery.refetch();
          }}
          isRetrying={paymentsQuery.isFetching || statsQuery.isFetching}
        />
      ) : (
        <PaymentsTable payments={payments} onViewDetails={setSelectedPayment} />
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

      <PaymentDetailsModal payment={selectedPayment} onClose={() => setSelectedPayment(null)} />
    </>
  );
}
