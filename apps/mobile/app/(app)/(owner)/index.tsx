import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  BadgeCheck,
  BarChart3,
  Bell,
  Building2,
  DoorOpen,
  FileSignature,
  Handshake,
  Plus,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react-native';
import { ErrorState, IconButton, Screen, useTheme } from '@getrentos/ui-native';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { MetricGrid } from '@/components/dashboard/MetricGrid';
import {
  ActivityFeed,
  AttentionCard,
  PortfolioCard,
  QuickActions,
  dashboardGreeting,
} from '@/components/dashboard/DashboardParts';
import { useMonetaryVisibility } from '@/hooks/useMonetaryVisibility';
import { RevenueTrendChart } from '@/components/landlord/RevenueTrendChart';
import { qk } from '@/lib/query/keys';
import { ownerApi } from '@/lib/api/owner';
import { useAuth } from '@/lib/auth/AuthProvider';
import { firstName } from '@/lib/format';

/** The kinds of activity the owner dashboard reports. */
const ACTIVITY_ICON: Record<string, LucideIcon> = {
  offer: FileSignature,
  transaction: Wallet,
  viewing: DoorOpen,
};

export default function OwnerHome() {
  const { profile } = useAuth();
  const { colors } = useTheme();
  const { visible: showMoney, toggle: toggleMoney } = useMonetaryVisibility();
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
      eyebrow={dashboardGreeting()}
      title={firstName(profile?.legalName)}
      roleBadge="PO"
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
        <AttentionCard
          Icon={FileSignature}
          title={`${d.pendingOffers} ${d.pendingOffers === 1 ? 'offer' : 'offers'} waiting for you`}
          detail="Accept, counter or decline"
          accessibilityLabel={`${d.pendingOffers} ${d.pendingOffers === 1 ? 'offer is' : 'offers are'} waiting for your answer`}
          onPress={() => router.push('/(app)/(owner)/offers')}
        />
      ) : null}

      <PortfolioCard
        label="Portfolio value"
        amount={d?.portfolioValue ?? 0}
        hint="Estimated from your properties’ recorded values"
        loading={dashboard.isPending}
        visible={showMoney}
        onToggle={toggleMoney}
      >
        {/* A single point isn't a trend, so the chart waits for two. */}
        {(trend.data?.length ?? 0) > 1 ? <RevenueTrendChart points={trend.data!} /> : null}
      </PortfolioCard>

      <MetricGrid metrics={metrics} loading={dashboard.isPending} />

      <QuickActions
        actions={[
          {
            label: 'Add property',
            Icon: Plus,
            onPress: () => router.push('/(app)/owner-add-property'),
          },
          { label: 'Buyer leads', Icon: Users, onPress: () => router.push('/(app)/owner-leads') },
          {
            label: 'Sales in progress',
            Icon: Wallet,
            onPress: () => router.push('/(app)/owner-transactions'),
            badge: d?.activeTransactions,
          },
          {
            label: 'Analytics',
            Icon: BarChart3,
            onPress: () => router.push('/(app)/owner-analytics'),
          },
        ]}
      />

      <ActivityFeed
        description="The latest movement across your properties"
        loading={dashboard.isPending}
        emptyText="Nothing has happened across your properties yet."
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
