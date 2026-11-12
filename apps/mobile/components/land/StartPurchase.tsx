import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Card,
  Checkbox,
  FormAlert,
  PressableScale,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import {
  countdownTo,
  landBuyerApi,
  planTermsLine,
  plotLabel,
  quotePlot,
  type EstatePlan,
  type Reservation,
} from '@/lib/api/landBuyer';
import { formatBps } from '@/lib/api/landSales';
import { errorMessage } from '@/lib/api/client';
import { foreignIdentityApi } from '@/lib/api/foreignIdentity';
import { formatNaira } from '@/lib/format';

// Anything the developer's land was not verified for must be acknowledged first.
export function StartPurchase({
  reservation: r,
  onDone,
  onLeave,
}: {
  reservation: Reservation;
  onDone: () => void;
  /** Closes the sheet this sits in, so a pushed screen is not hidden under it. */
  onLeave: () => void;
}) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [now] = useState(() => Date.now());
  const [planId, setPlanId] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const estate = useQuery({
    queryKey: qk.buyerLand.estate(r.layoutId),
    queryFn: () => landBuyerApi.estate(r.layoutId),
  });
  const e = estate.data;
  const plans = (e?.paymentPlans ?? []).filter((p) => p.active);
  const notVerified = e?.notVerified ?? [];
  const plan = plans.find((p) => p.id === planId);
  const ready = !!plan && (notVerified.length === 0 || acknowledged);
  // DIA-07: asked before starting, so a large purchase is not refused with a 403.
  const [fundsHold, setFundsHold] = useState<string | null>(null);

  const start = useMutation({
    mutationFn: async () => {
      const total = e && plan ? quotePlot(r.price, e.fees.total, plan).totalPrice : r.price;
      const hold = await foreignIdentityApi.sourceOfFundsHold(total);
      setFundsHold(hold);
      if (hold) return null;
      return landBuyerApi.startPurchase(
        r.id,
        planId!,
        notVerified.map((i) => i.key)
      );
    },
    onSuccess: (detail) => {
      if (!detail) return;
      qc.invalidateQueries({ queryKey: qk.buyerLand.all });
      toast.show('Purchase started. Pay your deposit to secure the plot.', 'success');
      onDone();
      router.push(`/(app)/buyer-land-purchase/${detail.id}`);
    },
    onError: (err) => toast.show(errorMessage(err, 'Could not start the purchase.'), 'error'),
  });

  if (estate.isLoading) return <Skeleton height={200} />;
  if (!e) return <FormAlert tone="error" message="This estate could not be loaded." />;

  return (
    <View style={{ gap: spacing.lg }}>
      <Text variant="callout" color="mutedForeground">
        {plotLabel(r)} in {r.layoutName} · {formatNaira(r.price)}. Held for{' '}
        {countdownTo(r.expiresAt, now).label} more. Choose how you will pay.
      </Text>
      {plans.length === 0 ? (
        <FormAlert
          tone="warning"
          message="This estate has no active payment plan right now, so a purchase cannot start."
        />
      ) : (
        plans.map((p) => (
          <PlanCard
            key={p.id}
            plan={p}
            plotPrice={r.price}
            fees={e.fees.total}
            selected={p.id === planId}
            onSelect={() => setPlanId(p.id)}
          />
        ))
      )}
      <Button
        label="Read the decision dossier and all-in cost"
        variant="ghost"
        size="sm"
        onPress={() => {
          onLeave();
          router.push({
            pathname: '/(app)/land-dossier',
            params: { layoutId: r.layoutId, plotId: r.plotId, ...(planId ? { planId } : {}) },
          });
        }}
        style={{ alignSelf: 'flex-start' }}
      />
      {notVerified.length > 0 ? (
        <View style={{ gap: spacing.sm }}>
          <FormAlert
            tone="warning"
            title="Before you commit: what was not verified on this land"
            message={notVerified.map((i) => `• ${i.label}`).join('\n')}
          />
          <Checkbox
            checked={acknowledged}
            onChange={setAcknowledged}
            label="I have read what was not verified and accept it. I understand I can have my own lawyer check these before I pay."
          />
        </View>
      ) : null}
      {fundsHold ? (
        <View style={{ gap: spacing.sm }}>
          <FormAlert tone="warning" title="Confirm your source of funds" message={fundsHold} />
          <Button
            label="Go to Identity abroad"
            variant="outline"
            size="sm"
            onPress={() => {
              onLeave();
              router.push('/(app)/invest-identity');
            }}
            style={{ alignSelf: 'flex-start' }}
          />
        </View>
      ) : null}
      <Button
        label={plan ? `Start on ${plan.name}` : 'Choose a plan'}
        loading={start.isPending}
        disabled={!ready || start.isPending}
        onPress={() => start.mutate()}
      />
      <Text variant="caption" color="mutedForeground">
        The figures are the API’s pricing rules applied to this plot; your contract fixes the exact
        schedule when it starts.
      </Text>
    </View>
  );
}

export function PlanCard({
  plan,
  plotPrice,
  fees,
  selected,
  onSelect,
}: {
  plan: EstatePlan;
  plotPrice: number;
  fees: number;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const { colors, spacing } = useTheme();
  const [lateOpen, setLateOpen] = useState(false);
  const q = quotePlot(plotPrice, fees, plan);
  const rows: [string, number][] = [
    ['Plot price', q.plotPrice],
    ...(q.priceUplift > 0 ? [['Instalment premium', q.priceUplift] as [string, number]] : []),
    ['Fees', q.fees],
    ['Total price', q.totalPrice],
    [q.durationMonths === 0 ? 'Due to start' : 'Deposit + fees to start', q.initialPayment],
  ];
  const body = (
    <Card
      padding={spacing.lg}
      style={{ gap: spacing.sm, borderWidth: selected ? 1.5 : 0, borderColor: colors.primary }}
    >
      <Text variant="bodyStrong">{plan.name}</Text>
      <Text variant="caption" color="mutedForeground">
        {planTermsLine(plan)}
      </Text>
      {rows.map(([label, amount]) => (
        <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text variant="callout" color="mutedForeground">
            {label}
          </Text>
          <Text variant="callout" style={{ fontWeight: '600' }}>
            {formatNaira(amount)}
          </Text>
        </View>
      ))}
      {q.durationMonths > 0 ? (
        <Text variant="caption" color="mutedForeground">
          Then monthly × {q.durationMonths} ≈ {formatNaira(q.monthlyInstallment)}
        </Text>
      ) : null}
      <PressableScale onPress={() => setLateOpen((v) => !v)} accessibilityRole="button">
        <Text variant="caption" color="primary" style={{ fontWeight: '600' }}>
          {lateOpen ? 'Hide' : 'If a payment is late'}
        </Text>
      </PressableScale>
      {lateOpen ? (
        <Text variant="caption" color="mutedForeground">
          {plan.gracePeriodDays} days’ grace, then a {formatBps(plan.lateFeeBps)} late fee. Default
          after {plan.defaultAfterDays} days overdue, when the developer may revoke and keep{' '}
          {formatBps(plan.revocationChargeBps)} of what you paid.
        </Text>
      ) : null}
    </Card>
  );
  return onSelect ? (
    <PressableScale
      onPress={onSelect}
      accessibilityRole="radio"
      accessibilityState={{ selected: !!selected }}
      accessibilityLabel={plan.name}
    >
      {body}
    </PressableScale>
  ) : (
    body
  );
}
