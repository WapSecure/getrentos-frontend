'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Receipt, Plus } from 'lucide-react';
import { Button, EmptyState, Pagination } from '@getrentos/ui';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import { ROUTES } from '@/lib/constants/auth';
import { CreateDuesModal } from '@/components/estate/dues/CreateDuesModal';
import { DueRow } from '@/components/estate/dues/DueRow';
import type { DueStatus } from '@/types/estate';

const statusFilters: { value: DueStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
];

const PAGE_SIZE = 10;
const HOUSEHOLD_OPTIONS_PAGE_SIZE = 20;

export default function EstateDuesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<DueStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [householdPage, setHouseholdPage] = useState(1);

  const { data: estate, isLoading: isEstateLoading } = useQuery({
    queryKey: estateKeys.myEstate,
    queryFn: () => unwrap(estateService.getMyEstate()),
  });

  const { data: householdsData, isLoading: isHouseholdsLoading } = useQuery({
    queryKey: [
      ...estateKeys.households(estate?.id ?? ''),
      {
        page: householdPage,
        pageSize: HOUSEHOLD_OPTIONS_PAGE_SIZE,
        status: 'active',
        purpose: 'due-options',
      },
    ],
    queryFn: () =>
      unwrap(
        estateService.listHouseholds(estate!.id, {
          page: householdPage,
          pageSize: HOUSEHOLD_OPTIONS_PAGE_SIZE,
          status: 'active',
        })
      ),
    enabled: !!estate,
  });
  const households = householdsData?.items ?? [];
  const householdsTotal = householdsData?.total ?? 0;

  const { data, isLoading: isDuesLoading } = useQuery({
    queryKey: [
      ...estateKeys.dues(estate?.id ?? '', statusFilter === 'all' ? undefined : statusFilter),
      { page, pageSize: PAGE_SIZE },
    ],
    queryFn: () =>
      unwrap(
        estateService.listDues(estate!.id, {
          page,
          pageSize: PAGE_SIZE,
          status: statusFilter === 'all' ? undefined : statusFilter,
        })
      ),
    enabled: !!estate,
  });
  const dues = data?.items ?? [];
  const total = data?.total ?? 0;

  const invalidateDues = () => {
    if (!estate) return;
    queryClient.invalidateQueries({ queryKey: ['estate', estate.id, 'dues'] });
  };

  const createDues = useMutation({
    mutationFn: (data: Parameters<typeof estateService.createDues>[1]) =>
      unwrap(estateService.createDues(estate!.id, data)),
    onSuccess: () => {
      invalidateDues();
      setPage(1);
      setIsModalOpen(false);
    },
  });

  const markPaid = useMutation({
    mutationFn: (dueId: string) => unwrap(estateService.markDuePaid(estate!.id, dueId)),
    onSuccess: () => {
      invalidateDues();
      setPage(1);
    },
  });

  if (isEstateLoading) {
    return <div className="h-32 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />;
  }

  if (!estate) {
    router.replace(ROUTES.ESTATE_SETUP);
    return null;
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dues</h1>
          <p className="text-muted-foreground mt-1">
            {total} due{total === 1 ? '' : 's'} in {estate.name}
          </p>
        </div>
        <Button
          variant="primary"
          className="gap-2"
          onClick={() => {
            setHouseholdPage(1);
            setIsModalOpen(true);
          }}
        >
          <Plus className="w-4 h-4" />
          Charge Dues
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {statusFilters.map((filter) => (
          <Button
            key={filter.value}
            variant={statusFilter === filter.value ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => {
              setStatusFilter(filter.value);
              setPage(1);
            }}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {isDuesLoading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />
      ) : dues.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12">
          <EmptyState
            icon={Receipt}
            title="No dues yet"
            description="Charge a levy or service charge to one or all households in this estate."
          />
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
          {dues.map((due) => (
            <DueRow
              key={due.id}
              due={due}
              onMarkPaid={() => markPaid.mutate(due.id)}
              isMarkingPaid={markPaid.isPending}
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

      <CreateDuesModal
        isOpen={isModalOpen}
        households={households}
        householdTotal={householdsTotal}
        householdPage={householdPage}
        householdPageSize={HOUSEHOLD_OPTIONS_PAGE_SIZE}
        onHouseholdPageChange={setHouseholdPage}
        isHouseholdsLoading={isHouseholdsLoading}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(data) => createDues.mutate(data)}
        isSubmitting={createDues.isPending}
      />
    </>
  );
}
