import { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { confirmedProgress, landSalesApi, type Milestone } from '@/lib/api/landSales';
import { errorMessage } from '@/lib/api/client';
import { Sheet } from '@/components/Sheet';
import { ConditionsList, DeliverForm, MilestoneList } from '@/components/land/Conveyance';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

/** The payment is released only once the buyer has confirmed every required step. */
export default function OwnerLandResale() {
  const { txId, property } = useLocalSearchParams<{ txId: string; property?: string }>();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const [delivering, setDelivering] = useState<Milestone | null>(null);

  const steps = useQuery({
    queryKey: qk.owner.resaleMilestones(txId),
    queryFn: () => landSalesApi.resaleMilestones(txId),
    enabled: !!txId,
  });
  const conditions = useQuery({
    queryKey: qk.owner.resaleConditions(txId),
    queryFn: () => landSalesApi.resaleConditions(txId),
    enabled: !!txId,
  });

  const deliver = useMutation({
    mutationFn: (input: { note?: string; documentId?: string }) =>
      landSalesApi.deliverResaleMilestone(txId, delivering!.key, input),
    onSuccess: (updated) => {
      // Before anyone acts the steps are planned rows; acting creates them, so reload.
      qc.setQueryData<Milestone[]>(qk.owner.resaleMilestones(txId), (old) =>
        old?.map((m) => (m.key === updated.key ? updated : m))
      );
      qc.invalidateQueries({ queryKey: qk.owner.resaleMilestones(txId) });
      setDelivering(null);
      toast.show(
        `${updated.label}: marked delivered. The buyer has been asked to confirm.`,
        'success'
      );
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not mark that step delivered.'), 'error'),
  });
  const deliverCondition = useMutation({
    mutationFn: ({ key, note }: { key: string; note: string }) =>
      landSalesApi.deliverResaleCondition(txId, key, note),
    onSuccess: (next) => {
      qc.setQueryData(qk.owner.resaleConditions(txId), next);
      toast.show('Marked met. The buyer has been asked to confirm.', 'success');
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not mark the condition met.'), 'error'),
  });

  const progress = confirmedProgress(steps.data ?? []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Land sale"
        title="Land conveyance"
        subtitle="Each step delivered, then confirmed by the buyer"
        onBack={() => goBack()}
      />
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
        <Text variant="callout" color="mutedForeground">
          Mark each step delivered as you complete it. The buyer confirms each one, and the payment
          is released to you once every required step is confirmed.
        </Text>

        {(conditions.data?.length ?? 0) > 0 ? (
          <Card style={{ gap: spacing.md }}>
            <Text variant="heading">Conditions of the sale</Text>
            <Text variant="caption" color="mutedForeground">
              The payment is not released while any condition is open. Mark the ones you deliver as
              met; Sureground checked the rest against the record. A condition missed by its
              deadline lets the buyer cancel with a full refund.
            </Text>
            <ConditionsList
              conditions={conditions.data ?? []}
              sellerLabel="You"
              busyKey={
                deliverCondition.isPending ? (deliverCondition.variables?.key ?? null) : null
              }
              onDeliver={(key, note) => deliverCondition.mutate({ key, note })}
            />
          </Card>
        ) : null}

        <QueryState
          query={steps}
          skeleton={<DetailSkeleton />}
          errorTitle="The conveyance steps could not be loaded"
        >
          <Card style={{ gap: spacing.md }}>
            <FormAlert
              tone="info"
              message={`${progress.done} of ${progress.required} required steps confirmed by the buyer. Governor’s Consent can take months, so it is tracked but does not hold up the payment.`}
            />
            <MilestoneList
              milestones={steps.data ?? []}
              deliverability={() => ({ allowed: true })}
              onDeliver={setDelivering}
            />
          </Card>
        </QueryState>
      </ScrollView>

      <Sheet
        open={!!delivering}
        onClose={() => setDelivering(null)}
        title={delivering?.label ?? ''}
      >
        {delivering ? (
          <DeliverForm
            key={delivering.key}
            milestone={delivering}
            propertyId={property ?? null}
            saving={deliver.isPending}
            onDeliver={(input) => deliver.mutate(input)}
            releasedAfterAllSteps
          />
        ) : null}
      </Sheet>
    </View>
  );
}
