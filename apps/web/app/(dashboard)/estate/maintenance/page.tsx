'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Hammer } from 'lucide-react';
import { Button, EmptyState } from '@getrentos/ui';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import { ROUTES } from '@/lib/constants/auth';
import { useSelectedEstate } from '@/app/(dashboard)/estate/layout';
import { CloseMaintenanceTicketModal } from '@/components/estate/maintenance/CloseMaintenanceTicketModal';
import { MaintenanceTicketCard } from '@/components/estate/maintenance/MaintenanceTicketCard';
import type { MaintenanceTicketStatus } from '@/types/estate';

const statusFilters: { value: MaintenanceTicketStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'dismissed', label: 'Dismissed' },
];

export default function EstateMaintenancePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<MaintenanceTicketStatus | 'all'>('all');
  const [closeTarget, setCloseTarget] = useState<{
    id: string;
    action: 'resolve' | 'dismiss';
  } | null>(null);

  const { estate, isLoading: isEstateLoading } = useSelectedEstate();

  const { data: tickets = [], isLoading: isTicketsLoading } = useQuery({
    queryKey: estateKeys.maintenanceTickets(
      estate?.id ?? '',
      statusFilter === 'all' ? undefined : statusFilter
    ),
    queryFn: () =>
      unwrap(
        estateService.listMaintenanceTickets(
          estate!.id,
          statusFilter === 'all' ? undefined : statusFilter
        )
      ),
    enabled: !!estate,
  });

  const invalidate = () => {
    if (!estate) return;
    queryClient.invalidateQueries({ queryKey: ['estate', estate.id, 'maintenanceTickets'] });
  };

  const startMutation = useMutation({
    mutationFn: (ticketId: string) =>
      unwrap(estateService.startMaintenanceTicket(estate!.id, ticketId)),
    onSuccess: invalidate,
  });

  const closeMutation = useMutation({
    mutationFn: ({
      id,
      action,
      resolutionNotes,
    }: {
      id: string;
      action: 'resolve' | 'dismiss';
      resolutionNotes?: string;
    }) =>
      unwrap(
        action === 'resolve'
          ? estateService.resolveMaintenanceTicket(estate!.id, id, resolutionNotes)
          : estateService.dismissMaintenanceTicket(estate!.id, id, resolutionNotes)
      ),
    onSuccess: () => {
      invalidate();
      setCloseTarget(null);
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Maintenance</h1>
        <p className="text-muted-foreground mt-1">
          {tickets.length} ticket{tickets.length === 1 ? '' : 's'} in {estate.name}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {statusFilters.map((filter) => (
          <Button
            key={filter.value}
            variant={statusFilter === filter.value ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setStatusFilter(filter.value)}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {isTicketsLoading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />
      ) : tickets.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12">
          <EmptyState
            icon={Hammer}
            title="No maintenance tickets yet"
            description="Tickets residents report will show up here."
          />
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
          {tickets.map((ticket) => (
            <MaintenanceTicketCard
              key={ticket.id}
              ticket={ticket}
              showHousehold
              onStart={() => startMutation.mutate(ticket.id)}
              onResolve={() => setCloseTarget({ id: ticket.id, action: 'resolve' })}
              onDismiss={() => setCloseTarget({ id: ticket.id, action: 'dismiss' })}
              isUpdating={startMutation.isPending || closeMutation.isPending}
            />
          ))}
        </div>
      )}

      <CloseMaintenanceTicketModal
        isOpen={!!closeTarget}
        action={closeTarget?.action ?? null}
        onClose={() => setCloseTarget(null)}
        onConfirm={(resolutionNotes) =>
          closeTarget &&
          closeMutation.mutate({ id: closeTarget.id, action: closeTarget.action, resolutionNotes })
        }
        isSubmitting={closeMutation.isPending}
      />
    </>
  );
}
