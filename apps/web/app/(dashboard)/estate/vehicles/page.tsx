'use client';

import { RedirectToEstateSetup } from '@/components/estate/shared/RedirectToEstateSetup';
import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Car, Plus, Settings2 } from 'lucide-react';
import {
  Button,
  CardSkeleton,
  EmptyState,
  ListSkeleton,
  Pagination,
  ToggleChip,
  PageHeader,
} from '@sureground/ui';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import { useSelectedEstate } from '@/app/(dashboard)/estate/layout';
import { LogVehicleModal } from '@/components/estate/vehicles/LogVehicleModal';
import { VehicleLogRow } from '@/components/estate/vehicles/VehicleLogRow';
import { ManageGatesModal } from '@/components/estate/gates/ManageGatesModal';

type StatusFilter = 'all' | 'inside' | 'exited';

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'inside', label: 'Currently inside' },
  { value: 'exited', label: 'Exited' },
];

const PAGE_SIZE = 10;

export default function EstateVehiclesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGatesModalOpen, setIsGatesModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);

  const { estate, isLoading: isEstateLoading } = useSelectedEstate();

  const { data: gates } = useQuery({
    queryKey: estateKeys.gates(estate?.id ?? ''),
    queryFn: () => unwrap(estateService.listGates(estate!.id)),
    enabled: !!estate,
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
    placeholderData: keepPreviousData,
  });
  // The API only filters by "open"; "exited" is applied here.
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
    return <CardSkeleton />;
  }

  if (!estate) return <RedirectToEstateSetup />;

  return (
    <>
      <PageHeader
        title="Vehicles"
        description={
          <>
            {isLogsLoading ? (
              'Loading…'
            ) : (
              <>
                {total} log{total === 1 ? '' : 's'}
              </>
            )}{' '}
            in {estate.name}
          </>
        }
        actions={
          <>
            <Button variant="outline" className="gap-2" onClick={() => setIsGatesModalOpen(true)}>
              <Settings2 className="w-4 h-4" />
              Manage gates
            </Button>
            <Button variant="primary" className="gap-2" onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4" />
              Log vehicle
            </Button>
          </>
        }
      />

      <div
        className="flex flex-wrap gap-2 mb-6"
        role="group"
        aria-label="Filter vehicles by status"
      >
        {statusFilters.map((filter) => (
          <ToggleChip
            key={filter.value}
            pressed={statusFilter === filter.value}
            onPressedChange={() => {
              setStatusFilter(filter.value);
              setPage(1);
            }}
          >
            {filter.label}
          </ToggleChip>
        ))}
      </div>

      {isLogsLoading ? (
        <ListSkeleton rows={3} />
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
        gates={gates}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(data) => logEntry.mutate(data)}
        isSubmitting={logEntry.isPending}
      />

      <ManageGatesModal
        isOpen={isGatesModalOpen}
        estateId={estate.id}
        onClose={() => setIsGatesModalOpen(false)}
      />
    </>
  );
}
