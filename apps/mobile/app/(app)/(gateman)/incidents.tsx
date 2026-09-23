import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ImagePlus, Siren, TriangleAlert, X } from 'lucide-react-native';
import {
  Badge,
  type BadgeTone,
  Button,
  Card,
  Chip,
  EmptyState,
  Screen,
  Skeleton,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { useGatemanPost } from '@/lib/gateman/GatemanPostProvider';
import {
  gatemanApi,
  PANIC_DESCRIPTION,
  type IncidentCategory,
  type IncidentPriority,
} from '@/lib/api/gateman';
import type { PickedFile } from '@/lib/api/documents';
import { qk } from '@/lib/query/keys';
import { relativeTime } from '@/lib/format';
import { capturePhoto, pickPhoto } from '@/lib/filePicker';
import { haptics } from '@/lib/haptics';

// `Record<…>` on purpose: these mappers lowercase the raw enum for display, so a
// new backend member should fail the build here rather than surface as a raw
// token like "other" in the list.
const CATEGORY_LABEL: Record<IncidentCategory, string> = {
  security: 'Security',
  maintenance: 'Maintenance',
  safety: 'Safety',
  other: 'Other',
};

const PRIORITY_LABEL: Record<IncidentPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

const CATEGORY_OPTIONS = (Object.keys(CATEGORY_LABEL) as IncidentCategory[]).map((value) => ({
  value,
  label: CATEGORY_LABEL[value],
}));

const PRIORITY_OPTIONS = (Object.keys(PRIORITY_LABEL) as IncidentPriority[]).map((value) => ({
  value,
  label: PRIORITY_LABEL[value],
}));

const PRIORITY_TONE: Record<IncidentPriority, BadgeTone> = {
  low: 'neutral',
  medium: 'info',
  high: 'warning',
  critical: 'danger',
};

export default function GatemanIncidents() {
  const { colors, spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();

  const [category, setCategory] = useState<IncidentCategory>('other');
  const [priority, setPriority] = useState<IncidentPriority>('medium');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<PickedFile | null>(null);
  const [panicSent, setPanicSent] = useState(false);

  const { estate, isLoading: isPostLoading } = useGatemanPost();

  const openQuery = useQuery({
    queryKey: qk.gateman.incidents(estate?.id ?? ''),
    queryFn: () => gatemanApi.listIncidents(estate!.id, 'open'),
    enabled: !!estate,
  });
  const open = openQuery.data ?? [];

  const invalidate = () => {
    if (estate) void qc.invalidateQueries({ queryKey: qk.gateman.incidents(estate.id) });
  };

  const report = useMutation({
    mutationFn: () =>
      gatemanApi.reportIncident(estate!.id, {
        description: description.trim(),
        category: category.toUpperCase() as Uppercase<IncidentCategory>,
        priority: priority.toUpperCase() as Uppercase<IncidentPriority>,
        photo: photo ?? undefined,
      }),
    onSuccess: () => {
      void haptics.success();
      setCategory('other');
      setPriority('medium');
      setDescription('');
      setPhoto(null);
      invalidate();
      toast.show('Incident reported.', 'success');
    },
    onError: (error) =>
      toast.show(
        error instanceof Error ? error.message : 'Could not report that incident.',
        'error'
      ),
  });

  const panic = useMutation({
    mutationFn: () =>
      gatemanApi.reportIncident(estate!.id, {
        description: PANIC_DESCRIPTION,
        category: 'SECURITY',
        priority: 'CRITICAL',
      }),
    onSuccess: () => {
      void haptics.success();
      setPanicSent(true);
      invalidate();
    },
    onError: () => toast.show('Could not raise the alarm. Call the manager.', 'error'),
  });

  const attachPhoto = async (from: 'camera' | 'library') => {
    const picked = from === 'camera' ? await capturePhoto() : await pickPhoto();
    if (picked) setPhoto(picked);
  };

  if (isPostLoading) {
    return (
      <Screen>
        <Skeleton height={280} radius={16} />
      </Screen>
    );
  }

  if (!estate) {
    return (
      <Screen>
        <EmptyState
          icon={<Siren size={34} color={colors.mutedForeground} />}
          title="No gate assigned yet"
          description="Your estate manager hasn't posted you to a gate yet."
        />
      </Screen>
    );
  }

  return (
    <Screen refreshing={openQuery.isRefetching} onRefresh={openQuery.refetch}>
      <View style={{ alignItems: 'center', gap: spacing.xs, marginTop: spacing.md }}>
        <Text variant="title" center>
          {estate.name}
        </Text>
        <Text variant="callout" color="mutedForeground" center>
          Report an incident or raise the alarm.
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Panic alert"
        disabled={panic.isPending}
        onPress={() => panic.mutate()}
        style={{
          borderRadius: 20,
          backgroundColor: colors.destructive,
          paddingVertical: spacing['2xl'],
          alignItems: 'center',
          gap: spacing.xs,
          opacity: panic.isPending ? 0.6 : 1,
        }}
      >
        <TriangleAlert size={32} color="#fff" />
        <Text variant="title" style={{ color: '#fff' }}>
          {panic.isPending ? 'Sending…' : 'PANIC ALERT'}
        </Text>
        <Text variant="caption" style={{ color: 'rgba(255,255,255,0.85)' }} center>
          Tap to immediately notify the estate manager
        </Text>
      </Pressable>

      {panicSent ? (
        <Text variant="caption" center style={{ color: colors.destructive }}>
          Alert sent — the estate manager has been notified.
        </Text>
      ) : null}

      <Card elevated>
        <Text variant="bodyStrong">Report an incident</Text>

        <View style={{ gap: spacing.sm }}>
          <Text variant="caption" color="mutedForeground" style={{ marginLeft: 4 }}>
            Category
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {CATEGORY_OPTIONS.map((opt) => (
              <Chip
                key={opt.value}
                label={opt.label}
                selected={category === opt.value}
                onPress={() => setCategory(opt.value)}
              />
            ))}
          </View>
        </View>

        <View style={{ gap: spacing.sm }}>
          <Text variant="caption" color="mutedForeground" style={{ marginLeft: 4 }}>
            Priority
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {PRIORITY_OPTIONS.map((opt) => (
              <Chip
                key={opt.value}
                label={opt.label}
                selected={priority === opt.value}
                onPress={() => setPriority(opt.value)}
              />
            ))}
          </View>
        </View>

        <TextField
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="What happened, where, and who's involved…"
          multiline
          numberOfLines={4}
        />

        <View style={{ gap: spacing.sm }}>
          <Text variant="caption" color="mutedForeground" style={{ marginLeft: 4 }}>
            Photo{' '}
            <Text variant="caption" color="mutedForeground">
              (optional)
            </Text>
          </Text>
          {photo ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: spacing.md,
              }}
            >
              <Text variant="caption" numberOfLines={1} style={{ flex: 1 }}>
                {photo.name}
              </Text>
              <Button
                label="Remove"
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
                label="Camera"
                variant="outline"
                size="sm"
                fullWidth={false}
                icon={<ImagePlus size={14} color={colors.foreground} />}
                onPress={() => void attachPhoto('camera')}
              />
              <Button
                label="Library"
                variant="outline"
                size="sm"
                fullWidth={false}
                onPress={() => void attachPhoto('library')}
              />
            </View>
          )}
        </View>

        <Button
          label={report.isPending ? 'Reporting…' : 'Report Incident'}
          loading={report.isPending}
          fullWidth
          disabled={!description.trim()}
          onPress={() => report.mutate()}
          style={{ marginTop: spacing.xs }}
        />
      </Card>

      <View style={{ gap: spacing.md }}>
        <Text variant="bodyStrong">Open incidents ({open.length})</Text>
        {openQuery.isLoading ? (
          <Skeleton height={64} radius={16} />
        ) : open.length === 0 ? (
          <Card>
            <Text variant="caption" color="mutedForeground">
              No open incidents right now.
            </Text>
          </Card>
        ) : (
          open.map((incident) => (
            <Card key={incident.id} elevated>
              <View style={{ gap: spacing.sm }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: spacing.md,
                  }}
                >
                  <Text variant="bodyStrong" style={{ flex: 1 }}>
                    {CATEGORY_LABEL[incident.category]}
                  </Text>
                  <Badge
                    label={PRIORITY_LABEL[incident.priority]}
                    tone={PRIORITY_TONE[incident.priority] ?? 'neutral'}
                  />
                </View>
                <Text variant="caption">{incident.description}</Text>
                <Text variant="caption" color="mutedForeground">
                  {relativeTime(incident.createdAt)}
                </Text>
              </View>
            </Card>
          ))
        )}
      </View>
    </Screen>
  );
}
