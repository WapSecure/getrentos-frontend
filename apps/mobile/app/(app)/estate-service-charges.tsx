import { useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, ReceiptText } from '@sureground/icons/native';
import {
  SERVICE_CHARGE_CYCLE_LABELS,
  SERVICE_CHARGE_QUERY_STATUS_LABELS,
  SERVICE_CHARGE_STATUS_LABELS,
  formatCurrency,
  type ServiceChargeQuery,
} from '@sureground/shared';
import {
  Badge,
  Button,
  Card,
  ListSkeleton,
  QueryState,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import { errorMessage } from '@/lib/api/client';
import { estateServiceChargesApi } from '@/lib/api/estateServiceCharges';
import { withStepUpSummary } from '@/lib/stepUp';
import { STATUS_TONE, formatDay } from '@/lib/serviceCharge';
import { useEstate } from '@/hooks/useEstate';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { goBack } from '@/lib/goBack';

export default function EstateServiceCharges() {
  const { estateId } = useEstate();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const budgets = useQuery({
    queryKey: qk.estateServiceCharges.list(estateId ?? ''),
    queryFn: () => estateServiceChargesApi.list(estateId!),
    enabled: !!estateId,
  });
  const queries = useQuery({
    queryKey: [...qk.estateServiceCharges.list(estateId ?? ''), 'queries'],
    queryFn: () => estateServiceChargesApi.queries(estateId!),
    enabled: !!estateId,
  });
  const live = (queries.data ?? []).filter((q) => q.status === 'OPEN' || q.status === 'ANSWERED');

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      refreshControl={
        <RefreshControl
          refreshing={budgets.isRefetching}
          onRefresh={() => {
            void budgets.refetch();
            void queries.refetch();
          }}
          tintColor={colors.mutedForeground}
        />
      }
      contentContainerStyle={{
        paddingTop: insets.top + spacing.md,
        paddingHorizontal: spacing.xl,
        paddingBottom: insets.bottom + spacing['3xl'],
        gap: spacing.xl,
      }}
    >
      <DetailHeader
        eyebrow="Dues"
        title="Service charge"
        subtitle="Budgets shared across households and billed as dues"
        onBack={() => goBack()}
      />
      {live.length > 0 && estateId ? (
        <View style={{ gap: spacing.sm }}>
          <Text variant="heading" headingLevel={2}>
            Queries from residents ({live.length})
          </Text>
          {live.map((q) => (
            <QueryCard key={q.id} estateId={estateId} query={q} />
          ))}
        </View>
      ) : null}
      <QueryState
        query={budgets}
        skeleton={<ListSkeleton variant="card" rows={3} height={84} />}
        isEmpty={!budgets.data?.length}
        empty={{
          icon: <ReceiptText size={34} color={colors.mutedForeground} />,
          title: 'No budgets yet',
          description: 'Set up a service charge budget on the web, then check and publish it here.',
        }}
      >
        <View style={{ gap: spacing.md }}>
          {(budgets.data ?? []).map((b) => (
            <Pressable
              key={b.id}
              accessibilityRole="button"
              accessibilityLabel={`${b.title}, ${SERVICE_CHARGE_STATUS_LABELS[b.status]}`}
              onPress={() =>
                router.push({ pathname: '/(app)/estate-service-charge/[id]', params: { id: b.id } })
              }
            >
              {({ pressed }) => (
                <Card elevated style={{ gap: spacing.sm, opacity: pressed ? 0.92 : 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyStrong">{b.title}</Text>
                      <Text variant="caption" color="mutedForeground">
                        {formatDay(b.periodStart)} · {SERVICE_CHARGE_CYCLE_LABELS[b.billingCycle]}
                      </Text>
                    </View>
                    <ChevronRight size={18} color={colors.mutedForeground} />
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <Badge
                      label={SERVICE_CHARGE_STATUS_LABELS[b.status]}
                      tone={STATUS_TONE[b.status]}
                    />
                    <Text variant="caption" color="mutedForeground">
                      {formatCurrency(b.total)} across{' '}
                      {b.participants.filter((p) => p.included).length} households
                    </Text>
                  </View>
                </Card>
              )}
            </Pressable>
          ))}
        </View>
      </QueryState>
    </ScrollView>
  );
}

function QueryCard({ estateId, query }: { estateId: string; query: ServiceChargeQuery }) {
  const { spacing } = useTheme();
  const toast = useToast();
  const qc = useQueryClient();
  const [mode, setMode] = useState<'reply' | 'uphold' | 'reject' | null>(null);
  const [text, setText] = useState('');
  const [credit, setCredit] = useState('');
  const done = (message: string) => {
    setMode(null);
    setText('');
    setCredit('');
    void qc.invalidateQueries({ queryKey: qk.estateServiceCharges.list(estateId) });
    toast.show(message, 'success');
  };
  const act = useMutation({
    mutationFn: async () => {
      if (mode === 'reply') return estateServiceChargesApi.respond(estateId, query.id, text.trim());
      if (mode === 'reject') return estateServiceChargesApi.reject(estateId, query.id, text.trim());
      const amount = Number(credit.replace(/[^\d]/g, '')) || 0;
      return withStepUpSummary(
        amount > 0
          ? `Take ${formatCurrency(amount)} off ${query.invoice.unit}'s due`
          : 'Uphold a service charge query',
        () => estateServiceChargesApi.uphold(estateId, query.id, text.trim(), amount)
      );
    },
    onSuccess: () => done(mode === 'reply' ? 'Reply sent.' : 'Decision sent.'),
    onError: (e) => toast.show(errorMessage(e, 'Could not send.'), 'error'),
  });
  return (
    <Card style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Badge
          label={SERVICE_CHARGE_QUERY_STATUS_LABELS[query.status]}
          tone={query.status === 'OPEN' ? 'warning' : 'info'}
        />
        <Text variant="caption" color="mutedForeground" style={{ flex: 1 }} numberOfLines={1}>
          {query.invoice.unit} · {query.line ? query.line.label : 'whole charge'}
        </Text>
      </View>
      <Text variant="callout">{query.reason}</Text>
      {query.response ? <Text variant="caption">Your reply: {query.response}</Text> : null}
      {mode ? (
        <View style={{ gap: spacing.sm }}>
          <TextField
            label={mode === 'reply' ? 'Your reply' : 'What they are told'}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={1000}
          />
          {mode === 'uphold' ? (
            <TextField
              label="Take off the due (₦)"
              hint={`Optional, at most ${formatCurrency(query.line?.amount ?? query.invoice.amount)}. Only an unpaid due can be lowered.`}
              keyboardType="number-pad"
              value={credit}
              onChangeText={setCredit}
              maxLength={12}
            />
          ) : null}
          <Button
            label="Send"
            loading={act.isPending}
            disabled={text.trim().length < 3 || act.isPending}
            onPress={() => act.mutate()}
          />
          <Button label="Cancel" variant="ghost" onPress={() => setMode(null)} />
        </View>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          <Button label="Reply" size="sm" variant="secondary" onPress={() => setMode('reply')} />
          <Button label="Uphold" size="sm" variant="secondary" onPress={() => setMode('uphold')} />
          <Button
            label="Not upheld"
            size="sm"
            variant="ghost"
            onPress={() =>
              Alert.alert('Not upheld?', 'You will explain why; the charge stays as billed.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Continue', onPress: () => setMode('reject') },
              ])
            }
          />
        </View>
      )}
    </Card>
  );
}
