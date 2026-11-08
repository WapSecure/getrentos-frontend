import { useState } from 'react';
import { Alert, RefreshControl, ScrollView, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Badge,
  Button,
  Card,
  FormAlert,
  Price,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  agencyFirmApi,
  agentPayStatus,
  hasAccount,
  type PayoutAccount,
  type PayoutRecord,
} from '@/lib/api/agencyFirm';
import { errorMessage } from '@/lib/api/client';
import { formatNaira } from '@/lib/format';
import { AccountForm, History, MyPayout } from '@/components/agency/AgentSelfPayout';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';
import { withStepUpSummary } from '@/lib/stepUp';
import { PAYOUT_ARRIVAL_NOTE, payoutAccountLabel, withdrawStepUpSummary } from '@getrentos/shared';

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
            awaiting={firmSummary.data.awaitingOwnerFunds ?? 0}
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

function FirmPayout({
  account,
  available,
  awaiting,
  accountSet,
  history,
  onChanged,
}: {
  account: PayoutAccount | null;
  available: number;
  /** Earned, waiting for the owners' rent to cover it. */
  awaiting: number;
  accountSet: boolean;
  history: PayoutRecord[];
  onChanged: () => void;
}) {
  const { spacing } = useTheme();
  const toast = useToast();
  const save = useMutation({
    mutationFn: ({
      bankCode,
      accountNumber,
      summary,
    }: {
      bankCode: string;
      accountNumber: string;
      summary: string;
    }) =>
      withStepUpSummary(summary, () => agencyFirmApi.setFirmPayoutAccount(bankCode, accountNumber)),
    onSuccess: () => {
      onChanged();
      toast.show('Payout account saved.', 'success');
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not save the account.'), 'error'),
  });
  const withdraw = useMutation({
    mutationFn: () =>
      withStepUpSummary(withdrawStepUpSummary(formatNaira(available), account), () =>
        agencyFirmApi.requestFirmPayout()
      ),
    onSuccess: () => {
      onChanged();
      toast.show('Payout requested.', 'success');
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not request the payout.'), 'error'),
  });
  return (
    <Card style={{ gap: spacing.md }}>
      <Text variant="heading">The firm’s payout</Text>
      <View style={{ gap: 2 }}>
        <Text variant="caption" color="mutedForeground">
          Available to withdraw
        </Text>
        <Price amount={available} variant="display" />
        {awaiting > 0 ? (
          <Text variant="caption" color="mutedForeground">
            {formatNaira(awaiting)} more is waiting for owners’ rent to arrive.
          </Text>
        ) : null}
      </View>
      <AccountForm
        key={account?.accountNumber ?? 'none'}
        account={hasAccount(account) ? account : null}
        saving={save.isPending}
        onSave={(bankCode, accountNumber, summary) =>
          save.mutate({ bankCode, accountNumber, summary })
        }
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
            `It is sent to ${account ? payoutAccountLabel(account) || 'the firm’s payout account' : 'the firm’s payout account'}. ${PAYOUT_ARRIVAL_NOTE}`,
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
    onError: (e) => toast.show(errorMessage(e, 'Could not pay the agents.'), 'error'),
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
