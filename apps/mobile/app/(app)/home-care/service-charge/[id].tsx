import { useState } from 'react';
import { Alert, RefreshControl, ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  SERVICE_CHARGE_CATEGORY_LABELS,
  SERVICE_CHARGE_COLLECTION_LABELS,
  SERVICE_CHARGE_CYCLE_LABELS,
  SERVICE_CHARGE_STATUS_LABELS,
  formatCurrency,
  shareSummary,
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
import { serviceChargesApi } from '@/lib/api/serviceCharges';
import { withStepUpSummary } from '@/lib/stepUp';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { goBack } from '@/lib/goBack';
import { COLLECTION_TONE, STATUS_TONE, formatDay } from '@/lib/serviceCharge';

/** One budget: its lines and every unit's share; publish, close or void with Face ID or the PIN. */
export default function ServiceChargeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const queryClient = useQueryClient();
  const budget = useQuery({
    queryKey: qk.homeCare.serviceCharge(id),
    queryFn: () => serviceChargesApi.get(id),
  });
  const data = budget.data;
  const isDraft = data?.status === 'DRAFT';
  const preview = useQuery({
    queryKey: [...qk.homeCare.serviceCharge(id), 'preview', data?.version],
    queryFn: () => serviceChargesApi.preview(id),
    enabled: isDraft,
  });
  const invoices = useQuery({
    queryKey: [...qk.homeCare.serviceCharge(id), 'invoices'],
    queryFn: () => serviceChargesApi.invoices(id),
    enabled: !!data && !isDraft,
  });
  const [voidReason, setVoidReason] = useState('');
  const [voidOpen, setVoidOpen] = useState(false);

  const refresh = () => queryClient.invalidateQueries({ queryKey: qk.homeCare.utilities });
  const publish = useMutation({
    mutationFn: () =>
      withStepUpSummary(`Publish ${data!.title} and bill tenants their shares`, () =>
        serviceChargesApi.publish(id, preview.data!.previewHash)
      ),
    onSuccess: (next) => {
      void refresh();
      toast.show(
        next.issuedNow > 0
          ? `Published. ${next.issuedNow} ${next.issuedNow === 1 ? 'tenant has' : 'tenants have'} been billed.`
          : 'Published. Tenants are billed as each instalment falls due.',
        'success'
      );
    },
    onError: (e) => {
      void preview.refetch();
      toast.show(errorMessage(e, 'Could not publish.'), 'error');
    },
  });
  const close = useMutation({
    mutationFn: () => withStepUpSummary(`Close ${data!.title}`, () => serviceChargesApi.close(id)),
    onSuccess: () => {
      void refresh();
      toast.show('Closed. Nothing more will be billed from it.', 'success');
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not close.'), 'error'),
  });
  const voidBudget = useMutation({
    mutationFn: () =>
      withStepUpSummary(`Void ${data!.title}`, () => serviceChargesApi.void(id, voidReason.trim())),
    onSuccess: () => {
      setVoidOpen(false);
      void refresh();
      toast.show('Voided. Its unpaid charges have been removed.', 'success');
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not void.'), 'error'),
  });

  const p = preview.data;
  const canPublish = isDraft && !!p && p.blockers.length === 0;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
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
        subtitle={data?.property.title}
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
                  {formatDay(data.periodStart)} to {formatDay(data.lastDay)} · Billed{' '}
                  {SERVICE_CHARGE_CYCLE_LABELS[data.billingCycle].toLowerCase()}
                </Text>
              </View>
              <Text variant="title">{formatCurrency(data.total)}</Text>
              <Text variant="caption" color="mutedForeground">
                {shareSummary(data.method, data.participants.filter((x) => x.included).length)}
              </Text>
              {data.voidReason ? (
                <Text variant="caption" color="mutedForeground">
                  Voided: {data.voidReason}
                </Text>
              ) : null}
            </Card>

            <View style={{ gap: spacing.sm }}>
              <Text variant="heading" headingLevel={2}>
                Lines
              </Text>
              <Card style={{ gap: spacing.md }}>
                {data.lines.length === 0 ? (
                  <Text color="mutedForeground">No lines yet. Add them on the web.</Text>
                ) : (
                  data.lines.map((line) => (
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
                  ))
                )}
              </Card>
            </View>

            {isDraft ? (
              <View style={{ gap: spacing.sm }}>
                <Text variant="heading" headingLevel={2}>
                  Each unit&apos;s share
                </Text>
                {p?.blockers.map((blocker) => (
                  <FormAlert key={blocker} tone="warning" message={blocker} />
                ))}
                {p?.warnings.map((warning) => (
                  <FormAlert key={warning} tone="warning" message={warning} />
                ))}
                <QueryState query={preview} skeleton={<ListSkeleton rows={4} />}>
                  {p && p.blockers.length === 0 ? (
                    <Card style={{ gap: spacing.md }}>
                      {p.participants.map((row) => (
                        <View
                          key={row.id}
                          accessible
                          accessibilityLabel={
                            row.included
                              ? `${row.label}: ${formatCurrency(row.total)} for the budget`
                              : `${row.label}: not sharing`
                          }
                          style={{ gap: 2 }}
                        >
                          <View style={{ flexDirection: 'row', gap: spacing.md }}>
                            <Text variant="callout" style={{ flex: 1, fontWeight: '600' }}>
                              {row.label}
                            </Text>
                            <Text
                              variant="callout"
                              color={row.included ? undefined : 'mutedForeground'}
                            >
                              {row.included ? formatCurrency(row.total) : 'Not sharing'}
                            </Text>
                          </View>
                          {row.tenancies[0]?.tenant ? (
                            <Text variant="caption" color="mutedForeground">
                              {row.tenancies[0].tenant}
                            </Text>
                          ) : null}
                          {row.notes.map((note) => (
                            <Text key={note} variant="caption" color="mutedForeground">
                              {note}
                            </Text>
                          ))}
                        </View>
                      ))}
                      <Text variant="caption" color="mutedForeground">
                        {p.instalments.length === 1
                          ? `One payment, due ${formatDay(p.instalments[0].dueDate)}.`
                          : `${p.instalments.length} instalments, the first due ${formatDay(p.instalments[0].dueDate)}.`}{' '}
                        Shares add up to {formatCurrency(p.apportioned)}.
                      </Text>
                    </Card>
                  ) : null}
                </QueryState>
                <Button
                  label="Publish and bill tenants"
                  loading={publish.isPending}
                  disabled={!canPublish || publish.isPending}
                  onPress={() =>
                    Alert.alert(
                      'Publish and bill tenants?',
                      'Once published, the lines and shares are locked. Instalments already due are billed to tenants now.',
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
                  skeleton={<ListSkeleton rows={4} />}
                  isEmpty={!invoices.data?.items.length}
                  empty={{
                    title: 'Nothing billed yet',
                    description:
                      'Each instalment is billed to tenants when it reaches its billing date.',
                  }}
                >
                  <Card style={{ gap: spacing.md }}>
                    {(invoices.data?.items ?? []).map((row) => (
                      <View key={row.id} style={{ gap: 4 }}>
                        <View style={{ flexDirection: 'row', gap: spacing.md }}>
                          <Text variant="callout" style={{ flex: 1, fontWeight: '600' }}>
                            {row.unit} · Instalment {row.instalment}
                          </Text>
                          <Text variant="callout">{formatCurrency(row.amount)}</Text>
                        </View>
                        <View
                          style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
                        >
                          <Badge
                            label={SERVICE_CHARGE_COLLECTION_LABELS[row.collection]}
                            tone={COLLECTION_TONE[row.collection]}
                          />
                          <Text
                            variant="caption"
                            color="mutedForeground"
                            style={{ flex: 1 }}
                            numberOfLines={1}
                          >
                            {row.tenant ?? (row.skipReason === 'VACANT' ? 'Vacant' : 'No tenant')} ·
                            due {formatDay(row.dueDate)}
                          </Text>
                        </View>
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
                    Only possible while no tenant has paid towards it. Its unpaid charges are
                    removed.
                  </Text>
                  <TextField
                    label="Why is it being voided?"
                    placeholder="e.g. Wrong figures"
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
