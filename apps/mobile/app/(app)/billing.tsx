import { useState } from 'react';
import { Alert, Platform, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, Minus, BadgeCheck } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  Divider,
  ErrorState,
  FormAlert,
  LinkButton,
  Price,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  billingApi,
  naira,
  planHeadline,
  type MyBilling,
  type PlanEntitlementRow,
  type PlanPersona,
  type SubscriptionInvoice,
} from '@/lib/api/billing';
import { ApiError } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthProvider';
import { formatDate } from '@/lib/format';
import {
  buyOffer,
  loadProOffers,
  manageStoreSubscription,
  purchasesAvailable,
  restorePurchases,
  type ProOffer,
} from '@/lib/purchases';
import { openLegal } from '@/lib/links';
import { DetailHeader } from '@/components/dashboard/DetailHeader';

const PERSONA: Partial<Record<string, PlanPersona>> = {
  landlord: 'landlord',
  owner: 'owner',
};

const date = (iso: string) => formatDate(iso, 'medium');

/**
 * Plan and receipts for every paying persona. Pro is bought here through the
 * App Store / Google Play (store rules); a plan bought on the web is still
 * cancelled here, and a store plan is managed in the store.
 */
export default function Billing() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const { usablePortal } = useAuth();
  const persona = PERSONA[usablePortal ?? ''] ?? 'owner';

  const mine = useQuery({ queryKey: qk.billing.mine, queryFn: billingApi.mine });
  const pricing = useQuery({
    queryKey: qk.billing.pricing,
    queryFn: billingApi.pricing,
    staleTime: 60 * 60_000,
  });
  const invoices = useQuery({
    queryKey: qk.billing.invoices,
    queryFn: () => billingApi.invoices(),
  });

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      refreshControl={
        <RefreshControl
          refreshing={mine.isRefetching || invoices.isRefetching}
          onRefresh={() => {
            mine.refetch();
            invoices.refetch();
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
        eyebrow="Account"
        title="Plan & billing"
        subtitle="What’s included and your receipts"
        onBack={() => router.back()}
      />

      {mine.isError && !mine.data ? (
        <ErrorState onRetry={() => mine.refetch()} />
      ) : !mine.data ? (
        <Skeleton height={120} radius={radius.lg} />
      ) : (
        <>
          <PlanCard billing={mine.data} />
          {!mine.data.isActive && purchasesAvailable() ? <BuyPro /> : null}
        </>
      )}

      {pricing.data?.entitlements[persona]?.length ? (
        <Comparison rows={pricing.data.entitlements[persona]} />
      ) : pricing.isPending ? (
        <Skeleton height={200} radius={radius.lg} />
      ) : null}

      <View style={{ gap: spacing.sm }}>
        <Text variant="heading" accessibilityRole="header">
          Receipts
        </Text>
        {invoices.isPending ? (
          <Skeleton height={64} radius={radius.lg} />
        ) : !invoices.data?.items.length ? (
          <Text variant="callout" color="mutedForeground">
            No charges yet.
          </Text>
        ) : (
          <Card elevated padding="none">
            {invoices.data.items.map((inv, i) => (
              <View key={inv.id}>
                {i > 0 ? <Divider /> : null}
                <InvoiceRow inv={inv} />
              </View>
            ))}
          </Card>
        )}
      </View>
    </ScrollView>
  );
}

function PlanCard({ billing: b }: { billing: MyBilling }) {
  const { colors, spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const pro = b.isActive;
  const trialing = b.status === 'TRIALING';
  const storeManaged = b.managedBy === 'app_store' || b.managedBy === 'play_store';
  const storeName = b.managedBy === 'play_store' ? 'Google Play' : 'the App Store';

  const cancel = useMutation({
    mutationFn: billingApi.cancel,
    onSuccess: (next) => {
      qc.setQueryData(qk.billing.mine, next);
      toast.show('Your plan won’t renew.', 'success');
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not cancel your plan.', 'error'),
  });

  const accessEnds = trialing ? b.trialEndsAt : b.currentPeriodEnd;
  const confirmCancel = () =>
    Alert.alert(
      trialing ? 'Cancel your trial?' : 'Cancel Pro?',
      trialing
        ? `Nothing will be charged.${accessEnds ? ` You keep Pro until ${date(accessEnds)}.` : ''}`
        : `You keep Pro${accessEnds ? ` until ${date(accessEnds)}` : ' until the period ends'}, then move to Free.`,
      [
        { text: 'Keep Pro', style: 'cancel' },
        { text: 'Cancel plan', style: 'destructive', onPress: () => cancel.mutate() },
      ]
    );

  return (
    <Card elevated style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <BadgeCheck size={20} color={pro ? colors.primary : colors.mutedForeground} />
        <Text variant="heading" style={{ flex: 1 }}>
          {pro ? 'Pro' : 'Free'}
        </Text>
        {trialing ? <Badge label="Trial" tone="info" /> : null}
        {b.cancelAtPeriodEnd ? <Badge label="Won’t renew" tone="warning" /> : null}
      </View>
      <Text variant="callout" color="mutedForeground">
        {planHeadline(b, date)}
      </Text>
      {pro && b.priceKobo && !b.cancelAtPeriodEnd ? (
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
          <Price amount={naira(b.priceKobo)} variant="bodyStrong" />
          <Text variant="caption" color="mutedForeground">
            {b.cycle === 'ANNUAL' ? 'per year' : 'per month'}
          </Text>
        </View>
      ) : null}
      {b.status === 'PAST_DUE' ? (
        <FormAlert
          message={
            storeManaged
              ? `Your last payment failed. Update your payment method in ${storeName} to keep Pro.`
              : 'Your last payment failed. Update your card from your GetRentos account on the web to keep Pro.'
          }
        />
      ) : null}
      {pro && storeManaged ? (
        // Store subscriptions are cancelled and changed in the store, not by us.
        <Button
          label={`Manage in ${storeName}`}
          variant="secondary"
          onPress={() => void manageStoreSubscription()}
        />
      ) : pro && !b.cancelAtPeriodEnd ? (
        <Button
          label={trialing ? 'Cancel trial' : 'Cancel plan'}
          variant="secondary"
          loading={cancel.isPending}
          onPress={confirmCancel}
        />
      ) : null}
      {!pro && !purchasesAvailable() ? (
        <Text variant="caption" color="mutedForeground">
          Plan changes aren’t available in this version of the app.
        </Text>
      ) : null}
    </Card>
  );
}

/**
 * Pro through the App Store / Google Play. What the store charges is shown in
 * the store's own formatting, with the auto-renewal terms the stores require
 * next to the button.
 */
function BuyPro() {
  const { spacing, radius } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [activating, setActivating] = useState(false);
  const offers = useQuery({ queryKey: ['store', 'pro-offers'], queryFn: loadProOffers });

  // The store confirms the purchase at once; our API hears via RevenueCat's
  // webhook a moment later. Wait for it rather than claiming Pro early.
  const waitForPro = async () => {
    setActivating(true);
    for (let i = 0; i < 15; i += 1) {
      const next = await billingApi.mine().catch(() => null);
      if (next?.isActive) {
        qc.setQueryData(qk.billing.mine, next);
        qc.invalidateQueries({ queryKey: ['me', 'subscription'] });
        toast.show('Welcome to Pro.', 'success');
        setActivating(false);
        return;
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
    setActivating(false);
    toast.show('Payment received. Pro will switch on in a few minutes.', 'info');
  };

  const buy = useMutation({
    mutationFn: (offer: ProOffer) => buyOffer(offer),
    onSuccess: (bought) => {
      if (bought) void waitForPro();
    },
    onError: (err) =>
      toast.show(err instanceof Error ? err.message : 'The purchase didn’t go through.', 'error'),
  });
  const restore = useMutation({
    mutationFn: restorePurchases,
    onSuccess: () => void waitForPro(),
    onError: () => toast.show('Nothing to restore on this account.', 'info'),
  });

  if (offers.isPending) return <Skeleton height={120} radius={radius.lg} />;
  if (!offers.data?.length) return null;

  return (
    <Card elevated style={{ gap: spacing.md }}>
      <Text variant="bodyStrong" accessibilityRole="header">
        Upgrade to Pro
      </Text>
      {offers.data.map((o) => (
        <Button
          key={o.id}
          label={`${o.price} ${o.cycle === 'ANNUAL' ? 'per year' : 'per month'}`}
          variant={o.cycle === 'MONTHLY' ? 'primary' : 'secondary'}
          loading={(buy.isPending && buy.variables?.id === o.id) || activating}
          disabled={buy.isPending || activating}
          onPress={() => buy.mutate(o)}
        />
      ))}
      <Text variant="caption" color="mutedForeground">
        Payment is charged to your {Platform.OS === 'ios' ? 'Apple ID' : 'Google Play'} account. Pro
        renews automatically unless you cancel at least 24 hours before the period ends; manage or
        cancel it in your {Platform.OS === 'ios' ? 'App Store' : 'Google Play'} settings.
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg }}>
        <LinkButton label="Terms" onPress={() => openLegal('terms')} />
        <LinkButton label="Privacy" onPress={() => openLegal('privacy')} />
        <LinkButton
          label="Restore purchases"
          onPress={() => restore.mutate()}
          disabled={restore.isPending}
        />
      </View>
    </Card>
  );
}

function Cell({ value }: { value: boolean | string }) {
  const { colors } = useTheme();
  if (typeof value === 'string')
    return (
      <Text variant="caption" center style={{ width: 64 }}>
        {value}
      </Text>
    );
  return (
    <View style={{ width: 64, alignItems: 'center' }}>
      {value ? (
        <Check size={16} color={colors.success} accessibilityLabel="Included" />
      ) : (
        <Minus size={16} color={colors.mutedForeground} accessibilityLabel="Not included" />
      )}
    </View>
  );
}

const spoken = (v: boolean | string) =>
  typeof v === 'string' ? v : v ? 'included' : 'not included';

function Comparison({ rows }: { rows: PlanEntitlementRow[] }) {
  const { spacing } = useTheme();
  return (
    <Card elevated padding="none">
      <View
        style={{ flexDirection: 'row', padding: spacing.lg, paddingBottom: spacing.sm }}
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
      >
        <Text variant="bodyStrong" style={{ flex: 1 }}>
          What’s included
        </Text>
        <Text variant="caption" color="mutedForeground" center style={{ width: 64 }}>
          Free
        </Text>
        <Text variant="caption" color="mutedForeground" center style={{ width: 64 }}>
          Pro
        </Text>
      </View>
      {rows.map((r) => (
        <View key={r.label}>
          <Divider />
          <View
            accessible
            accessibilityLabel={`${r.label}. Free: ${spoken(r.free)}. Pro: ${spoken(r.pro)}.`}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.md,
            }}
          >
            <Text variant="callout" style={{ flex: 1 }}>
              {r.label}
            </Text>
            <Cell value={r.free} />
            <Cell value={r.pro} />
          </View>
        </View>
      ))}
    </Card>
  );
}

const INVOICE_TONE = { PAID: 'success', REFUNDED: 'info', FAILED: 'danger' } as const;

function InvoiceRow({ inv }: { inv: SubscriptionInvoice }) {
  const { spacing } = useTheme();
  return (
    <View
      accessible
      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg }}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="callout" numberOfLines={2}>
          {inv.description}
        </Text>
        <Text variant="caption" color="mutedForeground">
          {inv.number} · {date(inv.paidAt ?? inv.createdAt)}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <Price amount={naira(inv.amountKobo)} variant="callout" />
        <Badge label={inv.status.toLowerCase()} tone={INVOICE_TONE[inv.status]} />
      </View>
    </View>
  );
}
