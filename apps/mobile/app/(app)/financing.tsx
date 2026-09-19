import { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Lock, Sparkles, Wallet } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  Divider,
  ErrorState,
  Price,
  Screen,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  financingApi,
  FINANCING_FEE_SCHEDULE,
  MIN_TRUST_SCORE_FOR_FINANCING,
  type FinancingInstallment,
  type FinancingOverview,
  type FinancingPlan,
  type FinancingPlanLength,
} from '@/lib/api/financing';
import { ApiError } from '@/lib/api/client';
import { formatDate } from '@/lib/format';

const PLAN_LENGTHS: FinancingPlanLength[] = [3, 6, 12];
const INSTALLMENT_STATUS_TONE: Record<
  FinancingInstallment['status'],
  'success' | 'warning' | 'danger' | 'info'
> = {
  upcoming: 'info',
  due: 'warning',
  processing: 'info',
  paid: 'success',
  overdue: 'danger',
};

export default function Financing() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();

  const query = useQuery({ queryKey: qk.renter.financing, queryFn: financingApi.getOverview });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          paddingTop: insets.top + 8,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.sm,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={10}
        >
          <ChevronLeft size={24} color={colors.foreground} />
        </Pressable>
        <Text variant="title">GetRentos Flex</Text>
      </View>

      {query.isLoading ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          <Skeleton height={180} radius={16} />
        </View>
      ) : query.isError || !query.data ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : (
        <Screen padded>
          {(() => {
            const overview = query.data;
            return overview.plan ? (
              <ActivePlanCard overview={{ plan: overview.plan }} />
            ) : (
              <EligibilityCard overview={overview} />
            );
          })()}
        </Screen>
      )}
    </View>
  );
}

function EligibilityCard({ overview }: { overview: FinancingOverview }) {
  const { colors, spacing } = useTheme();
  const eligible = overview.trustScore >= MIN_TRUST_SCORE_FOR_FINANCING;
  const [applying, setApplying] = useState(false);

  return (
    <>
      <Card elevated>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Sparkles size={20} color={colors.primary} />
          <Text variant="heading">Split your rent into monthly payments</Text>
        </View>
        <Text variant="callout" color="mutedForeground" style={{ marginTop: spacing.sm }}>
          We pay your landlord {overview.propertyName} in full today, and you repay us monthly —
          building your trust score along the way.
        </Text>

        <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
          <Row label="Rent due" value={<Price amount={overview.rentAmount} variant="callout" />} />
          <Row label="Landlord" value={<Text variant="callout">{overview.landlordName}</Text>} />
        </View>

        {!eligible ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              marginTop: spacing.lg,
              padding: spacing.md,
              borderRadius: 10,
              backgroundColor: colors.warningSubtle,
            }}
          >
            <Lock size={16} color={colors.warning} />
            <Text variant="caption" color="warning" style={{ flex: 1 }}>
              Your trust score ({overview.trustScore}) needs to reach{' '}
              {MIN_TRUST_SCORE_FOR_FINANCING} to unlock GetRentos Flex.
            </Text>
          </View>
        ) : (
          <Button
            label="Apply for Flex"
            style={{ marginTop: spacing.lg }}
            onPress={() => setApplying(true)}
          />
        )}

        <Text variant="caption" color="mutedForeground" style={{ marginTop: spacing.md }}>
          Missed installments affect your trust score.
        </Text>
      </Card>

      {applying ? (
        <ApplyPanel rentAmount={overview.rentAmount} onClose={() => setApplying(false)} />
      ) : null}
    </>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  const { spacing } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.xs,
      }}
    >
      <Text variant="caption" color="mutedForeground">
        {label}
      </Text>
      {value}
    </View>
  );
}

function ApplyPanel({ rentAmount, onClose }: { rentAmount: number; onClose: () => void }) {
  const { colors, spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [months, setMonths] = useState<FinancingPlanLength>(6);

  const mutation = useMutation({
    mutationFn: () => financingApi.apply(months),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.renter.financing });
      toast.show('Flex plan approved — your landlord has been paid.', 'success');
      onClose();
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not apply for Flex.', 'error'),
  });

  return (
    <Card elevated style={{ marginTop: spacing.lg }}>
      <Text variant="bodyStrong">Choose a plan length</Text>
      <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
        {PLAN_LENGTHS.map((m) => {
          const feePercent = FINANCING_FEE_SCHEDULE[m];
          const total = Math.round(rentAmount * (1 + feePercent / 100));
          const monthly = Math.round(total / m);
          const selected = months === m;
          return (
            <Pressable
              key={m}
              onPress={() => setMonths(m)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: spacing.md,
                borderRadius: 10,
                borderWidth: 1.5,
                borderColor: selected ? colors.primary : 'transparent',
                backgroundColor: selected ? colors.accent : colors.secondary,
                opacity: pressed ? 0.9 : 1,
              })}
            >
              <View>
                <Text variant="bodyStrong">{m} months</Text>
                <Text variant="caption" color="mutedForeground">
                  {feePercent}% fee
                </Text>
              </View>
              <Price amount={monthly} period="month" variant="bodyStrong" />
            </Pressable>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
        <View style={{ flex: 1 }}>
          <Button label="Cancel" variant="ghost" onPress={onClose} />
        </View>
        <View style={{ flex: 1 }}>
          <Button label="Confirm" loading={mutation.isPending} onPress={() => mutation.mutate()} />
        </View>
      </View>
    </Card>
  );
}

function ActivePlanCard({ overview }: { overview: { plan: FinancingPlan } }) {
  const { colors, spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const plan = overview.plan;
  const paidCount = plan.installments.filter((i) => i.status === 'paid').length;
  const nextDue = plan.installments.find((i) => i.status === 'due' || i.status === 'overdue');

  const payMutation = useMutation({
    mutationFn: (id: string) => financingApi.payInstallment(id),
    onSuccess: async (updated) => {
      if (updated.authorizationUrl) {
        await WebBrowser.openBrowserAsync(updated.authorizationUrl);
      } else {
        toast.show('Installment paid.', 'success');
      }
      qc.invalidateQueries({ queryKey: qk.renter.financing });
    },
    onError: (err) =>
      toast.show(
        err instanceof ApiError ? err.message : 'Could not process this payment.',
        'error'
      ),
  });

  const confirmPay = (installment: FinancingInstallment) => {
    Alert.alert(
      'Pay installment?',
      `You're about to pay ₦${installment.amount.toLocaleString()}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Pay now', onPress: () => payMutation.mutate(installment.id) },
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={{ gap: spacing.lg }}>
      <Card elevated>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Wallet size={18} color={colors.primary} />
            <Text variant="bodyStrong">Landlord paid in full</Text>
          </View>
          {plan.landlordPaidAt ? (
            <Text variant="caption" color="mutedForeground">
              {formatDate(plan.landlordPaidAt, 'short')}
            </Text>
          ) : null}
        </View>
        <Divider style={{ marginVertical: spacing.md }} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg }}>
          <Row
            label="Financed amount"
            value={<Price amount={plan.rentAmount} variant="callout" />}
          />
          <Row
            label="Monthly installment"
            value={<Price amount={plan.monthlyInstallment} variant="callout" />}
          />
          <Row label="Term" value={<Text variant="callout">{plan.planLengthMonths} months</Text>} />
          <Row label="Service fee" value={<Text variant="callout">{plan.feePercent}%</Text>} />
        </View>
        <Text variant="caption" color="mutedForeground" style={{ marginTop: spacing.sm }}>
          {paidCount}/{plan.installments.length} installments paid
        </Text>
      </Card>

      {nextDue ? (
        <Card elevated style={{ backgroundColor: colors.warningSubtle }}>
          <Text variant="bodyStrong" color="warning">
            Next payment due {formatDate(nextDue.dueDate, 'short')}
          </Text>
          <Button
            label={`Pay ₦${nextDue.amount.toLocaleString()}`}
            style={{ marginTop: spacing.md }}
            loading={payMutation.isPending}
            onPress={() => confirmPay(nextDue)}
          />
        </Card>
      ) : null}

      <View style={{ gap: spacing.sm }}>
        <Text variant="heading">Installment schedule</Text>
        <Card elevated padding="none">
          {plan.installments.map((i, idx) => (
            <View key={i.id}>
              {idx > 0 ? <Divider /> : null}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: spacing.lg,
                }}
              >
                <View>
                  <Text variant="callout">Installment {i.installmentNumber}</Text>
                  <Text variant="caption" color="mutedForeground">
                    {i.status === 'paid' && i.paidDate
                      ? `Paid ${formatDate(i.paidDate, 'short')}`
                      : `Due ${formatDate(i.dueDate, 'short')}`}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <Price amount={i.amount} variant="callout" />
                  <Badge
                    label={i.status[0].toUpperCase() + i.status.slice(1)}
                    tone={INSTALLMENT_STATUS_TONE[i.status]}
                  />
                </View>
              </View>
            </View>
          ))}
        </Card>
      </View>
    </ScrollView>
  );
}
