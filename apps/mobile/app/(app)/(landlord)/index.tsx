import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  Banknote,
  Bell,
  DoorOpen,
  FileText,
  MessageCircle,
  MessageCircleQuestion,
  Plus,
  TriangleAlert,
  Wrench,
  type SgIcon,
} from '@sureground/icons/native';
import {
  IconButton,
  Price,
  QueryState,
  Screen,
  SegmentedBar,
  StatGroup,
  StatGroupSkeleton,
  Text,
  useTheme,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import { landlordApi, type LandlordActivity } from '@/lib/api/landlord';
import { useAuth } from '@/lib/auth/AuthProvider';
import { firstName } from '@/lib/format';
import { RevenueTrendChart } from '@/components/landlord/RevenueTrendChart';
import { CreatePropertySheet } from '@/components/landlord/CreatePropertySheet';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import {
  ActivityFeed,
  AttentionCard,
  PortfolioCard,
  QuickActions,
  dashboardGreeting,
} from '@/components/dashboard/DashboardParts';
import { IdentityNudge } from '@/components/trust/IdentityNudge';
import { useMonetaryVisibility } from '@/hooks/useMonetaryVisibility';

const ACTIVITY_ICON: Record<LandlordActivity['type'], SgIcon> = {
  payment: Banknote,
  application: FileText,
  maintenance: Wrench,
  lease: FileText,
  message: MessageCircle,
  viewing: DoorOpen,
};

export default function LandlordOverview() {
  const { colors, spacing } = useTheme();
  const { profile } = useAuth();
  const { visible: showMoney, toggle: toggleMoney } = useMonetaryVisibility();
  const [adding, setAdding] = useState(false);

  const stats = useQuery({
    queryKey: qk.landlord.dashboardStats,
    queryFn: landlordApi.dashboardStats,
  });
  const activity = useQuery({ queryKey: qk.landlord.activity, queryFn: landlordApi.activity });
  const revenue = useQuery({
    queryKey: qk.landlord.revenueTrend,
    queryFn: landlordApi.revenueTrend,
  });
  const notifications = useQuery({
    queryKey: qk.landlord.notifications,
    queryFn: landlordApi.notifications,
  });
  const unread = (notifications.data ?? []).filter((n) => !n.read).length;

  const s = stats.data;
  const refresh = () => {
    stats.refetch();
    activity.refetch();
    revenue.refetch();
  };

  const header = (
    <DashboardHeader
      eyebrow={dashboardGreeting()}
      title={firstName(profile?.legalName)}
      roleBadge="LL"
      subtitle="Your rentals, tenants and rent"
      accessory={
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <IconButton
            onPress={() => router.push({ pathname: '/(app)/ask', params: { persona: 'landlord' } })}
            accessibilityLabel="Ask Sureground"
            icon={<MessageCircleQuestion size={21} color={colors.foreground} />}
          />
          <IconButton
            onPress={() => router.push('/(app)/landlord-notifications')}
            accessibilityLabel="Notifications"
            badge={unread}
            icon={<Bell size={21} color={colors.foreground} />}
          />
        </View>
      }
    />
  );

  const units = s ? s.occupiedUnits + s.vacantUnits + s.reservedUnits : 0;
  const occupancy = s && units > 0 ? Math.round((s.occupiedUnits / units) * 100) : 0;

  // Outstanding rent and open repairs live in the attention cards above, shown only when they need action.
  const statGroups = s ? (
    <>
      <StatGroup
        title="Portfolio"
        items={[
          {
            label: 'Properties',
            value: s.totalProperties,
            subtitle: `${units} ${units === 1 ? 'unit' : 'units'} in total`,
            onPress: () => router.push('/(app)/(landlord)/properties'),
          },
          {
            label: 'Occupied',
            value: s.occupiedUnits,
            subtitle: `${occupancy}% of units`,
            onPress: () => router.push('/(app)/(landlord)/tenants'),
          },
          {
            label: 'Reserved',
            value: s.reservedUnits,
            subtitle: 'Awaiting signature or payment',
          },
          {
            label: 'Vacant',
            value: s.vacantUnits,
            subtitle: 'Available now',
            onPress: () => router.push('/(app)/landlord-units'),
          },
        ]}
        footer={
          units > 0 ? (
            <SegmentedBar
              label="Units by status"
              segments={[
                { label: 'Occupied', value: s.occupiedUnits, tone: 'success' },
                { label: 'Reserved', value: s.reservedUnits, tone: 'warning' },
                { label: 'Vacant', value: s.vacantUnits, tone: 'neutral' },
              ]}
            />
          ) : undefined
        }
      />
    </>
  ) : null;

  const quickActions = (
    <QuickActions
      actions={[
        { label: 'Add property', Icon: Plus, onPress: () => setAdding(true) },
        {
          label: 'Applications',
          Icon: FileText,
          onPress: () => router.push('/(app)/landlord-applications'),
        },
        {
          label: 'Rent payments',
          Icon: Banknote,
          onPress: () => router.push('/(app)/landlord-payments'),
          badge: s?.outstandingPayments,
        },
        {
          label: 'Maintenance',
          Icon: Wrench,
          onPress: () => router.push('/(app)/landlord-maintenance'),
          badge: s?.activeMaintenanceRequests,
        },
      ]}
    />
  );

  return (
    <Screen refreshing={stats.isRefetching || activity.isRefetching} onRefresh={refresh}>
      {header}

      <QueryState
        query={stats}
        skeleton={
          <View style={{ gap: spacing.lg }}>
            <PortfolioCard
              label="Annual rent roll"
              amount={0}
              hint="A year of rent from your signed leases"
              loading
              visible={showMoney}
              onToggle={toggleMoney}
            />
            <StatGroupSkeleton groups={[4]} />
            {quickActions}
          </View>
        }
        errorTitle="We couldn't load your dashboard"
        errorDescription="Your property and payment data is safe. Check your connection and try again."
      >
        <IdentityNudge unlocks="listings, leases and payouts" />
        {s && s.outstandingPayments > 0 ? (
          <AttentionCard
            Icon={TriangleAlert}
            tone="danger"
            title={`${s.outstandingPayments} rent ${s.outstandingPayments === 1 ? 'payment' : 'payments'} outstanding`}
            detail={
              <Text variant="caption" color="mutedForeground">
                {showMoney ? <Price amount={s.outstandingAmount} variant="caption" /> : '••••••'}{' '}
                still to collect
              </Text>
            }
            accessibilityLabel={`${s.outstandingPayments} rent ${s.outstandingPayments === 1 ? 'payment is' : 'payments are'} outstanding. Open payments`}
            onPress={() => router.push('/(app)/landlord-payments')}
          />
        ) : null}
        {s && s.activeMaintenanceRequests > 0 ? (
          <AttentionCard
            Icon={Wrench}
            tone="warning"
            title={`${s.activeMaintenanceRequests} open maintenance ${s.activeMaintenanceRequests === 1 ? 'request' : 'requests'}`}
            detail="Assign a vendor or mark them resolved"
            onPress={() => router.push('/(app)/landlord-maintenance')}
          />
        ) : null}

        <PortfolioCard
          label="Annual rent roll"
          amount={s?.annualRentRoll ?? 0}
          hint="A year of rent from your signed leases"
          loading={false}
          visible={showMoney}
          onToggle={toggleMoney}
        >
          {(revenue.data?.length ?? 0) > 1 ? <RevenueTrendChart points={revenue.data!} /> : null}
        </PortfolioCard>

        {statGroups}

        {quickActions}
      </QueryState>

      <ActivityFeed
        description="The latest movement across your portfolio"
        loading={activity.isPending}
        error={activity.isError && !activity.data}
        onRetry={() => activity.refetch()}
        emptyText="Nothing has happened across your properties yet."
        items={(activity.data ?? []).slice(0, 6).map((a) => ({
          id: a.id,
          Icon: ACTIVITY_ICON[a.type] ?? FileText,
          title: a.title,
          detail: a.description,
          timestamp: a.timestamp,
        }))}
      />

      <CreatePropertySheet open={adding} onClose={() => setAdding(false)} />
    </Screen>
  );
}
