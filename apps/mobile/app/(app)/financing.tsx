import { usePaystackCheckout } from '@/hooks/usePaystackCheckout';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Lock, BadgeCheck, Clock, Wallet } from '@sureground/icons/native';
import {
  Badge,
  Button,
  Card,
  Divider,
  Price,
  QueryState,
  Screen,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@sureground/ui-native';
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
import { errorMessage } from '@/lib/api/client';
import { formatDate, formatNaira } from '@/lib/format';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';
import { PaySheet } from '@/components/payments/PaySheet';
import { usePaymentProviders } from '@/hooks/usePaymentProviders';
import type { PaymentProvider } from '@/lib/api/paymentStatus';

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
  const query = useQuery({ queryKey: qk.renter.financing, queryFn: financingApi.getOverview });
  const overview = query.data;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Flexible rent"
        title="Sureground Flex"
        subtitle="Eligibility, plans and instalments"
        onBack={() => goBack()}
      />

      <QueryState
        query={query}
        skeleton={
          <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
            <Skeleton height={180} radius={16} />
          </View>
        }
      >
        {overview ? (
          <Screen padded>
            {overview.plan ? (
              <ActivePlanCard overview={{ plan: overview.plan }} />
            ) : overview.newPlansOpen !== true ? (
              <PausedCard />
            ) : (
              <EligibilityCard overview={overview} />
            )}
          </Screen>
        ) : null}
      </QueryState>
    </View>
  );
}

function PausedCard() {
  const { colors, spacing } = useTheme();
  return (
    <Card elevated>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Clock size={20} color={colors.primary} />
        <Text variant="heading">Not taking new plans right now</Text>
      </View>
      <Text variant="callout" color="mutedForeground" style={{ marginTop: spacing.sm }}>
        We&apos;re setting Flex up with a funding partner so landlords are paid in full from day
        one. Until then we aren&apos;t starting new monthly plans. Your rent and payments work as
        usual, and plans that already exist are not affected.
      </Text>
      <Text variant="caption" color="mutedForeground" style={{ marginTop: spacing.md }}>
        Coming back soon. You&apos;ll be able to apply here as soon as Flex reopens.
      </Text>
    </Card>
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
          <BadgeCheck size={20} color={colors.primary} />
          <Text variant="heading">Split your rent into monthly payments</Text>
        </View>
        <Text variant="callout" color="mutedForeground" style={{ marginTop: spacing.sm }}>
          Sureground pays your landlord for {overview.propertyName} in full, and you repay us
          monthly: building your trust score along the way.
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
              {MIN_TRUST_SCORE_FOR_FINANCING} to unlock Sureground Flex.
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
          Missed instalments affect your trust score.
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
      toast.show(
        'Your Flex plan is set up. It shows here once your landlord has been paid.',
        'success'
      );
      onClose();
    },
    onError: (err) => toast.show(errorMessage(err, 'Could not apply for Flex.'), 'error'),
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
              accessibilityRole="radio"
              accessibilityLabel={`${m} months, ${feePercent}% fee`}
              accessibilityState={{ checked: selected }}
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
  const checkout = usePaystackCheckout();
  const plan = overview.plan;
  const paidCount = plan.installments.filter((i) => i.status === 'paid').length;
  const nextDue = plan.installments.find((i) => i.status === 'due' || i.status === 'overdue');
  const providers = usePaymentProviders();
  const [providerError, setProviderError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const closeSheet = () => {
    setSheetOpen(false);
    setProviderError(null);
  };

  const payMutation = useMutation({
    mutationFn: ({ id, provider }: { id: string; provider?: PaymentProvider }) =>
      financingApi.payInstallment(id, provider),
    onMutate: () => setProviderError(null),
    onSuccess: async (updated) => {
      closeSheet();
      if (updated.authorizationUrl) {
        await checkout(updated.authorizationUrl, updated.reference);
      } else {
        toast.show('Instalment paid.', 'success');
      }
      qc.invalidateQueries({ queryKey: qk.renter.financing });
    },
    onError: (err, { provider }) => {
      const unavailable = providers.recover(err, provider);
      if (unavailable) setProviderError(unavailable);
      else {
        closeSheet();
        toast.show(errorMessage(err, 'Could not process this payment.'), 'error');
      }
    },
  });

  return (
    <ScrollView contentContainerStyle={{ gap: spacing.lg }}>
      <Card elevated>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Wallet size={18} color={colors.primary} />
            <Text variant="bodyStrong">
              {plan.landlordPaidAt ? 'Landlord paid in full' : 'Landlord payment being arranged'}
            </Text>
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
            label="Monthly instalment"
            value={<Price amount={plan.monthlyInstallment} variant="callout" />}
          />
          <Row label="Term" value={<Text variant="callout">{plan.planLengthMonths} months</Text>} />
          <Row label="Service fee" value={<Text variant="callout">{plan.feePercent}%</Text>} />
        </View>
        <Text variant="caption" color="mutedForeground" style={{ marginTop: spacing.sm }}>
          {paidCount}/{plan.installments.length} instalments paid
        </Text>
      </Card>

      {nextDue ? (
        <Card elevated style={{ backgroundColor: colors.warningSubtle }}>
          <Text variant="bodyStrong" color="warning">
            Next payment due {formatDate(nextDue.dueDate, 'short')}
          </Text>
          <Button
            label={`Pay ${formatNaira(nextDue.amount)}`}
            style={{ marginTop: spacing.md }}
            loading={payMutation.isPending}
            onPress={() => {
              setProviderError(null);
              setSheetOpen(true);
            }}
          />
        </Card>
      ) : null}
      {nextDue ? (
        <PaySheet
          open={sheetOpen}
          onClose={closeSheet}
          title="Pay instalment"
          context={`Instalment ${nextDue.installmentNumber} of ${plan.installments.length}`}
          dueDate={nextDue.dueDate}
          overdue={nextDue.status === 'overdue'}
          owed={nextDue.amount}
          amount={nextDue.amount}
          itemLabel="Instalment"
          receiverLine={`The fee goes to the payment company, so the full ${formatNaira(nextDue.amount)} goes to your Flex plan.`}
          protection="This payment is applied to your Flex plan."
          providers={providers}
          providerError={providerError}
          busy={payMutation.isPending}
          onPay={() => payMutation.mutate({ id: nextDue.id, provider: providers.provider })}
        />
      ) : null}

      <View style={{ gap: spacing.sm }}>
        <Text variant="heading">Instalment schedule</Text>
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
                  <Text variant="callout">Instalment {i.installmentNumber}</Text>
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
