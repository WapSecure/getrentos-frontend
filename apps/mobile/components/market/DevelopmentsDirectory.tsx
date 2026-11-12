import { useMemo } from 'react';
import { Pressable, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { HardHat, MapPin, ShieldCheck } from '@sureground/icons/native';
import {
  Badge,
  Card,
  EmptyState,
  ListingPlaceholder,
  Price,
  QueryState,
  Skeleton,
  Text,
  useTheme,
} from '@sureground/ui-native';
import {
  DEVELOPMENT_STAGE_LABEL,
  completionLabel,
  placeholderOf,
  variantAtLeast,
  type ShowroomDevelopmentSummary,
} from '@sureground/shared/showroom';
import { qk } from '@/lib/query/keys';
import { developmentsApi } from '@/lib/api/developments';
import { DevelopmentPaymentNotice } from '@/components/showroom/DevelopmentAssurance';

const PAGE_SIZE = 12;

export const DEVELOPMENTS_INTRO = {
  title: 'Off-plan developments',
  body: "Each one went live only after a Sureground staff member checked the developer's CAC registration, the directors' identities, the title to the site and the building plan approval.",
} as const;

/** The public off-plan developments, as on the web's /developments: listed only, paid to the developer. */
export function DevelopmentsDirectory({ intro }: { intro: { title: string; body: string } }) {
  const { colors, spacing, radius } = useTheme();
  const query = useInfiniteQuery({
    queryKey: qk.market.developments,
    queryFn: ({ pageParam }) => developmentsApi.list(pageParam, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    placeholderData: keepPreviousData,
  });
  const items = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);

  const header = (
    <View
      style={{
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.sm,
        paddingBottom: spacing.md,
        gap: spacing.md,
      }}
    >
      <Card elevated style={{ gap: spacing.sm, backgroundColor: colors.accent }}>
        <Text variant="label" color="primary" uppercase>
          Off-plan
        </Text>
        <Text variant="title" accessibilityRole="header">
          {intro.title}
        </Text>
        <Text variant="callout" color="mutedForeground">
          {intro.body}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <ShieldCheck size={15} color={colors.success} />
          <Text variant="caption" style={{ fontWeight: '600' }}>
            Four staff checks before going live
          </Text>
        </View>
      </Card>
      <DevelopmentPaymentNotice compact />
    </View>
  );

  if (query.data === undefined) {
    return (
      <View style={{ flex: 1 }}>
        {header}
        <QueryState
          query={query}
          skeleton={
            <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} height={260} radius={radius.lg} />
              ))}
            </View>
          }
        >
          {null}
        </QueryState>
      </View>
    );
  }

  return (
    <QueryState query={query} style={{ paddingHorizontal: spacing.xl }}>
      <FlashList
        maintainVisibleContentPosition={{ disabled: true }}
        data={items}
        keyExtractor={(d) => d.id}
        ListHeaderComponent={header}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
        }}
        ListEmptyComponent={
          <EmptyState
            icon={<HardHat size={34} color={colors.mutedForeground} />}
            title="No developments yet"
            description="Developments appear here once all four checks have passed."
          />
        }
        ListFooterComponent={<View style={{ height: 120 }} />}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching && !query.isFetchingNextPage}
            onRefresh={() => void query.refetch()}
            tintColor={colors.mutedForeground}
          />
        }
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}>
            <DevelopmentCard development={item} />
          </View>
        )}
      />
    </QueryState>
  );
}

function DevelopmentCard({ development: d }: { development: ShowroomDevelopmentSummary }) {
  const { colors, spacing } = useTheme();
  const completion = completionLabel(d.expectedCompletion);
  const meta = [
    `By ${d.developerName}`,
    completion ? `Expected ${completion}` : null,
    d.cover?.source === 'render' ? "Artist's impression" : null,
  ]
    .filter(Boolean)
    .join(' · ');
  const location = `${d.city}, ${d.state}`;
  const cover = d.cover ? variantAtLeast(d.cover.url, d.cover.variants, 640) : undefined;
  const blur = placeholderOf(d.cover?.placeholder);

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/(public)/development/[id]', params: { id: d.id } })}
      accessibilityRole="button"
      accessibilityLabel={[
        d.name,
        DEVELOPMENT_STAGE_LABEL[d.stage],
        location,
        meta,
        d.priceFromNaira !== undefined
          ? `from ${Math.round(d.priceFromNaira).toLocaleString('en-NG')} naira, as the developer states it`
          : null,
      ]
        .filter(Boolean)
        .join(', ')}
    >
      {({ pressed }) => (
        <Card elevated padding="none" style={{ overflow: 'hidden', opacity: pressed ? 0.92 : 1 }}>
          <View style={{ height: 180, backgroundColor: colors.muted }}>
            {cover ? (
              <Image
                source={{ uri: cover }}
                placeholder={blur ? { uri: blur } : undefined}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
                cachePolicy="memory-disk"
                recyclingKey={d.id}
                accessible={false}
              />
            ) : (
              <ListingPlaceholder area={d.city} />
            )}
            <View style={{ position: 'absolute', top: spacing.sm, left: spacing.sm }}>
              <Badge label={DEVELOPMENT_STAGE_LABEL[d.stage]} tone="neutral" />
            </View>
          </View>
          <View style={{ padding: spacing.lg, gap: spacing.xs }}>
            <Text variant="bodyStrong" numberOfLines={2}>
              {d.name}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <MapPin size={13} color={colors.mutedForeground} />
              <Text variant="caption" color="mutedForeground" numberOfLines={1}>
                {location}
              </Text>
            </View>
            <Text variant="caption" color="mutedForeground" numberOfLines={2}>
              {meta}
            </Text>
            {d.priceFromNaira !== undefined ? (
              <View style={{ gap: 2, paddingTop: spacing.xs }}>
                <Price amount={d.priceFromNaira} variant="subheading" />
                <Text variant="caption" color="mutedForeground">
                  From, as the developer states it
                </Text>
              </View>
            ) : null}
          </View>
        </Card>
      )}
    </Pressable>
  );
}
