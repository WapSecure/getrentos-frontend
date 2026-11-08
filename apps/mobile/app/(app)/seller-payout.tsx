import { useState } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, View } from 'react-native';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BadgeCheck, Landmark } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  FormAlert,
  Price,
  QueryState,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  sellerPayoutApi,
  type SellerPayoutStatus,
  type SellerSalePayout,
} from '@/lib/api/sellerPayout';
import { errorMessage } from '@/lib/api/client';
import { BankAccountFields } from '@/components/forms/BankAccountFields';
import { PayoutCooldownHint, PayoutHoldNotice } from '@/components/payouts/PayoutHoldNotice';
import { withStepUpSummary } from '@/lib/stepUp';
import {
  INCOMPLETE_ACCOUNT_LOOKUP,
  PAYOUT_FAILED_NEXT_STEP,
  lookupAllowsSave,
  maskAccountNumber,
  payoutAccountStepUpSummary,
  saveAccountLabel,
  type AccountLookup,
} from '@getrentos/shared';
import { formatDate } from '@/lib/format';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { goBack } from '@/lib/goBack';

const STATUS: Record<SellerPayoutStatus, { label: string; tone: 'info' | 'success' | 'danger' }> = {
  PENDING: { label: 'Queued for the next hourly payout', tone: 'info' },
  PROCESSING: { label: 'On its way', tone: 'info' },
  PAID: { label: 'Paid', tone: 'success' },
  FAILED: { label: 'Failed', tone: 'danger' },
};

/** Where sale proceeds are paid once escrow releases. Shared by every seller role. */
export default function SellerPayout() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const account = useQuery({
    queryKey: qk.seller.payoutAccount,
    queryFn: sellerPayoutApi.account,
  });
  const payouts = useQuery({
    queryKey: qk.seller.payouts,
    queryFn: () => sellerPayoutApi.payouts(),
  });
  const a = account.data;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={account.isRefetching || payouts.isRefetching}
            onRefresh={() => {
              account.refetch();
              payouts.refetch();
            }}
            tintColor={colors.mutedForeground}
          />
        }
        contentContainerStyle={{
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing['3xl'],
          gap: spacing.lg,
        }}
      >
        <DetailHeader
          eyebrow="Getting paid"
          title="Payout account"
          subtitle="Where your sale money goes once the sale completes"
          onBack={() => goBack()}
        />

        <QueryState query={account} skeleton={<Skeleton height={96} radius={radius.lg} />}>
          {!a ? null : a.accountNumber ? (
            <Card
              elevated
              accessible
              accessibilityLabel={`${a.bankName}, account ending ${maskAccountNumber(a.accountNumber).replace(/\D/g, '')}, ${a.accountName}. ${a.verified ? 'Verified' : 'Not verified yet'}`}
              style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
            >
              <Landmark size={22} color={colors.primary} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="bodyStrong">{a.bankName}</Text>
                <Text variant="callout" color="mutedForeground">
                  {maskAccountNumber(a.accountNumber)} · {a.accountName}
                </Text>
                <PayoutHoldNotice holdUntil={a.payoutHoldUntil} />
              </View>
              {a.verified ? (
                <BadgeCheck size={20} color={colors.success} />
              ) : (
                <Badge label="Not verified" tone="warning" />
              )}
            </Card>
          ) : (
            <FormAlert
              tone="info"
              message="No payout account yet. Add one so your sale proceeds can reach you."
            />
          )}
          {a ? <AccountForm hasAccount={!!a.accountNumber} /> : null}
        </QueryState>

        <View style={{ gap: spacing.sm }}>
          <Text variant="heading" headingLevel={2}>
            Sale payouts
          </Text>
          <Text variant="caption" color="mutedForeground">
            Queued sales are sent in the hourly payout run; a newly changed account waits 24 hours
            first.
          </Text>
          {payouts.isPending ? (
            <Skeleton height={72} radius={radius.lg} />
          ) : !payouts.data?.items.length ? (
            <Text variant="callout" color="mutedForeground">
              No released sales yet.
            </Text>
          ) : (
            payouts.data.items.map((p) => <PayoutRow key={p.transactionId} p={p} />)
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function AccountForm({ hasAccount }: { hasAccount: boolean }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [lookup, setLookup] = useState<AccountLookup>(INCOMPLETE_ACCOUNT_LOOKUP);

  const save = useMutation({
    mutationFn: () =>
      withStepUpSummary(
        payoutAccountStepUpSummary({
          bankName: lookup.bankName,
          accountNumber,
          accountName: lookup.accountName,
        }),
        () => sellerPayoutApi.updateAccount({ bankCode, accountNumber })
      ),
    onSuccess: (saved) => {
      qc.setQueryData(qk.seller.payoutAccount, saved);
      setAccountNumber('');
      toast.show(
        saved.verified ? `Paying out to ${saved.accountName}.` : 'Saved. We’ll verify it shortly.',
        'success'
      );
    },
  });

  return (
    <Card elevated style={{ gap: spacing.md }}>
      <Text variant="bodyStrong" headingLevel={2}>
        {hasAccount ? 'Change account' : 'Add an account'}
      </Text>
      <BankAccountFields
        bankCode={bankCode}
        onBankCode={setBankCode}
        accountNumber={accountNumber}
        onAccountNumber={setAccountNumber}
        onLookup={setLookup}
      />
      {hasAccount ? <PayoutCooldownHint /> : null}
      {save.error ? (
        <FormAlert
          message={errorMessage(save.error, 'We couldn’t check that account. Try again.')}
        />
      ) : null}
      <Button
        label={saveAccountLabel(
          lookup,
          hasAccount ? 'Update payout account' : 'Save payout account'
        )}
        disabled={!lookupAllowsSave(lookup)}
        loading={save.isPending}
        onPress={() => save.mutate()}
      />
    </Card>
  );
}

function PayoutRow({ p }: { p: SellerSalePayout }) {
  const { spacing } = useTheme();
  const s = STATUS[p.payoutStatus];
  const when =
    p.payoutStatus === 'PAID' && p.paidAt
      ? `Paid ${formatDate(p.paidAt, 'medium')}`
      : p.releasedAt
        ? `Released ${formatDate(p.releasedAt, 'medium')}`
        : 'Released';
  return (
    <Card elevated style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {p.propertyTitle ?? 'Property sale'}
        </Text>
        <Text variant="caption" color="mutedForeground">
          {when}
        </Text>
        {p.payoutStatus === 'FAILED' ? (
          <Text variant="caption" color="mutedForeground">
            {PAYOUT_FAILED_NEXT_STEP}
          </Text>
        ) : null}
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <Price amount={p.amount} variant="callout" />
        <Badge label={s.label} tone={s.tone} />
      </View>
    </Card>
  );
}
