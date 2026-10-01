import { useQuery } from '@tanstack/react-query';
import { Building2, CalendarDays, FileSignature, Users } from 'lucide-react-native';
import { ErrorState, Screen } from '@getrentos/ui-native';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { MetricGrid } from '@/components/dashboard/MetricGrid';
import { realtorApi } from '@/lib/api/realtor';
import { qk } from '@/lib/query/keys';

export default function RealtorHome() {
  const dashboard = useQuery({ queryKey: qk.realtor.dashboard, queryFn: realtorApi.dashboard });
  const data = dashboard.data;
  const metrics = data
    ? [
        { label: 'Published listings', value: data.publishedListings, Icon: Building2 },
        { label: 'Active clients', value: data.activeClients, Icon: Users },
        { label: 'Active leads', value: data.activeLeads, Icon: FileSignature },
        { label: 'Upcoming viewings', value: data.upcomingViewings, Icon: CalendarDays },
      ]
    : [];
  return (
    <Screen refreshing={dashboard.isRefetching} onRefresh={() => dashboard.refetch()}>
      <DashboardHeader
        eyebrow="Workspace"
        title="Realtor business"
        roleBadge="RE"
        subtitle="Listings, clients and viewings"
      />
      {dashboard.isError ? (
        <ErrorState title="We couldn't load your business" onRetry={() => dashboard.refetch()} />
      ) : (
        <MetricGrid metrics={metrics} loading={dashboard.isPending} />
      )}
    </Screen>
  );
}
