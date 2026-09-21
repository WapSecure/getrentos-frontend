import { RefreshControl, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShieldCheck, Users } from 'lucide-react-native';
import {
  Avatar,
  Badge,
  Card,
  EmptyState,
  ErrorState,
  Skeleton,
  Text,
  useTheme,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  landlordApi,
  RENT_STATUS_LABEL,
  RENT_STATUS_TONE,
  type LandlordTenant,
} from '@/lib/api/landlord';
import { formatDate } from '@/lib/format';

export default function LandlordTenants() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();

  const query = useQuery({
    queryKey: qk.landlord.tenants(),
    queryFn: () => landlordApi.tenants(),
  });

  const items = query.data?.items ?? [];
  const behind = items.filter((t) => t.rentStatus === 'overdue').length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          paddingTop: insets.top + spacing.lg,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.sm,
        }}
      >
        <Text variant="title">Tenants</Text>
        {query.data ? (
          <Text variant="caption" color={behind > 0 ? 'destructive' : 'mutedForeground'}>
            {query.data.total} tenant{query.data.total === 1 ? '' : 's'}
            {behind > 0 ? ` · ${behind} behind on rent` : ''}
          </Text>
        ) : null}
      </View>

      {query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : query.isLoading ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.sm }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={88} radius={radius.lg} />
          ))}
        </View>
      ) : (
        <FlashList
          data={items}
          keyExtractor={(t) => t.id}
          renderItem={({ item }: { item: LandlordTenant }) => <TenantRow tenant={item} />}
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => query.refetch()}
              tintColor={colors.mutedForeground}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon={<Users size={32} color={colors.mutedForeground} />}
              title="No tenants yet"
              description="Once a lease is signed the tenant shows up here with their rent status."
            />
          }
        />
      )}
    </View>
  );
}

function TenantRow({ tenant: t }: { tenant: LandlordTenant }) {
  const { colors, spacing } = useTheme();
  return (
    <Card padding={spacing.lg} style={{ marginBottom: spacing.sm }}>
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <Avatar name={t.name} size={44} />
        <View style={{ flex: 1, gap: 3 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Text variant="bodyStrong" numberOfLines={1} style={{ flexShrink: 1 }}>
              {t.name}
            </Text>
            {t.verified ? <ShieldCheck size={13} color={colors.success} /> : null}
            <View style={{ flex: 1 }} />
            <Badge label={RENT_STATUS_LABEL[t.rentStatus]} tone={RENT_STATUS_TONE[t.rentStatus]} />
          </View>

          <Text variant="caption" color="mutedForeground" numberOfLines={1}>
            {t.propertyName}
            {t.unitName ? ` · ${t.unitName}` : ''}
          </Text>

          <Text variant="caption" color="mutedForeground">
            Moved in {formatDate(t.moveInDate, 'short')} · trust {t.trustScore}
          </Text>
        </View>
      </View>
    </Card>
  );
}
