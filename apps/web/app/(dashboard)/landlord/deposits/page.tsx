'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, PiggyBank } from 'lucide-react';
import { Button, Pagination, PageLoadingState, Toast, type ToastVariant } from '@getrentos/ui';
import { DepositCard } from '@/components/landlord/deposits/DepositCard';
import { RecordDepositModal } from '@/components/landlord/deposits/RecordDepositModal';
import { DepositDetailModal } from '@/components/landlord/deposits/DepositDetailModal';
import {
  depositService,
  DEPOSIT_STATUS_LABELS,
  type CreateDepositHoldInput,
  type DepositStatus,
} from '@/services/depositService';
import { landlordService } from '@/services/landlordService';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';

const statusFilters: { value: 'all' | DepositStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'HELD', label: DEPOSIT_STATUS_LABELS.HELD },
  { value: 'RETURNED', label: DEPOSIT_STATUS_LABELS.RETURNED },
];

const PAGE_SIZE = 12;

export default function LandlordDepositsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'all' | DepositStatus>('all');
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [openDepositId, setOpenDepositId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const status = filter === 'all' ? undefined : filter;

  const { data, isLoading } = useQuery({
    queryKey: [...landlordKeys.deposits({ status }), { page }],
    queryFn: () => unwrap(depositService.list({ status, page, pageSize: PAGE_SIZE })),
  });
  const deposits = data?.items ?? [];
  const total = data?.total ?? 0;

  // Active leases feed the record-deposit picker.
  const { data: leasesData } = useQuery({
    queryKey: [...landlordKeys.leases('signed'), { forDeposits: true }],
    queryFn: () => unwrap(landlordService.listLeases({ status: 'signed', pageSize: 100 })),
  });
  const leases = (leasesData?.items ?? []).map((l) => ({
    id: l.id,
    label: `${l.tenantName} — ${l.propertyName}${l.unitName ? ` · ${l.unitName}` : ''}`,
    securityDeposit: l.securityDeposit,
  }));

  const createMutation = useMutation({
    mutationFn: (input: CreateDepositHoldInput) => unwrap(depositService.create(input)),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['landlord', 'deposits'] });
      setIsRecordOpen(false);
      setOpenDepositId(created.id);
    },
    onError: (error: Error) =>
      setToast({ message: error.message || 'Could not record the deposit.', variant: 'error' }),
  });

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Deposits</h1>
          <p className="mt-1 text-muted-foreground">
            Hold, deduct against, and return tenant security deposits.
          </p>
        </div>
        <Button variant="primary" className="gap-2" onClick={() => setIsRecordOpen(true)}>
          <Plus className="h-4 w-4" />
          Record deposit
        </Button>
      </div>

      <div className="mb-6 flex w-fit gap-1 overflow-x-auto rounded-lg bg-secondary p-1">
        {statusFilters.map((option) => (
          <button
            key={option.value}
            onClick={() => {
              setFilter(option.value);
              setPage(1);
            }}
            className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === option.value
                ? 'bg-card text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <PageLoadingState />
      ) : deposits.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <PiggyBank className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-muted-foreground">No deposits yet</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {deposits.map((deposit) => (
            <DepositCard key={deposit.id} deposit={deposit} onOpen={setOpenDepositId} />
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

      <RecordDepositModal
        isOpen={isRecordOpen}
        onClose={() => setIsRecordOpen(false)}
        leases={leases}
        onCreate={(input) => createMutation.mutate(input)}
        isPending={createMutation.isPending}
      />

      <DepositDetailModal depositId={openDepositId} onClose={() => setOpenDepositId(null)} />

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </>
  );
}
