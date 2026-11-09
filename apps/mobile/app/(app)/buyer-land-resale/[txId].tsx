import { RefreshControl, ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Lock } from '@sureground/icons/native';
import {
  Card,
  DetailSkeleton,
  FormAlert,
  QueryState,
  Text,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import { landBuyerApi } from '@/lib/api/landBuyer';
import { conditionOpen, confirmedProgress, type Milestone } from '@/lib/api/landSales';
import { errorMessage } from '@/lib/api/client';
import { BuyerConditions, BuyerMilestones } from '@/components/land/BuyerConveyance';
import { CoApprovalCard } from '@/components/land/LandRequests';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

export default function BuyerLandResale() {
  const { txId } = useLocalSearchParams<{ txId: string }>();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const steps = useQuery({
    queryKey: qk.buyerLand.resaleMilestones(txId),
    queryFn: () => landBuyerApi.resaleMilestones(txId),
    enabled: !!txId,
  });
  const hasSteps = (steps.data?.length ?? 0) > 0;
  const conditions = useQuery({
    queryKey: qk.buyerLand.resaleConditions(txId),
    queryFn: () => landBuyerApi.resaleConditions(txId),
    enabled: hasSteps,
  });

  const confirm = useMutation({
    mutationFn: (key: string) => landBuyerApi.confirmResaleMilestone(txId, key),
    onSuccess: (updated) => {
      qc.setQueryData<Milestone[]>(qk.buyerLand.resaleMilestones(txId), (old) =>
        old?.map((m) => (m.key === updated.key ? updated : m))
      );
      qc.invalidateQueries({ queryKey: qk.buyerLand.resaleMilestones(txId) });
      toast.show(
        updated.status === 'DELIVERED'
          ? 'Your approval is recorded. Waiting for your representative.'
          : 'Step confirmed.',
        'success'
      );
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not confirm that step.'), 'error'),
  });
  const dispute = useMutation({
    mutationFn: ({ key, reason }: { key: string; reason: string }) =>
      landBuyerApi.disputeResaleMilestone(txId, key, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.buyerLand.resaleMilestones(txId) });
      toast.show('Dispute sent to the seller.', 'success');
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not send the dispute.'), 'error'),
  });
  const settle = useMutation({
    mutationFn: ({ key, how }: { key: string; how: 'confirm' | 'waive' }) =>
      landBuyerApi.settleResaleCondition(txId, key, how),
    onSuccess: (next, { how }) => {
      qc.setQueryData(qk.buyerLand.resaleConditions(txId), next);
      toast.show(how === 'confirm' ? 'Condition confirmed.' : 'Condition waived.', 'success');
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not update the condition.'), 'error'),
  });

  const progress = confirmedProgress(steps.data ?? []);
  const left = progress.required - progress.done;
  const conds = conditions.data ?? [];
  const openConds = conds.filter(conditionOpen).length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Land purchase"
        title="Land conveyance"
        subtitle="Confirm each step once it is done"
        onBack={() => goBack()}
      />
      <QueryState
        query={steps}
        skeleton={<DetailSkeleton />}
        isEmpty={!hasSteps}
        empty={{
          title: 'No conveyance steps',
          description:
            'This transaction is not a land sale, so payment follows the usual purchase steps.',
        }}
        style={{ paddingHorizontal: spacing.xl }}
      >
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
            gap: spacing.lg,
          }}
          refreshControl={
            <RefreshControl
              refreshing={steps.isRefetching}
              onRefresh={() => {
                steps.refetch();
                conditions.refetch();
              }}
              tintColor={colors.mutedForeground}
            />
          }
        >
          {conds.length ? (
            <Card style={{ gap: spacing.md }}>
              <Text variant="heading">Conditions of the sale</Text>
              <Text variant="callout" color="mutedForeground">
                {openConds === 0
                  ? 'Every condition is met or waived.'
                  : `${openConds} condition${openConds === 1 ? '' : 's'} still open. Your payment is not released while any is.`}
              </Text>
              {conds.some((c) => c.failed) ? (
                <FormAlert
                  tone="warning"
                  message="A condition was not met. You may cancel and take a full refund of what Sureground holds from your transactions page, or keep the purchase."
                />
              ) : null}
              <BuyerConditions
                conditions={conds}
                seller="Seller"
                busyKey={settle.isPending ? (settle.variables?.key ?? null) : null}
                onSettle={(key, how) => settle.mutate({ key, how })}
              />
            </Card>
          ) : null}
          <CoApprovalCard deal={{ kind: 'transaction', id: txId }} />
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Lock size={16} color={colors.primary} style={{ marginTop: 2 }} />
            <Text variant="callout" color="mutedForeground" style={{ flex: 1 }}>
              Your payment is not released to the seller until you confirm every required step
              below, including the deed of assignment and possession on site.
            </Text>
          </View>
          <Text variant="callout" style={{ fontWeight: '600' }}>
            {left > 0
              ? `${left} required step${left === 1 ? '' : 's'} before your payment can be released.`
              : 'Every required step is confirmed. Your payment can now be released to the seller.'}
          </Text>
          <Card>
            <BuyerMilestones
              milestones={steps.data!}
              contractOpen
              requiredOnly
              seller="seller"
              busyKey={
                confirm.isPending
                  ? (confirm.variables ?? null)
                  : dispute.isPending
                    ? (dispute.variables?.key ?? null)
                    : null
              }
              onConfirm={(m) => confirm.mutate(m.key)}
              onDispute={(m, reason) => dispute.mutate({ key: m.key, reason })}
            />
          </Card>
          <Text variant="caption" color="mutedForeground">
            Before any step is confirmed you can cancel and be refunded. Once you confirm a step, a
            refund needs a failed condition above, or a reported problem with the land.
          </Text>
        </ScrollView>
      </QueryState>
    </View>
  );
}
