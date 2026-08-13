'use client';

import { LegacyInput } from '@/components/ui/LegacyInput';

import { useState } from 'react';
import { Search, ShieldCheck } from 'lucide-react';
import { BuyerEscrowTransactionCard } from '@/components/buyer/transactions/BuyerEscrowTransactionCard';
import { BuyerEscrowTransactionDetailModal } from '@/components/buyer/transactions/BuyerEscrowTransactionDetailModal';
import type { BuyerEscrowTransaction, BuyerEscrowStatus } from '@/types/buyer';

const mockTransactions: BuyerEscrowTransaction[] = [
  {
    id: 'txn_001',
    offerId: 'offer_002',
    propertyId: 'listing_005',
    propertyTitle: 'Ikeja GRA Townhouse',
    ownerName: 'Segun Alabi',
    purchasePrice: 68_000_000,
    escrowStatus: 'deposit_pending',
    milestones: [
      { label: 'Deposit received', completed: false },
      { label: 'Funds held in escrow', completed: false },
      { label: 'Ownership verification', completed: false },
      { label: 'Final payment', completed: false },
      { label: 'Funds released', completed: false },
    ],
    activityLog: [
      {
        id: 'log_001',
        actor: 'owner',
        action: 'Accepted your offer of ₦68,000,000',
        timestamp: '2026-08-01T10:00:00.000Z',
      },
      {
        id: 'log_002',
        actor: 'system',
        action: 'Escrow transaction opened — awaiting your deposit',
        timestamp: '2026-08-01T10:05:00.000Z',
      },
    ],
    createdAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'txn_002',
    offerId: 'offer_003',
    propertyId: 'listing_006',
    propertyTitle: 'Surulere Family Duplex',
    ownerName: 'Tobi Fashola',
    purchasePrice: 54_500_000,
    escrowStatus: 'released',
    milestones: [
      { label: 'Deposit received', completed: true },
      { label: 'Funds held in escrow', completed: true },
      { label: 'Ownership verification', completed: true },
      { label: 'Final payment', completed: true },
      { label: 'Funds released', completed: true },
    ],
    activityLog: [
      {
        id: 'log_001',
        actor: 'buyer',
        action: 'Submitted earnest deposit of ₦5,450,000 into escrow',
        timestamp: '2026-05-02T09:00:00.000Z',
      },
      {
        id: 'log_002',
        actor: 'system',
        action: 'Deposit confirmed and funds moved to held status',
        timestamp: '2026-05-02T09:10:00.000Z',
      },
      {
        id: 'log_003',
        actor: 'compliance',
        action: 'Ownership verification approved',
        timestamp: '2026-05-10T13:20:00.000Z',
      },
      {
        id: 'log_004',
        actor: 'buyer',
        action: 'Remitted final payment balance',
        timestamp: '2026-06-12T10:15:00.000Z',
      },
      {
        id: 'log_005',
        actor: 'system',
        action: 'Funds released to owner — ownership transferred to you',
        timestamp: '2026-06-14T09:00:00.000Z',
      },
    ],
    createdAt: '2026-05-02T00:00:00.000Z',
    releasedAt: '2026-06-14T00:00:00.000Z',
  },
];

type StatusFilter = 'all' | BuyerEscrowStatus;

export default function BuyerTransactionsPage() {
  const [transactions, setTransactions] = useState<BuyerEscrowTransaction[]>(mockTransactions);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [activeTransactionId, setActiveTransactionId] = useState<string | null>(null);

  const handleMakePayment = (transactionId: string, stage: 'deposit' | 'final') => {
    setTransactions((prev) =>
      prev.map((t) => {
        if (t.id !== transactionId) return t;
        const nextStatus: BuyerEscrowStatus = stage === 'deposit' ? 'funds_held' : 'released';
        const newLog = {
          id: `log_${Date.now()}`,
          actor: 'buyer' as const,
          action:
            stage === 'deposit'
              ? 'Submitted earnest deposit into escrow'
              : 'Remitted final payment balance',
          timestamp: new Date().toISOString(),
        };
        return {
          ...t,
          escrowStatus: nextStatus,
          activityLog: [...t.activityLog, newLog],
          releasedAt: stage === 'final' ? new Date().toISOString() : t.releasedAt,
        };
      })
    );
  };

  const activeTransaction = transactions.find((t) => t.id === activeTransactionId) || null;

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.propertyTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.ownerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || t.escrowStatus === filter;
    return matchesSearch && matchesFilter;
  });

  const filterOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'deposit_pending', label: 'Deposit Pending' },
    { value: 'funds_held', label: 'Funds Held' },
    { value: 'verification', label: 'Verification' },
    { value: 'final_payment', label: 'Final Payment' },
    { value: 'released', label: 'Completed' },
    { value: 'frozen', label: 'Frozen' },
  ];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Transactions</h1>
        <p className="text-muted-foreground mt-1">
          {transactions.length} purchase transaction{transactions.length === 1 ? '' : 's'} in escrow
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <LegacyInput
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by property or owner..."
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
              ? 'Once an owner accepts your offer, the escrow transaction will appear here.'
              : 'Try adjusting your search or filter.'}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTransactions.map((transaction, index) => (
            <BuyerEscrowTransactionCard
              key={transaction.id}
              transaction={transaction}
              delay={index * 0.05}
              onClick={() => setActiveTransactionId(transaction.id)}
            />
          ))}
        </div>
      )}

      <BuyerEscrowTransactionDetailModal
        transaction={activeTransaction}
        onClose={() => setActiveTransactionId(null)}
        onMakePayment={handleMakePayment}
      />
    </>
  );
}
