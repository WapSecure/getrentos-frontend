'use client';

import { LegacyInput } from '@getrentos/ui';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ShieldCheck } from 'lucide-react';
import { EscrowTransactionCard } from '@/components/owner/transactions/EscrowTransactionCard';
import { EscrowTransactionDetailModal } from '@/components/owner/transactions/EscrowTransactionDetailModal';
import { ownerService } from '@/services/ownerService';
import { unwrap } from '@/lib/apiHelpers';
import { ownerKeys } from '@/lib/queryKeys';
import type { EscrowSaleTransaction, SaleEscrowStatus } from '@/types/owner';

type StatusFilter = 'all' | SaleEscrowStatus;

export default function OwnerTransactionsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [activeTransaction, setActiveTransaction] = useState<EscrowSaleTransaction | null>(null);

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ownerKeys.transactions,
    queryFn: () => unwrap(ownerService.listTransactions()),
  });

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.propertyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.buyerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || t.escrowStatus === filter;
    return matchesSearch && matchesFilter;
  });

  const filterOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'deposit_pending', label: 'Deposit Pending' },
    { value: 'funds_held', label: 'Funds Held' },
    { value: 'verification', label: 'Verification' },
    { value: 'final_payment', label: 'Final Payment' },
    { value: 'released', label: 'Released' },
    { value: 'frozen', label: 'Frozen' },
  ];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Escrow & Transactions</h1>
        <p className="text-muted-foreground mt-1">
          {isLoading
            ? 'Loading…'
            : `${transactions.length} sale transaction${transactions.length === 1 ? '' : 's'} in escrow`}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <LegacyInput
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by property or buyer..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex gap-1 p-1 bg-secondary rounded-lg w-fit overflow-x-auto">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
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

      {filteredTransactions.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            {transactions.length === 0
              ? 'No transactions yet'
              : 'No transactions match your filters'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            {transactions.length === 0
              ? 'Once you accept a buyer offer, the escrow transaction will appear here.'
              : 'Try adjusting your search or filter.'}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTransactions.map((transaction, index) => (
            <EscrowTransactionCard
              key={transaction.id}
              transaction={transaction}
              delay={index * 0.05}
              onClick={() => setActiveTransaction(transaction)}
            />
          ))}
        </div>
      )}

      <EscrowTransactionDetailModal
        transaction={activeTransaction}
        onClose={() => setActiveTransaction(null)}
      />
    </>
  );
}
