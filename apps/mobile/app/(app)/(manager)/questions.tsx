import { RefreshControl, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageSquareText } from 'lucide-react-native';
import { ListSkeleton, QueryState, useTheme } from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import { managementApi, type QuerySummary } from '@/lib/api/management';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { QueryRow } from '@/components/management/QueryRow';

/**
 * Owners' questions to the firm, from the manager's side: each has a 24-hour
 * first-reply promise, and "Waiting on you" means it's yours to answer.
 */
export default function AgencyQuestions() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const list = useQuery({
    queryKey: qk.management.queries('manager'),
    queryFn: () => managementApi.queries('manager'),
  });
  const waiting = (list.data ?? []).filter(
    (q) => q.status !== 'RESOLVED' && q.status !== 'ANSWERED'
  ).length;

  return (
    <View
      style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top + spacing.md }}
    >
      <View style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.lg }}>
        <DashboardHeader
          eyebrow="Owners ask"
          title="Questions"
          subtitle={
            list.data
              ? waiting
                ? `${waiting} waiting on you · replies due within 24 hours`
                : 'Nothing waiting on you'
              : 'Replies due within 24 hours, kept on record'
          }
        />
      </View>
      <QueryState
        query={list}
        skeleton={<ListSkeleton rows={4} />}
        isEmpty={!list.data?.length}
        empty={{
          icon: <MessageSquareText size={32} color={colors.mutedForeground} />,
          title: 'No questions yet',
          description: 'When an owner asks about rent, statements or repairs, it shows here.',
        }}
        style={{ paddingHorizontal: spacing.xl }}
      >
        <FlashList
          data={list.data ?? []}
          keyExtractor={(q) => q.id}
          renderItem={({ item }: { item: QuerySummary }) => <QueryRow query={item} />}
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          refreshControl={
            <RefreshControl
              refreshing={list.isRefetching}
              onRefresh={() => list.refetch()}
              tintColor={colors.mutedForeground}
            />
          }
        />
      </QueryState>
    </View>
  );
}
