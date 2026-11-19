import { useState } from 'react';
import { Platform, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Badge,
  Button,
  Card,
  LinkButton,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { estatePlanApi, type EstatePlan } from '@/lib/api/estatePlan';
import { errorMessage } from '@/lib/api/client';
import { formatDate } from '@/lib/format';
import { openLegal } from '@/lib/links';
import {
  buyOffer,
  loadEstateProOffers,
  manageStoreSubscription,
  purchasesAvailable,
  type ProOffer,
} from '@/lib/purchases';
import { qk } from '@/lib/query/keys';

const STORE = Platform.OS === 'ios' ? 'App Store' : 'Google Play';
const ACCOUNT = Platform.OS === 'ios' ? 'Apple ID' : 'Google Play';

/** Nothing shows until Estate Pro is switched on. The app never points to buying elsewhere. */
export function EstateProCard({ estateId, estateName }: { estateId: string; estateName: string }) {
  const plan = useQuery({
    queryKey: qk.estateManager.plan(estateId),
    queryFn: () => estatePlanApi.get(estateId),
    retry: false,
  });
  if (!plan.data?.billing.available) return null;
  return <Body estateId={estateId} estateName={estateName} plan={plan.data} />;
}

function Body({
  estateId,
  estateName,
  plan,
}: {
  estateId: string;
  estateName: string;
  plan: EstatePlan;
}) {
  const { spacing } = useTheme();
  const b = plan.billing;
  const households =
    plan.householdCap === null
      ? `${plan.households} households`
      : `${plan.households} of ${plan.householdCap} households`;

  return (
    <Card elevated style={{ gap: spacing.md }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing.sm,
        }}
      >
        <Text variant="bodyStrong" headingLevel={2}>
          Estate Pro · {estateName}
        </Text>
        {b.inForce ? (
          <Badge
            label={
              b.status === 'TRIALING'
                ? 'Free trial'
                : b.status === 'PAST_DUE'
                  ? 'Payment due'
                  : 'Active'
            }
            tone={b.status === 'PAST_DUE' ? 'warning' : 'success'}
          />
        ) : null}
      </View>
      <Text variant="caption" color="mutedForeground">
        {households}
      </Text>
      {b.inForce ? (
        <Active plan={plan} />
      ) : !plan.canManageBilling ? (
        <Text variant="callout" color="mutedForeground">
          Only the estate’s owner can change its plan.
        </Text>
      ) : purchasesAvailable() ? (
        <Buy estateId={estateId} maxHouseholds={b.prices.maxHouseholds} />
      ) : null}
    </Card>
  );
}

function Active({ plan }: { plan: EstatePlan }) {
  const { spacing } = useTheme();
  const b = plan.billing;
  const line =
    b.status === 'TRIALING' && b.trialEndsAt
      ? `Free until ${formatDate(b.trialEndsAt)}.`
      : b.cancelAtPeriodEnd && b.currentPeriodEnd
        ? `Cancelled. Estate Pro ends on ${formatDate(b.currentPeriodEnd)}.`
        : b.status === 'PAST_DUE'
          ? 'The last payment failed. Update your payment method to keep Estate Pro.'
          : b.currentPeriodEnd
            ? `Renews on ${formatDate(b.currentPeriodEnd)}.`
            : 'Active.';
  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="callout">{line}</Text>
      {b.store && plan.canManageBilling ? (
        <LinkButton label={`Manage in ${STORE}`} onPress={() => void manageStoreSubscription()} />
      ) : null}
    </View>
  );
}

function Buy({ estateId, maxHouseholds }: { estateId: string; maxHouseholds: number }) {
  const { spacing, radius } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [activating, setActivating] = useState(false);
  const offers = useQuery({
    queryKey: ['store', 'estate-pro-offers'],
    queryFn: loadEstateProOffers,
  });

  // The store confirms at once but our API hears via RevenueCat's webhook later: wait for it before claiming Estate Pro.
  const waitForEstatePro = async () => {
    setActivating(true);
    for (let i = 0; i < 15; i += 1) {
      const next = await estatePlanApi.get(estateId).catch(() => null);
      if (next?.billing.inForce) {
        qc.setQueryData(qk.estateManager.plan(estateId), next);
        qc.invalidateQueries({ queryKey: qk.estateManager.estates });
        toast.show('Estate Pro is on for this estate.', 'success');
        setActivating(false);
        return;
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
    setActivating(false);
    toast.show('Payment received. Estate Pro will switch on in a few minutes.', 'info');
  };

  const buy = useMutation({
    mutationFn: async (offer: ProOffer) => {
      await estatePlanApi.storeIntent(estateId);
      return buyOffer(offer);
    },
    onSuccess: (bought) => {
      if (bought) void waitForEstatePro();
    },
    onError: (err) => toast.show(errorMessage(err, 'The purchase didn’t go through.'), 'error'),
  });

  if (offers.isPending) return <Skeleton height={96} radius={radius.lg} />;
  if (!offers.data?.length) return null;

  return (
    <View style={{ gap: spacing.md }}>
      <Text variant="callout" color="mutedForeground">
        Pro tools for this estate, for up to {maxHouseholds} households.
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
        Payment is charged to your {ACCOUNT} account. Estate Pro renews automatically unless you
        cancel at least 24 hours before the period ends; manage or cancel it in your {STORE}{' '}
        settings. One estate per {ACCOUNT} account.
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg }}>
        <LinkButton label="Terms" onPress={() => openLegal('terms')} />
        <LinkButton label="Privacy" onPress={() => openLegal('privacy')} />
      </View>
    </View>
  );
}
