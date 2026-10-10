import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ImagePlus, Plus, ShieldAlert, X } from 'lucide-react-native';
import {
  Button,
  Chip,
  FormAlert,
  IconButton,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import type { PickedFile } from '@/lib/api/documents';
import { gatemanApi, type IncidentCategory, type IncidentPriority } from '@/lib/api/gateman';
import { capturePhoto, pickPhoto } from '@/lib/filePicker';
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
  const [reporting, setReporting] = useState(false);
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
        subtitle="Reported by residents, the gate and you"
        accessory={
          <IconButton
            accessibilityLabel="Report an incident"
            disabled={!estateId}
            icon={<Plus size={20} color={colors.primary} />}
            onPress={() => setReporting(true)}
          />
        }
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
      <Sheet open={reporting} onClose={() => setReporting(false)} title="Report an incident">
        {reporting ? <ReportForm estateId={estateId} onDone={() => setReporting(false)} /> : null}
      </Sheet>
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

const CATEGORIES: { value: IncidentCategory; label: string }[] = [
  { value: 'security', label: 'Security' },
  { value: 'safety', label: 'Safety' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'other', label: 'Other' },
];
const PRIORITIES: { value: IncidentPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

/** Something the manager saw on a walk round: a broken light, a gap in the fence. */
function ReportForm({ estateId, onDone }: { estateId: string; onDone: () => void }) {
  const { colors, spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [category, setCategory] = useState<IncidentCategory>('security');
  const [priority, setPriority] = useState<IncidentPriority>('medium');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<PickedFile | null>(null);

  const report = useMutation({
    mutationFn: () =>
      gatemanApi.reportIncident(estateId, {
        description: description.trim(),
        category: category.toUpperCase() as Uppercase<IncidentCategory>,
        priority: priority.toUpperCase() as Uppercase<IncidentPriority>,
        photo: photo ?? undefined,
      }),
    onSuccess: () => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: qk.estateManager.incidents(estateId) });
      toast.show('Incident reported.', 'success');
      onDone();
    },
  });

  const attach = async (from: 'camera' | 'library') => {
    const picked = from === 'camera' ? await capturePhoto() : await pickPhoto();
    if (picked) setPhoto(picked);
  };

  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ gap: spacing.xs }}>
        <Text variant="label">What kind</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {CATEGORIES.map((c) => (
            <Chip
              key={c.value}
              label={c.label}
              selected={category === c.value}
              onPress={() => setCategory(c.value)}
            />
          ))}
        </View>
      </View>
      <View style={{ gap: spacing.xs }}>
        <Text variant="label">How urgent</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {PRIORITIES.map((p) => (
            <Chip
              key={p.value}
              label={p.label}
              selected={priority === p.value}
              onPress={() => setPriority(p.value)}
            />
          ))}
        </View>
      </View>
      <TextField
        label="What happened"
        value={description}
        onChangeText={setDescription}
        placeholder="What, where, and who’s involved"
        multiline
        numberOfLines={4}
        maxLength={2000}
      />
      {photo ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <Text variant="caption" numberOfLines={1} style={{ flex: 1 }}>
            {photo.name}
          </Text>
          <Button
            label="Remove photo"
            variant="ghost"
            size="sm"
            fullWidth={false}
            icon={<X size={14} color={colors.foreground} />}
            onPress={() => setPhoto(null)}
          />
        </View>
      ) : (
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Button
            label="Take a photo"
            variant="outline"
            size="sm"
            fullWidth={false}
            icon={<ImagePlus size={14} color={colors.foreground} />}
            onPress={() => void attach('camera')}
          />
          <Button
            label="From library"
            variant="outline"
            size="sm"
            fullWidth={false}
            onPress={() => void attach('library')}
          />
        </View>
      )}
      {report.error ? (
        <FormAlert message={errorText(report.error, 'Could not report the incident.')} />
      ) : null}
      <Button
        label="Report incident"
        disabled={description.trim().length < 3}
        loading={report.isPending}
        onPress={() => report.mutate()}
      />
    </View>
  );
}
