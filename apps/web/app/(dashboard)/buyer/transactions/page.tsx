'use client';

import { LegacyInput, Pagination } from '@getrentos/ui';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, ShieldCheck } from 'lucide-react';
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

  const { data: transactionsData, isLoading } = useQuery({
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
  });
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
          {isLoading
            ? 'Loading…'
            : `${total} purchase transaction${total === 1 ? '' : 's'} in escrow`}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <LegacyInput
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search by property or owner..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex gap-1 p-1 bg-secondary rounded-lg w-fit overflow-x-auto">
          {filterOptions.map((option) => (
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

      {transactions.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            {total === 0 ? 'No transactions match your filters' : 'No transactions on this page'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            {total === 0
              ? 'Once an owner accepts your offer, the escrow transaction will appear here.'
              : 'Choose another page to view more transactions.'}
          </p>
        </div>
      ) : (
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
      )}

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
      />
    </>
  );
}
