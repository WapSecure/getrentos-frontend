import { useMemo, useState } from 'react';
import { tidyPlace } from '@sureground/shared';
import { Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Calendar,
  ChevronLeft,
  FileSignature,
  Heart,
  MessageCircle,
  PlayCircle,
  ShieldCheck,
} from '@sureground/icons/native';
import {
  Badge,
  Button,
  Card,
  DetailSkeleton,
  Divider,
  Price,
  QueryState,
  Text,
  useTheme,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import { buyerApi } from '@/lib/api/buyer';
import { useBuyerSaved } from '@/hooks/useBuyerSaved';
import { PropertyMapView } from '@/components/property/PropertyMapView';
import { ShowroomMedia, useTrackDetailView } from '@/components/showroom/ShowroomMedia';
import {
  KeyFactsRow,
  ShowroomCostsCard,
  ShowroomFacts,
  ShowroomPriceBar,
} from '@/components/showroom/ShowroomParts';
import { trackShowroom } from '@/lib/showroomAnalytics';
import { publicMarketApi } from '@/lib/api/publicMarket';
import { fromSale } from '@sureground/shared/showroom';
import { RequestViewingSheet } from '@/components/buyer/RequestViewingSheet';
import { MakeOfferSheet } from '@/components/buyer/MakeOfferSheet';
import { buyerOffersApi } from '@/lib/api/buyerOffers';
import { DiligenceCard } from '@/components/buyer/DiligenceCard';
import { formatDate, formatNaira } from '@/lib/format';
import { VideoTourSheet } from '@/components/video/VideoTourSheet';
import { useAskSeller } from '@/hooks/useAskSeller';
import { FilmedOnSite } from '@/components/video/FilmedOnSite';

export default function BuyerListingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const { savedIds, toggle } = useBuyerSaved();
  const [viewingOpen, setViewingOpen] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);
  const [touring, setTouring] = useState(false);
  const ask = useAskSeller();

  const query = useQuery({
    queryKey: qk.buyer.listingDetail(id),
    queryFn: () => buyerApi.getListing(id),
  });
  const listing = query.data;
  // An offer still in play: the button leads back to it rather than starting a second.
  const myOffers = useQuery({
    queryKey: qk.buyer.offers(1, 100),
    queryFn: () => buyerOffersApi.list(1, 100),
  });
  const openOffer = myOffers.data?.items.find(
    (o) => o.listingId === id && (o.status === 'submitted' || o.status === 'countered')
  );
  const isSaved = listing ? savedIds.has(listing.id) : false;
  // The buyer route has no media list, verified flag or offer status; the public listing has them.
  const pub = useQuery({
    queryKey: qk.market.detail('sale', id),
    queryFn: () => publicMarketApi.detail('sale', id),
    enabled: !!id,
    retry: false,
  });
  // Shared with the web showroom, so both show the same facts, costs and media.
  const showroom = useMemo(
    () =>
      listing
        ? fromSale({
            id: listing.id,
            title: listing.title,
            price: listing.askingPrice,
            city: listing.city,
            state: listing.state,
            address: listing.address,
            bedrooms: listing.bedrooms,
            bathrooms: listing.bathrooms,
            propertyType: listing.propertyType,
            coverImageUrl: listing.image,
            images: listing.images,
            amenities: listing.features,
            media: pub.data?.media,
            isVerified: pub.data?.verified,
            underOffer: pub.data?.underOffer,
          })
        : undefined,
    [listing, pub.data]
  );
  useTrackDetailView(listing?.id, 'sale');
  const startOffer = () => {
    if (!listing) return;
    if (openOffer) {
      router.push({ pathname: '/(app)/buyer-offer/[id]', params: { id: openOffer.id } });
      return;
    }
    trackShowroom({ name: 'offer_start', listingId: listing.id, market: 'sale' });
    setOfferOpen(true);
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
        <Text variant="title" style={{ flex: 1 }} numberOfLines={1}>
          {listing?.title ?? 'Listing'}
        </Text>
        {listing ? (
          <>
            <Pressable
              onPress={() => ask.mutate(listing.id)}
              disabled={ask.isPending}
              accessibilityRole="button"
              accessibilityLabel="Message the owner"
              hitSlop={10}
            >
              <MessageCircle size={21} color={colors.mutedForeground} />
            </Pressable>
            <Pressable
              onPress={() => {
                if (!isSaved) {
                  trackShowroom({ name: 'property_save', listingId: listing.id, market: 'sale' });
                }
                toggle(listing.id);
              }}
              accessibilityRole="button"
              accessibilityLabel={isSaved ? 'Remove from saved' : 'Save listing'}
              accessibilityState={{ selected: isSaved }}
              hitSlop={10}
            >
              <Heart
                size={22}
                color={isSaved ? colors.destructive : colors.mutedForeground}
                fill={isSaved ? colors.destructive : 'transparent'}
              />
            </Pressable>
          </>
        ) : null}
      </View>

      <QueryState
        query={query}
        style={{ paddingHorizontal: spacing.xl }}
        skeleton={<DetailSkeleton />}
      >
        {listing ? (
          <>
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: insets.bottom + 100, gap: spacing.lg }}
            >
              {showroom ? (
                <ShowroomMedia
                  listingId={listing.id}
                  market="sale"
                  items={showroom.media}
                  title={listing.title}
                  height={280}
                  onVideoExpired={() => void pub.refetch()}
                />
              ) : null}

              <View style={{ paddingHorizontal: spacing.xl, gap: spacing.lg }}>
                <View style={{ gap: 4 }}>
                  <Price amount={listing.askingPrice} variant="display" />
                  <Text variant="callout" color="mutedForeground">
                    {tidyPlace(
                      [listing.address, listing.city, listing.state].filter(Boolean).join(', ')
                    )}
                  </Text>
                  {listing.addressHidden ? (
                    <Text variant="caption" color="mutedForeground">
                      The exact address is shared once the property is verified.
                    </Text>
                  ) : null}
                </View>

                <KeyFactsRow
                  bedrooms={listing.bedrooms}
                  bathrooms={listing.bathrooms}
                  size={listing.propertySize}
                />

                {showroom ? (
                  <ShowroomCostsCard
                    market="sale"
                    costs={showroom.costs}
                    price={showroom.price}
                    footer={
                      showroom.underOffer && !openOffer ? (
                        <Text variant="caption" color="mutedForeground">
                          Under offer: the seller has accepted an offer, so it is not taking new
                          offers right now.
                        </Text>
                      ) : (
                        <Button
                          label={openOffer ? 'View your offer' : 'Make an offer'}
                          variant="secondary"
                          icon={<FileSignature size={16} color={colors.foreground} />}
                          onPress={startOffer}
                        />
                      )
                    }
                  />
                ) : null}

                <Divider />

                <View style={{ gap: spacing.sm }}>
                  <Text variant="heading">About this property</Text>
                  <Text variant="body" color="mutedForeground">
                    {listing.description}
                  </Text>
                </View>

                {showroom ? <ShowroomFacts facts={showroom.facts} /> : null}

                {listing.features?.length ? (
                  <View style={{ gap: spacing.sm }}>
                    <Text variant="heading">Features</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                      {listing.features.map((f) => (
                        <Badge key={f} label={f} tone="neutral" />
                      ))}
                    </View>
                  </View>
                ) : null}

                {listing.videoTourUrl ? (
                  <Pressable
                    onPress={() => setTouring(true)}
                    accessibilityRole="button"
                    accessibilityLabel={
                      listing.videoTourFilmedOnSite
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
                        {listing.videoTourFilmedOnSite ? (
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

                {listing.latitude != null && listing.longitude != null ? (
                  <View style={{ gap: spacing.sm }}>
                    <Text variant="heading">Location</Text>
                    <PropertyMapView
                      markers={[
                        {
                          id: listing.id,
                          latitude: listing.latitude,
                          longitude: listing.longitude,
                        },
                      ]}
                      variant={listing.locationPrecision === 'approximate' ? 'area' : 'location'}
                      zoom={15}
                      height={200}
                    />
                  </View>
                ) : null}

                <DiligenceCard listingId={listing.id} />

                <Card elevated>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <View>
                      <Text variant="bodyStrong">{listing.ownerName}</Text>
                      <Text variant="caption" color="mutedForeground">
                        {listing.propertyType} · Listed {formatDate(listing.listedDate, 'short')}
                      </Text>
                    </View>
                    {listing.ownerVerified ? (
                      <ShieldCheck size={18} color={colors.success} />
                    ) : null}
                  </View>
                </Card>
              </View>
            </ScrollView>

            <ShowroomPriceBar
              price={listing.askingPrice}
              caption={
                openOffer ? (
                  <Text variant="caption" color="mutedForeground" numberOfLines={2}>
                    {openOffer.status === 'countered'
                      ? `Your offer of ${formatNaira(openOffer.offerAmount)} has a counter waiting.`
                      : `You offered ${formatNaira(openOffer.offerAmount)}. Waiting for the seller.`}
                  </Text>
                ) : null
              }
              action={
                <Button
                  label="Request inspection"
                  fullWidth={false}
                  icon={<Calendar size={16} color={colors.primaryForeground} />}
                  onPress={() => {
                    trackShowroom({
                      name: 'inspection_request_start',
                      listingId: listing.id,
                      market: 'sale',
                      surface: 'app_sticky_bar',
                    });
                    setViewingOpen(true);
                  }}
                />
              }
            />

            <RequestViewingSheet
              open={viewingOpen}
              onClose={() => setViewingOpen(false)}
              listing={listing}
            />
            <MakeOfferSheet
              open={offerOpen}
              onClose={() => setOfferOpen(false)}
              listing={listing}
            />
            {listing.videoTourUrl ? (
              <VideoTourSheet
                open={touring}
                onClose={() => setTouring(false)}
                title={listing.title}
                videoUrl={listing.videoTourUrl}
                videoStream={listing.videoTourStream}
                onExpired={() => void query.refetch()}
              />
            ) : null}
          </>
        ) : null}
      </QueryState>
    </View>
  );
}
