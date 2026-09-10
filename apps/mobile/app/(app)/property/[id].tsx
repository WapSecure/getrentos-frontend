import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Heart,
  MapPin,
  BedDouble,
  Bath,
  Maximize,
  ShieldCheck,
} from 'lucide-react-native';
import {
  Badge,
  Button,
  Chip,
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
import { track } from '@/lib/analytics';

export default function PropertyDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { savedIds, toggle } = useSavedListings();

  const query = useQuery({
    queryKey: qk.listings.detail(id),
    queryFn: () => propertiesApi.getById(id),
    enabled: !!id,
  });

  useEffect(() => {
    if (query.data) track('listing_viewed', { id });
  }, [query.data, id]);

  const saved = savedIds.has(id);
  const p = query.data;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
      >
        <View style={{ height: 300, backgroundColor: colors.secondary }}>
          {p?.image ? (
            <Image
              source={{ uri: p.image }}
              contentFit="cover"
              transition={200}
              style={StyleSheet.absoluteFill}
            />
          ) : null}
        </View>

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

              <Text variant="caption" color="mutedForeground">
                Viewing bookings, the map and reviews arrive in the next update.
              </Text>
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
          <View style={{ flex: 1 }}>
            <Button
              label="Apply to rent"
              onPress={() => toast.show('Digital applications arrive in the next update.', 'info')}
            />
          </View>
        </View>
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
