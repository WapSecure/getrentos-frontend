import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  Banknote,
  ChevronRight,
  DoorOpen,
  FileText,
  MessageCircle,
  TriangleAlert,
  Wrench,
} from 'lucide-react-native';
import { Card, Divider, Price, Screen, Skeleton, Text, useTheme } from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { landlordApi, type LandlordActivity } from '@/lib/api/landlord';
import { useAuth } from '@/lib/auth/AuthProvider';
import { firstName, relativeTime } from '@/lib/format';
import { RevenueTrendChart } from '@/components/landlord/RevenueTrendChart';

const ACTIVITY_ICON: Record<LandlordActivity['type'], typeof Banknote> = {
  payment: Banknote,
  application: FileText,
  maintenance: Wrench,
  lease: FileText,
  message: MessageCircle,
  viewing: DoorOpen,
};

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function LandlordOverview() {
  const { colors, spacing, radius } = useTheme();
  const { profile } = useAuth();

  const stats = useQuery({
    queryKey: qk.landlord.dashboardStats,
    queryFn: landlordApi.dashboardStats,
  });
  const activity = useQuery({ queryKey: qk.landlord.activity, queryFn: landlordApi.activity });
  const revenue = useQuery({
    queryKey: qk.landlord.revenueTrend,
    queryFn: landlordApi.revenueTrend,
  });

  const s = stats.data;
  const occupancy =
    s && s.totalProperties > 0 && s.occupiedUnits + s.vacantUnits + s.reservedUnits > 0
      ? Math.round((s.occupiedUnits / (s.occupiedUnits + s.vacantUnits + s.reservedUnits)) * 100)
      : 0;

  return (
    <Screen
      refreshing={stats.isRefetching || activity.isRefetching}
      onRefresh={() => {
        stats.refetch();
        activity.refetch();
        revenue.refetch();
      }}
    >
      <View style={{ gap: spacing.xxs }}>
        <Text variant="label" color="primary" uppercase>
          {greeting()}
        </Text>
        <Text variant="title">{firstName(profile?.legalName)}</Text>
      </View>

      {/* Money first — it is what a landlord opens the app to check. */}
      <Card elevated>
        {stats.isLoading ? (
          <View style={{ gap: spacing.sm }}>
            <Skeleton height={16} width="50%" />
            <Skeleton height={30} width="70%" />
          </View>
        ) : (
          <View style={{ gap: spacing.md }}>
            <View style={{ gap: 2 }}>
              <Text variant="caption" color="mutedForeground">
                Annual rent roll
              </Text>
              <Price amount={s?.annualRentRoll ?? 0} variant="display" />
            </View>

            {s && s.outstandingAmount > 0 ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.sm,
                  padding: spacing.md,
                  borderRadius: radius.md,
                  backgroundColor: colors.destructive + '14',
                }}
              >
                <TriangleAlert size={16} color={colors.destructive} />
                <Text variant="caption" style={{ flex: 1, color: colors.destructive }}>
                  {s.outstandingPayments} outstanding payment
                  {s.outstandingPayments === 1 ? '' : 's'} · {}
                  <Price amount={s.outstandingAmount} variant="caption" color="destructive" />
                </Text>
              </View>
            ) : null}
          </View>
        )}
      </Card>

      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <StatTile
          label="Properties"
          value={s?.totalProperties ?? 0}
          loading={stats.isLoading}
          onPress={() => router.push('/(app)/(landlord)/properties')}
        />
        <StatTile label="Occupied" value={`${occupancy}%`} loading={stats.isLoading} />
        <StatTile label="Vacant" value={s?.vacantUnits ?? 0} loading={stats.isLoading} />
      </View>

      {(revenue.data ?? []).length > 0 ? (
        <View style={{ gap: spacing.md }}>
          <Text variant="heading">Revenue</Text>
          <Card elevated>
            <RevenueTrendChart points={revenue.data ?? []} />
          </Card>
        </View>
      ) : null}

      {s && s.activeMaintenanceRequests > 0 ? (
        <Card elevated>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: radius.md,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.warning + '1f',
              }}
            >
              <Wrench size={18} color={colors.warning} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">
                {s.activeMaintenanceRequests} open maintenance request
                {s.activeMaintenanceRequests === 1 ? '' : 's'}
              </Text>
              <Text variant="caption" color="mutedForeground">
                Assign a vendor or mark them resolved
              </Text>
            </View>
          </View>
        </Card>
      ) : null}

      <View style={{ gap: spacing.md }}>
        <Text variant="heading">Recent activity</Text>
        {activity.isLoading ? (
          <View style={{ gap: spacing.sm }}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} height={62} radius={radius.lg} />
            ))}
          </View>
        ) : (activity.data ?? []).length === 0 ? (
          <Text variant="callout" color="mutedForeground">
            Nothing has happened across your properties yet.
          </Text>
        ) : (
          <Card elevated padding="none">
            {(activity.data ?? []).slice(0, 8).map((a, i) => {
              const Icon = ACTIVITY_ICON[a.type] ?? FileText;
              return (
                <View key={a.id}>
                  {i > 0 ? <Divider /> : null}
                  <View
                    style={{
                      flexDirection: 'row',
                      gap: spacing.md,
                      padding: spacing.lg,
                      alignItems: 'flex-start',
                    }}
                  >
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: radius.sm,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: colors.secondary,
                      }}
                    >
                      <Icon size={15} color={colors.foreground} />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text variant="callout" style={{ fontWeight: '600' }}>
                        {a.title}
                      </Text>
                      <Text variant="caption" color="mutedForeground">
                        {a.description}
                      </Text>
                      <Text variant="caption" color="mutedForeground">
                        {relativeTime(a.timestamp)}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </Card>
        )}
      </View>
    </Screen>
  );
}

function StatTile({
  label,
  value,
  loading,
  onPress,
}: {
  label: string;
  value: string | number;
  loading?: boolean;
  onPress?: () => void;
}) {
  const { colors, spacing, radius } = useTheme();

  const body = (
    <>
      {loading ? <Skeleton height={22} width="60%" /> : <Text variant="heading">{value}</Text>}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
        <Text variant="caption" color="mutedForeground">
          {label}
        </Text>
        {onPress ? <ChevronRight size={12} color={colors.mutedForeground} /> : null}
      </View>
    </>
  );

  const style = {
    flex: 1,
    gap: 4,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  } as const;

  // Only the tiles that lead somewhere are tappable — a chevron without a
  // target reads as a broken affordance.
  if (!onPress) return <View style={style}>{body}</View>;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      style={style}
    >
      {body}
    </Pressable>
  );
}
