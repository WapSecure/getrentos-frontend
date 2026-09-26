import { RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { Calendar } from 'lucide-react-native';
import { Badge, EmptyState, ErrorState, Skeleton, Text, useTheme } from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  viewingsApi,
  VIEWING_STATUS_LABEL,
  VIEWING_STATUS_TONE,
  type ViewingRequest,
} from '@/lib/api/viewings';
import { formatDate } from '@/lib/format';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';

export default function Viewings() {
  const { colors, spacing, radius } = useTheme();
  const query = useQuery({ queryKey: qk.renter.viewings, queryFn: viewingsApi.list });
  const items = query.data ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Property discovery"
        title="Viewings"
        subtitle="Requests, confirmations and tour dates"
        onBack={() => router.back()}
      />

      {query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : query.isLoading ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={78} radius={radius.lg} />
          ))}
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Calendar size={34} color={colors.mutedForeground} />}
          title="No viewings requested"
          description="Request a viewing from any listing to see it here."
        />
      ) : (
        <FlashList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }: { item: ViewingRequest }) => (
            <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}>
              <ViewingRow request={item} />
            </View>
          )}
          contentContainerStyle={{ paddingTop: spacing.sm, paddingBottom: spacing['3xl'] }}
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

function ViewingRow({ request: r }: { request: ViewingRequest }) {
  const { colors, spacing, radius, shadows } = useTheme();
  return (
    <View
      style={[
        { borderRadius: radius.lg, backgroundColor: colors.card, padding: spacing.md, gap: 6 },
        shadows.sm,
      ]}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing.sm,
        }}
      >
        <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
          {r.propertyName}
        </Text>
        <Badge label={VIEWING_STATUS_LABEL[r.status]} tone={VIEWING_STATUS_TONE[r.status]} />
      </View>
      <Text variant="caption" color="mutedForeground">
        {r.status === 'confirmed' && r.scheduledAt
          ? `Scheduled for ${formatDate(r.scheduledAt, 'short')}`
          : `Requested ${formatDate(r.requestedAt, 'short')}`}
      </Text>
      {r.notes ? (
        <Text variant="callout" color="mutedForeground" numberOfLines={2}>
          “{r.notes}”
        </Text>
      ) : null}
    </View>
  );
}
