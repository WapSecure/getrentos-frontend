'use client';

import { useState } from 'react';
import { Search, ShieldCheck } from 'lucide-react';
import { EscrowTransactionCard } from '@/components/owner/transactions/EscrowTransactionCard';
import { EscrowTransactionDetailModal } from '@/components/owner/transactions/EscrowTransactionDetailModal';
import type { EscrowSaleTransaction, SaleEscrowStatus } from '@/types/owner';

const mockTransactions: EscrowSaleTransaction[] = [
  {
    id: 'txn_001',
    offerId: 'offer_003',
    propertyId: 'oprop_005',
    propertyName: 'Ikeja GRA Townhouse',
    buyerName: 'Segun Alabi',
    salePrice: 68_000_000,
    escrowStatus: 'funds_held',
    milestones: [
      { label: 'Deposit received', completed: true },
      { label: 'Funds held in escrow', completed: true },
      { label: 'Ownership verification', completed: false },
      { label: 'Final payment', completed: false },
      { label: 'Funds released', completed: false },
    ],
    activityLog: [
      {
        id: 'log_001',
        actor: 'buyer',
        action: 'Submitted earnest deposit of ₦6,800,000 into escrow',
        timestamp: '2026-07-28T09:15:00.000Z',
      },
      {
        id: 'log_002',
        actor: 'system',
        action: 'Deposit confirmed and funds moved to held status',
        timestamp: '2026-07-28T09:20:00.000Z',
      },
      {
        id: 'log_003',
        actor: 'owner',
        action: 'Uploaded updated title deed for compliance review',
        timestamp: '2026-07-29T14:05:00.000Z',
      },
      {
        id: 'log_004',
        actor: 'compliance',
        action: 'Ownership verification is in progress',
        timestamp: '2026-07-30T10:00:00.000Z',
      },
    ],
    createdAt: '2026-07-28T00:00:00.000Z',
  },
  {
    id: 'txn_002',
    offerId: 'offer_004',
    propertyId: 'oprop_006',
    propertyName: 'Banana Island Penthouse',
    buyerName: 'Amaka Obi',
    salePrice: 320_000_000,
    escrowStatus: 'frozen',
    disputeReason:
      'Buyer disputes a discrepancy between the surveyed plot size and the listing description.',
    milestones: [
      { label: 'Deposit received', completed: true },
      { label: 'Funds held in escrow', completed: true },
      { label: 'Ownership verification', completed: true },
      { label: 'Final payment', completed: false },
      { label: 'Funds released', completed: false },
    ],
    activityLog: [
      {
        id: 'log_001',
        actor: 'buyer',
        action: 'Submitted earnest deposit of ₦32,000,000 into escrow',
        timestamp: '2026-07-10T08:30:00.000Z',
      },
      {
        id: 'log_002',
        actor: 'system',
        action: 'Deposit confirmed and funds moved to held status',
        timestamp: '2026-07-10T08:40:00.000Z',
      },
      {
        id: 'log_003',
        actor: 'compliance',
        action: 'Ownership verification approved',
        timestamp: '2026-07-14T11:00:00.000Z',
      },
      {
        id: 'log_004',
        actor: 'buyer',
        action: 'Raised a dispute over surveyed plot size discrepancy',
        timestamp: '2026-07-20T16:45:00.000Z',
      },
      {
        id: 'log_005',
        actor: 'system',
        action: 'Escrow frozen pending dispute resolution',
        timestamp: '2026-07-20T16:46:00.000Z',
      },
    ],
    createdAt: '2026-07-10T00:00:00.000Z',
  },
  {
    id: 'txn_003',
    offerId: 'offer_005',
    propertyId: 'oprop_007',
    propertyName: 'Surulere Family Duplex',
    buyerName: 'Tobi Fashola',
    salePrice: 54_500_000,
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
        action: 'All conditions met — funds released to owner',
        timestamp: '2026-06-14T09:00:00.000Z',
      },
    ],
    createdAt: '2026-05-02T00:00:00.000Z',
    releasedAt: '2026-06-14T00:00:00.000Z',
  },
];

type StatusFilter = 'all' | SaleEscrowStatus;

export default function OwnerTransactionsPage() {
  const [transactions, setTransactions] = useState<EscrowSaleTransaction[]>(mockTransactions);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [activeTransaction, setActiveTransaction] = useState<EscrowSaleTransaction | null>(null);

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
          {transactions.length} sale transaction{transactions.length === 1 ? '' : 's'} in escrow
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
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
