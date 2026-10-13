import { useState } from 'react';
import { Alert, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Wrench } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Skeleton,
  Text,
  TextField,
  useTheme,
  useToast,
  type BadgeTone,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { agentApi, type AgentWorkOrder, type AgentWorkOrderStatus } from '@/lib/api/agent';
import { ApiError } from '@/lib/api/client';
import { capturePhoto, pickPhoto } from '@/lib/filePicker';
import { DetailHeader } from '@/components/dashboard/DetailHeader';

const STATUS_META: Record<AgentWorkOrderStatus, { label: string; tone: BadgeTone }> = {
  SUBMITTED: { label: 'To do', tone: 'neutral' },
  ASSIGNED: { label: 'To do', tone: 'neutral' },
  IN_PROGRESS: { label: 'In progress', tone: 'warning' },
  RESOLVED: { label: 'Resolved', tone: 'success' },
  CANCELLED: { label: 'Cancelled', tone: 'neutral' },
};

export default function AgentWorkOrders() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [completingId, setCompletingId] = useState<string | null>(null);
  const [report, setReport] = useState('');
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: qk.agent.workOrders,
    queryFn: () => agentApi.workOrders(),
  });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: qk.agent.workOrders });

  const start = useMutation({
    mutationFn: (id: string) => agentApi.startWorkOrder(id),
    onSuccess: () => {
      invalidate();
      toast.show('Work started.', 'success');
    },
    onError: (e) => toast.show(e instanceof ApiError ? e.message : 'Unable to start.', 'error'),
  });

  const complete = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      agentApi.completeWorkOrder(id, note),
    onSuccess: () => {
      invalidate();
      setCompletingId(null);
      setReport('');
      toast.show('Reported done — the owner can review it.', 'success');
    },
    onError: (e) => toast.show(e instanceof ApiError ? e.message : 'Unable to complete.', 'error'),
  });

  const addPhoto = async (id: string) => {
    const source = await new Promise<'camera' | 'library' | null>((resolve) => {
      Alert.alert('Add a photo', 'Capture on-site evidence for this job.', [
        { text: 'Take photo', onPress: () => resolve('camera') },
        { text: 'Choose from library', onPress: () => resolve('library') },
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
      ]);
    });
    if (!source) return;
    const file = await (source === 'camera' ? capturePhoto() : pickPhoto());
    if (!file) return;
    setUploadingId(id);
    try {
      await agentApi.addWorkOrderPhoto(id, file);
      invalidate();
    } catch (e) {
      toast.show(e instanceof ApiError ? e.message : 'Upload failed.', 'error');
    } finally {
      setUploadingId(null);
    }
  };

  const items = query.data ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.sm,
        }}
      >
        <DetailHeader
          eyebrow="Field operations"
          title="Work orders"
          subtitle="On-site jobs assigned to you. Start, add photos, report done — the owner closes it."
          onBack={() => router.back()}
        />
      </View>

      {query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : query.isLoading ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          {[0, 1].map((i) => (
            <Skeleton key={i} height={140} radius={radius.md} />
          ))}
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Wrench size={34} color={colors.mutedForeground} />}
          title="No work orders assigned"
          description="When a property owner assigns you an on-site maintenance job, it shows up here."
        />
      ) : (
        <FlashList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }: { item: AgentWorkOrder }) => {
            const meta = STATUS_META[item.status];
            const startable = item.status === 'SUBMITTED' || item.status === 'ASSIGNED';
            const inProgress = item.status === 'IN_PROGRESS';
            const isCompleting = completingId === item.id;
            return (
              <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}>
                <Card elevated>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: spacing.sm,
                    }}
                  >
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text variant="bodyStrong" numberOfLines={2}>
                        {item.issueTitle}
                      </Text>
                      <Text variant="caption" color="mutedForeground">
                        {item.propertyTitle} · {item.unitName} · {item.category}
                      </Text>
                    </View>
                    <Badge label={meta.label} tone={meta.tone} />
                  </View>

                  <Text variant="caption" color="mutedForeground" style={{ marginTop: spacing.xs }}>
                    {item.description}
                  </Text>

                  {item.fieldReport ? (
                    <Text variant="caption" style={{ marginTop: spacing.xs }}>
                      Your report: {item.fieldReport}
                    </Text>
                  ) : null}

                  {item.photos.length > 0 ? (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ gap: spacing.xs, marginTop: spacing.sm }}
                    >
                      {item.photos.map((p, i) => (
                        <Image
                          key={i}
                          source={{ uri: p.url }}
                          style={{ width: 64, height: 64, borderRadius: radius.md }}
                          contentFit="cover"
                        />
                      ))}
                    </ScrollView>
                  ) : null}

                  {startable ? (
                    <View style={{ marginTop: spacing.md }}>
                      <Button
                        label="Start"
                        loading={start.isPending && start.variables === item.id}
                        disabled={start.isPending && start.variables === item.id}
                        onPress={() => start.mutate(item.id)}
                      />
                    </View>
                  ) : null}

                  {inProgress && !isCompleting ? (
                    <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
                      <Button
                        label={uploadingId === item.id ? 'Uploading…' : 'Add photo'}
                        variant="secondary"
                        loading={uploadingId === item.id}
                        onPress={() => addPhoto(item.id)}
                      />
                      {!item.fieldCompletedAt ? (
                        <Button
                          label="Mark done"
                          variant="outline"
                          onPress={() => {
                            setCompletingId(item.id);
                            setReport('');
                          }}
                        />
                      ) : null}
                    </View>
                  ) : null}

                  {isCompleting ? (
                    <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
                      <TextField
                        label="Completion note"
                        value={report}
                        onChangeText={setReport}
                        placeholder="e.g. Replaced the washer; tap no longer drips."
                        multiline
                        editable={!complete.isPending}
                      />
                      {item.photos.length === 0 ? (
                        <Text variant="caption" color="mutedForeground">
                          Add a completion photo when the result can be shown visually.
                        </Text>
                      ) : null}
                      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                        <Button
                          label="Report done"
                          loading={complete.isPending}
                          disabled={complete.isPending || !report.trim()}
                          onPress={() => complete.mutate({ id: item.id, note: report })}
                        />
                        <Button
                          label="Cancel"
                          variant="ghost"
                          disabled={complete.isPending}
                          onPress={() => {
                            setCompletingId(null);
                            setReport('');
                          }}
                        />
                      </View>
                    </View>
                  ) : null}
                </Card>
              </View>
            );
          }}
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing['3xl'] }}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => query.refetch()}
              tintColor={colors.mutedForeground}
            />
          }
        />
      )}
    </View>
  );
}
