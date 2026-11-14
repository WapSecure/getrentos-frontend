import { useState } from 'react';
import { Alert, RefreshControl, ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  SERVICE_CHARGE_CATEGORY_LABELS,
  SERVICE_CHARGE_CYCLE_LABELS,
  SERVICE_CHARGE_STATUS_LABELS,
  formatCurrency,
} from '@sureground/shared';
import {
  Badge,
  Button,
  Card,
  FormAlert,
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

const COLLECTION_LABEL = {
  PAID: 'Paid',
  UNPAID: 'Not paid yet',
  REMOVED: 'Waived',
  VOIDED: 'Voided',
} as const;

/** One estate budget: lines, each household's share; publish, close or void with Face ID or the PIN. */
export default function EstateServiceChargeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { estateId } = useEstate();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const qc = useQueryClient();
  const key = qk.estateServiceCharges.one(estateId ?? '', id);
  const budget = useQuery({
    queryKey: key,
    queryFn: () => estateServiceChargesApi.get(estateId!, id),
    enabled: !!estateId,
  });
  const data = budget.data;
  const isDraft = data?.status === 'DRAFT';
  const preview = useQuery({
    queryKey: [...key, 'preview'],
    queryFn: () => estateServiceChargesApi.preview(estateId!, id),
    enabled: !!estateId && isDraft,
  });
  const invoices = useQuery({
    queryKey: [...key, 'invoices'],
    queryFn: () => estateServiceChargesApi.invoices(estateId!, id),
    enabled: !!estateId && !!data && !isDraft,
  });
  const [voidOpen, setVoidOpen] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const refresh = () =>
    qc.invalidateQueries({ queryKey: qk.estateServiceCharges.list(estateId ?? '') });
  const onError = (fallback: string) => (e: unknown) =>
    toast.show(errorMessage(e, fallback), 'error');
  const publish = useMutation({
    mutationFn: () =>
      withStepUpSummary(`Publish ${data!.title} and bill households`, () =>
        estateServiceChargesApi.publish(estateId!, id, preview.data!.previewHash)
      ),
    onSuccess: (next) => {
      void refresh();
      toast.show(
        next.issuedNow > 0
          ? `Published. ${next.issuedNow} households billed.`
          : 'Published. Households are billed as each instalment falls due.',
        'success'
      );
    },
    onError: (e) => {
      void preview.refetch();
      onError('Could not publish.')(e);
    },
  });
  const close = useMutation({
    mutationFn: () =>
      withStepUpSummary(`Close ${data!.title}`, () => estateServiceChargesApi.close(estateId!, id)),
    onSuccess: () => void refresh(),
    onError: onError('Could not close.'),
  });
  const voidBudget = useMutation({
    mutationFn: () =>
      withStepUpSummary(`Void ${data!.title}`, () =>
        estateServiceChargesApi.void(estateId!, id, voidReason.trim())
      ),
    onSuccess: () => {
      setVoidOpen(false);
      void refresh();
      toast.show('Voided. Its unpaid dues have been waived.', 'success');
    },
    onError: onError('Could not void.'),
  });
  const p = preview.data;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={budget.isRefetching}
          onRefresh={() => void refresh()}
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
        title={data?.title ?? 'Budget'}
        onBack={() => goBack()}
      />
      <QueryState query={budget} skeleton={<ListSkeleton variant="card" rows={3} height={96} />}>
        {data ? (
          <View style={{ gap: spacing.xl }}>
            <Card style={{ gap: spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Badge
                  label={SERVICE_CHARGE_STATUS_LABELS[data.status]}
                  tone={STATUS_TONE[data.status]}
                />
                <Text variant="caption" color="mutedForeground" style={{ flex: 1 }}>
                  {formatDay(data.periodStart)} to {formatDay(data.lastDay)} · billed{' '}
                  {SERVICE_CHARGE_CYCLE_LABELS[data.billingCycle].toLowerCase()}
                </Text>
              </View>
              <Text variant="title">{formatCurrency(data.total)}</Text>
              {data.voidReason ? <Text variant="caption">Voided: {data.voidReason}</Text> : null}
            </Card>
            <Card style={{ gap: spacing.md }}>
              {data.lines.map((line) => (
                <View key={line.id} style={{ flexDirection: 'row', gap: spacing.md }}>
                  <View style={{ flex: 1 }}>
                    <Text variant="callout" style={{ fontWeight: '600' }}>
                      {line.label}
                    </Text>
                    <Text variant="caption" color="mutedForeground">
                      {SERVICE_CHARGE_CATEGORY_LABELS[line.category]}
                    </Text>
                  </View>
                  <Text variant="callout">{formatCurrency(line.amount)}</Text>
                </View>
              ))}
            </Card>
            {isDraft ? (
              <View style={{ gap: spacing.sm }}>
                <Text variant="heading" headingLevel={2}>
                  Each household&apos;s share
                </Text>
                {p?.blockers.map((b) => (
                  <FormAlert key={b} tone="warning" message={b} />
                ))}
                <QueryState query={preview} skeleton={<ListSkeleton rows={4} />}>
                  {p && p.blockers.length === 0 ? (
                    <Card style={{ gap: spacing.sm }}>
                      {p.participants.map((row) => (
                        <View key={row.id} style={{ flexDirection: 'row', gap: spacing.md }}>
                          <Text variant="callout" style={{ flex: 1 }}>
                            {row.label}
                          </Text>
                          <Text
                            variant="callout"
                            color={row.included ? undefined : 'mutedForeground'}
                          >
                            {row.included ? formatCurrency(row.total) : 'Not sharing'}
                          </Text>
                        </View>
                      ))}
                      <Text variant="caption" color="mutedForeground">
                        {p.instalments.length === 1
                          ? 'One payment'
                          : `${p.instalments.length} instalments`}
                        , the first due {formatDay(p.instalments[0]?.dueDate ?? data.periodStart)}.
                      </Text>
                    </Card>
                  ) : null}
                </QueryState>
                <Button
                  label="Publish and bill households"
                  loading={publish.isPending}
                  disabled={!p || p.blockers.length > 0 || publish.isPending}
                  onPress={() =>
                    Alert.alert(
                      'Publish and bill households?',
                      'Once published, the lines and shares are locked.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Publish', onPress: () => publish.mutate() },
                      ]
                    )
                  }
                />
              </View>
            ) : (
              <View style={{ gap: spacing.sm }}>
                <Text variant="heading" headingLevel={2}>
                  What was billed
                </Text>
                <QueryState
                  query={invoices}
                  skeleton={<ListSkeleton rows={3} />}
                  isEmpty={!invoices.data?.length}
                  empty={{
                    title: 'Nothing billed yet',
                    description: 'Each instalment is billed when it reaches its billing date.',
                  }}
                >
                  <Card style={{ gap: spacing.md }}>
                    {(invoices.data ?? []).map((row) => (
                      <View key={row.id} style={{ gap: 2 }}>
                        <View style={{ flexDirection: 'row', gap: spacing.md }}>
                          <Text variant="callout" style={{ flex: 1, fontWeight: '600' }}>
                            {row.unit} · instalment {row.instalment}
                          </Text>
                          <Text variant="callout">{formatCurrency(row.amount)}</Text>
                        </View>
                        <Text variant="caption" color="mutedForeground">
                          {COLLECTION_LABEL[row.collection]} · due {formatDay(row.dueDate)}
                        </Text>
                      </View>
                    ))}
                  </Card>
                </QueryState>
                {data.status === 'PUBLISHED' ? (
                  <Button
                    label="Close budget"
                    variant="secondary"
                    loading={close.isPending}
                    onPress={() =>
                      Alert.alert('Close this budget?', 'Nothing more will be billed from it.', [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Close budget', onPress: () => close.mutate() },
                      ])
                    }
                  />
                ) : null}
              </View>
            )}
            {data.status !== 'VOIDED' ? (
              voidOpen ? (
                <Card style={{ gap: spacing.sm }}>
                  <Text variant="bodyStrong">Void this budget</Text>
                  <Text variant="caption" color="mutedForeground">
                    Only possible while no household has paid. Its unpaid dues are waived.
                  </Text>
                  <TextField
                    label="Why is it being voided?"
                    value={voidReason}
                    onChangeText={setVoidReason}
                    maxLength={500}
                  />
                  <Button
                    label="Void budget"
                    variant="destructive"
                    loading={voidBudget.isPending}
                    disabled={voidReason.trim().length < 3 || voidBudget.isPending}
                    onPress={() => voidBudget.mutate()}
                  />
                </Card>
              ) : (
                <Button label="Void budget" variant="ghost" onPress={() => setVoidOpen(true)} />
              )
            ) : null}
          </View>
        ) : null}
      </QueryState>
    </ScrollView>
  );
}
