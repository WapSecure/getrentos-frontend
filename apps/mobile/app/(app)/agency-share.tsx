import { RefreshControl, ScrollView, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Wallet } from 'lucide-react-native';
import { EmptyState, ErrorState, Skeleton, useTheme } from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { agencyFirmApi } from '@/lib/api/agencyFirm';
import { MyPayout } from '@/components/agency/AgentSelfPayout';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

/**
 * A realtor's or agent's share of a management firm's commissions. Many of a
 * firm's agents use plain realtor/agent accounts and never open the agency
 * workspace, so they see their share here.
 */
export default function AgencyShare() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const account = useQuery({
    queryKey: [...qk.agency.myPayout, 'account'],
    queryFn: agencyFirmApi.myPayoutAccount,
  });
  const summary = useQuery({
    queryKey: [...qk.agency.myPayout, 'summary'],
    queryFn: agencyFirmApi.mySummary,
  });
  const history = useQuery({
    queryKey: [...qk.agency.myPayout, 'history'],
    queryFn: agencyFirmApi.myPayouts,
  });
  const refresh = () => qc.invalidateQueries({ queryKey: qk.agency.myPayout });
  const s = summary.data;
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Money"
        title="Agency commission"
        subtitle={s?.agencyName ?? 'Your share of your firm’s commissions'}
        onBack={() => goBack()}
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing['3xl'],
          gap: spacing.md,
        }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={summary.isRefetching}
            onRefresh={refresh}
            tintColor={colors.mutedForeground}
          />
        }
      >
        {summary.isLoading ? (
          <Skeleton height={220} />
        ) : summary.isError || !s ? (
          <ErrorState onRetry={() => summary.refetch()} />
        ) : !s.agencyName && s.earned === 0 ? (
          <EmptyState
            icon={<Wallet size={32} color={colors.mutedForeground} />}
            title="You’re not part of a firm"
            description="When a management firm adds you as an agent, your share of its commissions shows here."
          />
        ) : (
          <MyPayout
            account={account.data ?? null}
            summary={s}
            history={history.data ?? []}
            onChanged={refresh}
          />
        )}
      </ScrollView>
    </View>
  );
}
