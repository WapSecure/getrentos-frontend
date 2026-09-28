import { ScrollView, View } from 'react-native';
import { BadgeCheck, X } from 'lucide-react-native';
import { Button, Card, IconButton, Price, Text, useTheme } from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import type { MarketCard } from '@/lib/api/publicMarket';

export function MarketComparisonSheet({
  open,
  listings,
  onClose,
  onRemove,
  onOpenListing,
}: {
  open: boolean;
  listings: MarketCard[];
  onClose: () => void;
  onRemove: (id: string) => void;
  onOpenListing: (id: string) => void;
}) {
  const { colors, spacing } = useTheme();
  return (
    <Sheet open={open} onClose={onClose} title="Compare listings" snapPoints={['88%']}>
      <Text variant="callout" color="mutedForeground">
        Swipe across to review price, location, space and verification.
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -spacing.xl, marginTop: spacing.lg }}
        contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: spacing.md }}
      >
        {listings.map((listing) => (
          <Card key={listing.id} elevated style={{ width: 260, gap: spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
              <Text variant="bodyStrong" numberOfLines={2} style={{ flex: 1 }}>
                {listing.title}
              </Text>
              <IconButton
                haptic={false}
                onPress={() => onRemove(listing.id)}
                accessibilityLabel={`Remove ${listing.title} from comparison`}
                icon={<X size={16} color={colors.mutedForeground} />}
              />
            </View>
            <Price amount={listing.price} period={listing.period} variant="subheading" />
            <ComparisonRow label="Location" value={listing.location} />
            <ComparisonRow label="Bedrooms" value={listing.bedrooms} />
            <ComparisonRow label="Bathrooms" value={listing.bathrooms} />
            <ComparisonRow label="Size" value={listing.size ? `${listing.size} m²` : undefined} />
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: spacing.sm,
              }}
            >
              <Text variant="caption" color="mutedForeground">
                Verification
              </Text>
              {listing.verified ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <BadgeCheck size={14} color={colors.success} />
                  <Text variant="caption" color="success">
                    Verified
                  </Text>
                </View>
              ) : (
                <Text variant="caption" color="mutedForeground">
                  Not verified
                </Text>
              )}
            </View>
            <Button label="View listing" size="sm" onPress={() => onOpenListing(listing.id)} />
          </Card>
        ))}
      </ScrollView>
      <Text variant="caption" color="mutedForeground" style={{ marginTop: spacing.lg }}>
        Comparison uses information supplied with each listing. Confirm details before paying or
        making an offer.
      </Text>
    </Sheet>
  );
}

function ComparisonRow({ label, value }: { label: string; value?: string | number }) {
  const { spacing } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: spacing.md,
      }}
    >
      <Text variant="caption" color="mutedForeground">
        {label}
      </Text>
      <Text variant="caption" numberOfLines={2} style={{ flex: 1, textAlign: 'right' }}>
        {value ?? 'Not provided'}
      </Text>
    </View>
  );
}
