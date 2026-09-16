import { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  Divider,
  Price,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  buyerOffersApi,
  BUYER_OFFER_STATUS_LABEL,
  BUYER_OFFER_STATUS_TONE,
  type BuyerOfferThreadMessage,
} from '@/lib/api/buyerOffers';
import { CounterOfferSheet } from '@/components/buyer/CounterOfferSheet';
import { formatDate } from '@/lib/format';
import { ApiError } from '@/lib/api/client';

export default function BuyerOfferDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const [counterOpen, setCounterOpen] = useState(false);

  const offersQuery = useQuery({
    queryKey: qk.buyer.offers(1, 50),
    queryFn: () => buyerOffersApi.list(1, 50),
  });
  const offer = offersQuery.data?.items.find((o) => o.id === id);

  const threadQuery = useQuery({
    queryKey: qk.buyer.offerThread(id),
    queryFn: () => buyerOffersApi.thread(id),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['buyer', 'offers'] });
    qc.invalidateQueries({ queryKey: qk.buyer.offerThread(id) });
  };

  const withdrawMutation = useMutation({
    mutationFn: () => buyerOffersApi.withdraw(id),
    onSuccess: () => {
      invalidate();
      toast.show('Offer withdrawn.', 'success');
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not withdraw this offer.', 'error'),
  });

  const acceptMutation = useMutation({
    mutationFn: () => buyerOffersApi.accept(id),
    onSuccess: () => {
      invalidate();
      toast.show('Offer accepted.', 'success');
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not accept this offer.', 'error'),
  });

  const confirmWithdraw = () => {
    Alert.alert('Withdraw offer', 'Are you sure you want to withdraw this offer?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Withdraw', style: 'destructive', onPress: () => withdrawMutation.mutate() },
    ]);
  };

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
        <Text variant="title">Offer</Text>
      </View>

      {!offer ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          <Skeleton height={140} radius={radius.lg} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            padding: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
            gap: spacing.lg,
          }}
        >
          <Card elevated>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="bodyStrong" numberOfLines={1}>
                  {offer.propertyTitle}
                </Text>
                <Text variant="caption" color="mutedForeground">
                  {offer.ownerName}
                </Text>
              </View>
              <Badge
                label={BUYER_OFFER_STATUS_LABEL[offer.status]}
                tone={BUYER_OFFER_STATUS_TONE[offer.status]}
              />
            </View>

            <Divider style={{ marginVertical: spacing.sm }} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View>
                <Text variant="caption" color="mutedForeground">
                  Your offer
                </Text>
                <Price amount={offer.offerAmount} variant="bodyStrong" />
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text variant="caption" color="mutedForeground">
                  Asking price
                </Text>
                <Price amount={offer.askingPrice} variant="bodyStrong" />
              </View>
            </View>

            <View style={{ marginTop: spacing.sm, gap: 4 }}>
              <Text variant="caption" color="mutedForeground">
                Financing: {offer.financingType}
              </Text>
              {offer.depositAmount ? (
                <Text variant="caption" color="mutedForeground">
                  Deposit: ₦{offer.depositAmount.toLocaleString()}
                </Text>
              ) : null}
              <Text variant="caption" color="mutedForeground">
                Submitted {formatDate(offer.submittedAt, 'medium')}
              </Text>
            </View>

            {offer.message ? (
              <>
                <Divider style={{ marginVertical: spacing.sm }} />
                <Text variant="callout" color="mutedForeground">
                  {offer.message}
                </Text>
              </>
            ) : null}
          </Card>

          {offer.status === 'submitted' || offer.status === 'countered' ? (
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              {offer.status === 'countered' ? (
                <Button
                  label="Accept"
                  size="sm"
                  style={{ flex: 1 }}
                  loading={acceptMutation.isPending}
                  onPress={() => acceptMutation.mutate()}
                />
              ) : null}
              <Button
                label="Counter"
                variant="outline"
                size="sm"
                style={{ flex: 1 }}
                onPress={() => setCounterOpen(true)}
              />
              <Button
                label="Withdraw"
                variant="destructive"
                size="sm"
                style={{ flex: 1 }}
                loading={withdrawMutation.isPending}
                onPress={confirmWithdraw}
              />
            </View>
          ) : null}

          <View style={{ gap: spacing.sm }}>
            <Text variant="heading">Activity</Text>
            {!threadQuery.data ? (
              <Skeleton height={60} radius={radius.md} />
            ) : threadQuery.data.length === 0 ? (
              <Text variant="callout" color="mutedForeground">
                No activity yet.
              </Text>
            ) : (
              threadQuery.data.map((m: BuyerOfferThreadMessage) => (
                <Card key={m.id} elevated padding={12}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Text variant="bodyStrong">{m.senderName}</Text>
                    <Text variant="caption" color="mutedForeground">
                      {formatDate(m.timestamp, 'short')}
                    </Text>
                  </View>
                  {m.text ? (
                    <Text variant="callout" color="mutedForeground" style={{ marginTop: 2 }}>
                      {m.text}
                    </Text>
                  ) : null}
                  {m.amount ? (
                    <Price amount={m.amount} variant="callout" style={{ marginTop: 2 }} />
                  ) : null}
                </Card>
              ))
            )}
          </View>
        </ScrollView>
      )}

      <CounterOfferSheet
        open={counterOpen}
        onClose={() => setCounterOpen(false)}
        offer={offer ?? null}
      />
    </View>
  );
}
