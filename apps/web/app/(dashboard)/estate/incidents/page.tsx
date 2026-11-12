'use client';

import { RedirectToEstateSetup } from '@/components/estate/shared/RedirectToEstateSetup';
import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Siren, Plus } from '@sureground/icons';
import {
  Button,
  CardSkeleton,
  EmptyState,
  ListSkeleton,
  ToggleChip,
  PageHeader,
  useToast,
} from '@sureground/ui';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import { useSelectedEstate } from '@/app/(dashboard)/estate/layout';
import { ReportIncidentModal } from '@/components/estate/incidents/ReportIncidentModal';
import { CloseIncidentModal } from '@/components/estate/incidents/CloseIncidentModal';
import { IncidentCard } from '@/components/estate/incidents/IncidentCard';
import { ReportDigestPanel } from '@/components/estate/incidents/ReportDigestPanel';
import { AnnouncementModal } from '@/components/estate/announcements/AnnouncementModal';
import type { IncidentStatus } from '@/types/estate';

const statusFilters: { value: IncidentStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'dismissed', label: 'Dismissed' },
];

export default function EstateIncidentsPage() {
  const queryClient = useQueryClient();
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | 'all'>('all');
  const [closeTarget, setCloseTarget] = useState<{
    id: string;
    action: 'resolve' | 'dismiss';
  } | null>(null);

  const { estate, isLoading: isEstateLoading } = useSelectedEstate();
  const [updateNotes, setUpdateNotes] = useState<string | null>(null);
  const toast = useToast();

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
    placeholderData: keepPreviousData,
  });

  const invalidate = () => {
    if (!estate) return;
    queryClient.invalidateQueries({ queryKey: ['estate', estate.id, 'incidents'] });
    queryClient.invalidateQueries({ queryKey: estateKeys.reportDigest(estate.id) });
  };

  const reportIncident = useMutation({
    mutationFn: (data: Parameters<typeof estateService.reportIncident>[1]) =>
      unwrap(estateService.reportIncident(estate!.id, data)),
    onSuccess: () => {
      invalidate();
      setIsReportOpen(false);
    },
  });

  const postUpdate = useMutation({
    mutationFn: (data: Parameters<typeof estateService.createAnnouncement>[1]) =>
      unwrap(estateService.createAnnouncement(estate!.id, data)),
    onSuccess: () => {
      toast.success('Update posted to residents.');
      queryClient.invalidateQueries({ queryKey: estateKeys.announcements(estate!.id) });
      setUpdateNotes(null);
    },
    onError: (error: Error) => toast.error(error.message || 'Could not post the update.'),
  });

  const startMutation = useMutation({
    meta: { showGlobalError: true },
    mutationFn: (id: string) => unwrap(estateService.startIncident(estate!.id, id)),
    onSuccess: () => {
      invalidate();
      toast.success('Incident marked in progress.');
    },
  });

  const closeMutation = useMutation({
    meta: { showGlobalError: true },
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
    return <CardSkeleton />;
  }

  if (!estate) return <RedirectToEstateSetup />;

  return (
    <>
      <PageHeader
        title="Incidents"
        description={
          <>
            {isIncidentsLoading ? (
              'Loading…'
            ) : (
              <>
                {incidents.length} incident{incidents.length === 1 ? '' : 's'}
              </>
            )}{' '}
            in {estate.name}
          </>
        }
        actions={
          <Button variant="primary" className="gap-2" onClick={() => setIsReportOpen(true)}>
            <Plus className="w-4 h-4" />
            Report incident
          </Button>
        }
      />

      <ReportDigestPanel estateId={estate.id} onDraftUpdate={setUpdateNotes} />

      <div
        className="flex flex-wrap gap-2 mb-6"
        role="group"
        aria-label="Filter incidents by status"
      >
        {statusFilters.map((filter) => (
          <ToggleChip
            key={filter.value}
            pressed={statusFilter === filter.value}
            onPressedChange={() => setStatusFilter(filter.value)}
          >
            {filter.label}
          </ToggleChip>
        ))}
      </div>

      {isIncidentsLoading ? (
        <ListSkeleton rows={3} />
      ) : incidents.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12">
          <EmptyState
            icon={Siren}
            title="No incidents reported"
            description="Reports from the gate: including panic alerts: will show up here."
          />
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
          {incidents.map((incident) => (
            <IncidentCard
              key={incident.id}
              incident={incident}
              onStart={() => startMutation.mutate(incident.id)}
              onResolve={() => setCloseTarget({ id: incident.id, action: 'resolve' })}
              onDismiss={() => setCloseTarget({ id: incident.id, action: 'dismiss' })}
              isUpdating={closeMutation.isPending || startMutation.isPending}
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
      <AnnouncementModal
        key={updateNotes ?? 'none'}
        estateId={estate.id}
        initialNotes={updateNotes ?? ''}
        isOpen={updateNotes !== null}
        announcement={null}
        onClose={() => setUpdateNotes(null)}
        onSubmit={(data) => postUpdate.mutate(data)}
        isSubmitting={postUpdate.isPending}
      />
    </>
  );
}
