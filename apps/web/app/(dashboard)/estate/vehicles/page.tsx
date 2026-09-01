'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Car, Plus } from 'lucide-react';
import { Button, EmptyState, Pagination } from '@getrentos/ui';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import { ROUTES } from '@/lib/constants/auth';
import { LogVehicleModal } from '@/components/estate/vehicles/LogVehicleModal';
import { VehicleLogRow } from '@/components/estate/vehicles/VehicleLogRow';

type StatusFilter = 'all' | 'inside' | 'exited';

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'inside', label: 'Currently Inside' },
  { value: 'exited', label: 'Exited' },
];

const PAGE_SIZE = 10;

export default function EstateVehiclesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);

  const { data: estate, isLoading: isEstateLoading } = useQuery({
    queryKey: estateKeys.myEstate,
    queryFn: () => unwrap(estateService.getMyEstate()),
  });

  const { data, isLoading: isLogsLoading } = useQuery({
    queryKey: [
      ...estateKeys.vehicleLogs(estate?.id ?? '', statusFilter),
      { page, pageSize: PAGE_SIZE },
    ],
    queryFn: () =>
      unwrap(
        estateService.listVehicleLogs(estate!.id, {
          page,
          pageSize: PAGE_SIZE,
          open: statusFilter === 'all' ? undefined : statusFilter === 'inside',
        })
      ),
    enabled: !!estate,
  });
  // The API only supports an "open" boolean filter — "exited" is applied client-side on this page.
  const logs = (data?.items ?? []).filter((log) =>
    statusFilter === 'exited' ? !!log.exitedAt : true
  );
  const total = statusFilter === 'exited' ? logs.length : (data?.total ?? 0);

  const invalidateLogs = () => {
    if (!estate) return;
    queryClient.invalidateQueries({ queryKey: ['estate', estate.id, 'vehicleLogs'] });
  };

  const logEntry = useMutation({
    mutationFn: (data: Parameters<typeof estateService.logVehicleEntry>[1]) =>
      unwrap(estateService.logVehicleEntry(estate!.id, data)),
    onSuccess: () => {
      invalidateLogs();
      setPage(1);
      setIsModalOpen(false);
    },
  });

  const markExited = useMutation({
    mutationFn: (logId: string) => unwrap(estateService.markVehicleExited(estate!.id, logId)),
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
          <h1 className="text-2xl font-bold text-foreground">Vehicles</h1>
          <p className="text-muted-foreground mt-1">
            {total} log{total === 1 ? '' : 's'} in {estate.name}
          </p>
        </div>
        <Button variant="primary" className="gap-2" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Log Vehicle
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
            icon={Car}
            title="No vehicle logs yet"
            description="Log a vehicle entering the estate at the gate."
          />
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
          {logs.map((log) => (
            <VehicleLogRow
              key={log.id}
              log={log}
              onMarkExited={() => markExited.mutate(log.id)}
              isMarkingExited={markExited.isPending}
            />
          ))}
        </div>
      )}

      {statusFilter !== 'exited' && total > 0 && (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
          className="mt-6"
        />
      )}

      <LogVehicleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(data) => logEntry.mutate(data)}
        isSubmitting={logEntry.isPending}
      />
    </>
  );
}
