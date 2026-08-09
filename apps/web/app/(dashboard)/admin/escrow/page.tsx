'use client';

import { useState, useEffect } from 'react';
import { Search, Landmark, Flag } from 'lucide-react';
import { DataTable, type Column } from '@/components/ui/Table';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { cn } from '@/lib/cn';
import { formatCurrency, formatDate } from '@/lib/format';
import { adminService } from '@/services/adminService';
import type { PlatformEscrowStatus, PlatformEscrowTransaction } from '@/types/admin';

const statusConfig: Record<PlatformEscrowStatus, { label: string; variant: BadgeVariant }> = {
  deposit_pending: { label: 'Deposit Pending', variant: 'neutral' },
  funds_held: { label: 'Funds Held', variant: 'info' },
  verification: { label: 'Verification', variant: 'warning' },
  final_payment: { label: 'Final Payment', variant: 'info' },
  released: { label: 'Released', variant: 'success' },
  frozen: { label: 'Frozen', variant: 'danger' },
};

type StatusFilter = 'all' | PlatformEscrowStatus;

const PAGE_SIZE = 10;

export default function AdminEscrowPage() {
  const [transactions, setTransactions] = useState<PlatformEscrowTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true);
      const response = await adminService.listEscrowTransactions();
      if (response.success && response.data) {
        setTransactions(response.data);
      }
      setIsLoading(false);
    };

    fetchTransactions();
  }, []);

  const toggleFlag = async (id: string) => {
    const current = transactions.find((t) => t.id === id);
    if (!current) return;
    const response = await adminService.toggleEscrowFlag(id, !current.flagged);
    if (response.success) {
      setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, flagged: !t.flagged } : t)));
    }
  };

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.propertyTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.sellerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pagedTransactions = filteredTransactions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'deposit_pending', label: 'Deposit Pending' },
    { value: 'funds_held', label: 'Funds Held' },
    { value: 'verification', label: 'Verification' },
    { value: 'final_payment', label: 'Final Payment' },
    { value: 'released', label: 'Released' },
    { value: 'frozen', label: 'Frozen' },
  ];

  const columns: Column<PlatformEscrowTransaction>[] = [
    {
      key: 'property',
      header: 'Property',
      render: (t) => t.propertyTitle,
      className: 'font-medium text-foreground whitespace-nowrap',
    },
    {
      key: 'buyer',
      header: 'Buyer',
      render: (t) => t.buyerName,
      className: 'text-muted-foreground whitespace-nowrap',
    },
    {
      key: 'seller',
      header: 'Seller',
      render: (t) => t.sellerName,
      className: 'text-muted-foreground whitespace-nowrap',
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (t) => formatCurrency(t.amount, { compact: true }),
      className: 'text-foreground whitespace-nowrap',
    },
    {
      key: 'status',
      header: 'Status',
      render: (t) => (
        <Badge variant={statusConfig[t.status].variant}>{statusConfig[t.status].label}</Badge>
      ),
      className: 'whitespace-nowrap',
    },
    {
      key: 'created',
      header: 'Created',
      render: (t) => formatDate(t.createdAt),
      className: 'text-muted-foreground whitespace-nowrap',
    },
    {
      key: 'flag',
      header: '',
      render: (t) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFlag(t.id);
          }}
          className={cn(
            'p-1.5 rounded-lg transition-colors',
            t.flagged
              ? 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30'
              : 'text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-secondary'
          )}
          title={t.flagged ? 'Unflag transaction' : 'Flag for review'}
        >
          <Flag className="w-3.5 h-3.5" />
        </button>
      ),
      className: 'text-right',
    },
  ];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Escrow Oversight</h1>
        <p className="text-muted-foreground mt-1">
          Platform-wide monitoring of escrow transactions ·{' '}
          {transactions.filter((t) => t.flagged).length} flagged for review
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search by property, buyer, or seller..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-secondary rounded-lg w-fit overflow-x-auto mb-6">
        {statusOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => {
              setStatusFilter(option.value);
              setPage(1);
            }}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap',
              statusFilter === option.value
                ? 'bg-card text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={pagedTransactions}
        isLoading={isLoading}
        getRowKey={(t) => t.id}
        getRowClassName={(t) => (t.flagged ? 'bg-red-50/50 dark:bg-red-900/10' : undefined)}
        emptyState={<EmptyState icon={Landmark} title="No transactions match your filters" />}
        footer={
          filteredTransactions.length > 0 && (
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              total={filteredTransactions.length}
              onPageChange={setPage}
            />
          )
        }
      />
    </>
  );
}
