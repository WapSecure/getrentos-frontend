import { useMemo } from 'react';
import { ActivityIndicator, Linking, Pressable, RefreshControl, View } from 'react-native';

import { useInfiniteQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, FileStack } from 'lucide-react-native';
import { Card, Price, QueryState, Skeleton, Text, useTheme } from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import { CHARGE_CATEGORY_LABEL, paymentsApi, type Receipt } from '@/lib/api/payments';
import { formatDate } from '@/lib/format';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { goBack } from '@/lib/goBack';

/** "Rent · 1 Aug – 31 Aug", or just the charge when no period is known (same as web). */
function receiptLabel(receipt: Receipt): string | null {
  if (!receipt.category && !receipt.periodStart) return null;
  const what = (receipt.category && CHARGE_CATEGORY_LABEL[receipt.category]) || 'Rent';
  if (!receipt.periodStart || !receipt.periodEnd) return what;
  return `${what} · ${formatDate(receipt.periodStart, 'short')} – ${formatDate(receipt.periodEnd, 'short')}`;
}

export default function Receipts() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();

  // Every receipt, a page at a time as the renter scrolls, not just the first 50.
  const query = useInfiniteQuery({
    queryKey: qk.renter.receipts,
    queryFn: ({ pageParam }) => paymentsApi.listReceipts(pageParam, 20),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
  });
  const items = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);

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
        <DetailHeader
          eyebrow="Payment records"
          title="Receipts"
          subtitle="Verified proof of completed payments"
          onBack={() => goBack()}
          style={{ flex: 1 }}
        />
      </View>

      <QueryState
        query={query}
        skeleton={
          <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} height={64} radius={radius.lg} />
            ))}
          </View>
        }
        isEmpty={items.length === 0}
        empty={{
          icon: <FileStack size={34} color={colors.mutedForeground} />,
          title: 'No receipts yet',
          description: 'Receipts for paid rent will appear here.',
        }}
      >
        <FlashList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }: { item: Receipt }) => (
            <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}>
              <Pressable
                onPress={() => Linking.openURL(item.url)}
                accessibilityRole="link"
                accessibilityLabel={`Open receipt for ${item.propertyName}, paid ${formatDate(item.date, 'short')}`}
              >
                <Card elevated>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text variant="bodyStrong" numberOfLines={1}>
                        {item.propertyName}
                      </Text>
                      {receiptLabel(item) ? (
                        <Text variant="caption" numberOfLines={1}>
                          {receiptLabel(item)}
                        </Text>
                      ) : null}
                      <Text variant="caption" color="mutedForeground">
                        Paid {formatDate(item.date, 'short')}
                      </Text>
                      {item.reference ? (
                        <Text variant="caption" color="mutedForeground" numberOfLines={1}>
                          {`Ref ${item.reference}`}
                        </Text>
                      ) : null}
                    </View>
                    <Price amount={item.amount} variant="callout" />
                    <ChevronRight size={16} color={colors.mutedForeground} />
                  </View>
                </Card>
              </Pressable>
            </View>
          )}
          contentContainerStyle={{ paddingTop: spacing.sm, paddingBottom: spacing['3xl'] }}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            query.isFetchingNextPage ? (
              <ActivityIndicator
                color={colors.mutedForeground}
                accessibilityLabel="Loading older receipts"
                style={{ paddingVertical: spacing.md }}
              />
            ) : null
          }
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => query.refetch()}
              tintColor={colors.mutedForeground}
            />
          }
        />
      </QueryState>
    </View>
  );
}
