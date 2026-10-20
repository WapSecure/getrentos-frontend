'use client';

import {
  EmptyState,
  ListSkeleton,
  PageErrorState,
  Pagination,
  SearchInput,
  SegmentedControl,
  Skeleton,
} from '@getrentos/ui';
import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ShieldCheck } from 'lucide-react';
import { EscrowTransactionCard } from '@/components/owner/transactions/EscrowTransactionCard';
import { EscrowTransactionDetailModal } from '@/components/owner/transactions/EscrowTransactionDetailModal';
import { ownerService } from '@/services/ownerService';
import { unwrap } from '@/lib/apiHelpers';
import { ownerKeys } from '@/lib/queryKeys';
import type { EscrowSaleTransaction, SaleEscrowStatus } from '@/types/owner';

type StatusFilter = 'all' | SaleEscrowStatus;

const PAGE_SIZE = 10;

export default function OwnerTransactionsPage() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [activeTransaction, setActiveTransaction] = useState<EscrowSaleTransaction | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [
      ...ownerKeys.transactions,
      {
        search: debouncedSearch,
        status: filter === 'all' ? undefined : filter,
        page,
        pageSize: PAGE_SIZE,
      },
    ],
    queryFn: () =>
      unwrap(
        ownerService.listTransactions({
          search: debouncedSearch || undefined,
          status: filter === 'all' ? undefined : filter,
          page,
          pageSize: PAGE_SIZE,
        })
      ),
    placeholderData: keepPreviousData,
  });
  const transactions = data?.items ?? [];
  const total = data?.total ?? 0;

  const filterOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'deposit_pending', label: 'Deposit Pending' },
    { value: 'funds_held', label: 'Funds Held' },
    { value: 'verification', label: 'Verification' },
    { value: 'final_payment', label: 'Final Payment' },
    { value: 'released', label: 'Released' },
    { value: 'frozen', label: 'Frozen' },
    { value: 'disputed', label: 'Disputed' },
    { value: 'refunded', label: 'Refunded' },
  ];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Sales in progress</h1>
        <div className="text-muted-foreground mt-1">
          {isLoading ? (
            <Skeleton className="h-5 w-48" />
          ) : (
            `${total} sale${total === 1 ? '' : 's'} protected by GetRentos`
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <SearchInput
          value={searchQuery}
          onValueChange={setSearchQuery}
          placeholder="Search by property or buyer..."
          className="flex-1 max-w-sm"
        />
        <SegmentedControl
          size="sm"
          aria-label="Filter by status"
          value={filter}
          onValueChange={(value) => {
            setFilter(value);
            setPage(1);
          }}
          segments={filterOptions}
          className="max-w-full overflow-x-auto"
        />
      </div>

      {isLoading ? (
        <ListSkeleton rows={6} variant="cards" label="Loading sales" />
      ) : isError && !data ? (
        <PageErrorState
          headingLevel="h2"
          title="We couldn't load your sales"
          onRetry={() => void refetch()}
        />
      ) : transactions.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title={total === 0 ? 'No transactions yet' : 'No transactions match your filters'}
          description={
            total === 0
              ? 'Once you accept a buyer offer, the sale and its protected payment will appear here.'
              : 'Try adjusting your search or filter.'
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {transactions.map((transaction, index) => (
            <EscrowTransactionCard
              key={transaction.id}
              transaction={transaction}
              delay={index * 0.05}
              onClick={() => setActiveTransaction(transaction)}
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

      <EscrowTransactionDetailModal
        transaction={activeTransaction}
        onClose={() => setActiveTransaction(null)}
      />
    </>
  );
}
