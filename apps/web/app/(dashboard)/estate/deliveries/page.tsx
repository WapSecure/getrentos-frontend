'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Package, Plus } from 'lucide-react';
import { Button, EmptyState, Pagination } from '@getrentos/ui';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import { ROUTES } from '@/lib/constants/auth';
import { LogDeliveryModal } from '@/components/estate/deliveries/LogDeliveryModal';
import { DeliveryLogRow } from '@/components/estate/deliveries/DeliveryLogRow';
import type { DeliveryLogStatus } from '@/types/estate';

const statusFilters: { value: DeliveryLogStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'received', label: 'Awaiting Pickup' },
  { value: 'collected', label: 'Collected' },
];

const PAGE_SIZE = 10;
const HOUSEHOLD_OPTIONS_PAGE_SIZE = 20;

export default function EstateDeliveriesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<DeliveryLogStatus | 'all'>('all');
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
        purpose: 'delivery-options',
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

  const { data, isLoading: isLogsLoading } = useQuery({
    queryKey: [
      ...estateKeys.deliveries(estate?.id ?? '', statusFilter === 'all' ? undefined : statusFilter),
      { page, pageSize: PAGE_SIZE },
    ],
    queryFn: () =>
      unwrap(
        estateService.listDeliveries(estate!.id, {
          page,
          pageSize: PAGE_SIZE,
          status: statusFilter === 'all' ? undefined : statusFilter,
        })
      ),
    enabled: !!estate,
  });
  const logs = data?.items ?? [];
  const total = data?.total ?? 0;

  const invalidateLogs = () => {
    if (!estate) return;
    queryClient.invalidateQueries({ queryKey: ['estate', estate.id, 'deliveries'] });
  };

  const logDelivery = useMutation({
    mutationFn: (data: Parameters<typeof estateService.logDelivery>[1]) =>
      unwrap(estateService.logDelivery(estate!.id, data)),
    onSuccess: () => {
      invalidateLogs();
      setPage(1);
      setIsModalOpen(false);
    },
  });

  const markCollected = useMutation({
    mutationFn: (logId: string) => unwrap(estateService.markDeliveryCollected(estate!.id, logId)),
    onSuccess: () => invalidateLogs(),
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
          <h1 className="text-2xl font-bold text-foreground">Deliveries</h1>
          <p className="text-muted-foreground mt-1">
            {total} log{total === 1 ? '' : 's'} in {estate.name}
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
          Log Delivery
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

      {isLogsLoading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />
      ) : logs.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12">
          <EmptyState
            icon={Package}
            title="No deliveries yet"
            description="Log a package received at the gate for a household."
          />
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
          {logs.map((log) => (
            <DeliveryLogRow
              key={log.id}
              log={log}
              onMarkCollected={() => markCollected.mutate(log.id)}
              isMarkingCollected={markCollected.isPending}
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

      <LogDeliveryModal
        isOpen={isModalOpen}
        households={households}
        householdTotal={householdsTotal}
        householdPage={householdPage}
        householdPageSize={HOUSEHOLD_OPTIONS_PAGE_SIZE}
        onHouseholdPageChange={setHouseholdPage}
        isHouseholdsLoading={isHouseholdsLoading}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(data) => logDelivery.mutate(data)}
        isSubmitting={logDelivery.isPending}
      />
    </>
  );
}
