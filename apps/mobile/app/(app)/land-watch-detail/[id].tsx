import { useState } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, View } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Badge,
  Button,
  Card,
  Chip,
  ErrorState,
  Skeleton,
  Text,
  TextField,
  useTheme,
  useToast,
  type BadgeTone,
} from '@getrentos/ui-native';
import {
  boundaryTone,
  LAND_BOUNDARY_LABELS,
  LAND_INCIDENT_KIND_LABELS,
  LAND_INCIDENT_STATUS_LABELS,
  LAND_INSPECTION_KIND_LABELS,
  LAND_INSPECTION_STATUS_LABELS,
  type LandWatchIncidentKind,
  describeDistance,
} from '@getrentos/shared';
import { qk } from '@/lib/query/keys';
import { landWatchApi } from '@/lib/api/landWatch';
import { ApiError } from '@/lib/api/client';
import { Sheet } from '@/components/Sheet';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { goBack } from '@/lib/goBack';
import { VendorWorkSection } from '@/components/landWatch/VendorWorkSection';

const KINDS: LandWatchIncidentKind[] = [
  'ENCROACHMENT',
  'BOUNDARY_DISTURBANCE',
  'CONSTRUCTION',
  'DUMPING',
  'GOVERNMENT_NOTICE',
  'OTHER',
];
const date = (iso: string) => new Date(iso).toLocaleDateString('en-NG');

/** One watched parcel or plot: reports with evidence, incidents, reminders. */
export default function LandWatchDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const [reporting, setReporting] = useState(false);
  const query = useQuery({ queryKey: qk.landWatch(id), queryFn: () => landWatchApi.get(id) });
  const paid = useMutation({
    mutationFn: (reminderId: string) => landWatchApi.reminderPaid(id, reminderId),
    onSuccess: (d) => {
      qc.setQueryData(qk.landWatch(id), d);
      toast.show('Marked paid.', 'success');
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not update that.', 'error'),
  });
  const w = query.data;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => qc.invalidateQueries({ queryKey: qk.landWatch(id) })}
            tintColor={colors.mutedForeground}
          />
        }
        contentContainerStyle={{
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing['3xl'],
          gap: spacing.lg,
        }}
      >
        <DetailHeader
          eyebrow="Land Watch"
          title={w?.land.label ?? 'Land Watch'}
          subtitle={w ? `${w.land.city}, ${w.land.state}` : undefined}
          onBack={() => goBack()}
        />
        {query.isError && !w ? (
          <ErrorState onRetry={() => query.refetch()} />
        ) : !w ? (
          <Skeleton height={240} radius={radius.lg} />
        ) : (
          <>
            <Text variant="caption" color="mutedForeground">
              {w.disclaimer}
            </Text>
            <Text variant="heading">Inspections</Text>
            {!w.inspections.length ? (
              <Text variant="callout" color="mutedForeground">
                {w.tier === 'ESSENTIAL'
                  ? 'Essential has no routine inspections.'
                  : 'Your first inspection is being arranged.'}
              </Text>
            ) : (
              w.inspections.map((i) => (
                <Card key={i.id} elevated style={{ gap: spacing.xs }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text variant="bodyStrong">{LAND_INSPECTION_KIND_LABELS[i.kind]}</Text>
                      <Text variant="caption" color="mutedForeground">
                        {i.reference}
                        {i.inspector ? ` · ${i.inspector.name}` : ''}
                        {i.report?.submittedAt ? ` · ${date(i.report.submittedAt)}` : ''}
                      </Text>
                    </View>
                    {i.report?.boundaryCondition ? (
                      <Badge
                        label={LAND_BOUNDARY_LABELS[i.report.boundaryCondition]}
                        tone={boundaryTone(i.report.boundaryCondition) as BadgeTone}
                      />
                    ) : (
                      <Badge label={LAND_INSPECTION_STATUS_LABELS[i.status]} tone="neutral" />
                    )}
                  </View>
                  {i.report ? (
                    <>
                      {i.report.beaconsExpected != null ? (
                        <Text variant="callout">
                          Beacons found: {i.report.beaconsFound ?? '—'} of{' '}
                          {i.report.beaconsExpected}
                        </Text>
                      ) : null}
                      <Text variant="callout">{i.report.summary}</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                        {i.report.evidence
                          .filter((e) => e.mimeType.startsWith('image/'))
                          .map((e) => (
                            <View key={e.id} style={{ width: 96, gap: 2 }}>
                              <Image
                                source={{ uri: e.url }}
                                style={{ width: 96, height: 96, borderRadius: radius.md }}
                                accessibilityLabel={`Photo taken ${date(e.capturedAt)}`}
                              />
                              <Text variant="caption" color="mutedForeground">
                                {describeDistance(e.distanceM)}
                              </Text>
                            </View>
                          ))}
                      </View>
                    </>
                  ) : null}
                </Card>
              ))
            )}

            <Text variant="heading">Incidents</Text>
            {w.incidents.map((i) => (
              <Card key={i.id} style={{ gap: spacing.xs }}>
                <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
                  <Text variant="bodyStrong" style={{ flex: 1 }}>
                    {LAND_INCIDENT_KIND_LABELS[i.kind]}
                  </Text>
                  <Badge
                    label={LAND_INCIDENT_STATUS_LABELS[i.status]}
                    tone={
                      i.status === 'OPEN'
                        ? 'warning'
                        : i.status === 'DISMISSED'
                          ? 'neutral'
                          : 'danger'
                    }
                  />
                </View>
                <Text variant="callout" color="mutedForeground">
                  {i.description}
                </Text>
                {i.resolutionNote ? (
                  <Text variant="callout">GetRentos: {i.resolutionNote}</Text>
                ) : null}
              </Card>
            ))}
            {w.status !== 'CANCELLED' ? (
              <Button
                label="Report a problem"
                variant="secondary"
                onPress={() => setReporting(true)}
              />
            ) : null}

            <VendorWorkSection watchId={w.id} tier={w.tier} status={w.status} />

            <Text variant="heading">Reminders</Text>
            {!w.reminders.length ? (
              <Text variant="callout" color="mutedForeground">
                Add land use charge or ground rent dates on the website.
              </Text>
            ) : (
              w.reminders.map((r) => (
                <Card
                  key={r.id}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text variant="bodyStrong">{r.label}</Text>
                    <Text variant="caption" color="mutedForeground">
                      {date(r.dueDate)}
                      {r.annual ? ' · yearly' : ''}
                      {r.amountNaira != null ? ` · ₦${r.amountNaira.toLocaleString('en-NG')}` : ''}
                    </Text>
                  </View>
                  <Button
                    label="Paid"
                    size="sm"
                    variant="secondary"
                    loading={paid.isPending && paid.variables === r.id}
                    onPress={() => paid.mutate(r.id)}
                  />
                </Card>
              ))
            )}
          </>
        )}
      </ScrollView>
      <Sheet open={reporting} onClose={() => setReporting(false)} title="Report a problem">
        {reporting ? <IncidentForm id={id} onDone={() => setReporting(false)} /> : null}
      </Sheet>
    </View>
  );
}

function IncidentForm({ id, onDone }: { id: string; onDone: () => void }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [kind, setKind] = useState<LandWatchIncidentKind | null>(null);
  const [description, setDescription] = useState('');
  const submit = useMutation({
    mutationFn: () =>
      landWatchApi.reportIncident(id, {
        kind: kind as LandWatchIncidentKind,
        description: description.trim(),
        requestInspection: true,
      }),
    onSuccess: (d) => {
      qc.setQueryData(qk.landWatch(id), d);
      qc.invalidateQueries({ queryKey: qk.landWatches });
      toast.show('Reported. An inspector will be sent to look.', 'success');
      onDone();
    },
  });
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ gap: spacing.md }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
          {KINDS.map((k) => (
            <Chip
              key={k}
              label={LAND_INCIDENT_KIND_LABELS[k]}
              selected={kind === k}
              onPress={() => setKind(k)}
            />
          ))}
        </View>
        <TextField
          label="What you saw or were told"
          value={description}
          onChangeText={setDescription}
          multiline
          required
          hint={description.trim().length < 10 ? 'At least 10 characters' : undefined}
          error={
            submit.error
              ? submit.error instanceof ApiError
                ? submit.error.message
                : 'That didn’t go through. Try again.'
              : null
          }
        />
        <Button
          label="Report"
          disabled={!kind || description.trim().length < 10}
          loading={submit.isPending}
          onPress={() => submit.mutate()}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
