'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Siren, Plus } from 'lucide-react';
import { Button, EmptyState } from '@getrentos/ui';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import { ROUTES } from '@/lib/constants/auth';
import { useSelectedEstate } from '@/app/(dashboard)/estate/layout';
import { ReportIncidentModal } from '@/components/estate/incidents/ReportIncidentModal';
import { CloseIncidentModal } from '@/components/estate/incidents/CloseIncidentModal';
import { IncidentCard } from '@/components/estate/incidents/IncidentCard';
import type { IncidentStatus } from '@/types/estate';

const statusFilters: { value: IncidentStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'dismissed', label: 'Dismissed' },
];

export default function EstateIncidentsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | 'all'>('all');
  const [closeTarget, setCloseTarget] = useState<{
    id: string;
    action: 'resolve' | 'dismiss';
  } | null>(null);

  const { estate, isLoading: isEstateLoading } = useSelectedEstate();

  const { data: incidents = [], isLoading: isIncidentsLoading } = useQuery({
    queryKey: estateKeys.incidents(
      estate?.id ?? '',
      statusFilter === 'all' ? undefined : statusFilter
    ),
    queryFn: () =>
      unwrap(
        estateService.listIncidents(estate!.id, statusFilter === 'all' ? undefined : statusFilter)
      ),
    enabled: !!estate,
  });

  const invalidate = () => {
    if (!estate) return;
    queryClient.invalidateQueries({ queryKey: ['estate', estate.id, 'incidents'] });
  };

  const reportIncident = useMutation({
    mutationFn: (data: Parameters<typeof estateService.reportIncident>[1]) =>
      unwrap(estateService.reportIncident(estate!.id, data)),
    onSuccess: () => {
      invalidate();
      setIsReportOpen(false);
    },
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
          ? estateService.resolveIncident(estate!.id, id, resolutionNotes)
          : estateService.dismissIncident(estate!.id, id, resolutionNotes)
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Incidents</h1>
          <p className="text-muted-foreground mt-1">
            {incidents.length} incident{incidents.length === 1 ? '' : 's'} in {estate.name}
          </p>
        </div>
        <Button variant="primary" className="gap-2" onClick={() => setIsReportOpen(true)}>
          <Plus className="w-4 h-4" />
          Report Incident
        </Button>
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

      {isIncidentsLoading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />
      ) : incidents.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12">
          <EmptyState
            icon={Siren}
            title="No incidents reported"
            description="Reports from the gate — including panic alerts — will show up here."
          />
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
          {incidents.map((incident) => (
            <IncidentCard
              key={incident.id}
              incident={incident}
              onResolve={() => setCloseTarget({ id: incident.id, action: 'resolve' })}
              onDismiss={() => setCloseTarget({ id: incident.id, action: 'dismiss' })}
              isUpdating={closeMutation.isPending}
            />
          ))}
        </div>
      )}

      <ReportIncidentModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        onSubmit={(data) => reportIncident.mutate(data)}
        isSubmitting={reportIncident.isPending}
      />

      <CloseIncidentModal
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
