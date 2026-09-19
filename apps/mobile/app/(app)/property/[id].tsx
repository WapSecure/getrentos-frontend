import { useEffect, useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Calendar,
  ChevronLeft,
  Heart,
  MapPin,
  Navigation,
  BedDouble,
  Bath,
  Maximize,
  MessageCircle,
  PlayCircle,
  ShieldCheck,
} from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  Chip,
  Divider,
  ErrorState,
  Price,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { useSavedListings } from '@/hooks/useSavedListings';
import { qk } from '@/lib/query/keys';
import { propertiesApi } from '@/lib/api/properties';
import { messagesApi } from '@/lib/api/messages';
import { ApiError } from '@/lib/api/client';
import { track } from '@/lib/analytics';
import { recentlyViewedApi } from '@/lib/api/recentlyViewed';
import { formatDate } from '@/lib/format';
import { ViewingRequestSheet } from '@/components/property/ViewingRequestSheet';
import { PropertyMapView } from '@/components/property/PropertyMapView';
import { PropertyGallery, toGallery } from '@/components/property/PropertyGallery';
import { GeoInsightsPanel } from '@/components/property/GeoInsightsPanel';

function openDirections(latitude: number, longitude: number, label: string) {
  const encodedLabel = encodeURIComponent(label);
  const url = Platform.select({
    ios: `maps://?daddr=${latitude},${longitude}&q=${encodedLabel}`,
    android: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodedLabel})`,
    default: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
  });
  Linking.openURL(url).catch(() =>
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`)
  );
}

export default function PropertyDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const { savedIds, toggle } = useSavedListings();
  const toast = useToast();
  const [viewingSheetOpen, setViewingSheetOpen] = useState(false);

  const query = useQuery({
    queryKey: qk.listings.detail(id),
    queryFn: () => propertiesApi.getById(id),
    enabled: !!id,
  });

  const messageMutation = useMutation({
    mutationFn: () => {
      const landlordId = query.data!.landlordId!;
      return messagesApi.start(landlordId, query.data!.propertyId);
    },
    onSuccess: (conversation) => router.push(`/(app)/conversation/${conversation.id}`),
    onError: (err) =>
      toast.show(
        err instanceof ApiError ? err.message : 'Could not start the conversation.',
        'error'
      ),
  });

  useEffect(() => {
    if (query.data) {
      track('listing_viewed', { id });
      recentlyViewedApi.record(id).catch(() => undefined);
    }
  }, [query.data, id]);

  const saved = savedIds.has(id);
  const p = query.data;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
      >
        <PropertyGallery images={toGallery(p?.image, p?.images)} height={300} />

        <View style={{ padding: spacing.xl, gap: spacing.lg }}>
          {query.isError ? (
            <ErrorState onRetry={() => query.refetch()} />
          ) : !p ? (
            <View style={{ gap: spacing.md }}>
              <Skeleton height={26} width="55%" />
              <Skeleton height={18} width="75%" />
              <Skeleton height={64} />
            </View>
          ) : (
            <>
              <View style={{ gap: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <Price amount={p.price} period={p.period} variant="title" />
                  {p.verified ? <Badge label="Verified" tone="success" /> : null}
                </View>
                <Text variant="heading">{p.title}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <MapPin size={13} color={colors.mutedForeground} />
                  <Text variant="callout" color="mutedForeground">
                    {p.address ? `${p.address}, ${p.location}` : p.location}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: spacing.xl }}>
                <Spec
                  icon={<BedDouble size={16} color={colors.foreground} />}
                  label={`${p.bedrooms} bed`}
                />
                <Spec
                  icon={<Bath size={16} color={colors.foreground} />}
                  label={`${p.bathrooms} bath`}
                />
                {p.size ? (
                  <Spec
                    icon={<Maximize size={16} color={colors.foreground} />}
                    label={`${p.size} m²`}
                  />
                ) : null}
              </View>

              {p.description ? (
                <View style={{ gap: spacing.sm }}>
                  <Text variant="bodyStrong">About this home</Text>
                  <Text variant="body" color="mutedForeground">
                    {p.description}
                  </Text>
                </View>
              ) : null}

              {p.amenities?.length ? (
                <View style={{ gap: spacing.sm }}>
                  <Text variant="bodyStrong">Amenities</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                    {p.amenities.map((a) => (
                      <Chip key={a} label={a} size="sm" />
                    ))}
                  </View>
                </View>
              ) : null}

              {p.landlordName ? (
                <View style={{ gap: spacing.sm }}>
                  <Text variant="bodyStrong">Listed by</Text>
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
                  <Text variant="bodyStrong">Reviews</Text>
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
                <Pressable onPress={() => Linking.openURL(p.videoTourUrl!)}>
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

              {p.latitude != null && p.longitude != null ? (
                <View style={{ gap: spacing.sm }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Text variant="bodyStrong">Location</Text>
                    <Pressable
                      onPress={() =>
                        openDirections(p.latitude as number, p.longitude as number, p.title)
                      }
                      accessibilityRole="button"
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                      hitSlop={8}
                    >
                      <Navigation size={13} color={colors.primary} />
                      <Text variant="callout" style={{ color: colors.primary, fontWeight: '600' }}>
                        Directions
                      </Text>
                    </Pressable>
                  </View>
                  <PropertyMapView
                    markers={[{ id: p.id, latitude: p.latitude, longitude: p.longitude }]}
                    variant="location"
                    zoom={15}
                    height={200}
                  />
                </View>
              ) : null}

              <GeoInsightsPanel listingId={p.id} />
            </>
          )}
        </View>
      </ScrollView>

      {/* floating back */}
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Back"
        style={[styles.back, { top: insets.top + 8 }]}
      >
        <ChevronLeft size={22} color="#fff" />
      </Pressable>

      {/* sticky action bar */}
      {p ? (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            flexDirection: 'row',
            gap: spacing.md,
            paddingHorizontal: spacing.xl,
            paddingTop: spacing.md,
            paddingBottom: insets.bottom + spacing.md,
            backgroundColor: colors.background,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: colors.border,
          }}
        >
          <Pressable
            onPress={() => toggle(id)}
            accessibilityRole="button"
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Heart
              size={20}
              color={saved ? colors.destructive : colors.foreground}
              fill={saved ? colors.destructive : 'transparent'}
            />
          </Pressable>
          {p.landlordId ? (
            <Pressable
              onPress={() => messageMutation.mutate()}
              disabled={messageMutation.isPending}
              accessibilityRole="button"
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: messageMutation.isPending ? 0.6 : 1,
              }}
            >
              <MessageCircle size={20} color={colors.foreground} />
            </Pressable>
          ) : null}
          <Pressable
            onPress={() => setViewingSheetOpen(true)}
            accessibilityRole="button"
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Calendar size={20} color={colors.foreground} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Button
              label="Apply to rent"
              onPress={() => router.push(`/(app)/property/${id}/apply`)}
            />
          </View>
        </View>
      ) : null}

      {p ? (
        <ViewingRequestSheet
          open={viewingSheetOpen}
          onClose={() => setViewingSheetOpen(false)}
          propertyId={p.propertyId}
          propertyTitle={p.title}
        />
      ) : null}
    </View>
  );
}

function Spec({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      {icon}
      <Text variant="callout">{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  back: {
    position: 'absolute',
    left: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(9,32,66,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
