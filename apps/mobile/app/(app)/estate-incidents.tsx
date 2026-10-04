import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldAlert } from 'lucide-react-native';
import { Button, useTheme, useToast } from '@getrentos/ui-native';
import { errorText } from '@/components/estate/EstateUI';
import { CloseSheet, QueueCard, QueueScreen, type QueueView } from '@/components/estate/Triage';
import { useEstate } from '@/hooks/useEstate';
import {
  INCIDENT_PRIORITY_TONE,
  byUrgency,
  categoryLabel,
  estateManagerApi,
  isOpenItem,
  type Incident,
} from '@/lib/api/estateManager';
import { haptics } from '@/lib/haptics';
import { qk } from '@/lib/query/keys';

/** What residents and the gate have reported, most urgent first. */
export default function EstateIncidents() {
  const { colors } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const { estate, estateId } = useEstate();
  const [view, setView] = useState<QueueView>('open');
  const [closing, setClosing] = useState<{ item: Incident; how: 'resolve' | 'dismiss' } | null>(
    null
  );

  const query = useQuery({
    queryKey: qk.estateManager.incidents(estateId),
    queryFn: () => estateManagerApi.incidents(estateId),
    enabled: !!estateId,
  });
  const open = useMemo(
    () => byUrgency((query.data ?? []).filter((i) => isOpenItem(i.status))),
    [query.data]
  );
  const closed = useMemo(
    () => (query.data ?? []).filter((i) => !isOpenItem(i.status)),
    [query.data]
  );

  const close = useMutation({
    mutationFn: (v: { item: Incident; how: 'resolve' | 'dismiss'; notes: string }) =>
      estateManagerApi.closeIncident(estateId, v.item.id, v.how, v.notes || undefined),
    onSuccess: (_i, v) => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: qk.estateManager.incidents(estateId) });
      toast.show(v.how === 'resolve' ? 'Incident resolved.' : 'Incident dismissed.', 'success');
      setClosing(null);
    },
    onError: (e) => {
      qc.invalidateQueries({ queryKey: qk.estateManager.incidents(estateId) });
      toast.show(errorText(e, 'Could not close this incident.'), 'error');
    },
  });

  return (
    <>
      <QueueScreen
        eyebrow={estate?.name ?? 'Safety'}
        title="Incidents"
        subtitle="Reported by residents and the gate"
        query={query}
        items={view === 'open' ? open : closed}
        view={view}
        onView={setView}
        openCount={open.length}
        icon={<ShieldAlert size={34} color={colors.mutedForeground} />}
        emptyOpen={{
          title: 'No open incidents',
          description: 'Anything a resident or guard reports shows up here straight away.',
        }}
        emptyClosed={{
          title: 'Nothing closed yet',
          description: 'Resolved and dismissed incidents are kept here.',
        }}
        renderItem={(i) => (
          <QueueCard
            title={`${categoryLabel(i.category)} incident`}
            description={i.description}
            createdAt={i.createdAt}
            photoUrl={i.photoUrl}
            notes={i.resolutionNotes}
            pills={[
              {
                label: `${categoryLabel(i.priority)} priority`,
                tone: INCIDENT_PRIORITY_TONE[i.priority] ?? 'neutral',
              },
              ...(isOpenItem(i.status)
                ? []
                : [
                    {
                      label: categoryLabel(i.status),
                      tone: i.status === 'resolved' ? ('success' as const) : ('neutral' as const),
                    },
                  ]),
            ]}
            actions={
              isOpenItem(i.status) ? (
                <>
                  <Button
                    label="Resolve"
                    size="sm"
                    style={{ flex: 1 }}
                    onPress={() => setClosing({ item: i, how: 'resolve' })}
                  />
                  <Button
                    label="Dismiss"
                    size="sm"
                    variant="ghost"
                    style={{ flex: 1 }}
                    onPress={() => setClosing({ item: i, how: 'dismiss' })}
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
        what="incident"
        busy={close.isPending}
        onClose={() => setClosing(null)}
        onConfirm={(notes) => closing && close.mutate({ ...closing, notes })}
      />
    </>
  );
}
