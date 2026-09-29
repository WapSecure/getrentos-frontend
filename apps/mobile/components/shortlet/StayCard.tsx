import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { Heart, ImageOff, Star, Zap } from 'lucide-react-native';
import { Card, PressableScale, Price, Text, useTheme } from '@getrentos/ui-native';
import type { ShortletListing } from '@/lib/api/shortlets';
import { nightsLabel } from '@/lib/stays';
import { TrustChips } from './StayUI';

/**
 * One stay in search. With dates it leads with the total the guest will pay —
 * nights, cleaning and VAT in — or says plainly why those dates don't work.
 */
export const StayCard = memo(function StayCard({
  item,
  saved,
  onPress,
  onToggleSave,
}: {
  item: ShortletListing;
  saved: boolean;
  onPress: () => void;
  onToggleSave: () => void;
}) {
  const { colors, spacing } = useTheme();
  const q = item.stayQuote;
  const specs = [
    item.bedrooms ? `${item.bedrooms} bed${item.bedrooms === 1 ? '' : 's'}` : null,
    `sleeps ${item.maxGuests}`,
  ]
    .filter(Boolean)
    .join(' · ');
  const priceA11y =
    q?.bookable === true
      ? `₦${q.quote.total.toLocaleString('en-NG')} total for ${nightsLabel(q.quote.nights)}`
      : `₦${item.nightlyRate.toLocaleString('en-NG')} a night`;

  return (
    <PressableScale
      onPress={onPress}
      activeScale={0.985}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${item.city}. ${priceA11y}${item.fairPrice ? '. Fair price' : ''}${item.inspection ? '. Inspected' : ''}`}
    >
      <Card elevated padding={0} style={{ overflow: 'hidden' }}>
        <View>
          {item.coverImageUrl ? (
            <Image
              source={{ uri: item.coverImageUrl }}
              contentFit="cover"
              cachePolicy="memory-disk"
              recyclingKey={item.id}
              transition={200}
              accessible={false}
              style={{ width: '100%', aspectRatio: 16 / 10, backgroundColor: colors.secondary }}
            />
          ) : (
            <View
              style={{
                width: '100%',
                aspectRatio: 16 / 10,
                backgroundColor: colors.secondary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ImageOff size={24} color={colors.mutedForeground} />
            </View>
          )}
          <View style={{ position: 'absolute', top: spacing.md, left: spacing.md, right: 64 }}>
            <TrustChips listing={item} onImage />
          </View>
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onToggleSave();
            }}
            accessibilityRole="button"
            accessibilityLabel={saved ? 'Remove from wishlist' : 'Save to wishlist'}
            hitSlop={8}
            style={{
              position: 'absolute',
              top: spacing.sm,
              right: spacing.sm,
              width: 44,
              height: 44,
              borderRadius: 22,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.32)',
            }}
          >
            <Heart
              size={20}
              color="#ffffff"
              fill={saved ? colors.destructive : 'transparent'}
              strokeWidth={saved ? 0 : 2}
            />
          </Pressable>
        </View>

        <View style={{ padding: spacing.lg, gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
              {item.title}
            </Text>
            {item.reviewCount > 0 && item.ratingAverage ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Star size={13} color={colors.foreground} fill={colors.foreground} />
                <Text variant="callout" style={{ fontWeight: '600' }}>
                  {item.ratingAverage.toFixed(1)}
                </Text>
                <Text variant="callout" color="mutedForeground">
                  ({item.reviewCount})
                </Text>
              </View>
            ) : null}
          </View>
          <Text variant="callout" color="mutedForeground" numberOfLines={1}>
            {item.city}, {item.state} · {specs}
          </Text>

          <View style={{ marginTop: spacing.sm, gap: 2 }}>
            {q?.bookable === true ? (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 5 }}>
                  <Price amount={q.quote.total} variant="subheading" />
                  <Text variant="callout" color="mutedForeground">
                    total
                  </Text>
                </View>
                <Text variant="caption" color="mutedForeground">
                  {nightsLabel(q.quote.nights)} · ₦{q.quote.perNight.toLocaleString('en-NG')}/night
                  avg · incl. cleaning{q.quote.tax ? ` & ${q.quote.taxName ?? 'tax'}` : ''}
                  {q.quote.deposit
                    ? ` · + ₦${q.quote.deposit.toLocaleString('en-NG')} refundable deposit`
                    : ''}
                </Text>
              </>
            ) : (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 5 }}>
                  <Price amount={item.nightlyRate} variant="subheading" />
                  <Text variant="callout" color="mutedForeground">
                    / night
                  </Text>
                  {item.instantBooking && !q ? (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 3,
                        marginLeft: 'auto',
                      }}
                    >
                      <Zap size={13} color={colors.primary} />
                      <Text variant="caption" color="primary" style={{ fontWeight: '700' }}>
                        Instant book
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text
                  variant="caption"
                  style={{
                    color: q?.bookable === false ? colors.warning : colors.mutedForeground,
                  }}
                >
                  {q?.bookable === false ? q.reason : 'Add dates to see the full price'}
                </Text>
              </>
            )}
          </View>
        </View>
      </Card>
    </PressableScale>
  );
});
