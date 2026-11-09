import { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Repeat } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  DetailSkeleton,
  Divider,
  EmptyState,
  NumberField,
  Price,
  QueryState,
  SwitchRow,
  Text,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import {
  FREQUENCIES,
  landlordFinanceApi,
  PAYOUT_STATUS,
  payableNow,
  type PayoutFrequency,
  type PayoutRecord,
  type PayoutSchedule,
} from '@/lib/api/landlordFinance';
import { errorMessage } from '@/lib/api/client';
import { formatDate, formatNaira } from '@/lib/format';
import { ChipSelect } from '@/components/landlord/ChipSelect';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

/** Anything above the auto-payout limit waits for approval on an owner statement. */
export default function LandlordAutoPayouts() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const query = useQuery({
    queryKey: qk.landlord.payoutSchedule,
    queryFn: landlordFinanceApi.payouts,
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Financials"
        title="Automatic payouts"
        subtitle="Your held balance, paid out on a schedule"
        onBack={() => goBack()}
      />
      <QueryState
        query={query}
        skeleton={<DetailSkeleton />}
        style={{ paddingHorizontal: spacing.xl }}
      >
        {query.data ? (
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: spacing.xl,
              paddingBottom: insets.bottom + spacing['3xl'],
              gap: spacing.lg,
            }}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={query.isRefetching}
                onRefresh={() => query.refetch()}
                tintColor={colors.mutedForeground}
              />
            }
          >
            {/* Keyed so a saved schedule from elsewhere reseeds the form. */}
            <Settings key={query.data.schedule?.nextRunAt ?? 'none'} data={query.data} />
            <Recent records={query.data.recent} />
          </ScrollView>
        ) : null}
      </QueryState>
    </View>
  );
}

function Settings({ data }: { data: PayoutSchedule }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [enabled, setEnabled] = useState(data.schedule?.enabled ?? false);
  const [frequency, setFrequency] = useState<PayoutFrequency>(
    data.schedule?.frequency ?? 'MONTHLY'
  );
  const [reserve, setReserve] = useState(String(data.schedule?.reserveAmount ?? 0));
  const reserveAmount = Math.max(0, Math.round(Number(reserve) || 0));
  const nextRunAt = data.schedule?.nextRunAt ?? null;
  const savedEnabled = data.schedule?.enabled ?? false;

  const save = useMutation({
    mutationFn: () => landlordFinanceApi.setPayouts({ frequency, reserveAmount, enabled }),
    onSuccess: (updated) => {
      qc.setQueryData(qk.landlord.payoutSchedule, updated);
      toast.show('Automatic payouts updated.', 'success');
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not save these settings.'), 'error'),
  });

  return (
    <>
      <Card elevated style={{ gap: spacing.md }}>
        <View style={{ gap: 2 }}>
          <Text variant="caption" color="mutedForeground">
            Held by Sureground for you
          </Text>
          <Price amount={data.balance} variant="display" />
        </View>
        <Divider />
        <View style={{ gap: 2 }}>
          <Text variant="caption" color="mutedForeground">
            Next automatic payout
          </Text>
          <Text variant="bodyStrong">
            {savedEnabled && nextRunAt ? formatDate(nextRunAt) : 'Off'}
          </Text>
          <Text variant="caption" color="mutedForeground">
            {enabled
              ? `About ${formatNaira(payableNow(data.balance, reserveAmount))} would go out, keeping ${formatNaira(reserveAmount)} back.`
              : 'Turn on automatic payouts to sweep your held balance to your bank.'}
          </Text>
        </View>
      </Card>

      <Card style={{ gap: spacing.lg }}>
        <SwitchRow
          label="Automatic payouts"
          description="Paid to your verified bank account. Anything above the auto-payout limit waits for approval on an owner statement."
          value={enabled}
          onValueChange={setEnabled}
        />
        <ChipSelect
          label="How often"
          options={FREQUENCIES}
          value={frequency}
          onChange={setFrequency}
          disabled={!enabled}
        />
        <NumberField
          currency
          label="Reserve to keep back"
          value={reserve}
          onValueChange={setReserve}
          hint="Stays in your account as a float for upcoming costs."
          editable={enabled}
        />
        <Button
          label="Save settings"
          loading={save.isPending}
          disabled={save.isPending}
          onPress={() => save.mutate()}
        />
      </Card>
    </>
  );
}

function Recent({ records }: { records: PayoutRecord[] }) {
  const { colors, spacing } = useTheme();
  return (
    <View style={{ gap: spacing.md }}>
      <Text variant="heading">Recent automatic payouts</Text>
      {records.length === 0 ? (
        <EmptyState
          icon={<Repeat size={32} color={colors.mutedForeground} />}
          title="No automatic payouts yet"
          description="Once a schedule runs, each payout shows up here."
        />
      ) : (
        records.map((r) => (
          <Card key={r.id} padding={spacing.lg} style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Price amount={r.amount} variant="bodyStrong" style={{ flex: 1 }} />
              <Badge label={PAYOUT_STATUS[r.status].label} tone={PAYOUT_STATUS[r.status].tone} />
            </View>
            <Text variant="caption" color="mutedForeground">
              {formatDate(r.paidAt ?? r.createdAt)} · kept {formatNaira(r.reserveAmount)} back
            </Text>
            {r.status === 'HELD' && r.heldReason ? (
              <Text variant="caption" color="mutedForeground">
                {r.heldReason}
              </Text>
            ) : null}
            {r.status === 'FAILED' && r.failureReason ? (
              <Text variant="caption" style={{ color: colors.destructive }}>
                {r.failureReason}
              </Text>
            ) : null}
          </Card>
        ))
      )}
    </View>
  );
}
