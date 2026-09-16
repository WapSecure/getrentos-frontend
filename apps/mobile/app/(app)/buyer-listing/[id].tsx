import { useState } from 'react';
import { Linking, Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Bath,
  Bed,
  Calendar,
  ChevronLeft,
  FileSignature,
  Heart,
  MessageCircle,
  PlayCircle,
  Ruler,
  ShieldCheck,
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
import { buyerApi } from '@/lib/api/buyer';
import { useBuyerSaved } from '@/hooks/useBuyerSaved';
import { PropertyMapView } from '@/components/property/PropertyMapView';
import { PropertyGallery, toGallery } from '@/components/property/PropertyGallery';
import { RequestViewingSheet } from '@/components/buyer/RequestViewingSheet';
import { MakeOfferSheet } from '@/components/buyer/MakeOfferSheet';
import { formatDate } from '@/lib/format';

export default function BuyerListingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const { savedIds, toggle } = useBuyerSaved();
  const [viewingOpen, setViewingOpen] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);

  const query = useQuery({
    queryKey: qk.buyer.listingDetail(id),
    queryFn: () => buyerApi.getListing(id),
  });
  const listing = query.data;
  const isSaved = listing ? savedIds.has(listing.id) : false;
  // The cover key is usually repeated in the gallery, and a repeated URI would collide as a list key.
  const gallery = listing ? toGallery(listing.image, listing.images) : [];

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
              onPress={() => router.push('/(app)/(buyer)/messages')}
              accessibilityRole="button"
              accessibilityLabel="Message the owner"
              hitSlop={10}
            >
              <MessageCircle size={21} color={colors.mutedForeground} />
            </Pressable>
            <Pressable
              onPress={() => toggle(listing.id)}
              accessibilityRole="button"
              accessibilityLabel="Save listing"
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
            <PropertyGallery images={gallery} />

            <View style={{ paddingHorizontal: spacing.xl, gap: spacing.lg }}>
              <View style={{ gap: 4 }}>
                <Price amount={listing.askingPrice} variant="display" />
                <Text variant="callout" color="mutedForeground">
                  {listing.address}, {listing.city}, {listing.state}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: spacing.lg, flexWrap: 'wrap' }}>
                {listing.bedrooms != null ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Bed size={15} color={colors.mutedForeground} />
                    <Text variant="callout" color="mutedForeground">
                      {listing.bedrooms} bed
                    </Text>
                  </View>
                ) : null}
                {listing.bathrooms != null ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Bath size={15} color={colors.mutedForeground} />
                    <Text variant="callout" color="mutedForeground">
                      {listing.bathrooms} bath
                    </Text>
                  </View>
                ) : null}
                {listing.propertySize != null ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ruler size={15} color={colors.mutedForeground} />
                    <Text variant="callout" color="mutedForeground">
                      {listing.propertySize} m²
                    </Text>
                  </View>
                ) : null}
              </View>

              <Divider />

              <View style={{ gap: spacing.sm }}>
                <Text variant="heading">About this property</Text>
                <Text variant="body" color="mutedForeground">
                  {listing.description}
                </Text>
              </View>

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

              {listing.videoUrl ? (
                <Pressable onPress={() => Linking.openURL(listing.videoUrl!)}>
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
                      <Text variant="caption" color="mutedForeground">
                        Walk through this property on video
                      </Text>
                    </View>
                  </Card>
                </Pressable>
              ) : null}

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
                  {listing.ownerVerified ? <ShieldCheck size={18} color={colors.success} /> : null}
                </View>
              </Card>
            </View>
          </ScrollView>

          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              flexDirection: 'row',
              gap: spacing.sm,
              padding: spacing.xl,
              paddingBottom: insets.bottom + spacing.sm,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              backgroundColor: colors.background,
            }}
          >
            <Button
              label="Request viewing"
              variant="outline"
              icon={<Calendar size={16} color={colors.foreground} />}
              style={{ flex: 1 }}
              onPress={() => setViewingOpen(true)}
            />
            <Button
              label="Make offer"
              icon={<FileSignature size={16} color={colors.primaryForeground} />}
              style={{ flex: 1 }}
              onPress={() => setOfferOpen(true)}
            />
          </View>

          <RequestViewingSheet
            open={viewingOpen}
            onClose={() => setViewingOpen(false)}
            listing={listing}
          />
          <MakeOfferSheet open={offerOpen} onClose={() => setOfferOpen(false)} listing={listing} />
        </>
      )}
    </View>
  );
}
