import { router } from 'expo-router';
import { isUpgradeError } from '@/components/host/HostUI';
import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import {
  BadgeCheck,
  BarChart3,
  Bell,
  Building2,
  DoorOpen,
  FileSignature,
  Handshake,
  MessageCircleQuestion,
  Plus,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react-native';
import { IconButton, QueryState, Screen, useTheme } from '@sureground/ui-native';
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
import { IdentityNudge } from '@/components/trust/IdentityNudge';

const ACTIVITY_ICON: Record<string, LucideIcon> = {
  offer: FileSignature,
  transaction: Wallet,
  viewing: DoorOpen,
};

export default function OwnerHome() {
  const { profile } = useAuth();
  const { colors, spacing } = useTheme();
  const { visible: showMoney, toggle: toggleMoney } = useMonetaryVisibility();
  const dashboard = useQuery({ queryKey: qk.owner.dashboard, queryFn: ownerApi.dashboard });
  const d = dashboard.data;
  // Pro only: a Free plan's upgrade error is final, so don't retry it.
  const trend = useQuery({
    queryKey: qk.owner.portfolioTrend,
    queryFn: ownerApi.portfolioTrend,
    retry: (n, e) => !isUpgradeError(e) && n < 2,
  });
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
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <IconButton
            onPress={() => router.push({ pathname: '/(app)/ask', params: { persona: 'owner' } })}
            accessibilityLabel="Ask Sureground"
            icon={<MessageCircleQuestion size={21} color={colors.foreground} />}
          />
          <IconButton
            onPress={() => router.push('/(app)/owner-notifications')}
            accessibilityLabel="Notifications"
            badge={unread}
            icon={<Bell size={21} color={colors.foreground} />}
          />
        </View>
      }
    />
  );

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

  const quickActions = (
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
  );

  return (
    <Screen refreshing={dashboard.isRefetching} onRefresh={() => void dashboard.refetch()}>
      {header}

      <QueryState
        query={dashboard}
        skeleton={
          <View style={{ gap: spacing.lg }}>
            <PortfolioCard
              label="Portfolio value"
              amount={0}
              hint="Estimated from your properties’ recorded values"
              loading
              visible={showMoney}
              onToggle={toggleMoney}
            />
            <MetricGrid metrics={[]} loading />
            {quickActions}
          </View>
        }
        errorTitle="We couldn't load your dashboard"
        errorDescription="Check your connection and try again."
      >
        <IdentityNudge unlocks="sale listings and offers" />
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
          loading={false}
          visible={showMoney}
          onToggle={toggleMoney}
        >
          {(trend.data?.length ?? 0) > 1 ? <RevenueTrendChart points={trend.data!} /> : null}
        </PortfolioCard>

        <MetricGrid metrics={metrics} loading={false} />

        {quickActions}

        <ActivityFeed
          description="The latest movement across your properties"
          loading={false}
          emptyText="Nothing has happened across your properties yet."
          items={(d?.recentActivity ?? []).slice(0, 6).map((a) => ({
            id: a.id,
            Icon: ACTIVITY_ICON[a.type] ?? Bell,
            title: a.message,
            timestamp: a.timestamp,
          }))}
        />
      </QueryState>
    </Screen>
  );
}
