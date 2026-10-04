import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  BedDouble,
  Bell,
  CalendarClock,
  FileSignature,
  FileText,
  Heart,
  Home as HomeIcon,
  LandPlot,
  Search,
  ShoppingBag,
  Wallet,
  type LucideIcon,
} from 'lucide-react-native';
import {
  Card,
  EmptyState,
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
import {
  ActivityFeed,
  AttentionCard,
  QuickActions,
  dashboardGreeting,
} from '@/components/dashboard/DashboardParts';
import { qk } from '@/lib/query/keys';
import { buyerApi } from '@/lib/api/buyer';
import { buyerSettingsApi } from '@/lib/api/buyerSettings';
import { useAuth } from '@/lib/auth/AuthProvider';
import { firstName } from '@/lib/format';

/** The kinds of activity the buyer dashboard reports. */
const ACTIVITY_ICON: Record<string, LucideIcon> = {
  offer: FileSignature,
  transaction: Wallet,
  escrow: Wallet,
  payment: Wallet,
  viewing: CalendarClock,
  document: FileText,
  saved: Heart,
};

export default function BuyerHome() {
  const { profile } = useAuth();
  const { colors, spacing } = useTheme();

  const dashboard = useQuery({ queryKey: qk.buyer.dashboard, queryFn: buyerApi.dashboard });
  // Drives the bell badge; the notifications screen owns the full list.
  const notifications = useQuery({
    queryKey: qk.buyer.notifications(1, 50),
    queryFn: () => buyerSettingsApi.notifications(1, 50),
  });
  const unread = notifications.data?.items.filter((n) => !n.read).length ?? 0;
  const d = dashboard.data;

  const header = (
    <DashboardHeader
      eyebrow={dashboardGreeting()}
      title={firstName(profile?.legalName)}
      roleBadge="BY"
      subtitle="Your offers, viewings and purchases"
      accessory={
        <IconButton
          onPress={() => router.push('/(app)/buyer-notification-inbox')}
          accessibilityLabel={unread ? `Notifications, ${unread} unread` : 'Notifications'}
          badge={unread}
          icon={<Bell size={21} color={colors.foreground} />}
        />
      }
    />
  );

  const metrics = d
    ? [
        {
          label: 'Saved',
          value: d.savedListings,
          Icon: Heart,
          onPress: () => router.push('/(app)/buyer-saved'),
        },
        {
          label: 'Offers',
          value: d.activeOffers,
          Icon: FileSignature,
          onPress: () => router.push('/(app)/(buyer)/offers'),
        },
        {
          label: 'Viewings',
          value: d.upcomingViewings,
          Icon: CalendarClock,
          onPress: () => router.push('/(app)/buyer-viewings'),
        },
        {
          label: 'Purchased',
          value: d.completedPurchases,
          Icon: ShoppingBag,
          onPress: () => router.push('/(app)/buyer-transactions'),
        },
      ]
    : [];

  if (dashboard.isError && !d) {
    return (
      <Screen refreshing={dashboard.isRefetching} onRefresh={() => dashboard.refetch()}>
        {header}
        <ErrorState
          title="We couldn't load your dashboard"
          description="Check your connection and try again. Your saved homes and offers are safe."
          onRetry={() => dashboard.refetch()}
        />
      </Screen>
    );
  }

  return (
    <Screen refreshing={dashboard.isRefetching} onRefresh={() => dashboard.refetch()}>
      {header}

      {/* What needs you first: a purchase with a payment in motion. */}
      {d?.activeTransactions ? (
        <AttentionCard
          Icon={Wallet}
          title={`${d.activeTransactions} ${d.activeTransactions === 1 ? 'purchase' : 'purchases'} in progress`}
          detail="See what’s paid and what happens next"
          onPress={() => router.push('/(app)/buyer-transactions')}
        />
      ) : null}

      <MetricGrid metrics={metrics} loading={dashboard.isPending} />

      <QuickActions
        actions={[
          {
            label: 'Find a property',
            Icon: Search,
            onPress: () => router.push('/(app)/(buyer)/discover'),
          },
          { label: 'Land', Icon: LandPlot, onPress: () => router.push('/(app)/land') },
          {
            label: 'Documents',
            Icon: FileText,
            onPress: () => router.push('/(app)/buyer-documents'),
          },
          { label: 'Short stays', Icon: BedDouble, onPress: () => router.push('/(app)/shortlets') },
        ]}
      />

      <View style={{ gap: spacing.md }}>
        <SectionHeader
          title="Recommended for you"
          description="Verified opportunities matched to your activity"
          actionLabel="See all"
          onAction={() => router.push('/(app)/(buyer)/discover')}
        />

        {dashboard.isPending ? (
          <Skeleton height={140} radius={16} />
        ) : !dashboard.data?.recommendations?.length ? (
          <EmptyState
            icon={<HomeIcon size={30} color={colors.mutedForeground} />}
            title="Your recommendations are warming up"
            description="Browse and save a few properties so we can tailor this space to you."
          />
        ) : (
          dashboard.data.recommendations.map((r) => (
            <Pressable
              key={r.id}
              onPress={() => router.push(`/(app)/buyer-listing/${r.id}`)}
              accessibilityRole="button"
              accessibilityLabel={`${r.title}, ${r.city}, ${Math.round(r.price).toLocaleString('en-NG')} naira`}
              accessibilityHint="Opens property details"
            >
              <Card elevated>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyStrong" numberOfLines={1}>
                      {r.title}
                    </Text>
                    <Text variant="caption" color="mutedForeground">
                      {r.city}
                    </Text>
                  </View>
                  <Price amount={r.price} variant="bodyStrong" />
                </View>
              </Card>
            </Pressable>
          ))
        )}
      </View>

      <ActivityFeed
        description="Offers, viewings and payment updates"
        loading={dashboard.isPending}
        emptyText="Your offers, viewings and payments will show up here."
        items={(d?.recentActivity ?? []).slice(0, 6).map((a) => ({
          id: a.id,
          Icon: ACTIVITY_ICON[a.type] ?? Bell,
          title: a.message,
          timestamp: a.timestamp,
        }))}
      />
    </Screen>
  );
}
