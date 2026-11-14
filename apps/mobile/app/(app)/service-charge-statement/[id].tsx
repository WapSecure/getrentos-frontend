import { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  SERVICE_CHARGE_CATEGORY_LABELS,
  SERVICE_CHARGE_CYCLE_LABELS,
  SERVICE_CHARGE_QUERY_STATUS_LABELS,
  formatCurrency,
  hasLiveQuery,
  statementShareBasis,
} from '@sureground/shared';
import {
  Badge,
  Button,
  Card,
  Chip,
  ListSkeleton,
  QueryState,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import { errorMessage } from '@/lib/api/client';
import {
  STATEMENT_COPY,
  statementsApi,
  type StatementKind,
} from '@/lib/api/serviceChargeStatements';
import { formatDay } from '@/lib/serviceCharge';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { goBack } from '@/lib/goBack';

/** One service charge as a statement, with queries. */
export default function ServiceChargeStatement() {
  const { id, kind: raw } = useLocalSearchParams<{ id: string; kind?: string }>();
  const kind: StatementKind = raw === 'resident' ? 'resident' : 'renter';
  const copy = STATEMENT_COPY[kind];
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const queryClient = useQueryClient();
  const statement = useQuery({
    queryKey: qk.statements.one(kind, id),
    queryFn: () => statementsApi.get(kind, id),
  });
  const data = statement.data;
  const [asking, setAsking] = useState(false);
  const [lineId, setLineId] = useState<string>('');
  const [reason, setReason] = useState('');
  const refresh = () => queryClient.invalidateQueries({ queryKey: qk.statements.list(kind) });
  const raise = useMutation({
    mutationFn: () =>
      statementsApi.raiseQuery(kind, id, {
        reason: reason.trim(),
        ...(lineId ? { invoiceLineId: lineId } : {}),
      }),
    onSuccess: () => {
      setAsking(false);
      setReason('');
      void refresh();
      toast.show('Query sent. You will be told when there is a reply.', 'success');
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not send the query.'), 'error'),
  });
  const withdraw = useMutation({
    mutationFn: (queryId: string) => statementsApi.withdrawQuery(kind, queryId),
    onSuccess: () => {
      void refresh();
      toast.show('Query withdrawn.', 'success');
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not withdraw.'), 'error'),
  });

  const choices = data
    ? [
        ...(hasLiveQuery(data.queries, null) ? [] : [{ id: '', label: 'Whole charge' }]),
        ...data.lines
          .filter((l) => !hasLiveQuery(data.queries, l.id))
          .map((l) => ({ id: l.id, label: l.label })),
      ]
    : [];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={statement.isRefetching}
          onRefresh={() => void statement.refetch()}
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
        eyebrow="Service charge"
        title={data?.title ?? 'Service charge'}
        subtitle={
          data
            ? `${data.unit}${(data.property ?? data.estate) ? `, ${data.property ?? data.estate}` : ''}`
            : undefined
        }
        onBack={() => goBack()}
      />
      <QueryState query={statement} skeleton={<ListSkeleton variant="card" rows={3} height={96} />}>
        {data ? (
          <View style={{ gap: spacing.xl }}>
            <Card style={{ gap: spacing.sm }}>
              <Text variant="caption" color="mutedForeground">
                {formatDay(data.periodStart)} to {formatDay(data.periodEnd)} · due{' '}
                {formatDay(data.dueDate)}
              </Text>
              <Text variant="title">{formatCurrency(data.amount)}</Text>
              {data.amountDue != null && data.amountDue !== data.amount ? (
                <Text variant="caption">
                  After an upheld query, {formatCurrency(data.amountDue)} is now due.
                </Text>
              ) : null}
              {data.collection === 'UNPAID' || data.collection === 'PART_PAID' ? (
                <Button
                  label={`Pay it ${copy.pay}`}
                  variant="secondary"
                  onPress={() => router.push(copy.payRoute as never)}
                />
              ) : (
                <Text variant="caption" color="mutedForeground">
                  {data.collection === 'PAID'
                    ? 'Paid.'
                    : data.collection === 'WAIVED'
                      ? 'Waived. You do not owe it.'
                      : 'Removed before it was paid. You do not owe it.'}
                </Text>
              )}
            </Card>

            <View style={{ gap: spacing.sm }}>
              <Text variant="heading" headingLevel={2}>
                How your share was worked out
              </Text>
              <Text variant="callout" color="mutedForeground">
                The budget for {formatDay(data.budget.periodStart)} to{' '}
                {formatDay(data.budget.lastDay)} is {formatCurrency(data.budget.total)}, billed{' '}
                {SERVICE_CHARGE_CYCLE_LABELS[data.budget.billingCycle].toLowerCase()}.{' '}
                {statementShareBasis(data.budget)}.
                {data.partOfInstalment != null
                  ? ` Your tenancy covered ${data.partOfInstalment}% of this instalment, so you pay that part.`
                  : ''}
              </Text>
              <Card style={{ gap: spacing.md }}>
                {data.lines.map((line) => (
                  <View key={line.id} style={{ gap: 2 }}>
                    <View style={{ flexDirection: 'row', gap: spacing.md }}>
                      <Text variant="callout" style={{ flex: 1, fontWeight: '600' }}>
                        {line.label}
                      </Text>
                      <Text variant="callout">{formatCurrency(line.amount)}</Text>
                    </View>
                    <Text variant="caption" color="mutedForeground">
                      {SERVICE_CHARGE_CATEGORY_LABELS[line.category]}
                      {line.budgetTotal != null
                        ? ` · whole budget ${formatCurrency(line.budgetTotal)}`
                        : ''}
                      {line.spentSoFar != null
                        ? ` · spent so far ${formatCurrency(line.spentSoFar)}`
                        : ''}
                    </Text>
                  </View>
                ))}
              </Card>
            </View>

            <View style={{ gap: spacing.sm }}>
              <Text variant="heading" headingLevel={2}>
                Your queries
              </Text>
              {data.queries.length === 0 ? (
                <Text variant="callout" color="mutedForeground">
                  If something looks wrong, raise a query within 90 days. {copy.replier} replies
                  here.
                </Text>
              ) : (
                data.queries.map((q) => {
                  const line = data.lines.find((l) => l.id === q.lineId);
                  const live = q.status === 'OPEN' || q.status === 'ANSWERED';
                  return (
                    <Card key={q.id} style={{ gap: spacing.sm }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                        <Badge
                          label={SERVICE_CHARGE_QUERY_STATUS_LABELS[q.status]}
                          tone={
                            q.status === 'UPHELD'
                              ? 'success'
                              : q.status === 'REJECTED'
                                ? 'warning'
                                : 'info'
                          }
                        />
                        <Text
                          variant="caption"
                          color="mutedForeground"
                          style={{ flex: 1 }}
                          numberOfLines={1}
                        >
                          {line ? `About ${line.label}` : 'About the whole charge'}
                        </Text>
                      </View>
                      <Text variant="callout">{q.reason}</Text>
                      {q.response ? <Text variant="callout">Reply: {q.response}</Text> : null}
                      {q.outcomeNote ? (
                        <Text variant="callout">
                          Decision: {q.outcomeNote}
                          {q.adjustmentAmount
                            ? ` ${formatCurrency(q.adjustmentAmount)} was credited to your ${copy.holder}.`
                            : ''}
                        </Text>
                      ) : null}
                      {live ? (
                        <Button
                          label="Withdraw query"
                          variant="ghost"
                          size="sm"
                          loading={withdraw.isPending && withdraw.variables === q.id}
                          onPress={() => withdraw.mutate(q.id)}
                        />
                      ) : null}
                    </Card>
                  );
                })
              )}
              {choices.length > 0 ? (
                asking ? (
                  <Card style={{ gap: spacing.md }}>
                    <Text variant="bodyStrong">Raise a query</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                      {choices.map((c) => (
                        <Chip
                          key={c.id || 'whole'}
                          label={c.label}
                          selected={lineId === c.id}
                          onPress={() => setLineId(c.id)}
                        />
                      ))}
                    </View>
                    <TextField
                      label="What looks wrong?"
                      hint="At least 10 characters"
                      value={reason}
                      onChangeText={setReason}
                      multiline
                      maxLength={1000}
                    />
                    <Button
                      label="Send query"
                      loading={raise.isPending}
                      disabled={reason.trim().length < 10 || raise.isPending}
                      onPress={() => raise.mutate()}
                    />
                  </Card>
                ) : (
                  <Button
                    label="Raise a query"
                    variant="secondary"
                    onPress={() => {
                      setLineId(choices[0].id);
                      setAsking(true);
                    }}
                  />
                )
              ) : null}
            </View>
          </View>
        ) : null}
      </QueryState>
    </ScrollView>
  );
}
