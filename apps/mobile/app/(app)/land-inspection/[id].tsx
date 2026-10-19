import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, CloudOff, MapPin, Navigation, Trash2 } from 'lucide-react-native';
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
} from '@getrentos/ui-native';
import {
  LAND_BOUNDARY_LABELS,
  LAND_INSPECTION_KIND_LABELS,
  landPoint,
  type LandBoundaryCondition,
  describeDistance,
} from '@getrentos/shared';
import { qk } from '@/lib/query/keys';
import { landWatchApi } from '@/lib/api/landWatch';
import { ApiError } from '@/lib/api/client';
import { capturePhoto } from '@/lib/filePicker';
import { locateRecording } from '@/lib/filmedOnSite';
import {
  discardCapture,
  enqueueCapture,
  flushCaptures,
  loadCaptureQueue,
  newClientRef,
  useCaptureQueue,
} from '@/lib/inspectionCaptureQueue';
import { DetailHeader } from '@/components/dashboard/DetailHeader';

const CONDITIONS: LandBoundaryCondition[] = ['INTACT', 'DISTURBED', 'ENCROACHED', 'INCONCLUSIVE'];
const OPEN = new Set(['ASSIGNED', 'QUERIED']);

/**
 * One inspection in the field: directions, photos with time and place (queued
 * when there is no signal), and the report.
 */
export default function LandInspectionJob() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const qc = useQueryClient();
  const query = useQuery({ queryKey: qk.landInspection(id), queryFn: () => landWatchApi.job(id) });
  const pending = useCaptureQueue(id);
  const [capturing, setCapturing] = useState(false);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: qk.landInspection(id) });
    qc.invalidateQueries({ queryKey: qk.landInspections });
  };
  const drain = async () => {
    const { uploaded } = await flushCaptures();
    if (uploaded) refresh();
  };

  useEffect(() => {
    void loadCaptureQueue().then(drain);
    // Back in signal: send what was captured without it.
    return NetInfo.addEventListener((s) => {
      if (s.isConnected) void drain();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const capture = async () => {
    setCapturing(true);
    try {
      const photo = await capturePhoto();
      if (!photo) return;
      const [fix, net] = await Promise.all([locateRecording(), NetInfo.fetch()]);
      await enqueueCapture({
        clientRef: newClientRef(),
        inspectionId: id,
        sourceUri: photo.uri,
        name: `capture-${Date.now()}.jpg`,
        mimeType: photo.mimeType ?? 'image/jpeg',
        capturedAt: new Date().toISOString(),
        lat: fix?.latitude,
        lng: fix?.longitude,
        capturedOffline: !net.isConnected,
      });
      if (!fix) toast.show('Saved without a location. Turn location on for the next one.', 'error');
      await drain();
    } catch {
      toast.show('That photo could not be saved.', 'error');
    } finally {
      setCapturing(false);
    }
  };

  const job = query.data;
  const point = job ? landPoint(job.land.location) : null;
  const open = job ? OPEN.has(job.status) : false;
  const waiting = pending.filter((p) => !p.error);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => query.refetch()}
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
          eyebrow={job ? job.reference : 'Inspection'}
          title={job?.land.label ?? 'Land inspection'}
          subtitle={job ? `${LAND_INSPECTION_KIND_LABELS[job.kind]} · ${job.land.city}` : undefined}
          onBack={() => router.back()}
        />
        {query.isError && !job ? (
          <ErrorState onRetry={() => query.refetch()} />
        ) : !job ? (
          <Skeleton height={220} radius={radius.lg} />
        ) : (
          <>
            {job.staffNote ? (
              <Card style={{ backgroundColor: colors.secondary }}>
                <Text variant="callout">GetRentos asks: {job.staffNote}</Text>
              </Card>
            ) : null}
            <Card elevated style={{ gap: spacing.sm }}>
              <View style={{ flexDirection: 'row', gap: spacing.xs, alignItems: 'center' }}>
                <MapPin size={16} color={colors.mutedForeground} />
                <Text variant="caption" color="mutedForeground" style={{ flex: 1 }}>
                  {job.land.address}, {job.land.city}, {job.land.state}
                </Text>
              </View>
              {job.instructions ? <Text variant="callout">“{job.instructions}”</Text> : null}
              {job.dueBy ? (
                <Text variant="caption" color="mutedForeground">
                  Due {new Date(job.dueBy).toLocaleDateString('en-NG')}
                </Text>
              ) : null}
              {point ? (
                <Button
                  label="Directions to the land"
                  variant="secondary"
                  icon={<Navigation size={16} color={colors.foreground} />}
                  onPress={() =>
                    Linking.openURL(
                      `https://www.google.com/maps/dir/?api=1&destination=${point.lat},${point.lng}`
                    )
                  }
                />
              ) : null}
            </Card>

            <Card elevated style={{ gap: spacing.sm }}>
              <Text variant="heading">Photos</Text>
              <Text variant="caption" color="mutedForeground">
                Take them on the land with location on. With no signal they wait on this phone and
                upload when you are back online.
              </Text>
              {job.evidence?.length ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                  {job.evidence.map((e) => (
                    <View key={e.id} style={{ width: 92, gap: 2 }}>
                      {e.mimeType.startsWith('image/') ? (
                        <Image
                          source={{ uri: e.url }}
                          style={{ width: 92, height: 92, borderRadius: radius.md }}
                        />
                      ) : null}
                      <Text variant="caption" color="mutedForeground">
                        {describeDistance(e.distanceM)}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
              {waiting.length ? (
                <View style={{ flexDirection: 'row', gap: spacing.xs, alignItems: 'center' }}>
                  <CloudOff size={16} color={colors.mutedForeground} />
                  <Text variant="caption" color="mutedForeground">
                    {waiting.length} waiting to upload
                  </Text>
                </View>
              ) : null}
              {pending
                .filter((p) => p.error)
                .map((p) => (
                  <View
                    key={p.clientRef}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
                  >
                    <Text variant="caption" color="destructive" style={{ flex: 1 }}>
                      Not accepted: {p.error}
                    </Text>
                    <Button
                      label="Discard"
                      variant="ghost"
                      size="sm"
                      icon={<Trash2 size={14} color={colors.foreground} />}
                      onPress={() => void discardCapture(p.clientRef)}
                    />
                  </View>
                ))}
              {open ? (
                <Button
                  label="Take a photo"
                  icon={<Camera size={16} color={colors.primaryForeground} />}
                  loading={capturing}
                  onPress={capture}
                />
              ) : null}
            </Card>

            {open ? (
              <ReportForm id={id} waiting={waiting.length} onFiled={refresh} />
            ) : job.report ? (
              <Card elevated style={{ gap: spacing.xs }}>
                <Text variant="heading">Your report</Text>
                <Badge
                  label={
                    job.report.boundaryCondition
                      ? LAND_BOUNDARY_LABELS[job.report.boundaryCondition]
                      : 'Filed'
                  }
                  tone="info"
                />
                <Text variant="callout">{job.report.summary}</Text>
              </Card>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function ReportForm({
  id,
  waiting,
  onFiled,
}: {
  id: string;
  waiting: number;
  onFiled: () => void;
}) {
  const { spacing } = useTheme();
  const toast = useToast();
  const [condition, setCondition] = useState<LandBoundaryCondition | null>(null);
  const [expected, setExpected] = useState('');
  const [found, setFound] = useState('');
  const [summary, setSummary] = useState('');
  const submit = useMutation({
    mutationFn: async () => {
      const fix = await locateRecording();
      return landWatchApi.submit(id, {
        boundaryCondition: condition as LandBoundaryCondition,
        beaconsExpected: expected ? Number(expected) : undefined,
        beaconsFound: found ? Number(found) : undefined,
        summary: summary.trim(),
        lat: fix?.latitude,
        lng: fix?.longitude,
      });
    },
    onSuccess: () => {
      toast.show('Report filed. GetRentos reviews it before the owner sees it.', 'success');
      onFiled();
    },
    onError: (err) =>
      toast.show(
        err instanceof ApiError ? err.message : 'That didn’t go through. Try again.',
        'error'
      ),
  });
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Card elevated style={{ gap: spacing.md }}>
        <Text variant="heading">Report</Text>
        <Text variant="callout" color="mutedForeground">
          The boundary
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
          {CONDITIONS.map((c) => (
            <Chip
              key={c}
              label={LAND_BOUNDARY_LABELS[c]}
              selected={condition === c}
              onPress={() => setCondition(c)}
            />
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <TextField
              label="Beacons on survey"
              value={expected}
              onChangeText={setExpected}
              keyboardType="number-pad"
            />
          </View>
          <View style={{ flex: 1 }}>
            <TextField
              label="Beacons found"
              value={found}
              onChangeText={setFound}
              keyboardType="number-pad"
            />
          </View>
        </View>
        <TextField
          label="What you found"
          value={summary}
          onChangeText={setSummary}
          multiline
          hint={summary.trim().length < 20 ? 'At least 20 characters' : undefined}
        />
        {waiting ? (
          <Text variant="caption" color="mutedForeground">
            {waiting} photo{waiting === 1 ? '' : 's'} still uploading. File once they are in.
          </Text>
        ) : null}
        <Button
          label="File the report"
          disabled={!condition || summary.trim().length < 20 || waiting > 0}
          loading={submit.isPending}
          onPress={() => submit.mutate()}
        />
        <Text variant="caption" color="mutedForeground">
          Your location is recorded when you file. File from the land.
        </Text>
      </Card>
    </KeyboardAvoidingView>
  );
}
