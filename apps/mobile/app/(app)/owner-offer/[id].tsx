import { useState } from 'react';
import { Alert, ScrollView, useWindowDimensions, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Badge,
  Button,
  Card,
  Divider,
  EmptyState,
  ErrorState,
  Price,
  Skeleton,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  offerGap,
  ownerApi,
  OWNER_OFFER_LABEL,
  OWNER_OFFER_TONE,
  type OwnerOffer,
} from '@/lib/api/owner';
import { formatDate } from '@/lib/format';
import { ApiError } from '@/lib/api/client';
import { readGate } from '@/lib/verificationGate';
import { haptics } from '@/lib/haptics';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { VerificationGateNotice } from '@/components/VerificationGateNotice';
import { Sheet } from '@/components/Sheet';

const FINANCING: Record<string, string> = {
  cash: 'Cash',
  mortgage: 'Mortgage',
  installment: 'Instalments',
};

export default function OwnerOfferDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const { width, fontScale } = useWindowDimensions();
  const stackActions = width < 380 || fontScale > 1.15;
  const qc = useQueryClient();
  const toast = useToast();
  const [counterOpen, setCounterOpen] = useState(false);

  const offers = useQuery({ queryKey: qk.owner.offers, queryFn: () => ownerApi.offers() });
  const offer = offers.data?.items.find((o) => o.id === id);
  const thread = useQuery({
    queryKey: qk.owner.offerThread(id),
    queryFn: () => ownerApi.offerThread(id),
    enabled: !!id,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: qk.owner.offers });
    qc.invalidateQueries({ queryKey: qk.owner.dashboard });
    qc.invalidateQueries({ queryKey: qk.owner.transactions });
  };

  const accept = useMutation({
    mutationFn: () => ownerApi.acceptOffer(id),
    onSuccess: () => {
      haptics.success();
      refresh();
      toast.show('Offer accepted. The buyer can now pay the deposit into escrow.', 'success');
    },
    onError: (err) => {
      haptics.error();
      // A trust-tier block is explained inline, with the way forward.
      if (!readGate(err)) {
        toast.show(err instanceof ApiError ? err.message : 'Could not accept this offer.', 'error');
      }
    },
  });

  const reject = useMutation({
    mutationFn: () => ownerApi.rejectOffer(id),
    onSuccess: () => {
      refresh();
      toast.show('Offer declined.', 'success');
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not decline this offer.', 'error'),
  });

  const open = offer?.status === 'submitted' || offer?.status === 'countered';

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing['3xl'],
          gap: spacing.lg,
        }}
      >
        <DetailHeader
          eyebrow="Offer"
          title={offer?.propertyName ?? 'Offer'}
          onBack={() => router.back()}
        />

        {offers.isError && !offers.data ? (
          <ErrorState
            title="We couldn't load this offer"
            description="Check your connection and try again."
            onRetry={() => offers.refetch()}
          />
        ) : offers.isPending ? (
          <Skeleton height={180} radius={radius.lg} />
        ) : !offer ? (
          <EmptyState title="Offer not found" description="It may have been withdrawn." />
        ) : (
          <>
            <Card elevated style={{ gap: spacing.sm }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Text variant="bodyStrong">{offer.buyerName}</Text>
                <Badge
                  label={OWNER_OFFER_LABEL[offer.status]}
                  tone={OWNER_OFFER_TONE[offer.status]}
                />
              </View>
              <Divider />
              <View
                style={{
                  flexDirection: stackActions ? 'column' : 'row',
                  justifyContent: 'space-between',
                  gap: spacing.md,
                }}
              >
                <View>
                  <Text variant="caption" color="mutedForeground">
                    Offer
                  </Text>
                  <Price amount={offer.offerAmount} variant="heading" />
                  <Text
                    variant="caption"
                    color={offer.offerAmount < offer.askingPrice ? 'warning' : 'success'}
                  >
                    {offerGap(offer.offerAmount, offer.askingPrice)}
                  </Text>
                </View>
                <View style={{ alignItems: stackActions ? 'flex-start' : 'flex-end' }}>
                  <Text variant="caption" color="mutedForeground">
                    Your asking price
                  </Text>
                  <Price amount={offer.askingPrice} variant="bodyStrong" />
                </View>
              </View>
              <Divider />
              <Fact
                label="Financing"
                value={FINANCING[offer.financingType] ?? offer.financingType}
              />
              {offer.depositAmount ? (
                <Fact
                  label="Deposit offered"
                  value={`₦${offer.depositAmount.toLocaleString('en-NG')}`}
                />
              ) : null}
              <Fact label="Received" value={formatDate(offer.submittedAt, 'medium')} />
              {offer.message ? (
                <Text variant="callout" color="mutedForeground" style={{ marginTop: spacing.xs }}>
                  “{offer.message}”
                </Text>
              ) : null}
            </Card>

            {open ? (
              <View style={{ gap: spacing.sm }}>
                <VerificationGateNotice error={accept.error} scoreHref="/(app)/verify-identity" />
                <Button
                  label="Accept offer"
                  loading={accept.isPending}
                  disabled={reject.isPending}
                  onPress={() =>
                    Alert.alert(
                      'Accept this offer?',
                      `You're agreeing to sell ${offer.propertyName} to ${offer.buyerName} for ₦${offer.offerAmount.toLocaleString('en-NG')}. Other open offers stay open until you answer them.`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Accept offer', onPress: () => accept.mutate() },
                      ]
                    )
                  }
                />
                <View style={{ flexDirection: stackActions ? 'column' : 'row', gap: spacing.sm }}>
                  <Button
                    label="Counter"
                    variant="outline"
                    style={{ flex: 1 }}
                    disabled={accept.isPending || reject.isPending}
                    onPress={() => setCounterOpen(true)}
                  />
                  <Button
                    label="Decline"
                    variant="secondary"
                    style={{ flex: 1 }}
                    loading={reject.isPending}
                    disabled={accept.isPending}
                    onPress={() =>
                      Alert.alert(
                        'Decline this offer?',
                        `${offer.buyerName} will be told you declined.`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Decline', style: 'destructive', onPress: () => reject.mutate() },
                        ]
                      )
                    }
                  />
                </View>
              </View>
            ) : offer.status === 'accepted' ? (
              <Button
                label="Follow the sale in escrow"
                variant="outline"
                onPress={() => router.push('/(app)/owner-transactions')}
              />
            ) : null}

            <View style={{ gap: spacing.sm }}>
              <Text variant="heading" accessibilityRole="header">
                Negotiation
              </Text>
              {thread.isError && !thread.data ? (
                <ErrorState
                  title="We couldn't load the negotiation"
                  description="Your offer is safe. Try loading the conversation again."
                  onRetry={() => thread.refetch()}
                />
              ) : thread.isPending ? (
                <Skeleton height={60} radius={radius.md} />
              ) : !thread.data?.length ? (
                <Text variant="callout" color="mutedForeground">
                  No counter-offers yet.
                </Text>
              ) : (
                thread.data.map((m) => (
                  <Card
                    key={m.id}
                    padding={12}
                    accessible
                    accessibilityLabel={[
                      m.senderName,
                      m.amount ? `${Math.round(m.amount).toLocaleString('en-NG')} naira` : null,
                      m.text,
                      formatDate(m.timestamp, 'short'),
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text variant="bodyStrong">{m.senderName}</Text>
                      <Text variant="caption" color="mutedForeground">
                        {formatDate(m.timestamp, 'short')}
                      </Text>
                    </View>
                    {m.amount ? <Price amount={m.amount} variant="callout" /> : null}
                    {m.text ? (
                      <Text variant="callout" color="mutedForeground">
                        {m.text}
                      </Text>
                    ) : null}
                  </Card>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>

      <Sheet open={counterOpen} onClose={() => setCounterOpen(false)} title="Counter this offer">
        {offer ? (
          <CounterForm
            key={counterOpen ? 'open' : 'closed'}
            offer={offer}
            onDone={() => {
              setCounterOpen(false);
              qc.invalidateQueries({ queryKey: qk.owner.offerThread(id) });
              refresh();
            }}
          />
        ) : null}
      </Sheet>
    </View>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{ flexDirection: 'row', justifyContent: 'space-between' }}
      accessible
      accessibilityLabel={`${label}: ${value}`}
    >
      <Text variant="callout" color="mutedForeground">
        {label}
      </Text>
      <Text variant="callout" style={{ fontWeight: '600' }}>
        {value}
      </Text>
    </View>
  );
}

function CounterForm({ offer, onDone }: { offer: OwnerOffer; onDone: () => void }) {
  const { spacing } = useTheme();
  const toast = useToast();
  const [amount, setAmount] = useState(String(offer.askingPrice));
  const [message, setMessage] = useState('');
  const value = Number(amount.replace(/\D/g, ''));

  const counter = useMutation({
    mutationFn: () => ownerApi.counterOffer(offer.id, value, message.trim() || undefined),
    onSuccess: () => {
      toast.show('Counter-offer sent.', 'success');
      onDone();
    },
    onError: (err) =>
      toast.show(
        err instanceof ApiError ? err.message : 'Could not send the counter-offer.',
        'error'
      ),
  });

  return (
    <View style={{ gap: spacing.lg }}>
      <Text variant="body" color="mutedForeground">
        {offer.buyerName} offered ₦{offer.offerAmount.toLocaleString('en-NG')}. Name the price you’d
        accept.
      </Text>
      <TextField
        label="Your price (₦)"
        keyboardType="number-pad"
        value={value ? value.toLocaleString('en-NG') : ''}
        onChangeText={setAmount}
        hint={value ? offerGap(value, offer.askingPrice) : undefined}
      />
      <TextField
        label="Message (optional)"
        value={message}
        onChangeText={setMessage}
        multiline
        maxLength={500}
      />
      <Button
        label="Send counter-offer"
        loading={counter.isPending}
        disabled={!value}
        onPress={() => counter.mutate()}
      />
    </View>
  );
}
