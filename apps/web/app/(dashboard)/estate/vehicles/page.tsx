'use client';

import { RedirectToEstateSetup } from '@/components/estate/shared/RedirectToEstateSetup';
import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Car, Plus, Settings2 } from '@sureground/icons';
import {
  Button,
  CardSkeleton,
  EmptyState,
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
import {
  EstateFilterChips,
  EstateListSection,
  EstateListSkeleton,
  EstateRowList,
} from '@/components/estate/shared/EstateListSection';

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

  const activeFilter = statusFilters.find((filter) => filter.value === statusFilter)!;

  return (
    <>
      <PageHeader
        title="Vehicles"
        description={`Vehicles logged in and out at the gates of ${estate.name}.`}
        actions={
          <>
            <Button
              variant="outline"
              icon={<Settings2 className="h-4 w-4" />}
              onClick={() => setIsGatesModalOpen(true)}
            >
              Manage gates
            </Button>
            <Button
              variant="primary"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => setIsModalOpen(true)}
            >
              Log vehicle
            </Button>
          </>
        }
      />

      <EstateListSection
        id="vehicle-logs"
        title={statusFilter === 'all' ? 'Vehicle log' : activeFilter.label}
        count={isLogsLoading ? undefined : total}
        countLabel={`${total} log${total === 1 ? '' : 's'}`}
        description="Plate, driver and gate for each entry. Mark a vehicle exited when it leaves."
        toolbar={
          <EstateFilterChips label="Filter vehicles by status">
            {statusFilters.map((filter) => (
              <ToggleChip
                key={filter.value}
                size="sm"
                pressed={statusFilter === filter.value}
                onPressedChange={() => {
                  setStatusFilter(filter.value);
                  setPage(1);
                }}
              >
                {filter.label}
              </ToggleChip>
            ))}
          </EstateFilterChips>
        }
        footer={
          statusFilter !== 'exited' && total > PAGE_SIZE ? (
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
          ) : undefined
        }
      >
        {isLogsLoading ? (
          <EstateListSkeleton />
        ) : logs.length === 0 ? (
          statusFilter === 'inside' ? (
            <EmptyState
              bare
              size="compact"
              icon={Car}
              title="No vehicles inside"
              description="Every logged vehicle has been marked as exited."
            />
          ) : statusFilter === 'exited' ? (
            <EmptyState
              bare
              size="compact"
              icon={Car}
              title="No vehicles have exited"
              description="Vehicles show here once they are marked as exited."
            />
          ) : (
            <EmptyState
              bare
              icon={Car}
              title="No vehicle logs yet"
              description="Log a vehicle as it comes through the gate. Gate officers can log vehicles too."
            />
          )
        ) : (
          <EstateRowList>
            {logs.map((log) => (
              <li key={log.id}>
                <VehicleLogRow
                  log={log}
                  onMarkExited={() => markExited.mutate(log.id)}
                  isMarkingExited={markExited.isPending}
                />
              </li>
            ))}
          </EstateRowList>
        )}
      </EstateListSection>

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
