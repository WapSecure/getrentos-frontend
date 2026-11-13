import { formatLocation } from '@sureground/shared';
import { useCallback } from 'react';
import { Pressable, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Heart } from '@sureground/icons/native';
import {
  Card,
  EmptyState,
  ErrorState,
  Price,
  Skeleton,
  Text,
  useTheme,
} from '@sureground/ui-native';
import type { BuyerListing } from '@/lib/api/buyer';
import { useBuyerSaved } from '@/hooks/useBuyerSaved';
import { useCardAnalytics } from '@/hooks/useCardAnalytics';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { goBack } from '@/lib/goBack';

export default function BuyerSaved() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const { toggle, items, isLoading, isError, isRefetching, refetch } = useBuyerSaved();
  const cards = useCardAnalytics('sale', 'sale_saved');

  const renderItem = useCallback(
    ({ item, index }: { item: BuyerListing; index: number }) => (
      <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}>
        <Pressable
          onPress={() => {
            cards.click(item.id, index);
            router.push(`/(app)/buyer-listing/${item.id}`);
          }}
          accessibilityRole="button"
          accessibilityLabel={`${[item.title, item.address, item.city].filter(Boolean).join(', ')}, ${Math.round(item.askingPrice).toLocaleString('en-NG')} naira`}
          accessibilityHint="Opens property details"
        >
          <Card elevated>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: spacing.sm,
              }}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="bodyStrong" numberOfLines={1}>
                  {item.title}
                </Text>
                <Text variant="caption" color="mutedForeground" numberOfLines={1}>
                  {formatLocation(item.address, item.city)}
                </Text>
                <Price amount={item.askingPrice} variant="bodyStrong" style={{ marginTop: 4 }} />
              </View>
              <Pressable
                onPress={(event) => {
                  event.stopPropagation();
                  toggle(item.id);
                }}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${item.title} from saved listings`}
                accessibilityState={{ selected: true }}
                style={{
                  width: 44,
                  height: 44,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Heart size={20} color={colors.destructive} fill={colors.destructive} />
              </Pressable>
            </View>
          </Card>
        </Pressable>
      </View>
    ),
    [cards, colors.destructive, spacing.md, spacing.sm, spacing.xl, toggle]
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.sm,
        }}
      >
        <DetailHeader
          eyebrow="Buyer journey"
          title="Saved listings"
          subtitle={
            !isLoading && !isError
              ? `${items.length} saved home${items.length === 1 ? '' : 's'}`
              : 'Your property shortlist'
          }
          onBack={() => goBack()}
        />
      </View>

      {isError && items.length === 0 ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={100} radius={16} />
          ))}
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Heart size={34} color={colors.mutedForeground} />}
          title="Nothing saved yet"
          description="Tap the heart on a listing to save it here."
        />
      ) : (
        <FlashList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          {...cards.listProps}
          contentContainerStyle={{
            paddingTop: spacing.sm,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => void refetch()}
              tintColor={colors.mutedForeground}
            />
          }
        />
      )}
    </View>
  );
}
