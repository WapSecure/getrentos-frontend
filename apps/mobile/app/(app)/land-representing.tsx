import { RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Users } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  Divider,
  ListSkeleton,
  PressableScale,
  QueryState,
  Text,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import {
  landBuyerExtrasApi,
  REP_SCOPES,
  REP_STATUS,
  type Appointment,
} from '@/lib/api/landBuyerExtras';
import { errorMessage } from '@/lib/api/client';
import { formatNaira } from '@/lib/format';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

export default function LandRepresenting() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const q = useQuery({
    queryKey: qk.buyerLand.representing,
    queryFn: landBuyerExtrasApi.representing,
  });
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Land"
        title="Buyers you represent"
        subtitle="Follow their deals and approve payments"
        onBack={() => goBack()}
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing['3xl'],
          gap: spacing.md,
        }}
        refreshControl={
          <RefreshControl
            refreshing={q.isRefetching}
            onRefresh={() => void q.refetch()}
            tintColor={colors.mutedForeground}
          />
        }
      >
        <QueryState
          query={q}
          skeleton={<ListSkeleton rows={2} variant="card" height={110} />}
          isEmpty={(q.data ?? []).length === 0}
          empty={{
            icon: <Users size={32} color={colors.mutedForeground} />,
            title: 'No one has appointed you',
            description:
              'When a buyer appoints you as their representative, it appears here for you to accept.',
          }}
        >
          {(q.data ?? []).map((a) => (
            <Principal key={a.id} appointment={a} />
          ))}
        </QueryState>
      </ScrollView>
    </View>
  );
}

function Principal({ appointment: a }: { appointment: Appointment }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const respond = useMutation({
    mutationFn: (response: 'ACCEPT' | 'DECLINE') => landBuyerExtrasApi.respond(a.id, response),
    onSuccess: (_r, response) => {
      qc.invalidateQueries({ queryKey: qk.buyerLand.representing });
      toast.show(
        response === 'ACCEPT' ? 'You now represent this buyer.' : 'Invitation declined.',
        'success'
      );
    },
    onError: (e) => toast.show(errorMessage(e, 'That did not go through.'), 'error'),
  });
  const deals = useQuery({
    queryKey: qk.buyerLand.principalDeals(a.principalId),
    queryFn: () => landBuyerExtrasApi.principalDeals(a.principalId),
    enabled: a.status === 'ACTIVE',
  });
  const status = REP_STATUS[a.status];
  return (
    <Card style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Text variant="bodyStrong" style={{ flex: 1 }}>
          {a.name ?? a.email}
        </Text>
        <Badge label={status.label} tone={status.tone} />
      </View>
      {a.scopes.map((s) => (
        <Text key={s} variant="caption" color="mutedForeground">
          • {REP_SCOPES.find((x) => x.value === s)?.label ?? s}
        </Text>
      ))}
      {a.note ? (
        <Text variant="callout" color="mutedForeground">
          “{a.note}”
        </Text>
      ) : null}
      {a.status === 'INVITED' ? (
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Button
            label="Accept"
            size="sm"
            loading={respond.isPending && respond.variables === 'ACCEPT'}
            disabled={respond.isPending}
            onPress={() => respond.mutate('ACCEPT')}
          />
          <Button
            label="Decline"
            size="sm"
            variant="ghost"
            disabled={respond.isPending}
            onPress={() => respond.mutate('DECLINE')}
          />
        </View>
      ) : null}
      {a.status === 'ACTIVE' && deals.data ? (
        deals.data.purchases.length + deals.data.resales.length === 0 ? (
          <Text variant="caption" color="mutedForeground">
            No land deals yet.
          </Text>
        ) : (
          <View style={{ gap: spacing.sm }}>
            {deals.data.purchases.map((p) => (
              <DealRow
                key={p.purchaseId}
                title={p.title}
                detail={`${p.reference} · ${p.status.replace(/_/g, ' ').toLowerCase()}`}
                approves={p.youApprovePayments}
                onPress={() =>
                  router.push(`/(app)/land-represented?kind=purchase&id=${p.purchaseId}`)
                }
              />
            ))}
            {deals.data.resales.map((t) => (
              <DealRow
                key={t.transactionId}
                title={t.title}
                detail={`Resale · ${formatNaira(t.amount)}`}
                approves={t.youApprovePayments}
                onPress={() =>
                  router.push(`/(app)/land-represented?kind=transaction&id=${t.transactionId}`)
                }
              />
            ))}
          </View>
        )
      ) : null}
    </Card>
  );
}

function DealRow({
  title,
  detail,
  approves,
  onPress,
}: {
  title: string;
  detail: string;
  approves: boolean;
  onPress: () => void;
}) {
  const { spacing } = useTheme();
  return (
    <PressableScale onPress={onPress} accessibilityRole="button" accessibilityLabel={title}>
      <View style={{ paddingBottom: spacing.sm, gap: 2 }}>
        <Divider style={{ marginBottom: spacing.sm }} />
        <Text variant="callout" style={{ fontWeight: '600' }}>
          {title}
        </Text>
        <Text variant="caption" color="mutedForeground">
          {detail}
        </Text>
        {approves ? <Badge label="You approve payments" tone="info" /> : null}
      </View>
    </PressableScale>
  );
}
