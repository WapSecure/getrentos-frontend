import { useState } from 'react';
import { Alert, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Badge,
  Button,
  Card,
  FormAlert,
  NumberField,
  Price,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  agencyFirmApi,
  agentPayStatus,
  bankProblem,
  hasAccount,
  PAYOUT_STATUS,
  type MySummary,
  type PayoutAccount,
  type PayoutRecord,
} from '@/lib/api/agencyFirm';
import { formatDay } from '@/lib/api/agency';
import { ApiError } from '@/lib/api/client';
import { formatNaira } from '@/lib/format';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

const errorText = (e: unknown, fallback: string) => (e instanceof ApiError ? e.message : fallback);

/**
 * Money out: the firm's own commission to its bank, agents' shares to theirs,
 * and this person's share as an agent. Sections the API refuses for this
 * person (the firm's payout, paying agents) simply don't show.
 */
export default function AgencyPayouts() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const firmAccount = useQuery({
    queryKey: [...qk.agency.firmPayout, 'account'],
    queryFn: agencyFirmApi.firmPayoutAccount,
    retry: false,
  });
  const firmSummary = useQuery({
    queryKey: [...qk.agency.firmPayout, 'summary'],
    queryFn: agencyFirmApi.firmPayoutSummary,
    retry: false,
  });
  const firmPayouts = useQuery({
    queryKey: [...qk.agency.firmPayout, 'history'],
    queryFn: agencyFirmApi.firmPayouts,
    retry: false,
  });
  const payable = useQuery({
    queryKey: qk.agency.agentPayouts,
    queryFn: agencyFirmApi.payableAgents,
    retry: false,
  });
  const myAccount = useQuery({
    queryKey: [...qk.agency.myPayout, 'account'],
    queryFn: agencyFirmApi.myPayoutAccount,
  });
  const mySummary = useQuery({
    queryKey: [...qk.agency.myPayout, 'summary'],
    queryFn: agencyFirmApi.mySummary,
  });
  const myPayouts = useQuery({
    queryKey: [...qk.agency.myPayout, 'history'],
    queryFn: agencyFirmApi.myPayouts,
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['agency', 'payouts'] });
  const requiredTier = mySummary.data?.withdrawTierRequired ?? 3;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Agency"
        title="Payouts"
        subtitle="Commission paid to your bank and your agents"
        onBack={() => goBack()}
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing['3xl'],
          gap: spacing.lg,
        }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={refresh}
            tintColor={colors.mutedForeground}
          />
        }
      >
        {firmSummary.data ? (
          <FirmPayout
            account={firmAccount.data ?? null}
            available={firmSummary.data.available}
            accountSet={firmSummary.data.accountSet}
            history={firmPayouts.data ?? []}
            onChanged={refresh}
          />
        ) : null}

        {payable.data ? (
          <Card style={{ gap: spacing.md }}>
            <Text variant="heading">Pay your agents</Text>
            {payable.data.length === 0 ? (
              <Text variant="callout" color="mutedForeground">
                No agent shares to pay.
              </Text>
            ) : (
              payable.data.map((a) => {
                const status = agentPayStatus(a, requiredTier);
                return (
                  <View
                    key={a.agentUserId}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text variant="callout" style={{ fontWeight: '600' }}>
                        {a.agentName}
                      </Text>
                      <Text variant="caption" color="mutedForeground">
                        {formatNaira(a.payable)} · {a.commissions} commission
                        {a.commissions === 1 ? '' : 's'}
                      </Text>
                    </View>
                    <Badge label={status.label} tone={status.tone} />
                  </View>
                );
              })
            )}
            <PayAgentsButton
              total={payable.data.filter((a) => a.ready).reduce((s, a) => s + a.payable, 0)}
              onChanged={refresh}
            />
          </Card>
        ) : null}

        {mySummary.data ? (
          <MyPayout
            account={myAccount.data ?? null}
            summary={mySummary.data}
            history={myPayouts.data ?? []}
            onChanged={refresh}
          />
        ) : null}
      </ScrollView>
    </View>
  );
}

function History({ items }: { items: PayoutRecord[] }) {
  const { colors, spacing } = useTheme();
  if (!items.length) return null;
  return (
    <View style={{ gap: spacing.sm }}>
      {items.map((p, i) => {
        const s = PAYOUT_STATUS[p.status] ?? PAYOUT_STATUS.PENDING;
        return (
          <View key={p.id ?? `${p.createdAt}-${i}`} style={{ gap: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Price amount={p.amount} variant="callout" style={{ flex: 1 }} />
              <Badge label={s.label} tone={s.tone} />
            </View>
            <Text variant="caption" color="mutedForeground">
              {formatDay(p.createdAt)}
            </Text>
            {p.status === 'FAILED' && p.failureReason ? (
              <Text variant="caption" style={{ color: colors.destructive }}>
                {p.failureReason}
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

function AccountForm({
  account,
  onSave,
  saving,
}: {
  account: PayoutAccount | null;
  onSave: (bankCode: string, accountNumber: string) => void;
  saving: boolean;
}) {
  const { spacing } = useTheme();
  const [editing, setEditing] = useState(!hasAccount(account));
  // Captured once: render must not read the clock.
  const [now] = useState(() => Date.now());
  const [bankCode, setBankCode] = useState(account?.bankCode ?? '');
  const [accountNumber, setAccountNumber] = useState('');
  const problem = bankProblem(bankCode, accountNumber);
  if (!editing && account) {
    return (
      <View style={{ gap: spacing.xs }}>
        <Text variant="callout">
          {account.bankName ?? account.bankCode} · {account.accountNumber}
          {account.accountName ? ` · ${account.accountName}` : ''}
        </Text>
        {account.payoutHoldUntil && Date.parse(account.payoutHoldUntil) > now ? (
          <Text variant="caption" color="mutedForeground">
            New details: payouts to this account start after {formatDay(account.payoutHoldUntil)}.
          </Text>
        ) : null}
        <Button
          label="Change account"
          size="sm"
          variant="ghost"
          onPress={() => setEditing(true)}
          style={{ alignSelf: 'flex-start' }}
        />
      </View>
    );
  }
  return (
    <View style={{ gap: spacing.md }}>
      <NumberField
        label="Bank code"
        value={bankCode}
        onValueChange={setBankCode}
        hint="e.g. 058 for GTBank"
      />
      <NumberField label="Account number" value={accountNumber} onValueChange={setAccountNumber} />
      <Text variant="caption" color="mutedForeground">
        Changing your bank details pauses payouts to the new account for 24 hours, and we’ll email
        you about it.
      </Text>
      {problem && (bankCode || accountNumber) ? (
        <Text variant="caption" color="mutedForeground">
          {problem}
        </Text>
      ) : null}
      <Button
        label="Save account"
        size="sm"
        loading={saving}
        disabled={!!problem || saving}
        onPress={() => onSave(bankCode.trim(), accountNumber.trim())}
      />
    </View>
  );
}

function FirmPayout({
  account,
  available,
  accountSet,
  history,
  onChanged,
}: {
  account: PayoutAccount | null;
  available: number;
  accountSet: boolean;
  history: PayoutRecord[];
  onChanged: () => void;
}) {
  const { spacing } = useTheme();
  const toast = useToast();
  const save = useMutation({
    mutationFn: ({ bankCode, accountNumber }: { bankCode: string; accountNumber: string }) =>
      agencyFirmApi.setFirmPayoutAccount(bankCode, accountNumber),
    onSuccess: () => {
      onChanged();
      toast.show('Payout account saved.', 'success');
    },
    onError: (e) => toast.show(errorText(e, 'Could not save the account.'), 'error'),
  });
  const withdraw = useMutation({
    mutationFn: agencyFirmApi.requestFirmPayout,
    onSuccess: () => {
      onChanged();
      toast.show('Payout requested.', 'success');
    },
    onError: (e) => toast.show(errorText(e, 'Could not request the payout.'), 'error'),
  });
  return (
    <Card style={{ gap: spacing.md }}>
      <Text variant="heading">The firm’s payout</Text>
      <View style={{ gap: 2 }}>
        <Text variant="caption" color="mutedForeground">
          Available to withdraw
        </Text>
        <Price amount={available} variant="display" />
      </View>
      <AccountForm
        key={account?.accountNumber ?? 'none'}
        account={hasAccount(account) ? account : null}
        saving={save.isPending}
        onSave={(bankCode, accountNumber) => save.mutate({ bankCode, accountNumber })}
      />
      {!accountSet ? (
        <Text variant="caption" color="mutedForeground">
          Add a payout account to withdraw.
        </Text>
      ) : null}
      <Button
        label="Withdraw"
        loading={withdraw.isPending}
        disabled={!accountSet || available <= 0 || withdraw.isPending}
        onPress={() =>
          Alert.alert(
            `Withdraw ${formatNaira(available)}?`,
            'It is sent to the firm’s payout account.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Withdraw', onPress: () => withdraw.mutate() },
            ]
          )
        }
      />
      <History items={history} />
    </Card>
  );
}

function PayAgentsButton({ total, onChanged }: { total: number; onChanged: () => void }) {
  const toast = useToast();
  const [skipped, setSkipped] = useState<{ agentName: string; reason: string }[]>([]);
  const run = useMutation({
    mutationFn: agencyFirmApi.payAgents,
    onSuccess: (res) => {
      onChanged();
      setSkipped(res.skipped);
      toast.show(`Paid ${res.paid.length} agents, ${res.skipped.length} skipped.`, 'success');
    },
    onError: (e) => toast.show(errorText(e, 'Could not pay the agents.'), 'error'),
  });
  return (
    <>
      <Button
        label={`Pay agents (${formatNaira(total)} ready)`}
        loading={run.isPending}
        disabled={total <= 0 || run.isPending}
        onPress={() =>
          Alert.alert(
            `Pay ${formatNaira(total)} to your agents?`,
            'Only agents marked Ready are paid.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Pay', onPress: () => run.mutate() },
            ]
          )
        }
      />
      {skipped.length ? (
        <FormAlert
          tone="info"
          title="Skipped"
          message={skipped.map((s) => `${s.agentName}: ${s.reason}`).join('\n')}
        />
      ) : null}
    </>
  );
}

function MyPayout({
  account,
  summary,
  history,
  onChanged,
}: {
  account: PayoutAccount | null;
  summary: MySummary;
  history: PayoutRecord[];
  onChanged: () => void;
}) {
  const { spacing } = useTheme();
  const toast = useToast();
  const save = useMutation({
    mutationFn: ({ bankCode, accountNumber }: { bankCode: string; accountNumber: string }) =>
      agencyFirmApi.setMyPayoutAccount(bankCode, accountNumber),
    onSuccess: () => {
      onChanged();
      toast.show('Your payout account is saved.', 'success');
    },
    onError: (e) => toast.show(errorText(e, 'Could not save the account.'), 'error'),
  });
  return (
    <Card style={{ gap: spacing.md }}>
      <Text variant="heading">Your share as an agent</Text>
      <Text variant="callout" color="mutedForeground">
        Earned {formatNaira(summary.earned)} · paid {formatNaira(summary.paid)} · pending{' '}
        {formatNaira(summary.pending)}
      </Text>
      {!summary.canReceive ? (
        <FormAlert
          tone="warning"
          message={`Verify your identity to trust tier ${summary.withdrawTierRequired} to receive payouts.`}
        />
      ) : null}
      {!summary.canReceive ? (
        <Button
          label="Verify your identity"
          size="sm"
          variant="secondary"
          onPress={() => router.push('/(app)/verify-identity')}
          style={{ alignSelf: 'flex-start' }}
        />
      ) : null}
      <AccountForm
        key={account?.accountNumber ?? 'none'}
        account={hasAccount(account) ? account : null}
        saving={save.isPending}
        onSave={(bankCode, accountNumber) => save.mutate({ bankCode, accountNumber })}
      />
      <History items={history.slice(0, 5)} />
    </Card>
  );
}
