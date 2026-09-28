import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Eye, Landmark } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  Chip,
  Divider,
  ErrorState,
  FormAlert,
  Price,
  Skeleton,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { hostShortletsApi, type PayoutSummary } from '@/lib/api/hostShortlets';
import { COMMON_BANKS } from '@/lib/api/sellerPayout';
import { ApiError } from '@/lib/api/client';
import { formatDate } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { Sheet } from '@/components/Sheet';
import { RevenueTrendChart } from '@/components/landlord/RevenueTrendChart';
import { HostFeeNote } from '@/components/host/HostUI';

const naira = (n: number) => `₦${Math.round(n).toLocaleString('en-NG')}`;

/** Why a verified host still can't withdraw (the backend names the real blocker). */
const WITHHELD: Record<string, string> = {
  SCORE_BELOW_TIER3_MIN:
    'Your checks are complete, but your trust score is below what withdrawing needs. It restores itself as your trust profile builds.',
  OPEN_DISPUTE_AS_SUBJECT: 'A dispute open against you is holding withdrawals until it’s resolved.',
  OPEN_REVIEW_CASE:
    'A trust review on your account is still open. Withdrawals unlock when it closes.',
  FAILED_FINANCIAL_CHECK: 'An earlier financial check didn’t pass. Re-submit it to withdraw again.',
  ACCOUNT_RESTRICTED: 'Your account is restricted. Contact support to withdraw.',
};

export default function HostEarnings() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const [accountOpen, setAccountOpen] = useState(false);
  const summary = useQuery({
    queryKey: qk.host.payoutSummary,
    queryFn: hostShortletsApi.payoutSummary,
  });
  const account = useQuery({
    queryKey: qk.host.payoutAccount,
    queryFn: hostShortletsApi.payoutAccount,
  });
  const earnings = useQuery({ queryKey: qk.host.earnings, queryFn: hostShortletsApi.earnings });
  const views = useQuery({ queryKey: qk.host.views, queryFn: hostShortletsApi.views });
  const payouts = useQuery({
    queryKey: qk.host.payouts,
    queryFn: () => hostShortletsApi.payouts(),
  });
  const penalties = useQuery({
    queryKey: qk.host.penalties,
    queryFn: () => hostShortletsApi.penalties(),
  });

  const refresh = () => {
    summary.refetch();
    account.refetch();
    earnings.refetch();
    views.refetch();
    payouts.refetch();
    penalties.refetch();
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
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
      <DetailHeader eyebrow="Hosting" title="Earnings & payouts" onBack={() => router.back()} />

      {summary.isError && !summary.data ? (
        <ErrorState onRetry={() => summary.refetch()} />
      ) : !summary.data ? (
        <Skeleton height={200} radius={radius.xl} />
      ) : (
        <>
          <Withdraw
            s={summary.data}
            hasAccount={!!account.data}
            onSetAccount={() => setAccountOpen(true)}
          />
          <Breakdown s={summary.data} />
          <HostFeeNote />

          <View style={{ gap: spacing.sm }}>
            <Text variant="heading" accessibilityRole="header">
              Payout account
            </Text>
            <Card elevated style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <Landmark size={22} color={colors.primary} />
              <View style={{ flex: 1 }}>
                {account.data ? (
                  <>
                    <Text variant="bodyStrong">{account.data.bankName}</Text>
                    <Text variant="caption" color="mutedForeground">
                      {account.data.accountNumber} · {account.data.accountName}
                    </Text>
                  </>
                ) : (
                  <Text variant="callout" color="mutedForeground">
                    {account.isPending ? 'Loading…' : 'No account yet. Add one to withdraw.'}
                  </Text>
                )}
              </View>
              <Button
                label={account.data ? 'Change' : 'Add'}
                size="sm"
                variant="secondary"
                onPress={() => setAccountOpen(true)}
              />
            </Card>
          </View>

          <Performance />

          <View style={{ gap: spacing.sm }}>
            <Text variant="heading" accessibilityRole="header">
              Payout history
            </Text>
            {payouts.isPending ? (
              <Skeleton height={64} radius={radius.lg} />
            ) : !payouts.data?.items.length ? (
              <Text variant="callout" color="mutedForeground">
                No payouts yet.
              </Text>
            ) : (
              <Card elevated padding="none">
                {payouts.data.items.map((p, i) => (
                  <View key={p.id}>
                    {i ? <Divider /> : null}
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: spacing.md,
                        padding: spacing.lg,
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text variant="callout" style={{ fontWeight: '600' }}>
                          {formatDate(p.paidAt ?? p.createdAt, 'medium')}
                        </Text>
                        <Text variant="caption" color="mutedForeground">
                          {p.bookingCount} stay{p.bookingCount === 1 ? '' : 's'}
                          {p.penaltyDeducted ? ` · ${naira(p.penaltyDeducted)} fees taken` : ''}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 4 }}>
                        <Price amount={p.amount} variant="callout" />
                        <Badge
                          label={
                            p.status === 'SUCCESS'
                              ? 'Paid'
                              : p.status === 'PENDING'
                                ? 'On its way'
                                : 'Failed'
                          }
                          tone={
                            p.status === 'SUCCESS'
                              ? 'success'
                              : p.status === 'PENDING'
                                ? 'info'
                                : 'danger'
                          }
                        />
                      </View>
                    </View>
                  </View>
                ))}
              </Card>
            )}
          </View>

          {penalties.data?.items.length ? (
            <View style={{ gap: spacing.sm }}>
              <Text variant="heading" accessibilityRole="header">
                Cancellation fees
              </Text>
              <Card elevated padding="none">
                {penalties.data.items.map((p, i) => (
                  <View key={p.id}>
                    {i ? <Divider /> : null}
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: spacing.md,
                        padding: spacing.lg,
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text variant="callout" style={{ fontWeight: '600' }} numberOfLines={1}>
                          {p.listingTitle}
                        </Text>
                        <Text variant="caption" color="mutedForeground">
                          Cancelled {p.daysBeforeCheckIn} day{p.daysBeforeCheckIn === 1 ? '' : 's'}{' '}
                          before · {p.percent}%
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 4 }}>
                        <Text variant="callout" style={{ fontWeight: '700' }}>
                          {naira(p.status === 'OUTSTANDING' ? p.outstanding : p.amount)}
                        </Text>
                        <Badge
                          label={
                            p.status === 'OUTSTANDING'
                              ? 'Owed'
                              : p.status === 'SETTLED'
                                ? 'Settled'
                                : 'Waived'
                          }
                          tone={p.status === 'OUTSTANDING' ? 'warning' : 'neutral'}
                        />
                      </View>
                    </View>
                  </View>
                ))}
              </Card>
            </View>
          ) : null}
        </>
      )}

      <Sheet open={accountOpen} onClose={() => setAccountOpen(false)} title="Payout account">
        {accountOpen ? <AccountForm onDone={() => setAccountOpen(false)} /> : null}
      </Sheet>
    </ScrollView>
  );
}

function Withdraw({
  s,
  hasAccount,
  onSetAccount,
}: {
  s: PayoutSummary;
  hasAccount: boolean;
  onSetAccount: () => void;
}) {
  const { colors, spacing, radius } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const withdraw = useMutation({
    mutationFn: hostShortletsApi.requestPayout,
    onSuccess: (p) => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: ['host'] });
      toast.show(`${naira(p.amount)} is on its way to your bank.`, 'success');
    },
    onError: (e) => {
      void haptics.error();
      toast.show(e instanceof ApiError ? e.message : 'Could not withdraw.', 'error');
    },
  });
  const blocked = !s.accountSet
    ? 'Add a payout account to withdraw.'
    : !s.canWithdraw
      ? (s.withdrawWithheldReason && WITHHELD[s.withdrawWithheldReason]) ||
        `Withdrawing needs Trust Tier ${s.withdrawTierRequired}; you’re on ${s.hostTier}. Finish your verification to unlock it.`
      : null;
  const confirm = () =>
    Alert.alert(
      `Withdraw ${naira(s.available)}?`,
      `${s.penaltiesOutstanding ? `${naira(s.penaltiesOutstanding)} in cancellation fees comes off first. ` : ''}It usually lands the same day.`,
      [
        { text: 'Not now', style: 'cancel' },
        { text: 'Withdraw', onPress: () => withdraw.mutate() },
      ]
    );
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
          label="See your trust profile"
          variant="secondary"
          onPress={() => router.push('/(app)/verify-identity')}
        />
      ) : (
        <Button
          label={s.available > 0 ? `Withdraw ${naira(s.available)}` : 'Nothing to withdraw yet'}
          variant="secondary"
          disabled={s.available <= 0 || !hasAccount}
          loading={withdraw.isPending}
          onPress={confirm}
        />
      )}
    </View>
  );
}

function Breakdown({ s }: { s: PayoutSummary }) {
  const { spacing } = useTheme();
  const rows: [string, number, string][] = [
    [
      'On the way',
      s.upcoming,
      s.nextReleaseAt
        ? `Next unlocks ${formatDate(s.nextReleaseAt, 'medium')}`
        : `Held ${s.holdHours}h after check-in`,
    ],
    ['Sent to your bank', s.inTransit, 'Waiting for the bank to confirm'],
    ['Held by a dispute', s.frozen, 'Released when the dispute closes'],
    ['In a failed payout', s.inFailedPayout, 'Support will retry it'],
    ['Fees owed', s.penaltiesOutstanding, 'Taken from your next withdrawals'],
  ];
  const shown = rows.filter(([, v]) => v > 0);
  if (!shown.length) return null;
  return (
    <Card elevated style={{ gap: spacing.md }}>
      {shown.map(([k, v, hint]) => (
        <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Text variant="callout" style={{ fontWeight: '600' }}>
              {k}
            </Text>
            <Text variant="caption" color="mutedForeground">
              {hint}
            </Text>
          </View>
          <Text variant="bodyStrong">{naira(v)}</Text>
        </View>
      ))}
    </Card>
  );
}

function Performance() {
  const { colors, spacing, radius } = useTheme();
  const earnings = useQuery({ queryKey: qk.host.earnings, queryFn: hostShortletsApi.earnings });
  const views = useQuery({ queryKey: qk.host.views, queryFn: hostShortletsApi.views });
  const e = earnings.data;
  if (earnings.isPending) return <Skeleton height={220} radius={radius.lg} />;
  if (!e) return null;
  const points = e.monthly.slice(-6).map((m) => ({
    label: new Date(`${m.month}-15T12:00:00`).toLocaleDateString('en-NG', { month: 'short' }),
    value: m.earned,
  }));
  const stats: [string, string][] = [
    ['Nights sold', e.nightsSold.toLocaleString('en-NG')],
    ['Stays', e.bookingsCount.toLocaleString('en-NG')],
    ['Avg. night', e.avgNightlyRate ? naira(e.avgNightlyRate) : '—'],
    ['Views', views.data ? views.data.totalViews.toLocaleString('en-NG') : '—'],
  ];
  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="heading" accessibilityRole="header">
        Performance
      </Text>
      <Card elevated style={{ gap: spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
          <Price amount={e.totalEarned} variant="title" />
          <Text variant="callout" color="mutedForeground">
            earned
          </Text>
        </View>
        <Text variant="caption" color="mutedForeground">
          {naira(e.grossEarned)} from guests − {naira(e.platformFees)} GetRentos fees
          {e.commissionPct ? ` (${e.commissionPct}%)` : ''}
        </Text>
        {points.length > 1 ? <RevenueTrendChart points={points} /> : null}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
          {stats.map(([k, v]) => (
            <View key={k} style={{ flexBasis: '46%', flexGrow: 1, gap: 2 }}>
              <Text variant="caption" color="mutedForeground">
                {k}
              </Text>
              <Text variant="bodyStrong">{v}</Text>
            </View>
          ))}
        </View>
      </Card>
      {e.byListing.length > 1 ? (
        <Card elevated padding="none">
          {e.byListing
            .slice()
            .sort((a, b) => b.earned - a.earned)
            .map((l, i) => {
              const v = views.data?.byListing.find((x) => x.listingId === l.listingId);
              return (
                <View key={l.listingId}>
                  {i ? <Divider /> : null}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.md,
                      padding: spacing.lg,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text variant="callout" style={{ fontWeight: '600' }} numberOfLines={1}>
                        {l.title}
                      </Text>
                      <Text variant="caption" color="mutedForeground">
                        {l.nights} nights · {l.bookings} stays
                      </Text>
                    </View>
                    {v ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Eye size={13} color={colors.mutedForeground} />
                        <Text variant="caption" color="mutedForeground">
                          {v.views}
                        </Text>
                      </View>
                    ) : null}
                    <Price amount={l.earned} variant="callout" />
                  </View>
                </View>
              );
            })}
        </Card>
      ) : null}
    </View>
  );
}

function AccountForm({ onDone }: { onDone: () => void }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [bankCode, setBankCode] = useState('');
  const [other, setOther] = useState(false);
  const [accountNumber, setAccountNumber] = useState('');
  // Behind "confirm it's you": apiFetch prompts for it automatically.
  const save = useMutation({
    mutationFn: () => hostShortletsApi.savePayoutAccount(bankCode, accountNumber),
    onSuccess: (a) => {
      void haptics.success();
      qc.setQueryData(qk.host.payoutAccount, a);
      qc.invalidateQueries({ queryKey: qk.host.payoutSummary });
      toast.show(`Payouts go to ${a.accountName}.`, 'success');
      onDone();
    },
  });
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ gap: spacing.md }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {COMMON_BANKS.map((b) => (
            <Chip
              key={b.code}
              label={b.name}
              size="sm"
              selected={!other && bankCode === b.code}
              onPress={() => {
                setOther(false);
                setBankCode(b.code);
              }}
            />
          ))}
          <Chip
            label="Other bank"
            size="sm"
            selected={other}
            onPress={() => {
              setOther(true);
              setBankCode('');
            }}
          />
        </View>
        {other ? (
          <TextField
            label="Bank code"
            keyboardType="number-pad"
            value={bankCode}
            onChangeText={(v) => setBankCode(v.replace(/\D/g, ''))}
            maxLength={6}
          />
        ) : null}
        <TextField
          label="Account number"
          keyboardType="number-pad"
          value={accountNumber}
          onChangeText={(v) => setAccountNumber(v.replace(/\D/g, ''))}
          maxLength={10}
        />
        {save.error ? (
          <FormAlert
            message={
              save.error instanceof ApiError
                ? save.error.message
                : 'We couldn’t check that account.'
            }
          />
        ) : null}
        <Button
          label="Save payout account"
          disabled={!bankCode || accountNumber.length !== 10}
          loading={save.isPending}
          onPress={() => save.mutate()}
        />
        <Text variant="caption" color="mutedForeground">
          We check the account name with your bank before saving. You’ll be asked to confirm it’s
          you.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}
