import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BadgeCheck, ChevronRight, Landmark, Sparkles, Wallet } from 'lucide-react-native';
import {
  Button,
  Card,
  Chip,
  FormAlert,
  Price,
  QueryState,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { realtorApi, type RealtorPayout, type RealtorPayoutSummary } from '@/lib/api/realtor';
import { errorMessage } from '@/lib/api/client';
import { BankAccountFields, accountNumberOk } from '@/components/forms/BankAccountFields';
import { formatDate } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { withdrawBlocker } from '@/lib/withdrawal';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { Sheet } from '@/components/Sheet';
import { StatusPill, isUpgradeError } from '@/components/host/HostUI';
import { RevenueTrendChart } from '@/components/landlord/RevenueTrendChart';
import { CommissionRow } from '@/components/realtor/CommissionRow';
import { goBack } from '@/lib/goBack';

const naira = (n: number) => `₦${Math.round(n).toLocaleString('en-NG')}`;

type Filter = 'all' | 'AVAILABLE' | 'PAID' | 'VOID';

/** Commission earned when a sale completes, and getting it to the bank. */
export default function RealtorCommissions() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const [accountOpen, setAccountOpen] = useState(false);
  const summary = useQuery({
    queryKey: qk.realtor.payoutSummary,
    queryFn: realtorApi.payoutSummary,
    retry: (n, e) => !isUpgradeError(e) && n < 2,
  });
  const ready = !!summary.data;
  const account = useQuery({
    queryKey: qk.realtor.payoutAccount,
    queryFn: realtorApi.payoutAccount,
    enabled: ready,
  });
  const trend = useQuery({
    queryKey: qk.realtor.trend,
    queryFn: realtorApi.commissionTrend,
    enabled: ready,
  });
  const payouts = useQuery({
    queryKey: qk.realtor.payouts,
    queryFn: () => realtorApi.payouts(),
    enabled: ready,
  });

  const refresh = () => {
    summary.refetch();
    account.refetch();
    trend.refetch();
    payouts.refetch();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={summary.isRefetching}
            onRefresh={refresh}
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
        <DetailHeader eyebrow="Getting paid" title="Commissions" onBack={() => goBack()} />

        {isUpgradeError(summary.error) ? (
          <ProGate />
        ) : (
          <QueryState query={summary} skeleton={<Skeleton height={200} radius={radius.xl} />}>
            {summary.data ? (
              <>
                <Withdraw s={summary.data} onSetAccount={() => setAccountOpen(true)} />

                <Card elevated style={{ gap: spacing.md }}>
                  {(
                    [
                      ['On its way', summary.data.pending, 'Yours once the sale completes'],
                      ['Paid to your bank', summary.data.paid, 'Settled so far'],
                      [
                        'Earned in total',
                        summary.data.totalEarned,
                        `${summary.data.dealsClosed} ${summary.data.dealsClosed === 1 ? 'deal' : 'deals'} closed`,
                      ],
                    ] as const
                  ).map(([label, amount, note]) => (
                    <View key={label} style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ flex: 1 }}>
                        <Text variant="callout">{label}</Text>
                        <Text variant="caption" color="mutedForeground">
                          {note}
                        </Text>
                      </View>
                      <Price amount={amount} variant="bodyStrong" />
                    </View>
                  ))}
                  {(trend.data?.length ?? 0) > 1 && (trend.data ?? []).some((p) => p.value > 0) ? (
                    <RevenueTrendChart points={trend.data!} />
                  ) : null}
                </Card>

                <View style={{ gap: spacing.sm }}>
                  <Text variant="heading" headingLevel={2}>
                    Payout account
                  </Text>
                  <Pressable
                    onPress={() => setAccountOpen(true)}
                    accessibilityRole="button"
                    accessibilityLabel={
                      account.data
                        ? `${account.data.bankName}, ${account.data.accountNumber}, ${account.data.accountName}. Change`
                        : 'Add a payout account'
                    }
                  >
                    <Card
                      elevated
                      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
                    >
                      <Landmark size={22} color={colors.primary} />
                      <View style={{ flex: 1 }}>
                        {account.isPending ? (
                          <Skeleton height={20} width="60%" />
                        ) : account.data ? (
                          <>
                            <Text variant="bodyStrong">{account.data.bankName}</Text>
                            <Text variant="caption" color="mutedForeground">
                              {account.data.accountNumber} · {account.data.accountName}
                            </Text>
                          </>
                        ) : (
                          <Text variant="bodyStrong">Add where commission is paid</Text>
                        )}
                      </View>
                      <Text variant="callout" color="primary" style={{ fontWeight: '700' }}>
                        {account.data ? 'Change' : 'Add'}
                      </Text>
                    </Card>
                  </Pressable>
                </View>

                <Ledger />

                <View style={{ gap: spacing.sm }}>
                  <Text variant="heading" headingLevel={2}>
                    Payouts
                  </Text>
                  {payouts.isPending ? (
                    <Skeleton height={64} radius={radius.lg} />
                  ) : !payouts.data?.items.length ? (
                    <Text variant="callout" color="mutedForeground">
                      No withdrawals yet.
                    </Text>
                  ) : (
                    payouts.data.items.map((p) => <PayoutRow key={p.id} p={p} />)
                  )}
                </View>
              </>
            ) : null}
          </QueryState>
        )}
      </ScrollView>
      <Sheet open={accountOpen} onClose={() => setAccountOpen(false)} title="Payout account">
        {accountOpen ? <AccountForm onDone={() => setAccountOpen(false)} /> : null}
      </Sheet>
    </KeyboardAvoidingView>
  );
}

function ProGate() {
  const { colors, spacing } = useTheme();
  const perks = [
    'See every commission as soon as the sale completes',
    'Your split snapshotted when you earn it, never restated',
    'Withdraw straight to your bank',
    'A full payout history for your records',
  ];
  return (
    <Card elevated style={{ gap: spacing.md }}>
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: colors.infoSubtle,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Sparkles size={22} color={colors.primary} />
      </View>
      <Text variant="heading">Commission payouts are part of Pro</Text>
      {perks.map((p) => (
        <View key={p} style={{ flexDirection: 'row', gap: spacing.sm }}>
          <BadgeCheck size={16} color={colors.success} style={{ marginTop: 2 }} />
          <Text variant="callout" style={{ flex: 1 }}>
            {p}
          </Text>
        </View>
      ))}
      <Button label="See Pro" onPress={() => router.push('/(app)/billing')} />
    </Card>
  );
}

function Withdraw({ s, onSetAccount }: { s: RealtorPayoutSummary; onSetAccount: () => void }) {
  const { colors, spacing, radius } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const withdraw = useMutation({
    mutationFn: realtorApi.withdraw,
    onSuccess: (p) => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: ['realtor'] });
      toast.show(
        p.status === 'failed'
          ? 'The bank didn’t accept that payout. Support will retry it to your account.'
          : `${naira(p.amount)} is on its way to your bank.`,
        p.status === 'failed' ? 'error' : 'success'
      );
    },
    onError: (e) => {
      void haptics.error();
      toast.show(errorMessage(e, 'Could not withdraw.'), 'error');
    },
  });
  const blocked = withdrawBlocker(s);
  return (
    <View
      style={{
        borderRadius: radius.xl,
        padding: spacing.xl,
        gap: spacing.md,
        backgroundColor: colors.primary,
      }}
    >
      <Text variant="label" uppercase style={{ color: colors.primaryForeground, opacity: 0.8 }}>
        Available to withdraw
      </Text>
      <Price amount={s.available} variant="display" style={{ color: colors.primaryForeground }} />
      {blocked ? (
        <Text variant="callout" style={{ color: colors.primaryForeground, opacity: 0.9 }}>
          {blocked}
        </Text>
      ) : null}
      {!s.accountSet ? (
        <Button label="Add payout account" variant="secondary" onPress={onSetAccount} />
      ) : !s.canWithdraw ? (
        <Button
          label="Finish verification"
          variant="secondary"
          onPress={() => router.push('/(app)/verify-identity')}
        />
      ) : (
        <Button
          label={s.available > 0 ? `Withdraw ${naira(s.available)}` : 'Nothing to withdraw yet'}
          variant="secondary"
          disabled={s.available <= 0}
          loading={withdraw.isPending}
          onPress={() =>
            Alert.alert(`Withdraw ${naira(s.available)}?`, 'It usually lands the same day.', [
              { text: 'Not now', style: 'cancel' },
              { text: 'Withdraw', onPress: () => withdraw.mutate() },
            ])
          }
        />
      )}
    </View>
  );
}

function Ledger() {
  const { spacing, radius } = useTheme();
  const [filter, setFilter] = useState<Filter>('all');
  const query = useQuery({
    queryKey: qk.realtor.commissions(filter),
    queryFn: () => realtorApi.commissions(filter === 'all' ? undefined : filter),
    // Keep the last list on screen while another filter loads.
    placeholderData: keepPreviousData,
  });
  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="heading" headingLevel={2}>
        Commission
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: spacing.sm }}
      >
        {(
          [
            ['all', 'All'],
            ['AVAILABLE', 'Available'],
            ['PAID', 'Paid'],
            ['VOID', 'Voided'],
          ] as const
        ).map(([v, label]) => (
          <Chip
            key={v}
            label={label}
            size="sm"
            selected={filter === v}
            onPress={() => setFilter(v)}
          />
        ))}
      </ScrollView>
      <QueryState query={query} skeleton={<Skeleton height={72} radius={radius.lg} />}>
        {query.data && !query.data.items.length ? (
          <Text variant="callout" color="mutedForeground">
            {filter === 'all'
              ? 'Commission appears here when a sale you worked on completes.'
              : 'Nothing here.'}
          </Text>
        ) : (
          (query.data?.items ?? []).map((c) => <CommissionRow key={c.id} c={c} />)
        )}
      </QueryState>
    </View>
  );
}

const PAYOUT_TONE = {
  pending: { label: 'On its way', tone: 'info' },
  success: { label: 'Paid', tone: 'success' },
  failed: { label: 'Failed', tone: 'danger' },
} as const;

function PayoutRow({ p }: { p: RealtorPayout }) {
  const { colors, spacing } = useTheme();
  const s = PAYOUT_TONE[p.status];
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/(app)/realtor-payout/[id]', params: { id: p.id } })}
      accessibilityRole="button"
      accessibilityLabel={`${naira(p.amount)}, ${s.label}, ${formatDate(p.createdAt, 'medium')}, ${p.commissionCount} commissions`}
    >
      <Card elevated style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Wallet size={20} color={colors.primary} />
        <View style={{ flex: 1, gap: 2 }}>
          <Price amount={p.amount} variant="bodyStrong" />
          <Text variant="caption" color="mutedForeground">
            {formatDate(p.createdAt, 'medium')} · {p.commissionCount}{' '}
            {p.commissionCount === 1 ? 'commission' : 'commissions'}
          </Text>
        </View>
        <StatusPill label={s.label} tone={s.tone} />
        <ChevronRight size={16} color={colors.mutedForeground} />
      </Card>
    </Pressable>
  );
}

function AccountForm({ onDone }: { onDone: () => void }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  // Behind "confirm it's you": apiFetch prompts for it automatically.
  const save = useMutation({
    mutationFn: () => realtorApi.savePayoutAccount(bankCode, accountNumber),
    onSuccess: (a) => {
      void haptics.success();
      qc.setQueryData(qk.realtor.payoutAccount, a);
      qc.invalidateQueries({ queryKey: qk.realtor.payoutSummary });
      toast.show(`Commission goes to ${a.accountName}.`, 'success');
      onDone();
    },
  });
  return (
    <View style={{ gap: spacing.md }}>
      <BankAccountFields
        bankCode={bankCode}
        onBankCode={setBankCode}
        accountNumber={accountNumber}
        onAccountNumber={setAccountNumber}
      />
      <Text variant="caption" color="mutedForeground">
        We check the name on the account with your bank
      </Text>
      {save.error ? (
        <FormAlert message={errorMessage(save.error, 'We couldn’t check that account.')} />
      ) : null}
      <Button
        label="Save payout account"
        disabled={!bankCode || !accountNumberOk(accountNumber)}
        loading={save.isPending}
        onPress={() => save.mutate()}
      />
    </View>
  );
}
