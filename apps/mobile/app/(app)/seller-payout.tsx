import { useState } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BadgeCheck, Landmark } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  Chip,
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
import {
  COMMON_BANKS,
  sellerPayoutApi,
  type SellerPayoutStatus,
  type SellerSalePayout,
} from '@/lib/api/sellerPayout';
import { ApiError } from '@/lib/api/client';
import { formatDate } from '@/lib/format';
import { DetailHeader } from '@/components/dashboard/DetailHeader';

const STATUS: Record<SellerPayoutStatus, { label: string; tone: 'info' | 'success' | 'danger' }> = {
  PENDING: { label: 'Queued', tone: 'info' },
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
          subtitle="Where sale proceeds go once escrow releases"
          onBack={() => router.back()}
        />

        {account.isError && !a ? (
          <ErrorState onRetry={() => account.refetch()} />
        ) : !a ? (
          <Skeleton height={96} radius={radius.lg} />
        ) : a.accountNumber ? (
          <Card
            elevated
            accessible
            accessibilityLabel={`${a.bankName}, account ${a.accountNumber}, ${a.accountName}. ${a.verified ? 'Verified' : 'Not verified yet'}`}
            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
          >
            <Landmark size={22} color={colors.primary} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="bodyStrong">{a.bankName}</Text>
              <Text variant="callout" color="mutedForeground">
                {a.accountNumber} · {a.accountName}
              </Text>
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

        <View style={{ gap: spacing.sm }}>
          <Text variant="heading" accessibilityRole="header">
            Sale payouts
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
  const [other, setOther] = useState(false);
  const [accountNumber, setAccountNumber] = useState('');

  const save = useMutation({
    mutationFn: () => sellerPayoutApi.updateAccount({ bankCode, accountNumber }),
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
      <Text variant="bodyStrong" accessibilityRole="header">
        {hasAccount ? 'Change account' : 'Add an account'}
      </Text>
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
          value={bankCode}
          onChangeText={(v) => setBankCode(v.replace(/\D/g, ''))}
          keyboardType="number-pad"
          maxLength={6}
          hint="Your bank’s code, e.g. 058 for GTBank"
        />
      ) : null}
      <TextField
        label="Account number"
        value={accountNumber}
        onChangeText={(v) => setAccountNumber(v.replace(/\D/g, ''))}
        keyboardType="number-pad"
        maxLength={10}
      />
      {save.error ? (
        <FormAlert
          message={
            save.error instanceof ApiError
              ? save.error.message
              : 'We couldn’t check that account. Try again.'
          }
        />
      ) : null}
      <Button
        label={hasAccount ? 'Update payout account' : 'Save payout account'}
        disabled={!bankCode || accountNumber.length !== 10}
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
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <Price amount={p.amount} variant="callout" />
        <Badge label={s.label} tone={s.tone} />
      </View>
    </Card>
  );
}
