import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Eye, Plus } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Skeleton,
  Text,
  useTheme,
} from '@getrentos/ui-native';
import { LAND_WATCH_TIER_LABELS } from '@getrentos/shared';
import { qk } from '@/lib/query/keys';
import { landWatchApi } from '@/lib/api/landWatch';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { goBack } from '@/lib/goBack';

/** Land I watch: inspection reports, incidents and reminders. */
export default function LandWatch() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const query = useQuery({ queryKey: qk.landWatches, queryFn: landWatchApi.mine });
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
          title="Land Watch"
          subtitle="Independent eyes on land you own"
          onBack={() => goBack()}
        />
        {query.isError && !query.data ? (
          <ErrorState onRetry={() => query.refetch()} />
        ) : query.isPending ? (
          <Skeleton height={140} radius={radius.lg} />
        ) : !items.length ? (
          <>
            <EmptyState
              icon={<Eye size={34} color={colors.mutedForeground} />}
              title="Nothing watched yet"
              description="Get independent inspections, incident alerts and payment reminders for a parcel you own or a plot you bought."
            />
            <Button
              label="Watch land"
              icon={<Plus size={18} color={colors.primaryForeground} />}
              onPress={() => router.push('/(app)/land-watch-new')}
            />
          </>
        ) : (
          <>
            <Button
              label="Watch more land"
              variant="outline"
              size="sm"
              icon={<Plus size={16} color={colors.foreground} />}
              onPress={() => router.push('/(app)/land-watch-new')}
              style={{ alignSelf: 'flex-start' }}
            />
            {items.map((w) => (
              <Pressable
                key={w.id}
                accessibilityRole="button"
                accessibilityLabel={`${w.land.label}, ${w.land.city}, ${w.land.state}`}
                onPress={() =>
                  router.push({ pathname: '/(app)/land-watch-detail/[id]', params: { id: w.id } })
                }
              >
                <Card elevated style={{ gap: spacing.xs }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text variant="bodyStrong">{w.land.label}</Text>
                      <Text variant="caption" color="mutedForeground">
                        {w.land.city}, {w.land.state}
                      </Text>
                    </View>
                    <Badge
                      label={`${LAND_WATCH_TIER_LABELS[w.tier].label}${w.status === 'PAUSED' ? ' · paused' : ''}`}
                      tone={w.status === 'ACTIVE' ? 'success' : 'neutral'}
                    />
                  </View>
                  <Text variant="caption" color="mutedForeground">
                    Last inspection{' '}
                    {w.lastInspection
                      ? new Date(w.lastInspection).toLocaleDateString('en-NG')
                      : 'none yet'}
                    {w.nextInspectionDue
                      ? ` · next ${new Date(w.nextInspectionDue).toLocaleDateString('en-NG')}`
                      : ''}
                  </Text>
                  {w.openIncidents ? (
                    <Badge
                      label={`${w.openIncidents} open incident${w.openIncidents === 1 ? '' : 's'}`}
                      tone="danger"
                    />
                  ) : null}
                </Card>
              </Pressable>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}
