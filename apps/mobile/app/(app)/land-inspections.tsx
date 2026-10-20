import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ClipboardList } from 'lucide-react-native';
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  Skeleton,
  Text,
  useTheme,
  type BadgeTone,
} from '@getrentos/ui-native';
import { LAND_INSPECTION_KIND_LABELS, type LandInspectionStatus } from '@getrentos/shared';
import { qk } from '@/lib/query/keys';
import { landWatchApi } from '@/lib/api/landWatch';
import { useCaptureQueue } from '@/lib/inspectionCaptureQueue';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { goBack } from '@/lib/goBack';

const WORDS: Partial<Record<LandInspectionStatus, [string, BadgeTone]>> = {
  ASSIGNED: ['To do', 'info'],
  QUERIED: ['Questions to answer', 'warning'],
  SUBMITTED: ['Filed', 'neutral'],
  ESCALATED: ['Filed · being checked', 'neutral'],
  ACCEPTED: ['Accepted', 'success'],
  CANCELLED: ['Called off', 'neutral'],
};

/** Land inspections GetRentos has assigned to me. */
export default function LandInspections() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const query = useQuery({ queryKey: qk.landInspections, queryFn: landWatchApi.jobs });
  const queued = useCaptureQueue();
  const items = query.data ?? [];
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
          eyebrow="Land"
          title="Inspections"
          subtitle="Visits assigned to you"
          onBack={() => goBack()}
        />
        {query.isError && !query.data ? (
          <ErrorState onRetry={() => query.refetch()} />
        ) : query.isPending ? (
          <Skeleton height={140} radius={radius.lg} />
        ) : !items.length ? (
          <EmptyState
            icon={<ClipboardList size={34} color={colors.mutedForeground} />}
            title="Nothing assigned"
            description="New inspections appear here."
          />
        ) : (
          items.map((j) => {
            const [label, tone] = WORDS[j.status] ?? [j.status, 'neutral' as BadgeTone];
            const waiting = queued.filter((q) => q.inspectionId === j.id && !q.error).length;
            return (
              <Pressable
                key={j.id}
                accessibilityRole="button"
                onPress={() =>
                  router.push({ pathname: '/(app)/land-inspection/[id]', params: { id: j.id } })
                }
              >
                <Card elevated style={{ gap: spacing.xs }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text variant="bodyStrong">{j.land.label}</Text>
                      <Text variant="caption" color="mutedForeground">
                        {j.reference} · {LAND_INSPECTION_KIND_LABELS[j.kind]} · {j.land.city}
                      </Text>
                    </View>
                    <Badge label={label} tone={tone} />
                  </View>
                  {j.dueBy ? (
                    <Text variant="caption" color="mutedForeground">
                      Due {new Date(j.dueBy).toLocaleDateString('en-NG')}
                    </Text>
                  ) : null}
                  {waiting ? (
                    <Text variant="caption" color="mutedForeground">
                      {waiting} photo{waiting === 1 ? '' : 's'} waiting to upload
                    </Text>
                  ) : null}
                </Card>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
