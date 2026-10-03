import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Wrench } from 'lucide-react-native';
import { Button, useTheme, useToast } from '@getrentos/ui-native';
import { errorText } from '@/components/estate/EstateUI';
import { CloseSheet, QueueCard, QueueScreen, type QueueView } from '@/components/estate/Triage';
import { useEstate } from '@/hooks/useEstate';
import {
  TICKET_PRIORITY_TONE,
  byUrgency,
  categoryLabel,
  estateManagerApi,
  isOpenItem,
  type MaintenanceTicket,
} from '@/lib/api/estateManager';
import { haptics } from '@/lib/haptics';
import { qk } from '@/lib/query/keys';

/** Repairs residents asked for: pick one up, then close it with what was done. */
export default function EstateMaintenance() {
  const { colors } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const { estate, estateId } = useEstate();
  const [view, setView] = useState<QueueView>('open');
  const [closing, setClosing] = useState<{
    item: MaintenanceTicket;
    how: 'resolve' | 'dismiss';
  } | null>(null);

  const query = useQuery({
    queryKey: qk.estateManager.maintenance(estateId),
    queryFn: () => estateManagerApi.maintenance(estateId),
    enabled: !!estateId,
  });
  const open = useMemo(
    () => byUrgency((query.data ?? []).filter((t) => isOpenItem(t.status))),
    [query.data]
  );
  const closed = useMemo(
    () => (query.data ?? []).filter((t) => !isOpenItem(t.status)),
    [query.data]
  );

  const refreshQueue = () =>
    qc.invalidateQueries({ queryKey: qk.estateManager.maintenance(estateId) });
  const start = useMutation({
    mutationFn: (t: MaintenanceTicket) => estateManagerApi.startMaintenance(estateId, t.id),
    onSuccess: () => {
      void haptics.success();
      refreshQueue();
      toast.show('In progress. The resident has been told.', 'success');
    },
    onError: (e) => {
      refreshQueue();
      toast.show(errorText(e, 'Could not start this ticket.'), 'error');
    },
  });
  const close = useMutation({
    mutationFn: (v: { item: MaintenanceTicket; how: 'resolve' | 'dismiss'; notes: string }) =>
      estateManagerApi.closeMaintenance(estateId, v.item.id, v.how, v.notes || undefined),
    onSuccess: (_t, v) => {
      void haptics.success();
      refreshQueue();
      toast.show(
        v.how === 'resolve'
          ? 'Resolved. The resident has been told.'
          : 'Dismissed. The resident has been told.',
        'success'
      );
      setClosing(null);
    },
    onError: (e) => {
      refreshQueue();
      toast.show(errorText(e, 'Could not close this ticket.'), 'error');
    },
  });

  return (
    <>
      <QueueScreen
        eyebrow={estate?.name ?? 'Operations'}
        title="Maintenance"
        subtitle="Repairs residents have asked for"
        query={query}
        items={view === 'open' ? open : closed}
        view={view}
        onView={setView}
        openCount={open.length}
        icon={<Wrench size={34} color={colors.mutedForeground} />}
        emptyOpen={{
          title: 'No open tickets',
          description:
            'When a resident reports a fault in a shared area or their home, it lands here.',
        }}
        emptyClosed={{
          title: 'Nothing closed yet',
          description: 'Finished and dismissed tickets are kept here.',
        }}
        renderItem={(t) => (
          <QueueCard
            title={`${categoryLabel(t.category)}`}
            where={`${t.unitLabel} · ${t.residentName}`}
            description={t.description}
            createdAt={t.createdAt}
            photoUrl={t.photoUrl}
            notes={t.resolutionNotes}
            pills={[
              {
                label: `${categoryLabel(t.priority)} priority`,
                tone: TICKET_PRIORITY_TONE[t.priority] ?? 'neutral',
              },
              {
                label: t.status === 'open' ? 'New' : categoryLabel(t.status),
                tone:
                  t.status === 'open'
                    ? 'warning'
                    : t.status === 'in_progress'
                      ? 'info'
                      : t.status === 'resolved'
                        ? 'success'
                        : 'neutral',
              },
            ]}
            actions={
              isOpenItem(t.status) ? (
                <>
                  {t.status === 'open' ? (
                    <Button
                      label="Start"
                      size="sm"
                      style={{ flex: 1 }}
                      loading={start.isPending && start.variables?.id === t.id}
                      onPress={() => start.mutate(t)}
                    />
                  ) : null}
                  <Button
                    label="Resolve"
                    size="sm"
                    variant={t.status === 'open' ? 'secondary' : 'primary'}
                    style={{ flex: 1 }}
                    onPress={() => setClosing({ item: t, how: 'resolve' })}
                  />
                  <Button
                    label="Dismiss"
                    size="sm"
                    variant="ghost"
                    style={{ flex: 1 }}
                    onPress={() => setClosing({ item: t, how: 'dismiss' })}
                  />
                </>
              ) : undefined
            }
          />
        )}
      />
      <CloseSheet
        open={!!closing}
        how={closing?.how ?? 'resolve'}
        what="ticket"
        busy={close.isPending}
        onClose={() => setClosing(null)}
        onConfirm={(notes) => closing && close.mutate({ ...closing, notes })}
      />
    </>
  );
}
