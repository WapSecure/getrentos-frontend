import { useState } from 'react';
import { Pressable, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2, ClipboardCheck } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  Divider,
  EmptyState,
  ErrorState,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { qk } from '@/lib/query/keys';
import {
  inspectionsApi,
  INSPECTION_TYPE_LABEL,
  ROOM_CONDITION_LABEL,
  ROOM_CONDITION_TONE,
  type Inspection,
} from '@/lib/api/inspections';
import { ApiError } from '@/lib/api/client';
import { formatDate } from '@/lib/format';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';

export default function Inspections() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<Inspection | null>(null);

  const query = useQuery({ queryKey: qk.renter.inspections, queryFn: inspectionsApi.list });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Property condition"
        title="Inspection reports"
        subtitle="Review move-in, periodic and move-out records"
        onBack={() => router.back()}
      />

      {query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : query.isLoading ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          {[0, 1].map((i) => (
            <Skeleton key={i} height={90} radius={radius.lg} />
          ))}
        </View>
      ) : !query.data?.length ? (
        <EmptyState
          icon={<ClipboardCheck size={34} color={colors.mutedForeground} />}
          title="No inspection reports"
          description="Move-in, move-out and periodic inspection reports from your landlord's agent will appear here."
        />
      ) : (
        <FlashList
          data={query.data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }: { item: Inspection }) => (
            <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}>
              <Pressable onPress={() => setSelected(item)}>
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
                      <Text variant="bodyStrong">
                        {INSPECTION_TYPE_LABEL[item.type]} inspection
                      </Text>
                      <Text variant="caption" color="mutedForeground">
                        {item.property.title} · {formatDate(item.scheduledAt, 'short')}
                      </Text>
                    </View>
                    <Badge
                      label={item.acknowledgedAt ? 'Reviewed' : 'Needs review'}
                      tone={item.acknowledgedAt ? 'success' : 'warning'}
                    />
                  </View>
                </Card>
              </Pressable>
            </View>
          )}
          contentContainerStyle={{
            paddingTop: spacing.sm,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => query.refetch()}
              tintColor={colors.mutedForeground}
            />
          }
        />
      )}

      <InspectionDetailSheet inspection={selected} onClose={() => setSelected(null)} />
    </View>
  );
}

function InspectionDetailSheet({
  inspection,
  onClose,
}: {
  inspection: Inspection | null;
  onClose: () => void;
}) {
  const { colors, spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();

  const mutation = useMutation({
    mutationFn: (id: string) => inspectionsApi.acknowledge(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.renter.inspections });
      toast.show('Marked as reviewed.', 'success');
      onClose();
    },
    onError: (err) =>
      toast.show(
        err instanceof ApiError ? err.message : 'Could not acknowledge this report.',
        'error'
      ),
  });

  return (
    <Sheet
      open={!!inspection}
      onClose={onClose}
      title={inspection ? `${INSPECTION_TYPE_LABEL[inspection.type]} inspection` : undefined}
    >
      {inspection ? (
        <View style={{ gap: spacing.lg }}>
          <Text variant="caption" color="mutedForeground">
            {inspection.property.title} · {formatDate(inspection.scheduledAt, 'short')}
          </Text>

          {inspection.overallCondition ? (
            <Card elevated>
              <Text variant="bodyStrong">Overall condition</Text>
              <Text variant="callout" color="mutedForeground" style={{ marginTop: 4 }}>
                {inspection.overallCondition}
              </Text>
            </Card>
          ) : null}

          <Card elevated padding="none">
            {inspection.rooms.map((room, i) => (
              <View key={room.room}>
                {i > 0 ? <Divider /> : null}
                <View style={{ padding: spacing.lg, gap: 4 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Text variant="bodyStrong">{room.room}</Text>
                    <Badge
                      label={ROOM_CONDITION_LABEL[room.condition]}
                      tone={ROOM_CONDITION_TONE[room.condition]}
                    />
                  </View>
                  {room.notes ? (
                    <Text variant="caption" color="mutedForeground">
                      {room.notes}
                    </Text>
                  ) : null}
                  {room.photoCount ? (
                    <Text variant="caption" color="mutedForeground">
                      {room.photoCount} {room.photoCount === 1 ? 'photo' : 'photos'}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))}
          </Card>

          {inspection.acknowledgedAt ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={14} color={colors.success} />
              <Text variant="caption" color="mutedForeground">
                Reviewed {formatDate(inspection.acknowledgedAt, 'short')}
              </Text>
            </View>
          ) : (
            <>
              <Text variant="caption" color="mutedForeground">
                Confirming you&apos;ve reviewed this record does not waive your right to dispute it.
              </Text>
              <Button
                label="Confirm I reviewed this record"
                loading={mutation.isPending}
                onPress={() => mutation.mutate(inspection.id)}
              />
            </>
          )}
        </View>
      ) : null}
    </Sheet>
  );
}
