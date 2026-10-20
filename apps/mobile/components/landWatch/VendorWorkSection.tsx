import { View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Hammer } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  ErrorState,
  ListSkeleton,
  PressableScale,
  Text,
  useTheme,
} from '@getrentos/ui-native';
import {
  LAND_WATCH_JOB_KIND_LABELS,
  LAND_WATCH_JOB_STATUS_LABELS,
  type LandWatchJob,
  type LandWatchStatus,
  type LandWatchTier,
} from '@getrentos/shared';
import { qk } from '@/lib/query/keys';
import { landWatchApi } from '@/lib/api/landWatch';

/** Jobs that still take one of the watch's five open slots. */
const OPEN = new Set<LandWatchJob['status']>(['REQUESTED', 'QUOTED', 'APPROVED', 'IN_PROGRESS']);
const MAX_OPEN = 5;

/**
 * Vendor work on a watched parcel: fencing, clearing, beacons. GetRentos finds
 * vendors and records the work; the owner pays the vendor. Managed only.
 */
export function VendorWorkSection({
  watchId,
  tier,
  status,
}: {
  watchId: string;
  tier: LandWatchTier;
  status: LandWatchStatus;
}) {
  const { colors, spacing } = useTheme();
  const managed = tier === 'MANAGED';
  const jobs = useQuery({
    queryKey: qk.landWatchJobs(watchId),
    queryFn: () => landWatchApi.watchJobs(watchId),
    enabled: managed,
  });

  if (!managed) {
    return (
      <View style={{ gap: spacing.sm }}>
        <Text variant="heading">Vendor work</Text>
        <Text variant="callout" color="mutedForeground">
          Fencing, clearing, security and beacon work arranged for you comes with Managed.
        </Text>
      </View>
    );
  }

  const list = jobs.data ?? [];
  const open = list.filter((j) => OPEN.has(j.status)).length;
  const canAsk = status === 'ACTIVE' && open < MAX_OPEN;

  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="heading">Vendor work</Text>
      {jobs.isError && !jobs.data ? (
        <ErrorState
          title="Couldn’t load vendor work"
          description="Check your connection and try again."
          onRetry={() => jobs.refetch()}
        />
      ) : jobs.isPending ? (
        <ListSkeleton rows={2} variant="card" height={72} />
      ) : !list.length ? (
        <Text variant="callout" color="mutedForeground">
          Ask for fencing, clearing or other work. We find vendors and post their quotes here; you
          choose one and pay them directly.
        </Text>
      ) : (
        list.map((j) => {
          const s = LAND_WATCH_JOB_STATUS_LABELS[j.status];
          const kind = LAND_WATCH_JOB_KIND_LABELS[j.kind];
          return (
            <PressableScale
              key={j.id}
              accessibilityRole="button"
              accessibilityLabel={`${kind}, ${j.reference}, ${s.label}`}
              accessibilityHint="Opens the job"
              onPress={() =>
                router.push({
                  pathname: '/(app)/land-watch-job/[id]',
                  params: { id: j.id, watchId },
                })
              }
            >
              <Card style={{ gap: spacing.xs }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text variant="bodyStrong">{kind}</Text>
                    <Text variant="caption" color="mutedForeground">
                      {j.reference}
                    </Text>
                  </View>
                  <Badge label={s.label} tone={s.tone} />
                  <ChevronRight size={18} color={colors.mutedForeground} />
                </View>
                <Text variant="callout" color="mutedForeground" numberOfLines={2}>
                  {j.description}
                </Text>
              </Card>
            </PressableScale>
          );
        })
      )}
      {status === 'ACTIVE' ? (
        <>
          <Button
            label="Ask for work"
            variant="secondary"
            icon={<Hammer size={18} color={colors.foreground} />}
            disabled={!canAsk}
            onPress={() =>
              router.push({ pathname: '/(app)/land-watch-job-new/[watchId]', params: { watchId } })
            }
          />
          {!canAsk && jobs.data ? (
            <Text variant="caption" color="mutedForeground">
              You have {MAX_OPEN} jobs open. Finish or cancel one to ask for more.
            </Text>
          ) : null}
        </>
      ) : null}
    </View>
  );
}
