import { useState } from 'react';
import { Alert, Linking, Pressable, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarCheck, ChevronLeft, Heart } from 'lucide-react-native';
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
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  shortletsApi,
  SHORTLET_BOOKING_STATUS_LABEL,
  SHORTLET_BOOKING_STATUS_TONE,
  type ShortletBooking,
} from '@/lib/api/shortlets';
import { ReviewStaySheet } from '@/components/shortlet/ReviewStaySheet';
import { formatDate } from '@/lib/format';
import { ApiError } from '@/lib/api/client';

export default function ShortletBookings() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const [reviewing, setReviewing] = useState<ShortletBooking | null>(null);

  const query = useQuery({
    queryKey: qk.shortlets.bookings(1, 50),
    queryFn: () => shortletsApi.myBookings(1, 50),
  });
  const items = query.data?.items ?? [];

  const invalidate = () => qc.invalidateQueries({ queryKey: ['shortlets', 'bookings'] });

  const payMutation = useMutation({
    mutationFn: (id: string) => shortletsApi.payBooking(id),
    onSuccess: (res) => {
      invalidate();
      if (res.authorizationUrl) Linking.openURL(res.authorizationUrl);
      else toast.show('Payment initiated.', 'success');
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not start this payment.', 'error'),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => shortletsApi.cancelBooking(id),
    onSuccess: () => {
      invalidate();
      toast.show('Booking cancelled.', 'success');
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not cancel this booking.', 'error'),
  });

  const confirmCancel = (b: ShortletBooking) => {
    Alert.alert(
      'Cancel booking',
      `Cancel your stay at ${b.propertyTitle}? Your refund follows the ${b.cancellationPolicy.toLowerCase()} cancellation policy.`,
      [
        { text: 'Keep booking', style: 'cancel' },
        {
          text: 'Cancel booking',
          style: 'destructive',
          onPress: () => cancelMutation.mutate(b.id),
        },
      ]
    );
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
        <Text variant="title" style={{ flex: 1 }}>
          My stays
        </Text>
        <Pressable
          onPress={() => router.push('/(app)/shortlet-wishlist')}
          accessibilityRole="button"
          accessibilityLabel="Wishlist"
          hitSlop={10}
        >
          <Heart size={21} color={colors.foreground} />
        </Pressable>
      </View>

      {query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : query.isLoading ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          {[0, 1].map((i) => (
            <Skeleton key={i} height={180} radius={radius.lg} />
          ))}
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<CalendarCheck size={34} color={colors.mutedForeground} />}
          title="No stays booked"
          description="Bookings you make will appear here."
          action={
            <Button
              label="Browse shortlets"
              fullWidth={false}
              onPress={() => router.push('/(app)/shortlets')}
            />
          }
        />
      ) : (
        <FlashList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }: { item: ShortletBooking }) => (
            <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}>
              <Card elevated padding="none" style={{ overflow: 'hidden' }}>
                <Pressable onPress={() => router.push(`/(app)/shortlet/${item.listingId}`)}>
                  {item.coverImageUrl ? (
                    <Image
                      source={{ uri: item.coverImageUrl }}
                      contentFit="cover"
                      transition={200}
                      style={{ width: '100%', height: 130 }}
                    />
                  ) : null}
                </Pressable>

                <View style={{ padding: spacing.lg, gap: 4 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: spacing.sm,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyStrong" numberOfLines={1}>
                        {item.propertyTitle}
                      </Text>
                      <Text variant="caption" color="mutedForeground">
                        {formatDate(item.checkIn, 'short')} → {formatDate(item.checkOut, 'short')} ·{' '}
                        {item.nights} {item.nights === 1 ? 'night' : 'nights'} · {item.guestCount}{' '}
                        {item.guestCount === 1 ? 'guest' : 'guests'}
                      </Text>
                    </View>
                    <Badge
                      label={SHORTLET_BOOKING_STATUS_LABEL[item.status]}
                      tone={SHORTLET_BOOKING_STATUS_TONE[item.status]}
                    />
                  </View>

                  <Divider style={{ marginVertical: spacing.sm }} />

                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Price amount={item.total} variant="bodyStrong" />
                    <Text
                      variant="caption"
                      color={item.paymentStatus === 'PAID' ? 'success' : 'mutedForeground'}
                    >
                      {item.paymentStatus === 'PAID'
                        ? 'Paid'
                        : item.paymentStatus === 'REFUNDED'
                          ? 'Refunded'
                          : 'Unpaid'}
                    </Text>
                  </View>

                  {item.deposit ? (
                    <Text variant="caption" color="mutedForeground">
                      Deposit ₦{item.deposit.toLocaleString()} ·{' '}
                      {item.depositStatus === 'REFUNDED'
                        ? 'refunded'
                        : item.depositStatus.toLowerCase()}
                      {item.depositClaimDeducted
                        ? ` · ₦${item.depositClaimDeducted.toLocaleString()} deducted`
                        : ''}
                    </Text>
                  ) : null}

                  {item.refundAmount ? (
                    <Text variant="caption" color="mutedForeground">
                      Refund ₦{item.refundAmount.toLocaleString()}
                      {item.refundedAt ? ` on ${formatDate(item.refundedAt, 'short')}` : ''}
                    </Text>
                  ) : null}

                  <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
                    {item.paymentRequired ? (
                      <Button
                        label="Pay now"
                        size="sm"
                        style={{ flex: 1 }}
                        loading={payMutation.isPending}
                        onPress={() => payMutation.mutate(item.id)}
                      />
                    ) : null}
                    {item.status === 'REQUESTED' || item.status === 'CONFIRMED' ? (
                      <Button
                        label="Cancel"
                        variant="outline"
                        size="sm"
                        style={{ flex: 1 }}
                        loading={cancelMutation.isPending}
                        onPress={() => confirmCancel(item)}
                      />
                    ) : null}
                    {item.status === 'COMPLETED' && !item.reviewed ? (
                      <Button
                        label="Leave review"
                        variant="outline"
                        size="sm"
                        style={{ flex: 1 }}
                        onPress={() => setReviewing(item)}
                      />
                    ) : null}
                  </View>
                </View>
              </Card>
            </View>
          )}
          contentContainerStyle={{
            paddingTop: spacing.sm,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => query.refetch()}
              tintColor={colors.mutedForeground}
            />
          }
        />
      )}

      <ReviewStaySheet open={!!reviewing} onClose={() => setReviewing(null)} booking={reviewing} />
    </View>
  );
}
