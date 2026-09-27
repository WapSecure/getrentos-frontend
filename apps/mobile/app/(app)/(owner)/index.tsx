import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  BadgeCheck,
  BarChart3,
  Bell,
  Building2,
  ChevronRight,
  FileSignature,
  Handshake,
  Plus,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react-native';
import {
  Card,
  ErrorState,
  IconButton,
  Price,
  Screen,
  SectionHeader,
  Skeleton,
  Text,
  useTheme,
} from '@getrentos/ui-native';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { MetricGrid } from '@/components/dashboard/MetricGrid';
import { RevenueTrendChart } from '@/components/landlord/RevenueTrendChart';
import { qk } from '@/lib/query/keys';
import { ownerApi } from '@/lib/api/owner';
import { useAuth } from '@/lib/auth/AuthProvider';
import { firstName, relativeTime } from '@/lib/format';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function OwnerHome() {
  const { profile } = useAuth();
  const { colors, spacing, radius } = useTheme();
  const dashboard = useQuery({ queryKey: qk.owner.dashboard, queryFn: ownerApi.dashboard });
  const d = dashboard.data;
  const trend = useQuery({ queryKey: qk.owner.portfolioTrend, queryFn: ownerApi.portfolioTrend });
  // Drives the bell badge; the notifications screen owns the full list.
  const notifications = useQuery({
    queryKey: qk.owner.notifications,
    queryFn: () => ownerApi.notifications(),
  });
  const unread = notifications.data?.items.filter((n) => !n.read).length ?? 0;

  const header = (
    <DashboardHeader
      eyebrow={greeting()}
      title={firstName(profile?.legalName)}
      subtitle="Your properties, offers and sales"
      accessory={
        <IconButton
          onPress={() => router.push('/(app)/owner-notifications')}
          accessibilityLabel={unread ? `Notifications, ${unread} unread` : 'Notifications'}
          badge={unread}
          icon={<Bell size={21} color={colors.foreground} />}
        />
      }
    />
  );

  if (dashboard.isError && !d) {
    return (
      <Screen refreshing={dashboard.isRefetching} onRefresh={() => dashboard.refetch()}>
        {header}
        <ErrorState
          title="We couldn't load your dashboard"
          description="Check your connection and try again."
          onRetry={() => dashboard.refetch()}
        />
      </Screen>
    );
  }

  const metrics = d
    ? [
        {
          label: 'Properties',
          value: d.totalProperties,
          Icon: Building2,
          onPress: () => router.push('/(app)/(owner)/properties'),
        },
        {
          label: 'Verified',
          value: d.verifiedProperties,
          Icon: BadgeCheck,
          onPress: () => router.push('/(app)/(owner)/properties'),
        },
        {
          label: 'Live listings',
          value: d.activeListings,
          Icon: Handshake,
          onPress: () => router.push('/(app)/(owner)/properties'),
        },
        {
          label: 'Sold',
          value: d.completedSales,
          Icon: Wallet,
          onPress: () => router.push('/(app)/owner-transactions'),
        },
      ]
    : [];

  return (
    <Screen refreshing={dashboard.isRefetching} onRefresh={() => dashboard.refetch()}>
      {header}

      {/* What needs you first: offers waiting on an answer. */}
      {d?.pendingOffers ? (
        <Pressable
          onPress={() => router.push('/(app)/(owner)/offers')}
          accessibilityRole="button"
          accessibilityLabel={`${d.pendingOffers} ${d.pendingOffers === 1 ? 'offer is' : 'offers are'} waiting for your answer`}
        >
          <Card
            elevated
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.md,
              backgroundColor: colors.accent,
            }}
          >
            <FileSignature size={20} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">
                {d.pendingOffers} {d.pendingOffers === 1 ? 'offer' : 'offers'} waiting for you
              </Text>
              <Text variant="caption" color="mutedForeground">
                Accept, counter or decline
              </Text>
            </View>
            <ChevronRight size={18} color={colors.primary} />
          </Card>
        </Pressable>
      ) : null}

      <Card elevated style={{ gap: spacing.xs }}>
        <Text variant="caption" color="mutedForeground">
          Portfolio value
        </Text>
        {dashboard.isPending ? (
          <Skeleton height={30} width="60%" />
        ) : (
          <Price amount={d?.portfolioValue ?? 0} variant="title" />
        )}
        <Text variant="caption" color="mutedForeground">
          Estimated from your properties’ recorded values
        </Text>
        {/* A single point isn't a trend, so the chart waits for two. */}
        {(trend.data?.length ?? 0) > 1 ? (
          <View style={{ marginTop: spacing.sm }}>
            <RevenueTrendChart points={trend.data!} />
          </View>
        ) : null}
      </Card>

      <MetricGrid metrics={metrics} loading={dashboard.isPending} />

      <View style={{ gap: spacing.md }}>
        <SectionHeader title="Quick actions" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          <QuickAction
            label="Add property"
            Icon={Plus}
            onPress={() => router.push('/(app)/owner-add-property')}
          />
          <QuickAction
            label="Buyer leads"
            Icon={Users}
            onPress={() => router.push('/(app)/owner-leads')}
          />
          <QuickAction
            label="Sales & escrow"
            Icon={Wallet}
            onPress={() => router.push('/(app)/owner-transactions')}
            badge={d?.activeTransactions}
          />
          <QuickAction
            label="Analytics"
            Icon={BarChart3}
            onPress={() => router.push('/(app)/owner-analytics')}
          />
        </View>
      </View>

      {d?.recentActivity?.length ? (
        <View style={{ gap: spacing.md }}>
          <SectionHeader title="Recent activity" />
          <Card elevated padding="none">
            {d.recentActivity.slice(0, 6).map((a, i) => (
              <View
                key={a.id}
                accessible
                accessibilityLabel={`${a.message}, ${relativeTime(a.timestamp)}`}
                style={{
                  flexDirection: 'row',
                  gap: spacing.md,
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.md,
                  borderTopWidth: i ? 1 : 0,
                  borderTopColor: colors.border,
                }}
              >
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: radius.full,
                    marginTop: 6,
                    backgroundColor: colors.primary,
                  }}
                />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="callout">{a.message}</Text>
                  <Text variant="caption" color="mutedForeground">
                    {relativeTime(a.timestamp)}
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        </View>
      ) : null}
    </Screen>
  );
}

function QuickAction({
  label,
  Icon,
  onPress,
  badge,
}: {
  label: string;
  Icon: LucideIcon;
  onPress: () => void;
  badge?: number;
}) {
  const { colors, spacing, radius } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={badge ? `${label}, ${badge} active` : label}
      style={({ pressed }) => ({
        flexBasis: '48%',
        flexGrow: 1,
        minHeight: 56,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: pressed ? colors.secondary : colors.card,
      })}
    >
      <Icon size={18} color={colors.primary} />
      <Text variant="callout" style={{ flex: 1, fontWeight: '600' }}>
        {label}
      </Text>
      {badge ? (
        <Text variant="caption" color="primary" style={{ fontWeight: '800' }}>
          {badge}
        </Text>
      ) : null}
    </Pressable>
  );
}
