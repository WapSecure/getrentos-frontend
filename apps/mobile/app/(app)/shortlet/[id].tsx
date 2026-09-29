import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CalendarClock,
  ChevronLeft,
  Clock,
  Heart,
  PlayCircle,
  Star,
  Undo2,
} from 'lucide-react-native';
import {
  Button,
  Card,
  Chip,
  Divider,
  ErrorState,
  Price,
  Skeleton,
  Text,
  useTheme,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { shortletsApi } from '@/lib/api/shortlets';
import { CANCELLATION_POLICIES } from '@/lib/api/hostShortlets';
import { nightsLabel, seasonRange } from '@/lib/stays';
import { formatDate } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { PropertyGallery, toGallery } from '@/components/property/PropertyGallery';
import { PropertyMapView } from '@/components/property/PropertyMapView';
import { BookStaySheet } from '@/components/shortlet/BookStaySheet';
import { StayDatesSheet, type StayDates } from '@/components/shortlet/StayDatesSheet';
import { MessageHostSheet } from '@/components/shortlet/MessageHostSheet';
import {
  GuestPromiseCard,
  InfoRow,
  Section,
  SupportContact,
  TrustChips,
} from '@/components/shortlet/StayUI';
import {
  EssentialsBlock,
  FairPriceNote,
  HostBlock,
  InspectionBlock,
  PricingBlock,
  RulesBlock,
} from '@/components/shortlet/StaySections';

type SheetName = 'dates' | 'book' | 'message' | null;

/** One stay, told in the order a guest decides: trust, fit, price, then the total. */
export default function ShortletDetail() {
  const params = useLocalSearchParams<{
    id: string;
    checkIn?: string;
    checkOut?: string;
    guests?: string;
  }>();
  const id = params.id;
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const [dates, setDates] = useState<StayDates | null>(
    params.checkIn && params.checkOut
      ? { checkIn: params.checkIn, checkOut: params.checkOut }
      : null
  );
  const [guests, setGuests] = useState(Math.max(1, Number(params.guests) || 1));
  const [sheet, setSheet] = useState<SheetName>(null);
  // Picking dates on the way to booking carries straight on to the booking sheet.
  const [bookAfterDates, setBookAfterDates] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  // Past the photos, the floating controls sit on a solid bar with the title.
  const [solidHeader, setSolidHeader] = useState(false);

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
  const taken = useQuery({
    queryKey: qk.shortlets.availability(id),
    queryFn: () => shortletsApi.availability(id),
    enabled: sheet === 'dates',
    staleTime: 60_000,
  });
  const quote = useQuery({
    queryKey: qk.shortlets.availability(id, dates?.checkIn, dates?.checkOut),
    queryFn: () => shortletsApi.availability(id, dates!.checkIn, dates!.checkOut),
    enabled: !!dates,
  });

  const listing = query.data;
  const saved = (wishlistQuery.data ?? []).includes(id);

  useEffect(() => {
    shortletsApi.recordView(id).catch(() => {
      /* view tracking is best-effort */
    });
  }, [id]);

  const wishlist = useMutation({
    mutationFn: (next: boolean) =>
      next ? shortletsApi.addToWishlist(id) : shortletsApi.removeFromWishlist(id),
    onMutate: (next) => {
      void haptics.tap();
      qc.setQueryData<string[]>(qk.shortlets.wishlistIds, (old = []) =>
        next ? [...old, id] : old.filter((x) => x !== id)
      );
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: qk.shortlets.wishlistIds });
      qc.invalidateQueries({ queryKey: qk.shortlets.wishlist });
    },
  });

  const openDates = (thenBook: boolean) => {
    setBookAfterDates(thenBook);
    setSheet('dates');
  };

  const galleryHeight = 300 + insets.top;
  const roundButton = {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: solidHeader ? 'transparent' : 'rgba(255,255,255,0.94)',
  };
  const iconColor = solidHeader ? colors.foreground : '#161b22';

  const policy = listing
    ? CANCELLATION_POLICIES.find((p) => p.value === listing.cancellationPolicy)
    : undefined;
  const q = quote.data;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {query.isError ? (
        <View style={{ flex: 1, paddingTop: insets.top + 56 }}>
          <ErrorState onRetry={() => query.refetch()} />
        </View>
      ) : !listing ? (
        <View style={{ gap: spacing.lg }}>
          <Skeleton height={300 + insets.top} radius={0} />
          <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
            <Skeleton height={30} width="80%" />
            <Skeleton height={18} width="50%" />
            <Skeleton height={120} radius={radius.lg} />
          </View>
        </View>
      ) : (
        <>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={32}
            onScroll={(e) =>
              setSolidHeader(e.nativeEvent.contentOffset.y > galleryHeight - insets.top - 64)
            }
          >
            <PropertyGallery
              images={toGallery(listing.coverImageUrl, listing.images)}
              height={galleryHeight}
              emptyLabel="No photos for this stay yet"
            />

            <View
              style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.xl, gap: spacing['2xl'] }}
            >
              {/* Title and trust */}
              <View style={{ gap: spacing.sm }}>
                <Text variant="title" accessibilityRole="header">
                  {listing.title}
                </Text>
                <Text variant="body" color="mutedForeground">
                  {listing.city}, {listing.state} · sleeps {listing.maxGuests}
                  {listing.bedrooms
                    ? ` · ${listing.bedrooms} bed${listing.bedrooms === 1 ? '' : 's'}`
                    : ''}
                  {listing.bathrooms
                    ? ` · ${listing.bathrooms} bath${listing.bathrooms === 1 ? '' : 's'}`
                    : ''}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Star size={15} color={colors.foreground} fill={colors.foreground} />
                  <Text variant="bodyStrong">
                    {listing.reviewCount > 0 && listing.ratingAverage
                      ? listing.ratingAverage.toFixed(1)
                      : 'New'}
                  </Text>
                  {listing.reviewCount > 0 ? (
                    <Text variant="body" color="mutedForeground">
                      · {listing.reviewCount} {listing.reviewCount === 1 ? 'review' : 'reviews'}
                    </Text>
                  ) : null}
                </View>
                <View style={{ marginTop: spacing.xs }}>
                  <TrustChips listing={listing} />
                </View>
              </View>

              <Divider />
              <HostBlock listing={listing} onMessage={() => setSheet('message')} />
              <Divider />

              {/* The facts that decide a stay */}
              <View style={{ gap: spacing.lg }}>
                <InfoRow
                  icon={Clock}
                  title={`Check in ${listing.checkInTime ? `from ${listing.checkInTime}` : 'time set by host'}`}
                  detail={listing.checkOutTime ? `Check out by ${listing.checkOutTime}` : undefined}
                />
                <InfoRow
                  icon={CalendarClock}
                  title={`Minimum ${nightsLabel(listing.minNights)}`}
                  detail={
                    listing.seasons?.some((s) => s.minNights)
                      ? 'Longer minimums apply in peak season'
                      : undefined
                  }
                />
                <InfoRow
                  icon={Undo2}
                  title={`${policy?.label ?? 'Flexible'} cancellation`}
                  detail={policy?.hint}
                />
              </View>

              {listing.description ? (
                <Section title="About this stay">
                  <Text
                    variant="body"
                    color="mutedForeground"
                    numberOfLines={aboutOpen ? undefined : 5}
                  >
                    {listing.description}
                  </Text>
                  {listing.description.length > 240 ? (
                    <Pressable
                      onPress={() => setAboutOpen((o) => !o)}
                      accessibilityRole="button"
                      hitSlop={8}
                    >
                      <Text variant="callout" color="primary" style={{ fontWeight: '700' }}>
                        {aboutOpen ? 'Show less' : 'Read more'}
                      </Text>
                    </Pressable>
                  ) : null}
                </Section>
              ) : null}

              {listing.videoUrl || listing.tourUrl ? (
                <Pressable
                  onPress={() => Linking.openURL((listing.videoUrl ?? listing.tourUrl)!)}
                  accessibilityRole="link"
                >
                  <Card elevated>
                    <InfoRow
                      icon={PlayCircle}
                      title={listing.videoUrl ? 'Watch the video tour' : 'Take the virtual tour'}
                      detail="See the space before you book"
                    />
                  </Card>
                </Pressable>
              ) : null}

              <EssentialsBlock listing={listing} />
              <RulesBlock listing={listing} />

              {listing.amenities?.length ? (
                <Section title="Amenities">
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                    {listing.amenities.map((a) => (
                      <Chip key={a} label={a} />
                    ))}
                  </View>
                </Section>
              ) : null}

              <PricingBlock listing={listing} />
              <FairPriceNote listing={listing} />
              <InspectionBlock listing={listing} />

              <GuestPromiseCard>
                <SupportContact context={`Question about ${listing.title}`} />
              </GuestPromiseCard>

              {listing.latitude != null && listing.longitude != null ? (
                <Section title="Where you'll be" caption={`${listing.city}, ${listing.state}`}>
                  <PropertyMapView
                    markers={[
                      { id: listing.id, latitude: listing.latitude, longitude: listing.longitude },
                    ]}
                    variant="location"
                    zoom={15}
                    height={200}
                  />
                </Section>
              ) : null}

              {reviews.data?.items.length ? (
                <Section title="Reviews">
                  {reviews.data.items.map((r) => (
                    <Card key={r.id} elevated style={{ gap: spacing.sm }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                        <Text variant="bodyStrong" style={{ flex: 1 }}>
                          {r.authorName}
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 1 }}>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star
                              key={n}
                              size={12}
                              color={colors.foreground}
                              fill={n <= r.rating ? colors.foreground : 'transparent'}
                            />
                          ))}
                        </View>
                      </View>
                      <Text variant="caption" color="mutedForeground">
                        {formatDate(r.createdAt, 'short')}
                      </Text>
                      {r.comment ? (
                        <Text variant="body" color="mutedForeground">
                          {r.comment}
                        </Text>
                      ) : null}
                    </Card>
                  ))}
                </Section>
              ) : null}
            </View>
          </ScrollView>

          {/* Floating controls over the gallery; a solid bar once scrolled past it */}
          <View
            pointerEvents="box-none"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              paddingTop: insets.top + spacing.sm,
              paddingBottom: spacing.sm,
              paddingHorizontal: spacing.lg,
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              backgroundColor: solidHeader ? colors.card : 'transparent',
              borderBottomWidth: solidHeader ? StyleSheet.hairlineWidth : 0,
              borderBottomColor: colors.border,
            }}
          >
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={6}
              style={roundButton}
            >
              <ChevronLeft size={22} color={iconColor} />
            </Pressable>
            <Text
              variant="bodyStrong"
              numberOfLines={1}
              style={{ flex: 1, textAlign: 'center', opacity: solidHeader ? 1 : 0 }}
              importantForAccessibility="no"
            >
              {listing.title}
            </Text>
            <Pressable
              onPress={() => wishlist.mutate(!saved)}
              accessibilityRole="button"
              accessibilityLabel={saved ? 'Remove from wishlist' : 'Save to wishlist'}
              hitSlop={6}
              style={roundButton}
            >
              <Heart
                size={19}
                color={saved ? colors.destructive : iconColor}
                fill={saved ? colors.destructive : 'transparent'}
              />
            </Pressable>
          </View>

          {/* The total, always in reach */}
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.md,
              paddingHorizontal: spacing.xl,
              paddingTop: spacing.md,
              paddingBottom: insets.bottom + spacing.md,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              backgroundColor: colors.card,
            }}
          >
            <Pressable
              style={{ flex: 1 }}
              onPress={() => openDates(false)}
              accessibilityRole="button"
              accessibilityLabel={dates ? 'Change dates' : 'Add dates'}
            >
              {dates && q?.available && q.estimatedTotal != null ? (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                    <Price amount={q.estimatedTotal} variant="subheading" />
                    <Text variant="callout" color="mutedForeground">
                      total
                    </Text>
                  </View>
                  <Text variant="caption" style={{ textDecorationLine: 'underline' }}>
                    {seasonRange(dates.checkIn, dates.checkOut)} ·{' '}
                    {nightsLabel(q.estimatedNights ?? 0)}
                  </Text>
                </>
              ) : dates && q && !q.available ? (
                <>
                  <Text variant="callout" style={{ color: colors.warning }} numberOfLines={2}>
                    {q.reason ?? 'Those dates are taken.'}
                  </Text>
                  <Text variant="caption" style={{ textDecorationLine: 'underline' }}>
                    Change dates
                  </Text>
                </>
              ) : (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                    <Price amount={listing.nightlyRate} variant="subheading" />
                    <Text variant="callout" color="mutedForeground">
                      / night
                    </Text>
                  </View>
                  <Text variant="caption" style={{ textDecorationLine: 'underline' }}>
                    {dates && quote.isFetching ? 'Pricing your dates…' : 'Add dates for the total'}
                  </Text>
                </>
              )}
            </Pressable>
            <Button
              label={
                !dates || (q && !q.available)
                  ? 'Check dates'
                  : listing.instantBooking
                    ? 'Book now'
                    : 'Request'
              }
              fullWidth={false}
              size="lg"
              onPress={() => (dates && q?.available ? setSheet('book') : openDates(true))}
            />
          </View>

          <StayDatesSheet
            open={sheet === 'dates'}
            onClose={() => setSheet(null)}
            value={dates}
            unavailable={taken.data?.unavailableDates}
            minNights={listing.minNights}
            onChange={(d) => {
              setDates(d);
              if (d && bookAfterDates) setTimeout(() => setSheet('book'), 250);
            }}
          />
          {dates ? (
            <BookStaySheet
              open={sheet === 'book'}
              onClose={() => setSheet(null)}
              listing={listing}
              dates={dates}
              guests={Math.min(guests, listing.maxGuests)}
              onGuestsChange={setGuests}
              onChangeDates={() => {
                setSheet(null);
                setTimeout(() => openDates(true), 250);
              }}
            />
          ) : null}
          <MessageHostSheet
            open={sheet === 'message'}
            onClose={() => setSheet(null)}
            listing={listing}
          />
        </>
      )}
    </View>
  );
}
