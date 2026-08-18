'use client';

import { LegacyInput, Pagination } from '@getrentos/ui';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { RentCollectionStats } from '@/components/landlord/payments/RentCollectionStats';
import { PaymentsTable } from '@/components/landlord/payments/PaymentsTable';
import { PaymentDetailsModal } from '@/components/landlord/payments/PaymentDetailsModal';
import {
  landlordService,
  type RentCollectionStats as RentCollectionStatsData,
} from '@/services/landlordService';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';
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
  { value: 'pending', label: 'Pending' },
  { value: 'overdue', label: 'Overdue' },
];

const PAGE_SIZE = 10;

export default function LandlordPaymentsPage() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | RentPaymentStatus>('all');
  const [selectedPayment, setSelectedPayment] = useState<RentPayment | null>(null);

  const { data } = useQuery({
    queryKey: [
      ...landlordKeys.payments(),
      { page, pageSize: PAGE_SIZE, status: filter === 'all' ? undefined : filter },
    ],
    queryFn: () =>
      unwrap(
        landlordService.listPayments({
          status: filter === 'all' ? undefined : filter,
          page,
          pageSize: PAGE_SIZE,
        })
      ),
  });
  const payments = data?.items ?? [];
  const total = data?.total ?? 0;

  const { data: stats = EMPTY_STATS } = useQuery({
    queryKey: landlordKeys.rentCollectionStats,
    queryFn: () => unwrap(landlordService.getRentCollectionStats()),
  });

  const { totalCollected, outstandingBalance, escrowPending, upcomingPayments } = stats;

  // The server filters by status; search stays client-side (not supported by the API).
  const filteredPayments = useMemo(
    () =>
      payments.filter(
        (p) =>
          p.tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.propertyName.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [payments, searchQuery]
  );

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Payments</h1>
        <p className="text-muted-foreground mt-1">Track rent collection and escrow status</p>
      </div>

      <RentCollectionStats
        totalCollected={totalCollected}
        outstandingBalance={outstandingBalance}
        escrowPending={escrowPending}
        upcomingPayments={upcomingPayments}
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <LegacyInput
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tenants or properties..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex gap-1 p-1 bg-secondary rounded-lg w-fit">
          {statusFilters.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                setFilter(option.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                filter === option.value
                  ? 'bg-card text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <PaymentsTable payments={filteredPayments} onViewDetails={setSelectedPayment} />

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
