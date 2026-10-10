import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { ChevronRight, Home } from 'lucide-react-native';
import { Card, Price, Text, useTheme } from '@getrentos/ui-native';
import { StatusPill } from '@/components/host/HostUI';
import {
  listingName,
  listingPricePeriod,
  listingStatus,
  listingTypeLabel,
  type EstateListing,
} from '@/lib/api/estateMarketplace';
import { formatNaira } from '@/lib/format';

/** One listing the estate advertises: what, for how much, and whether it's live. */
export function ListingCard({ listing, onPress }: { listing: EstateListing; onPress: () => void }) {
  const { colors, spacing, radius } = useTheme();
  const s = listingStatus(listing.status);
  const name = listingName(listing);
  const photos = listing.media?.length ?? 0;
  const cover = listing.media?.[0]?.url ?? listing.coverImageUrl;
  const closed = listing.status === 'CLOSED';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${listingTypeLabel(listing.listingType)}, ${formatNaira(listing.price)}${listing.listingType === 'SHORTLET' ? ' a night' : ''}, ${s.label}. ${photos} ${photos === 1 ? 'photo' : 'photos'}. Manage listing`}
    >
      {({ pressed }) => (
        <Card
          elevated
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            opacity: pressed ? 0.92 : closed ? 0.7 : 1,
          }}
        >
          {cover ? (
            <Image
              source={{ uri: cover }}
              contentFit="cover"
              accessible={false}
              style={{ width: 64, height: 64, borderRadius: radius.md }}
            />
          ) : (
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: radius.md,
                backgroundColor: colors.secondary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Home size={22} color={colors.mutedForeground} />
            </View>
          )}
          <View style={{ flex: 1, gap: 3 }}>
            <Text variant="bodyStrong" numberOfLines={1}>
              {name}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Price
                amount={listing.price}
                period={listingPricePeriod(listing.listingType)}
                variant="callout"
              />
              <Text variant="caption" color="mutedForeground" numberOfLines={1}>
                · {listingTypeLabel(listing.listingType)}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <StatusPill label={s.label} tone={s.tone} />
              <Text variant="caption" color="mutedForeground" numberOfLines={1} style={{ flex: 1 }}>
                {photos ? `${photos} ${photos === 1 ? 'photo' : 'photos'}` : 'No photos'}
                {listing.viewCount ? ` · ${listing.viewCount.toLocaleString('en-NG')} views` : ''}
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color={colors.mutedForeground} />
        </Card>
      )}
    </Pressable>
  );
}
