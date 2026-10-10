import { useState } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRightLeft } from 'lucide-react-native';
import {
  Button,
  Card,
  EmptyState,
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
  OFFER_STATUS,
  canCounter,
  currentAmount,
  offerThread,
  realtorApi,
  vsAsking,
} from '@/lib/api/realtor';
import { ApiError } from '@/lib/api/client';
import { formatDate, relativeTime } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { StatusPill } from '@/components/host/HostUI';

/**
 * One negotiation: every amount on the table in order, and a counter for the
 * realtor. Accepting is the owner's call, since it commits their property.
 */
export default function RealtorOfferDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const offers = useQuery({ queryKey: qk.realtor.offers, queryFn: () => realtorApi.offers() });
  const o = offers.data?.items.find((x) => x.id === id);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={offers.isRefetching}
            onRefresh={() => offers.refetch()}
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
          eyebrow="Offer"
          title={o ? o.listing.listingTitle || o.listing.property.title : 'Offer'}
          subtitle={o ? `From ${o.buyer.legalName || o.buyer.email}` : undefined}
          onBack={() => router.back()}
        />
        {offers.isError && !offers.data ? (
          <ErrorState onRetry={() => offers.refetch()} />
        ) : offers.isPending ? (
          <Skeleton height={240} radius={radius.lg} />
        ) : !o ? (
          <EmptyState
            title="Offer not found"
            description="It may have been withdrawn, or the listing is no longer yours."
          />
        ) : (
          <>
            <Card elevated style={{ gap: spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text variant="caption" color="mutedForeground" style={{ flex: 1 }}>
                  On the table
                </Text>
                <StatusPill
                  label={OFFER_STATUS[o.status].label}
                  tone={OFFER_STATUS[o.status].tone}
                />
              </View>
              <Price amount={currentAmount(o)} variant="title" />
              {o.listing.price ? (
                <Text variant="callout" color="mutedForeground">
                  Asking ₦{Math.round(o.listing.price).toLocaleString('en-NG')}
                  {vsAsking(currentAmount(o), o.listing.price)
                    ? ` · ${vsAsking(currentAmount(o), o.listing.price)}`
                    : ''}
                </Text>
              ) : null}
            </Card>

            <View style={{ gap: spacing.sm }}>
              <Text variant="heading" accessibilityRole="header">
                Negotiation
              </Text>
              {offerThread(o).map((step, i) => {
                const you = step.who === 'you';
                return (
                  <View
                    key={step.id}
                    accessible
                    accessibilityLabel={`${you ? 'You countered' : i === 0 ? 'Buyer offered' : 'Buyer countered'} ${Math.round(step.amount).toLocaleString('en-NG')} naira, ${relativeTime(step.at)}${step.message ? `. ${step.message}` : ''}`}
                    style={{
                      alignSelf: you ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                      padding: spacing.md,
                      borderRadius: radius.lg,
                      backgroundColor: you ? colors.accent : colors.secondary,
                      gap: 4,
                    }}
                  >
                    <Text variant="caption" color="mutedForeground">
                      {you ? 'You countered' : i === 0 ? 'Buyer offered' : 'Buyer countered'}
                    </Text>
                    <Price amount={step.amount} variant="bodyStrong" />
                    {step.message ? <Text variant="callout">{step.message}</Text> : null}
                    <Text variant="caption" color="mutedForeground">
                      {relativeTime(step.at)}
                    </Text>
                  </View>
                );
              })}
            </View>

            {canCounter(o.status) ? (
              <CounterForm offerId={o.id} current={currentAmount(o)} asking={o.listing.price} />
            ) : (
              <FormAlert
                tone={o.status === 'ACCEPTED' ? 'success' : 'info'}
                message={
                  o.status === 'ACCEPTED'
                    ? 'Your client accepted this offer. The buyer pays the deposit to GetRentos, which holds it until the sale completes.'
                    : 'This offer is settled and can’t be countered.'
                }
              />
            )}
            <Text variant="caption" color="mutedForeground" center>
              Made {formatDate(o.createdAt, 'medium')}. Only your client can accept or decline.
            </Text>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function CounterForm({
  offerId,
  current,
  asking,
}: {
  offerId: string;
  current: number;
  asking?: number;
}) {
  const { colors, spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const n = Number(amount.replace(/\D/g, ''));
  const counter = useMutation({
    mutationFn: () => realtorApi.counter(offerId, n, message.trim() || undefined),
    onSuccess: () => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: qk.realtor.offers });
      setAmount('');
      setMessage('');
      toast.show('Counter sent to the buyer.', 'success');
    },
  });
  return (
    <Card elevated style={{ gap: spacing.md }}>
      <Text variant="bodyStrong" accessibilityRole="header">
        Counter
      </Text>
      <TextField
        label="Your counter (₦)"
        keyboardType="number-pad"
        value={n ? n.toLocaleString('en-NG') : ''}
        onChangeText={setAmount}
        hint={
          n && asking
            ? (vsAsking(n, asking) ?? undefined)
            : `Currently ₦${Math.round(current).toLocaleString('en-NG')}`
        }
      />
      <TextField
        label="Message (optional)"
        value={message}
        onChangeText={setMessage}
        multiline
        hint="Why this number: condition, comparable sales, timing"
      />
      {n && n === current ? (
        <FormAlert tone="warning" message="That’s the amount already on the table." />
      ) : null}
      {counter.error ? (
        <FormAlert
          message={
            counter.error instanceof ApiError
              ? counter.error.message
              : 'Could not send the counter.'
          }
        />
      ) : null}
      <Button
        label={n ? `Counter at ₦${n.toLocaleString('en-NG')}` : 'Send counter'}
        icon={<ArrowRightLeft size={16} color={colors.primaryForeground} />}
        disabled={!n || n === current}
        loading={counter.isPending}
        onPress={() => counter.mutate()}
      />
    </Card>
  );
}
