import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Clock,
  Heart,
  PlayCircle,
  ShieldCheck,
  Star,
  Users,
  Zap,
} from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  Divider,
  ErrorState,
  Price,
  Skeleton,
  Text,
  useTheme,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { shortletsApi, CANCELLATION_POLICY_LABEL } from '@/lib/api/shortlets';
import { PropertyGallery, toGallery } from '@/components/property/PropertyGallery';
import { PropertyMapView } from '@/components/property/PropertyMapView';
import { BookStaySheet } from '@/components/shortlet/BookStaySheet';
import { formatDate } from '@/lib/format';

export default function ShortletDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [bookOpen, setBookOpen] = useState(false);

  const query = useQuery({
    queryKey: qk.shortlets.detail(id),
    queryFn: () => shortletsApi.get(id),
  });
  const reviews = useQuery({
    queryKey: qk.shortlets.reviews(id),
    queryFn: () => shortletsApi.reviews(id, 1, 20),
  });
  const wishlistQuery = useQuery({
    queryKey: qk.shortlets.wishlistIds,
    queryFn: shortletsApi.wishlistIds,
  });

  const listing = query.data;
  const saved = (wishlistQuery.data ?? []).includes(id);

  useEffect(() => {
    shortletsApi.recordView(id).catch(() => {
      /* view tracking is best-effort */
    });
  }, [id]);

  const wishlistMutation = useMutation({
    mutationFn: (next: boolean) =>
      next ? shortletsApi.addToWishlist(id) : shortletsApi.removeFromWishlist(id),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: qk.shortlets.wishlistIds });
      qc.invalidateQueries({ queryKey: qk.shortlets.wishlist });
    },
  });

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
        <Text variant="title" style={{ flex: 1 }} numberOfLines={1}>
          {listing?.title ?? 'Stay'}
        </Text>
        {listing ? (
          <Pressable
            onPress={() => wishlistMutation.mutate(!saved)}
            accessibilityRole="button"
            accessibilityLabel={saved ? 'Remove from wishlist' : 'Save to wishlist'}
            hitSlop={10}
          >
            <Heart
              size={22}
              color={saved ? colors.destructive : colors.mutedForeground}
              fill={saved ? colors.destructive : 'transparent'}
            />
          </Pressable>
        ) : null}
      </View>

      {query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : !listing ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          <Skeleton height={200} radius={radius.lg} />
        </View>
      ) : (
        <>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: insets.bottom + 100, gap: spacing.lg }}
          >
            <PropertyGallery
              images={toGallery(listing.coverImageUrl, listing.images)}
              height={250}
              emptyLabel="No photos for this stay yet"
            />

            <View style={{ paddingHorizontal: spacing.xl, gap: spacing.lg }}>
              <View style={{ gap: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 5 }}>
                  <Price amount={listing.nightlyRate} variant="display" />
                  <Text variant="callout" color="mutedForeground">
                    / night
                  </Text>
                </View>
                <Text variant="callout" color="mutedForeground">
                  {listing.address}, {listing.city}, {listing.state}
                </Text>
                {listing.reviewCount > 0 && listing.ratingAverage ? (
                  <View
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}
                  >
                    <Star size={14} color={colors.warning} fill={colors.warning} />
                    <Text variant="callout">
                      {listing.ratingAverage.toFixed(1)} · {listing.reviewCount}{' '}
                      {listing.reviewCount === 1 ? 'review' : 'reviews'}
                    </Text>
                  </View>
                ) : null}
              </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                {listing.instantBooking ? <Badge label="Instant book" tone="info" /> : null}
                {listing.furnished ? <Badge label="Furnished" tone="neutral" /> : null}
                <Badge
                  label={`${CANCELLATION_POLICY_LABEL[listing.cancellationPolicy]} cancellation`}
                  tone="neutral"
                />
              </View>

              <Card elevated>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                  <Users size={17} color={colors.mutedForeground} />
                  <Text variant="callout" style={{ flex: 1 }}>
                    Sleeps up to {listing.maxGuests}
                  </Text>
                </View>
                <Divider style={{ marginVertical: spacing.sm }} />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                  <Clock size={17} color={colors.mutedForeground} />
                  <Text variant="callout" style={{ flex: 1 }}>
                    Check in {listing.checkInTime ?? '—'} · Check out {listing.checkOutTime ?? '—'}
                  </Text>
                </View>
                <Divider style={{ marginVertical: spacing.sm }} />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                  <Zap size={17} color={colors.mutedForeground} />
                  <Text variant="callout" style={{ flex: 1 }}>
                    Minimum {listing.minNights} {listing.minNights === 1 ? 'night' : 'nights'}
                  </Text>
                </View>
              </Card>

              <View style={{ gap: spacing.sm }}>
                <Text variant="heading">About this stay</Text>
                <Text variant="body" color="mutedForeground">
                  {listing.description}
                </Text>
              </View>

              {listing.amenities?.length ? (
                <View style={{ gap: spacing.sm }}>
                  <Text variant="heading">Amenities</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                    {listing.amenities.map((a) => (
                      <Badge key={a} label={a} tone="neutral" />
                    ))}
                  </View>
                </View>
              ) : null}

              {listing.videoUrl || listing.tourUrl ? (
                <Pressable onPress={() => Linking.openURL((listing.videoUrl ?? listing.tourUrl)!)}>
                  <Card
                    elevated
                    style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: colors.accent,
                      }}
                    >
                      <PlayCircle size={20} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyStrong">
                        {listing.videoUrl ? 'Video tour' : 'Virtual tour'}
                      </Text>
                      <Text variant="caption" color="mutedForeground">
                        See the space before you book
                      </Text>
                    </View>
                  </Card>
                </Pressable>
              ) : null}

              <Card elevated>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <View>
                    <Text variant="bodyStrong">Hosted by {listing.hostName}</Text>
                    {listing.deposit ? (
                      <Text variant="caption" color="mutedForeground">
                        ₦{listing.deposit.toLocaleString()} refundable deposit
                      </Text>
                    ) : null}
                  </View>
                  {listing.hostVerified ? <ShieldCheck size={18} color={colors.success} /> : null}
                </View>
              </Card>

              {listing.latitude != null && listing.longitude != null ? (
                <View style={{ gap: spacing.sm }}>
                  <Text variant="heading">Location</Text>
                  <PropertyMapView
                    markers={[
                      { id: listing.id, latitude: listing.latitude, longitude: listing.longitude },
                    ]}
                    variant="location"
                    zoom={15}
                    height={200}
                  />
                </View>
              ) : null}

              {reviews.data?.items.length ? (
                <View style={{ gap: spacing.sm }}>
                  <Text variant="heading">Reviews</Text>
                  {reviews.data.items.map((r) => (
                    <Card key={r.id} elevated>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Text variant="bodyStrong">{r.authorName}</Text>
                        <View style={{ flexDirection: 'row', gap: 1 }}>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star
                              key={n}
                              size={12}
                              color={colors.warning}
                              fill={n <= r.rating ? colors.warning : 'transparent'}
                            />
                          ))}
                        </View>
                      </View>
                      <Text variant="caption" color="mutedForeground" style={{ marginTop: 2 }}>
                        {formatDate(r.createdAt, 'short')}
                      </Text>
                      {r.comment ? (
                        <Text
                          variant="callout"
                          color="mutedForeground"
                          style={{ marginTop: spacing.sm }}
                        >
                          {r.comment}
                        </Text>
                      ) : null}
                    </Card>
                  ))}
                </View>
              ) : null}
            </View>
          </ScrollView>

          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.md,
              padding: spacing.xl,
              paddingBottom: insets.bottom + spacing.sm,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              backgroundColor: colors.background,
            }}
          >
            <View style={{ flex: 1 }}>
              <Price amount={listing.nightlyRate} variant="bodyStrong" />
              <Text variant="caption" color="mutedForeground">
                per night
              </Text>
            </View>
            <Button
              label={listing.instantBooking ? 'Book now' : 'Request to book'}
              fullWidth={false}
              onPress={() => setBookOpen(true)}
            />
          </View>

          <BookStaySheet open={bookOpen} onClose={() => setBookOpen(false)} listing={listing} />
        </>
      )}
    </View>
  );
}
