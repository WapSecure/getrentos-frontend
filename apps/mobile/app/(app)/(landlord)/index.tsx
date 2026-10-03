import { useState } from 'react';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  Banknote,
  Bell,
  Building2,
  DoorOpen,
  FileText,
  KeyRound,
  MessageCircle,
  PieChart,
  Plus,
  TriangleAlert,
  Wrench,
  type LucideIcon,
} from 'lucide-react-native';
import { ErrorState, IconButton, Price, Screen, Text, useTheme } from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { landlordApi, type LandlordActivity } from '@/lib/api/landlord';
import { useAuth } from '@/lib/auth/AuthProvider';
import { firstName } from '@/lib/format';
import { RevenueTrendChart } from '@/components/landlord/RevenueTrendChart';
import { CreatePropertySheet } from '@/components/landlord/CreatePropertySheet';
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

const ACTIVITY_ICON: Record<LandlordActivity['type'], LucideIcon> = {
  payment: Banknote,
  application: FileText,
  maintenance: Wrench,
  lease: FileText,
  message: MessageCircle,
  viewing: DoorOpen,
};

export default function LandlordOverview() {
  const { colors } = useTheme();
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
  // Drives the bell badge; the notifications screen owns the full list.
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
        <IconButton
          onPress={() => router.push('/(app)/landlord-notifications')}
          accessibilityLabel={unread ? `Notifications, ${unread} unread` : 'Notifications'}
          badge={unread}
          icon={<Bell size={21} color={colors.foreground} />}
        />
      }
    />
  );

  if (stats.isError && !s) {
    return (
      <Screen refreshing={stats.isRefetching} onRefresh={refresh}>
        {header}
        <ErrorState
          title="We couldn't load your dashboard"
          description="Your property and payment data is safe. Check your connection and try again."
          onRetry={() => stats.refetch()}
        />
      </Screen>
    );
  }

  const units = s ? s.occupiedUnits + s.vacantUnits + s.reservedUnits : 0;
  const occupancy = s && units > 0 ? Math.round((s.occupiedUnits / units) * 100) : 0;

  const metrics = s
    ? [
        {
          label: 'Properties',
          value: s.totalProperties,
          Icon: Building2,
          onPress: () => router.push('/(app)/(landlord)/properties'),
        },
        {
          label: 'Occupied',
          value: `${occupancy}%`,
          Icon: PieChart,
          onPress: () => router.push('/(app)/(landlord)/tenants'),
        },
        {
          label: 'Vacant units',
          value: s.vacantUnits,
          Icon: KeyRound,
          onPress: () => router.push('/(app)/landlord-listings'),
        },
        {
          label: 'Open repairs',
          value: s.activeMaintenanceRequests,
          Icon: Wrench,
          onPress: () => router.push('/(app)/landlord-maintenance'),
        },
      ]
    : [];

  return (
    <Screen refreshing={stats.isRefetching || activity.isRefetching} onRefresh={refresh}>
      {header}

      {/* What needs you first: rent that hasn't come in, then repairs waiting. */}
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
        loading={stats.isPending}
        visible={showMoney}
        onToggle={toggleMoney}
      >
        {/* A single point isn't a trend, so the chart waits for two. */}
        {(revenue.data?.length ?? 0) > 1 ? <RevenueTrendChart points={revenue.data!} /> : null}
      </PortfolioCard>

      <MetricGrid metrics={metrics} loading={stats.isPending} />

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
