import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Building2, Home, WalletCards, Wrench } from 'lucide-react-native';
import {
  Card,
  EmptyState,
  ErrorState,
  Screen,
  Skeleton,
  Text,
  useTheme,
} from '@getrentos/ui-native';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { MetricGrid } from '@/components/dashboard/MetricGrid';
import { estateManagerApi } from '@/lib/api/estateManager';
import { qk } from '@/lib/query/keys';

export default function EstateHome() {
  const { spacing, colors } = useTheme();
  const estates = useQuery({
    queryKey: qk.estateManager.estates,
    queryFn: estateManagerApi.listMine,
  });
  const estate = estates.data?.[0];
  const dashboard = useQuery({
    queryKey: qk.estateManager.dashboard(estate?.id ?? 'none'),
    queryFn: () => estateManagerApi.dashboard(estate!.id),
    enabled: Boolean(estate?.id),
  });

  if (estates.isError) {
    return (
      <Screen>
        <DashboardHeader
          eyebrow="Workspace"
          title="Estate management"
          roleBadge="EM"
          subtitle="Community operations"
        />
        <ErrorState title="We couldn't load your estates" onRetry={() => estates.refetch()} />
      </Screen>
    );
  }

  const stats = dashboard.data;
  const metrics = stats
    ? [
        { label: 'Households', value: stats.totalHouseholds, Icon: Home },
        { label: 'Open incidents', value: stats.openIncidents, Icon: AlertTriangle },
        { label: 'Maintenance', value: stats.openMaintenanceTickets, Icon: Wrench },
        {
          label: 'Dues outstanding',
          value: `₦${stats.duesOutstanding.toLocaleString()}`,
          Icon: WalletCards,
        },
      ]
    : [];

  return (
    <Screen
      refreshing={estates.isRefetching || dashboard.isRefetching}
      onRefresh={() => {
        void estates.refetch();
        void dashboard.refetch();
      }}
    >
      <DashboardHeader
        eyebrow="Workspace"
        title={estate?.name ?? 'Estate management'}
        roleBadge="EM"
        subtitle={estate ? `${estate.address}, ${estate.city}` : 'Community operations'}
      />
      {estates.isPending ? (
        <Skeleton height={180} radius={16} />
      ) : !estate ? (
        <EmptyState
          icon={<Building2 size={30} color={colors.mutedForeground} />}
          title="No estate assigned"
          description="An estate appears here after your manager membership is approved."
        />
      ) : dashboard.isError ? (
        <Card elevated>
          <Text variant="bodyStrong">Operational summary unavailable</Text>
          <Text variant="caption" color="mutedForeground" style={{ marginTop: spacing.xs }}>
            Your estate is connected, but its analytics could not be loaded. Pull down to retry.
          </Text>
        </Card>
      ) : (
        <View style={{ gap: spacing.lg }}>
          <MetricGrid metrics={metrics} loading={dashboard.isPending} />
          {stats ? (
            <Card elevated>
              <Text variant="bodyStrong">This month</Text>
              <Text variant="body" style={{ marginTop: spacing.sm }}>
                ₦{stats.duesCollectedThisMonth.toLocaleString()} collected
              </Text>
              <Text variant="caption" color="mutedForeground" style={{ marginTop: spacing.xs }}>
                {stats.pendingViolations} pending violations
              </Text>
            </Card>
          ) : null}
        </View>
      )}
    </Screen>
  );
}
