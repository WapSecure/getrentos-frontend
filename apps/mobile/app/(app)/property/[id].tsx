import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Calendar,
  ChevronLeft,
  Heart,
  MapPin,
  Navigation,
  MessageCircle,
  PlayCircle,
  Share2,
  ShieldCheck,
  Search,
} from '@sureground/icons/native';
import {
  Badge,
  Button,
  Card,
  Chip,
  Divider,
  IconButton,
  LinkButton,
  listingArea,
  Price,
  QueryState,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { useSavedListings } from '@/hooks/useSavedListings';
import { qk } from '@/lib/query/keys';
import { leaseApi } from '@/lib/api/lease';
import { propertiesApi } from '@/lib/api/properties';
import { messagesApi } from '@/lib/api/messages';
import { errorMessage, ApiError } from '@/lib/api/client';
import { track } from '@/lib/analytics';
import { recentlyViewedApi } from '@/lib/api/recentlyViewed';
import { formatDate } from '@/lib/format';
import { env } from '@/lib/env';
import { marketWebPath } from '@/lib/api/publicMarket';
import { ViewingRequestSheet } from '@/components/property/ViewingRequestSheet';
import { PropertyMapView } from '@/components/property/PropertyMapView';
import { openDirections } from '@/lib/directions';
import { ShowroomMedia, useTrackDetailView } from '@/components/showroom/ShowroomMedia';
import {
  KeyFactsRow,
  ShowroomCostsCard,
  ShowroomFacts,
  ShowroomPriceBar,
} from '@/components/showroom/ShowroomParts';
import { trackShowroom } from '@/lib/showroomAnalytics';
import { fromRental } from '@sureground/shared/showroom';
import { GeoInsightsPanel } from '@/components/property/GeoInsightsPanel';
import { ListingCheckCard } from '@/components/property/ListingCheckCard';
import { AffordabilityCard } from '@/components/property/AffordabilityCard';
import { VideoTourSheet } from '@/components/video/VideoTourSheet';
import { FilmedOnSite } from '@/components/video/FilmedOnSite';
import { trustChainLabel } from '@sureground/shared';

export default function PropertyDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const { savedIds, toggle } = useSavedListings();
  const toast = useToast();
  const [viewingSheetOpen, setViewingSheetOpen] = useState(false);
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [touring, setTouring] = useState(false);
  // Past the gallery the back and share buttons get a solid bar, so they never sit on text.
  const [scrolled, setScrolled] = useState(false);

  const query = useQuery({
    queryKey: qk.listings.detail(id),
    queryFn: async () => {
      try {
        return await propertiesApi.getById(id);
      } catch (e) {
        // A home that has been let or withdrawn is gone, not a connection
        // problem: null renders the "no longer listed" state below.
        if (e instanceof ApiError && e.status === 404) return null;
        throw e;
      }
    },
    enabled: !!id,
  });

  const messageMutation = useMutation({
    mutationFn: () => {
      const landlordId = query.data!.landlordId!;
      return messagesApi.start(landlordId, query.data!.propertyId);
    },
    onSuccess: (conversation) => router.push(`/(app)/conversation/${conversation.id}`),
    onError: (err) => toast.show(errorMessage(err, 'Could not start the conversation.'), 'error'),
  });

  useEffect(() => {
    if (query.data) {
      track('listing_viewed', { id });
      recentlyViewedApi.record(id).catch(() => undefined);
    }
  }, [query.data, id]);

  const saved = savedIds.has(id);
  const p = query.data;
  // The same facts, fees and media as the web showroom.
  const showroom = useMemo(() => (p ? fromRental(p) : undefined), [p]);
  useTrackDetailView(p?.id, 'rent');
  // Only asked when the home is let: it might be the one this renter lives in.
  const lease = useQuery({
    queryKey: qk.renter.lease,
    queryFn: leaseApi.getLease,
    retry: false,
    enabled: p?.acceptingApplications === false,
  });
  const isMyHome = !!p && !!lease.data && lease.data.propertyId === p.propertyId;
  const accepting = p?.acceptingApplications !== false;
  const apply = () => {
    trackShowroom({ name: 'inquiry_start', listingId: id, market: 'rent' });
    router.push(`/(app)/property/${id}/apply`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        // A tap on a commute-destination suggestion must not just close the keyboard.
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={32}
        onScroll={(e) => {
          const past = e.nativeEvent.contentOffset.y > 180;
          if (past !== scrolled) setScrolled(past);
        }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
      >
        {query.data === null ? null : p && showroom ? (
          <ShowroomMedia
            listingId={p.id}
            market="rent"
            items={showroom.media}
            title={p.title}
            height={300}
            area={listingArea({ title: p.title, location: p.location ?? '' })}
            onVideoExpired={() => void query.refetch()}
          />
        ) : (
          <View style={{ height: 300, backgroundColor: colors.muted }} />
        )}

        <View style={{ padding: spacing.xl, gap: spacing.lg }}>
          <QueryState
            query={query}
            isEmpty={query.data === null}
            empty={{
              icon: <Search size={34} color={colors.mutedForeground} />,
              title: 'This home is no longer listed',
              description: 'It may have been let or taken down. Keep browsing for homes like it.',
              action: <Button label="Back to Discover" onPress={() => router.back()} />,
            }}
            skeleton={
              <View style={{ gap: spacing.md }}>
                <Skeleton height={26} width="55%" />
                <Skeleton height={18} width="75%" />
                <Skeleton height={64} />
              </View>
            }
          >
            {p ? (
              <>
                <View style={{ gap: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <Price amount={p.price} period={p.period} variant="title" />
                    {p.trustChain?.steps.length ? (
                      <Badge
                        label={trustChainLabel(p.trustChain).label}
                        tone={
                          trustChainLabel(p.trustChain).tone === 'verified'
                            ? 'success'
                            : trustChainLabel(p.trustChain).tone === 'partial'
                              ? 'info'
                              : 'warning'
                        }
                      />
                    ) : p.verified ? (
                      <Badge label="Verified" tone="success" />
                    ) : null}
                  </View>
                  <Text variant="heading" headingLevel={1}>
                    {p.title}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <MapPin size={13} color={colors.mutedForeground} />
                    <Text variant="callout" color="mutedForeground">
                      {p.address ? `${p.address}, ${p.location}` : p.location}
                    </Text>
                  </View>
                  {p.addressHidden ? (
                    <Text variant="caption" color="mutedForeground">
                      The exact address is shared once the property is verified.
                    </Text>
                  ) : null}
                </View>

                <KeyFactsRow bedrooms={p.bedrooms} bathrooms={p.bathrooms} size={p.size} />

                {showroom ? (
                  <ShowroomCostsCard
                    market="rent"
                    costs={showroom.costs}
                    price={showroom.price}
                    priceUnit={showroom.priceUnit}
                    footer={
                      accepting ? (
                        <Button label="Apply to rent" variant="secondary" onPress={apply} />
                      ) : null
                    }
                  />
                ) : null}

                {p.description ? (
                  <View style={{ gap: spacing.xs }}>
                    <Text variant="bodyStrong" headingLevel={2}>
                      About this home
                    </Text>
                    <Text
                      variant="body"
                      color="mutedForeground"
                      numberOfLines={descriptionOpen ? undefined : 6}
                    >
                      {p.description}
                    </Text>
                    {p.description.length > 280 ? (
                      <LinkButton
                        label={descriptionOpen ? 'Show less' : 'Read more'}
                        onPress={() => setDescriptionOpen((v) => !v)}
                      />
                    ) : null}
                  </View>
                ) : null}

                {showroom ? <ShowroomFacts facts={showroom.facts} /> : null}

                {p.amenities?.length ? (
                  <View style={{ gap: spacing.sm }}>
                    <Text variant="bodyStrong" headingLevel={2}>
                      Amenities
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                      {p.amenities.map((a) => (
                        <Chip key={a} label={a} size="sm" />
                      ))}
                    </View>
                  </View>
                ) : null}

                <ListingCheckCard listingId={p.id} />
                <AffordabilityCard listingId={p.id} />

                {p.landlordName ? (
                  <View style={{ gap: spacing.sm }}>
                    <Text variant="bodyStrong" headingLevel={2}>
                      Listed by
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text variant="body">{p.landlordName}</Text>
                      {p.landlordVerified ? <ShieldCheck size={14} color={colors.success} /> : null}
                    </View>
                    {p.landlordReviews ? (
                      <Text variant="caption" color="mutedForeground">
                        {p.landlordRating?.toFixed(1)} ★ · {p.landlordReviews} reviews
                      </Text>
                    ) : null}
                  </View>
                ) : null}

                {p.reviews && p.reviews.length > 0 ? (
                  <View style={{ gap: spacing.sm }}>
                    <Text variant="bodyStrong" headingLevel={2}>
                      Reviews
                    </Text>
                    <Card elevated padding="none">
                      {p.reviews.slice(0, 3).map((r, i) => (
                        <View key={r.id}>
                          {i > 0 ? <Divider /> : null}
                          <View style={{ padding: spacing.lg, gap: 4 }}>
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                              }}
                            >
                              <Text variant="callout" style={{ fontWeight: '700' }}>
                                {r.author}
                              </Text>
                              <Text variant="caption" color="mutedForeground">
                                {r.rating.toFixed(1)} ★
                              </Text>
                            </View>
                            <Text variant="caption" color="mutedForeground">
                              {formatDate(r.date, 'short')}
                            </Text>
                            <Text variant="body" style={{ marginTop: 2 }}>
                              {r.comment}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </Card>
                  </View>
                ) : null}

                {p.videoTourUrl ? (
                  <Pressable
                    onPress={() => setTouring(true)}
                    accessibilityRole="button"
                    accessibilityLabel={
                      p.videoTourFilmedOnSite
                        ? 'Watch the video tour, filmed on site'
                        : 'Watch the video tour'
                    }
                  >
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
                        <Text variant="bodyStrong">Video tour</Text>
                        {p.videoTourFilmedOnSite ? (
                          <FilmedOnSite />
                        ) : (
                          <Text variant="caption" color="mutedForeground">
                            Walk through this property on video
                          </Text>
                        )}
                      </View>
                    </Card>
                  </Pressable>
                ) : null}

                {p.latitude != null && p.longitude != null ? (
                  <View style={{ gap: spacing.sm }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Text variant="bodyStrong" headingLevel={2}>
                        Location
                      </Text>
                      {/* Directions to an approximate point would lead to the wrong street. */}
                      {p.locationPrecision !== 'approximate' ? (
                        <Pressable
                          onPress={() =>
                            openDirections(p.latitude as number, p.longitude as number, p.title)
                          }
                          accessibilityRole="button"
                          accessibilityLabel="Get directions"
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 4,
                            minHeight: 44,
                          }}
                          hitSlop={8}
                        >
                          <Navigation size={13} color={colors.primary} />
                          <Text
                            variant="callout"
                            style={{ color: colors.primary, fontWeight: '600' }}
                          >
                            Directions
                          </Text>
                        </Pressable>
                      ) : null}
                    </View>
                    <PropertyMapView
                      markers={[{ id: p.id, latitude: p.latitude, longitude: p.longitude }]}
                      variant={p.locationPrecision === 'approximate' ? 'area' : 'location'}
                      zoom={15}
                      height={200}
                    />
                  </View>
                ) : null}

                <GeoInsightsPanel listingId={p.id} />
              </>
            ) : null}
          </QueryState>
        </View>
      </ScrollView>

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
          justifyContent: 'space-between',
          backgroundColor: scrolled ? colors.background : 'transparent',
          borderBottomWidth: scrolled ? StyleSheet.hairlineWidth : 0,
          borderBottomColor: colors.border,
        }}
      >
        <IconButton
          onPress={() => router.back()}
          haptic={false}
          accessibilityLabel="Go back"
          icon={<ChevronLeft size={22} color={colors.foreground} />}
        />
        {p ? (
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {p.landlordId ? (
              <IconButton
                onPress={() => messageMutation.mutate()}
                disabled={messageMutation.isPending}
                accessibilityLabel={`Message ${p.landlordName ?? 'the landlord'}`}
                style={{ opacity: messageMutation.isPending ? 0.6 : 1 }}
                icon={<MessageCircle size={19} color={colors.foreground} />}
              />
            ) : null}
            <IconButton
              onPress={() => {
                trackShowroom({ name: 'property_share', listingId: p.id, market: 'rent' });
                Share.share({
                  message: `${p.title} · ${p.location}\n${env.webUrl}${marketWebPath('rent', p.id)}`,
                }).catch(() => undefined);
              }}
              accessibilityLabel="Share this home"
              icon={<Share2 size={19} color={colors.foreground} />}
            />
          </View>
        ) : null}
      </View>

      {p ? (
        <ShowroomPriceBar
          price={p.price}
          period={p.period}
          leading={
            <IconButton
              onPress={() => {
                if (!saved) trackShowroom({ name: 'property_save', listingId: id, market: 'rent' });
                toggle(id);
              }}
              accessibilityLabel={saved ? 'Remove from saved' : 'Save this home'}
              selected={saved}
              icon={
                <Heart
                  size={20}
                  color={saved ? colors.destructive : colors.foreground}
                  fill={saved ? colors.destructive : 'transparent'}
                />
              }
            />
          }
          action={
            accepting ? (
              // A let unit is no longer available, so don't invite a viewing of it.
              <Button
                label="Request viewing"
                fullWidth={false}
                icon={<Calendar size={16} color={colors.primaryForeground} />}
                onPress={() => {
                  trackShowroom({
                    name: 'inspection_request_start',
                    listingId: id,
                    market: 'rent',
                    surface: 'app_sticky_bar',
                  });
                  setViewingSheetOpen(true);
                }}
              />
            ) : isMyHome ? (
              <Button
                label="View my lease"
                fullWidth={false}
                onPress={() => router.push('/(app)/lease')}
              />
            ) : (
              <Button
                label="Find similar homes"
                variant="secondary"
                fullWidth={false}
                onPress={() => router.push('/(app)/(renter)/discover')}
              />
            )
          }
          caption={
            accepting || isMyHome ? null : (
              <Text variant="caption" color="mutedForeground">
                Already let
              </Text>
            )
          }
        />
      ) : null}

      {p ? (
        <ViewingRequestSheet
          open={viewingSheetOpen}
          onClose={() => setViewingSheetOpen(false)}
          propertyId={p.propertyId}
          propertyTitle={p.title}
        />
      ) : null}
      {p?.videoTourUrl ? (
        <VideoTourSheet
          open={touring}
          onClose={() => setTouring(false)}
          title={p.title}
          videoUrl={p.videoTourUrl}
          videoStream={p.videoTourStream}
          // A signed link that has lapsed: fetch the listing for a fresh one.
          onExpired={() => void query.refetch()}
        />
      ) : null}
    </View>
  );
}
