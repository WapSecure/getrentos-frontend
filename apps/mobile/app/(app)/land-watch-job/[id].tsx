import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { FileText, Phone, SearchCheck } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  DetailSkeleton,
  EmptyState,
  ErrorState,
  Text,
  TextField,
  useTheme,
  useToast,
  type BadgeTone,
} from '@getrentos/ui-native';
import {
  LAND_WATCH_JOB_KIND_LABELS,
  LAND_WATCH_JOB_PAYMENT_NOTE,
  LAND_WATCH_JOB_STATUS_LABELS,
  type LandWatchJob,
  type LandWatchJobQuote,
  type LandWatchJobQuoteStatus,
} from '@getrentos/shared';
import { qk } from '@/lib/query/keys';
import { landWatchApi } from '@/lib/api/landWatch';
import { ApiError } from '@/lib/api/client';
import { formatNaira } from '@/lib/format';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { haptics } from '@/lib/haptics';
import { goBack } from '@/lib/goBack';

const date = (iso: string) => new Date(iso).toLocaleDateString('en-NG');
const expired = (q: LandWatchJobQuote) =>
  !!q.validUntil && new Date(q.validUntil).getTime() < Date.now();
const QUOTE_STATUS: Record<LandWatchJobQuoteStatus, { label: string; tone: BadgeTone }> = {
  OFFERED: { label: 'Offered', tone: 'warning' },
  ACCEPTED: { label: 'Accepted', tone: 'success' },
  DECLINED: { label: 'Declined', tone: 'neutral' },
  WITHDRAWN: { label: 'Withdrawn', tone: 'neutral' },
};
const CANCELLABLE = new Set<LandWatchJob['status']>(['REQUESTED', 'QUOTED', 'APPROVED']);
const MIN_REASON = 5;

type Action =
  | { type: 'accept'; quoteId: string }
  | { type: 'decline'; quoteId: string }
  | { type: 'check' }
  | { type: 'cancel'; reason: string };

const SUCCESS: Record<Action['type'], string> = {
  accept: 'Quote accepted. Contact the vendor to arrange payment.',
  decline: 'Quote declined.',
  check: 'Independent check booked.',
  cancel: 'Job cancelled.',
};

/** One vendor job on a Managed watch: quotes to choose from, then proof of the work. */
export default function LandWatchJobScreen() {
  const { id, watchId } = useLocalSearchParams<{ id: string; watchId: string }>();
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState('');

  const query = useQuery({
    queryKey: qk.landWatchJobs(watchId),
    queryFn: () => landWatchApi.watchJobs(watchId),
    enabled: !!watchId,
  });
  const job = query.data?.find((j) => j.id === id);

  const act = useMutation({
    mutationFn: (a: Action) => {
      switch (a.type) {
        case 'accept':
          return landWatchApi.acceptQuote(watchId, id, a.quoteId);
        case 'decline':
          return landWatchApi.declineQuote(watchId, id, a.quoteId);
        case 'check':
          return landWatchApi.requestJobCheck(watchId, id);
        case 'cancel':
          return landWatchApi.cancelJob(watchId, id, a.reason);
      }
    },
    onSuccess: (updated, a) => {
      void haptics.success();
      qc.setQueryData<LandWatchJob[]>(qk.landWatchJobs(watchId), (list) =>
        list?.map((j) => (j.id === updated.id ? updated : j))
      );
      // The watch prefix covers the jobs list too; a check also adds an inspection.
      qc.invalidateQueries({ queryKey: qk.landWatch(watchId) });
      toast.show(SUCCESS[a.type], 'success');
      if (a.type === 'cancel') {
        setCancelling(false);
        setReason('');
      }
    },
    onError: (e) => {
      void haptics.error();
      toast.show(
        e instanceof ApiError ? e.message : 'That didn’t go through. Check your connection.',
        'error'
      );
    },
  });
  const pending = (type: Action['type'], quoteId?: string) =>
    act.isPending &&
    act.variables?.type === type &&
    (!quoteId || ('quoteId' in act.variables && act.variables.quoteId === quoteId));

  const confirmAccept = (q: LandWatchJobQuote) =>
    Alert.alert(
      `Accept ${formatNaira(q.amountNaira)} from ${q.vendorName}?`,
      `${LAND_WATCH_JOB_PAYMENT_NOTE}\n\nOther quotes on this job will be declined.`,
      [
        { text: 'Not yet', style: 'cancel' },
        { text: 'Accept quote', onPress: () => act.mutate({ type: 'accept', quoteId: q.id }) },
      ]
    );

  const confirmDecline = (q: LandWatchJobQuote) =>
    Alert.alert(`Decline ${q.vendorName}’s quote?`, 'You can’t undo this.', [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Decline',
        style: 'destructive',
        onPress: () => act.mutate({ type: 'decline', quoteId: q.id }),
      },
    ]);

  const status = job ? LAND_WATCH_JOB_STATUS_LABELS[job.status] : null;
  const accepted = job?.quotes.find((q) => q.status === 'ACCEPTED');
  const images = job?.proof.filter((p) => p.mimeType.startsWith('image/')) ?? [];
  const files = job?.proof.filter((p) => !p.mimeType.startsWith('image/')) ?? [];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
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
          eyebrow="Vendor work"
          title={job ? LAND_WATCH_JOB_KIND_LABELS[job.kind] : 'Vendor work'}
          subtitle={job?.reference}
          onBack={() => goBack()}
        />

        {query.isError && !query.data ? (
          <ErrorState onRetry={() => query.refetch()} />
        ) : query.isPending ? (
          <DetailSkeleton />
        ) : !job || !status ? (
          <EmptyState
            title="Job not found"
            description="It may have been removed. Go back to the watch to see its jobs."
          />
        ) : (
          <>
            <Card style={{ gap: spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Text variant="caption" color="mutedForeground" style={{ flex: 1 }}>
                  Asked {date(job.createdAt)}
                </Text>
                <Badge label={status.label} tone={status.tone} />
              </View>
              <Text variant="callout">{job.description}</Text>
              {job.status === 'CANCELLED' && job.cancelReason ? (
                <Text variant="callout" color="mutedForeground">
                  Cancelled{job.cancelledAt ? ` ${date(job.cancelledAt)}` : ''}: {job.cancelReason}
                </Text>
              ) : null}
            </Card>

            {accepted ? (
              <Card elevated style={{ gap: spacing.sm }}>
                <Text variant="heading">Your vendor</Text>
                <Text variant="bodyStrong">
                  {accepted.vendorName} · {formatNaira(accepted.amountNaira)}
                </Text>
                {accepted.vendorPhone ? (
                  <Button
                    label={`Call ${accepted.vendorPhone}`}
                    variant="secondary"
                    accessibilityLabel={`Call ${accepted.vendorName} on ${accepted.vendorPhone}`}
                    icon={<Phone size={18} color={colors.foreground} />}
                    onPress={() =>
                      Linking.openURL(`tel:${accepted.vendorPhone!.replace(/\s+/g, '')}`).catch(
                        () => toast.show('This device can’t make calls.', 'error')
                      )
                    }
                  />
                ) : null}
                <Text variant="caption" color="mutedForeground">
                  {LAND_WATCH_JOB_PAYMENT_NOTE}
                </Text>
              </Card>
            ) : null}

            <Text variant="heading">Quotes</Text>
            {!job.quotes.length ? (
              <Text variant="callout" color="mutedForeground">
                {job.status === 'CANCELLED'
                  ? 'No quotes came in.'
                  : 'We’re finding vendors. Their quotes will appear here.'}
              </Text>
            ) : (
              job.quotes.map((q) => {
                const qs = QUOTE_STATUS[q.status];
                const old = expired(q);
                const choosable = job.status === 'QUOTED' && q.status === 'OFFERED';
                return (
                  <Card key={q.id} style={{ gap: spacing.xs }}>
                    <View
                      style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}
                    >
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text variant="bodyStrong">{q.vendorName}</Text>
                        <Text variant="subheading">{formatNaira(q.amountNaira)}</Text>
                      </View>
                      <Badge
                        label={old && q.status === 'OFFERED' ? 'Expired' : qs.label}
                        tone={old && q.status === 'OFFERED' ? 'neutral' : qs.tone}
                      />
                    </View>
                    <Text variant="callout">{q.scope}</Text>
                    {q.validUntil ? (
                      <Text variant="caption" color="mutedForeground">
                        {old ? 'Expired' : 'Valid until'} {date(q.validUntil)}
                      </Text>
                    ) : null}
                    {choosable ? (
                      <View
                        style={{
                          flexDirection: 'row',
                          flexWrap: 'wrap',
                          gap: spacing.sm,
                          marginTop: spacing.xs,
                        }}
                      >
                        <Button
                          label="Accept"
                          size="sm"
                          fullWidth={false}
                          style={{ flexGrow: 1 }}
                          accessibilityLabel={`Accept ${q.vendorName}’s quote of ${formatNaira(q.amountNaira)}`}
                          disabled={old || act.isPending}
                          loading={pending('accept', q.id)}
                          onPress={() => confirmAccept(q)}
                        />
                        <Button
                          label="Decline"
                          size="sm"
                          variant="outline"
                          fullWidth={false}
                          style={{ flexGrow: 1 }}
                          accessibilityLabel={`Decline ${q.vendorName}’s quote`}
                          disabled={act.isPending}
                          loading={pending('decline', q.id)}
                          onPress={() => confirmDecline(q)}
                        />
                      </View>
                    ) : null}
                  </Card>
                );
              })
            )}

            {job.proof.length || job.completionNote ? (
              <>
                <Text variant="heading">Proof of work</Text>
                {images.length ? (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                    {images.map((p) => (
                      <Pressable
                        key={p.id}
                        accessibilityRole="imagebutton"
                        accessibilityLabel={`Open photo ${p.fileName}${p.note ? `: ${p.note}` : ''}`}
                        onPress={() => Linking.openURL(p.url)}
                      >
                        <Image
                          source={{ uri: p.url }}
                          contentFit="cover"
                          style={{
                            width: 96,
                            height: 96,
                            borderRadius: radius.md,
                            backgroundColor: colors.secondary,
                          }}
                        />
                      </Pressable>
                    ))}
                  </View>
                ) : null}
                {files.map((p) => (
                  <Pressable
                    key={p.id}
                    accessibilityRole="link"
                    accessibilityLabel={`Open ${p.fileName}`}
                    onPress={() => Linking.openURL(p.url)}
                  >
                    <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                      <FileText size={20} color={colors.mutedForeground} />
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text variant="bodyStrong" numberOfLines={1}>
                          {p.fileName}
                        </Text>
                        <Text variant="caption" color="mutedForeground" numberOfLines={2}>
                          {p.note ? `${p.note} · ` : ''}
                          {date(p.createdAt)}
                        </Text>
                      </View>
                    </Card>
                  </Pressable>
                ))}
                {job.completionNote ? (
                  <Text variant="callout">
                    Completed{job.completedAt ? ` ${date(job.completedAt)}` : ''}:{' '}
                    {job.completionNote}
                  </Text>
                ) : null}
              </>
            ) : null}

            {job.status === 'COMPLETED' ? (
              job.checkInspectionId ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <Badge label="Check booked" tone="success" />
                  <Text variant="caption" color="mutedForeground" style={{ flex: 1 }}>
                    An inspector will look at the work. The report appears under Inspections.
                  </Text>
                </View>
              ) : (
                <View style={{ gap: spacing.xs }}>
                  <Button
                    label="Ask for an independent check"
                    variant="secondary"
                    icon={<SearchCheck size={18} color={colors.foreground} />}
                    loading={pending('check')}
                    disabled={act.isPending}
                    onPress={() => act.mutate({ type: 'check' })}
                  />
                  <Text variant="caption" color="mutedForeground">
                    A GetRentos inspector, not the vendor, visits to confirm the work was done.
                  </Text>
                </View>
              )
            ) : null}

            {CANCELLABLE.has(job.status) ? (
              cancelling ? (
                <Card style={{ gap: spacing.md }}>
                  <TextField
                    label="Why are you cancelling?"
                    value={reason}
                    onChangeText={setReason}
                    multiline
                    required
                    maxLength={1000}
                    hint={
                      reason.trim().length < MIN_REASON
                        ? `At least ${MIN_REASON} characters`
                        : undefined
                    }
                  />
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                    <Button
                      label="Keep the job"
                      variant="outline"
                      fullWidth={false}
                      style={{ flexGrow: 1 }}
                      disabled={pending('cancel')}
                      onPress={() => setCancelling(false)}
                    />
                    <Button
                      label="Cancel job"
                      variant="destructive"
                      fullWidth={false}
                      style={{ flexGrow: 1 }}
                      loading={pending('cancel')}
                      disabled={reason.trim().length < MIN_REASON || act.isPending}
                      onPress={() => act.mutate({ type: 'cancel', reason: reason.trim() })}
                    />
                  </View>
                </Card>
              ) : (
                <Button
                  label="Cancel this job"
                  variant="ghost"
                  disabled={act.isPending}
                  onPress={() => setCancelling(true)}
                />
              )
            ) : null}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
