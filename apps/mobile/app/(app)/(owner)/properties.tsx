import { useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Building2, MapPin, Plus } from 'lucide-react-native';
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  IconButton,
  Price,
  Skeleton,
  Text,
  useTheme,
} from '@getrentos/ui-native';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { qk } from '@/lib/query/keys';
import {
  ownerApi,
  OWNER_LISTING_LABEL,
  OWNER_LISTING_TONE,
  OWNER_VERIFICATION_LABEL,
  OWNER_VERIFICATION_TONE,
  type OwnerListing,
  type OwnerProperty,
} from '@/lib/api/owner';

export default function OwnerProperties() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();

  const properties = useQuery({
    queryKey: qk.owner.properties,
    queryFn: () => ownerApi.properties(),
  });
  const listings = useQuery({ queryKey: qk.owner.listings, queryFn: () => ownerApi.listings() });

  // The newest listing per property — what the card should say about it.
  const listingFor = useMemo(() => {
    const map = new Map<string, OwnerListing>();
    for (const l of listings.data?.items ?? []) {
      const seen = map.get(l.propertyId);
      if (!seen || seen.createdAt < l.createdAt) map.set(l.propertyId, l);
    }
    return map;
  }, [listings.data]);

  const items = properties.data?.items ?? [];
  const refresh = (
    <RefreshControl
      refreshing={properties.isRefetching}
      onRefresh={() => {
        properties.refetch();
        listings.refetch();
      }}
      tintColor={colors.mutedForeground}
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          paddingHorizontal: spacing.xl,
          paddingTop: insets.top + spacing.lg,
          paddingBottom: spacing.sm,
        }}
      >
        <DashboardHeader
          eyebrow="Your portfolio"
          title="Properties"
          subtitle={
            properties.data
              ? `${properties.data.total} ${properties.data.total === 1 ? 'property' : 'properties'}`
              : undefined
          }
          accessory={
            <IconButton
              onPress={() => router.push('/(app)/owner-add-property')}
              accessibilityLabel="Add a property"
              icon={<Plus size={20} color={colors.foreground} />}
            />
          }
        />
      </View>

      {properties.isError && items.length === 0 ? (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} refreshControl={refresh}>
          <ErrorState onRetry={() => properties.refetch()} />
        </ScrollView>
      ) : properties.isPending ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={104} radius={radius.lg} />
          ))}
        </View>
      ) : items.length === 0 ? (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} refreshControl={refresh}>
          <EmptyState
            icon={<Building2 size={34} color={colors.mutedForeground} />}
            title="Add your first property"
            description="Record a property you own, verify ownership, then list it for sale."
            action={
              <Button
                label="Add property"
                onPress={() => router.push('/(app)/owner-add-property')}
              />
            }
          />
        </ScrollView>
      ) : (
        <FlashList
          data={items}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          refreshControl={refresh}
          renderItem={({ item }: { item: OwnerProperty }) => (
            <PropertyRow property={item} listing={listingFor.get(item.id)} />
          )}
        />
      )}
    </View>
  );
}

function PropertyRow({
  property: p,
  listing,
}: {
  property: OwnerProperty;
  listing?: OwnerListing;
}) {
  const { colors, spacing, radius, shadows } = useTheme();
  return (
    <Pressable
      onPress={() => router.push(`/(app)/owner-property/${p.id}`)}
      accessibilityRole="button"
      accessibilityLabel={[
        p.name,
        `${p.city}, ${p.state}`,
        OWNER_VERIFICATION_LABEL[p.verificationStatus],
        listing ? `listing ${OWNER_LISTING_LABEL[listing.status]}` : 'not listed',
      ].join(', ')}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          gap: spacing.md,
          padding: spacing.md,
          borderRadius: radius.lg,
          backgroundColor: colors.card,
          opacity: pressed ? 0.92 : 1,
        },
        shadows.sm,
      ]}
    >
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: radius.md,
          overflow: 'hidden',
          backgroundColor: colors.secondary,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {p.coverImageUrl ? (
          <Image
            source={{ uri: p.coverImageUrl }}
            contentFit="cover"
            recyclingKey={p.id}
            cachePolicy="memory-disk"
            accessible={false}
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          <Building2 size={22} color={colors.mutedForeground} />
        )}
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {p.name}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <MapPin size={11} color={colors.mutedForeground} />
          <Text variant="caption" color="mutedForeground" numberOfLines={1} style={{ flex: 1 }}>
            {p.city}, {p.state}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          <Badge
            label={OWNER_VERIFICATION_LABEL[p.verificationStatus]}
            tone={OWNER_VERIFICATION_TONE[p.verificationStatus]}
          />
          {listing ? (
            <Badge
              label={OWNER_LISTING_LABEL[listing.status]}
              tone={OWNER_LISTING_TONE[listing.status]}
            />
          ) : null}
        </View>
        {listing ? <Price amount={listing.askingPrice} variant="callout" /> : null}
      </View>
    </Pressable>
  );
}
