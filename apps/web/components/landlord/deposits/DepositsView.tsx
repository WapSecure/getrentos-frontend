'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, PiggyBank } from 'lucide-react';
import {
  Button,
  CardSkeleton,
  EmptyState,
  Pagination,
  PageErrorState,
  Tabs,
  TabsList,
  TabsTrigger,
  useToast,
} from '@getrentos/ui';
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

/**
 * The deposits screen. Role-agnostic: it talks to the /deposits API, which any
 * property-controller (landlord, owner, or manager) may use, so the landlord and
 * owner portals both render this.
 */
export function DepositsView() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'all' | DepositStatus>('all');
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [openDepositId, setOpenDepositId] = useState<string | null>(null);
  const toast = useToast();

  const status = filter === 'all' ? undefined : filter;

  const depositsQuery = useQuery({
    queryKey: [...landlordKeys.deposits({ status }), { page }],
    queryFn: () => unwrap(depositService.list({ status, page, pageSize: PAGE_SIZE })),
    placeholderData: keepPreviousData,
  });
  const { data, isLoading } = depositsQuery;
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
    onError: (error: Error) => toast.error(error.message || 'Could not record the deposit.'),
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

      <Tabs
        value={filter}
        onValueChange={(value) => {
          setFilter(value as 'all' | DepositStatus);
          setPage(1);
        }}
        className="mb-6 max-w-full"
      >
        <TabsList className="max-w-full">
          {statusFilters.map((option) => (
            <TabsTrigger key={option.value} value={option.value}>
              {option.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <CardSkeleton key={i} lines={2} />
          ))}
        </div>
      ) : !data ? (
        <PageErrorState
          title="Deposits are unavailable"
          description="We could not load held and returned deposits. No deposit has been changed."
          onRetry={() => void depositsQuery.refetch()}
          isRetrying={depositsQuery.isFetching}
        />
      ) : deposits.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title={filter === 'all' ? 'No deposits yet' : `No ${filter.toLowerCase()} deposits`}
          action={
            filter !== 'all' ? (
              <Button variant="outline" onClick={() => setFilter('all')}>
                View all deposits
              </Button>
            ) : undefined
          }
        />
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
    </>
  );
}
