import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, Scale } from 'lucide-react-native';
import { Badge, Card, Skeleton, Text, useTheme, type BadgeTone } from '@getrentos/ui-native';
import { sellerOffers, type ComparedOffer, type OfferSide } from '@/lib/api/sellerOffers';

const TURN: Record<ComparedOffer['turn'], { label: string; tone: BadgeTone }> = {
  new: { label: 'New: your reply', tone: 'info' },
  yours: { label: 'Your turn', tone: 'warning' },
  buyer: { label: "Buyer's turn", tone: 'neutral' },
};

/**
 * "Compare offers" above the offer list: each listing's live offers side by
 * side, with a counter option worked out from the figures. Never which offer
 * to take. Hidden with no live offers, or if it fails.
 */
export function OfferComparisonCard({ side }: { side: OfferSide }) {
  const { colors, spacing, radius } = useTheme();
  const api = sellerOffers(side);
  const [open, setOpen] = useState<string | null>(null);
  const q = useQuery({
    queryKey: api.keys.compare,
    queryFn: api.compare,
    staleTime: 5 * 60_000,
    retry: false,
  });
  if (q.isLoading) return <Skeleton height={110} radius={radius.lg} />;
  const data = q.data;
  if (!data?.listings.length) return null;

  return (
    <Card elevated padding={spacing.lg}>
      <View style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <Scale size={18} color={colors.primary} />
          <Text variant="bodyStrong" headingLevel={2}>
            Compare offers
          </Text>
        </View>
        {data.listings.map((l) => {
          const isOpen = open === l.listingId;
          return (
            <View
              key={l.listingId}
              style={{
                gap: spacing.xs,
                borderTopWidth: 1,
                borderTopColor: colors.border,
                paddingTop: spacing.sm,
              }}
            >
              <Pressable
                onPress={() => setOpen(isOpen ? null : l.listingId)}
                accessibilityRole="button"
                accessibilityState={{ expanded: isOpen }}
                accessibilityLabel={`${l.property}, ${l.offers.length} live offers`}
                style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="callout" style={{ fontWeight: '600' }} numberOfLines={1}>
                    {l.property}
                  </Text>
                  <Text variant="caption" color="mutedForeground">
                    Asking {l.asking} · {l.offers.length} live offer
                    {l.offers.length === 1 ? '' : 's'}
                  </Text>
                </View>
                <ChevronDown
                  size={16}
                  color={colors.mutedForeground}
                  style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }}
                />
              </Pressable>
              <Text variant="caption" color={l.saleInProgress ? 'warning' : undefined}>
                {l.overview}
              </Text>
              {isOpen
                ? l.offers.map((o) => (
                    <View
                      key={o.offerId}
                      style={{
                        gap: 2,
                        padding: spacing.sm,
                        borderRadius: radius.md,
                        backgroundColor: colors.secondary,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                        <Text variant="label" style={{ flex: 1 }} numberOfLines={1}>
                          {o.label} · {o.buyerName}
                        </Text>
                        {l.saleInProgress ? null : (
                          <Badge label={TURN[o.turn].label} tone={TURN[o.turn].tone} />
                        )}
                      </View>
                      <Text variant="callout">{o.amount}</Text>
                      <Text variant="caption" color="mutedForeground">
                        {o.pricePosition} {o.financing}. Deposit {o.deposit ?? 'none stated'}.{' '}
                        {o.expiry}
                      </Text>
                      <Text variant="caption">{o.standsOut}</Text>
                      {o.counterOption ? (
                        <Text variant="caption" color="mutedForeground">
                          Counter option {o.counterOption.amount}: {o.counterReasoning}
                        </Text>
                      ) : null}
                    </View>
                  ))
                : null}
            </View>
          );
        })}
        <Text variant="caption" color="mutedForeground">
          {data.disclaimer}
        </Text>
      </View>
    </Card>
  );
}
