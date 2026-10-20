'use client';

import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck } from 'lucide-react';
import { Pagination, QueryState, SearchInput, SegmentedControl, Skeleton } from '@getrentos/ui';
import { BuyerEscrowTransactionCard } from '@/components/buyer/transactions/BuyerEscrowTransactionCard';
import { BuyerEscrowTransactionDetailModal } from '@/components/buyer/transactions/BuyerEscrowTransactionDetailModal';
import { buyerService } from '@/services/buyerService';
import { unwrap } from '@/lib/apiHelpers';
import { buyerKeys } from '@/lib/queryKeys';
import type { BuyerEscrowStatus } from '@/types/buyer';

type StatusFilter = 'all' | BuyerEscrowStatus;

export default function BuyerTransactionsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [activeTransactionId, setActiveTransactionId] = useState<string | null>(null);
  const PAGE_SIZE = 9;
  const [page, setPage] = useState(1);

  const transactionsQuery = useQuery({
    queryKey: [
      ...buyerKeys.transactions,
      { search: searchQuery, status: filter, page, pageSize: PAGE_SIZE },
    ],
    queryFn: () =>
      unwrap(
        buyerService.listTransactions({
          search: searchQuery || undefined,
          status: filter === 'all' ? undefined : filter,
          page,
          pageSize: PAGE_SIZE,
        })
      ),
    placeholderData: keepPreviousData,
  });
  const { data: transactionsData, isLoading } = transactionsQuery;
  const transactions = transactionsData?.items ?? [];
  const total = transactionsData?.total ?? 0;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: buyerKeys.transactions });

  const depositMutation = useMutation({
    mutationFn: (id: string) => unwrap(buyerService.depositTransaction(id)),
    onSuccess: invalidate,
  });
  const releaseMutation = useMutation({
    mutationFn: (id: string) => unwrap(buyerService.releaseTransaction(id)),
    onSuccess: invalidate,
  });

  const handleMakePayment = (transactionId: string, stage: 'deposit' | 'final') => {
    if (stage === 'deposit') depositMutation.mutate(transactionId);
    else releaseMutation.mutate(transactionId);
  };

  const activeTransaction = transactions.find((t) => t.id === activeTransactionId) || null;

  const filterOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'deposit_pending', label: 'Deposit Pending' },
    { value: 'funds_held', label: 'Funds Held' },
    { value: 'verification', label: 'Verification' },
    { value: 'final_payment', label: 'Final Payment' },
    { value: 'released', label: 'Completed' },
    { value: 'frozen', label: 'Frozen' },
    { value: 'disputed', label: 'Disputed' },
    { value: 'refunded', label: 'Refunded' },
  ];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Transactions</h1>
        <p className="text-muted-foreground mt-1">
          {isLoading ? (
            <Skeleton className="inline-block h-4 w-56 align-middle" />
          ) : (
            `${total} purchase${total === 1 ? '' : 's'} protected by GetRentos`
          )}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <SearchInput
          value={searchQuery}
          onValueChange={(value) => {
            setSearchQuery(value);
            setPage(1);
          }}
          placeholder="Search by property or owner..."
          label="Search transactions"
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

      <QueryState
        isLoading={isLoading}
        isError={transactionsQuery.isError && !transactionsData}
        onRetry={() => void transactionsQuery.refetch()}
        isRetrying={transactionsQuery.isFetching}
        isEmpty={transactions.length === 0}
        empty={{
          icon: ShieldCheck,
          title:
            total === 0 ? 'No transactions match your filters' : 'No transactions on this page',
          description:
            total === 0
              ? 'Once an owner accepts your offer, the purchase and its protected payment will appear here.'
              : 'Choose another page to view more transactions.',
        }}
        scope="page"
        loading={
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5" aria-busy="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-56 rounded-2xl" />
            ))}
          </div>
        }
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {transactions.map((transaction, index) => (
            <BuyerEscrowTransactionCard
              key={transaction.id}
              transaction={transaction}
              delay={index * 0.05}
              onClick={() => setActiveTransactionId(transaction.id)}
            />
          ))}
        </div>
      </QueryState>

      {total > 0 && (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
          className="mt-8"
        />
      )}

      <BuyerEscrowTransactionDetailModal
        transaction={activeTransaction}
        onClose={() => setActiveTransactionId(null)}
        onMakePayment={handleMakePayment}
        isPaying={depositMutation.isPending || releaseMutation.isPending}
      />
    </>
  );
}
