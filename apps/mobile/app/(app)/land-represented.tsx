import { Alert, RefreshControl, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight } from '@sureground/icons/native';
import { moneyVariant, salePlanLabel } from '@sureground/shared';
import {
  Badge,
  Button,
  Card,
  DetailSkeleton,
  Divider,
  QueryState,
  Text,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import { landBuyerExtrasApi, type Deal } from '@/lib/api/landBuyerExtras';
import { purchaseWorkspaceApi } from '@/lib/api/purchaseWorkspace';
import { BUYER_MILESTONE_STATUS } from '@/lib/api/landBuyer';
import type { Milestone } from '@/lib/api/landSales';
import { errorMessage } from '@/lib/api/client';
import { formatDate } from '@/lib/format';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';
import { AcquisitionStatusBadges } from '@/components/purchases/AcquisitionStatusBadges';

// Shown when an older server sends no note of its own.
const DEPOSIT_NOTE =
  'This covers the deposit held under Payment Protection only. It does not show that the property is legally yours.';

export default function LandRepresented() {
  const { kind, id } = useLocalSearchParams<{ kind: 'purchase' | 'transaction'; id: string }>();
  const deal: Deal = { kind: kind === 'transaction' ? 'transaction' : 'purchase', id };
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const detail = useQuery({
    queryKey: qk.buyerLand.represented(deal.kind, id),
    queryFn: async (): Promise<{ title: string; milestones: Milestone[] }> => {
      if (deal.kind === 'purchase') {
        const p = await landBuyerExtrasApi.representedPurchase(id);
        return { title: `${p.layoutName} · ${p.reference}`, milestones: p.milestones };
      }
      return {
        title: 'Land sale',
        milestones: await landBuyerExtrasApi.representedTransaction(id),
      };
    },
    enabled: !!id,
  });
  // The sale's workspace names the property, its deposit and what happens next. Same key as the
  // full purchase screen, so opening that afterwards is instant.
  const workspace = useQuery({
    queryKey: qk.purchaseWorkspace.detail('REPRESENTATIVE', id),
    queryFn: () => purchaseWorkspaceApi.get('REPRESENTATIVE', id),
    retry: false,
    enabled: !!id && deal.kind === 'transaction',
  });
  const ws = workspace.data;
  const rule = useQuery({
    queryKey: [...qk.buyerLand.represented(deal.kind, id), 'co-approval'],
    queryFn: () => landBuyerExtrasApi.representedCoApproval(deal),
    // Refused when this representative may not approve payments: then they only follow.
    retry: false,
    enabled: !!id,
  });
  const approve = useMutation({
    mutationFn: (key: string) => landBuyerExtrasApi.representativeApprove(deal, key),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.buyerLand.represented(deal.kind, id) });
      toast.show('Your approval is recorded.', 'success');
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not record your approval.'), 'error'),
  });
  const pending = new Map((rule.data?.pending ?? []).map((p) => [p.milestoneKey, p]));
  const iApprove = rule.data?.binding === true;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow={ws ? `${salePlanLabel(ws)} · You represent the buyer` : 'You represent the buyer'}
        title={ws?.propertyTitle ?? detail.data?.title ?? 'Land deal'}
        subtitle={iApprove ? 'You give the second approval on each step' : 'You follow this deal'}
        onBack={() => goBack()}
      />
      <QueryState
        query={detail}
        skeleton={<DetailSkeleton />}
        errorTitle="This deal is not available to you"
        errorDescription="You may no longer represent the buyer, or the deal has closed."
        style={{ paddingHorizontal: spacing.xl }}
      >
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
            gap: spacing.md,
          }}
          refreshControl={
            <RefreshControl
              refreshing={detail.isRefetching}
              onRefresh={() => {
                detail.refetch();
                rule.refetch();
                if (deal.kind === 'transaction') workspace.refetch();
              }}
              tintColor={colors.mutedForeground}
            />
          }
        >
          {ws ? (
            <Card style={{ gap: spacing.md }}>
              <AcquisitionStatusBadges statuses={ws.statuses} />
              {ws.nextAction ? (
                <Text
                  variant="callout"
                  color={ws.nextAction.waitingForYou ? 'foreground' : 'mutedForeground'}
                >
                  <Text variant="callout" color="mutedForeground">
                    {ws.nextAction.waitingForYou ? 'Waiting for you: ' : 'Next: '}
                  </Text>
                  {ws.nextAction.label}
                </Text>
              ) : null}
              <Divider />
              <View style={{ gap: spacing.xs }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <Text variant="bodyStrong" style={{ flex: 1 }}>
                    Deposit
                  </Text>
                  <Badge
                    label={ws.statuses.moneyStatus.label}
                    tone={moneyVariant(ws.statuses.moneyStatus.code)}
                  />
                </View>
                <Text variant="caption" color="mutedForeground">
                  {ws.statuses.moneyStatus.note || DEPOSIT_NOTE}
                </Text>
              </View>
              <Button
                label="See the whole purchase"
                variant="secondary"
                size="sm"
                iconRight={<ArrowRight size={16} color={colors.secondaryForeground} />}
                onPress={() =>
                  router.push(
                    `/(app)/purchase-workspace/${encodeURIComponent(id)}?role=representative`
                  )
                }
                style={{ alignSelf: 'flex-start' }}
              />
            </Card>
          ) : null}
          {[...(detail.data?.milestones ?? [])]
            .sort((a, b) => a.sequence - b.sequence)
            .map((m) => {
              const awaiting = pending.get(m.key);
              const canApprove =
                iApprove &&
                m.status === 'DELIVERED' &&
                !(awaiting?.representativeApproved ?? false);
              const status = BUYER_MILESTONE_STATUS[m.status] ?? BUYER_MILESTONE_STATUS.PENDING;
              return (
                <Card key={m.key} style={{ gap: spacing.sm }}>
                  <Text variant="callout" style={{ fontWeight: '600' }}>
                    {m.label}
                  </Text>
                  <Badge
                    label={
                      status.label === 'Awaiting your confirmation' ? 'Delivered' : status.label
                    }
                    tone={status.tone}
                  />
                  {m.deliveredAt ? (
                    <Text variant="caption" color="mutedForeground">
                      Delivered {formatDate(m.deliveredAt, 'short')}
                    </Text>
                  ) : null}
                  {m.note ? (
                    <Text variant="caption" color="mutedForeground">
                      Seller’s note: {m.note}
                    </Text>
                  ) : null}
                  {awaiting ? (
                    <Text variant="caption" color="mutedForeground">
                      {awaiting.buyerApproved ? 'The buyer approved' : 'Waiting for the buyer'} ·{' '}
                      {awaiting.representativeApproved ? 'you approved' : 'waiting for you'}
                    </Text>
                  ) : null}
                  {canApprove ? (
                    <Button
                      label="Approve"
                      size="sm"
                      loading={approve.isPending && approve.variables === m.key}
                      disabled={approve.isPending}
                      onPress={() =>
                        Alert.alert(
                          'Approve this step?',
                          `“${m.label}”. Once the buyer has approved too, the seller is paid this step’s share. Approve only what you have verified yourself.`,
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Approve', onPress: () => approve.mutate(m.key) },
                          ]
                        )
                      }
                      style={{ alignSelf: 'flex-start' }}
                    />
                  ) : null}
                </Card>
              );
            })}
        </ScrollView>
      </QueryState>
    </View>
  );
}
