import { useState } from 'react';
import { RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LayoutGrid, Search } from 'lucide-react-native';
import {
  Badge,
  Card,
  ListSkeleton,
  PressableScale,
  QueryState,
  Text,
  TextField,
  useTheme,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import { landBuyerApi, type EstateSummary } from '@/lib/api/landBuyer';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { formatNaira } from '@/lib/format';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

const PAGE_SIZE = 12;

/** Estates selling plots on a verified, in-date master parcel. */
export default function LandEstates() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const term = useDebouncedValue(search.trim(), 350);
  const list = useInfiniteQuery({
    queryKey: qk.buyerLand.estates(term),
    queryFn: ({ pageParam }) => landBuyerApi.estates(pageParam, PAGE_SIZE, term || undefined),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    placeholderData: keepPreviousData,
  });
  const estates = list.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Land"
        title="Estates selling plots"
        subtitle="Reserve a plot and pay on a plan"
        onBack={() => goBack()}
      />
      <View style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.lg }}>
        <TextField
          placeholder="Search estates, cities or states"
          value={search}
          onChangeText={setSearch}
          leftIcon={<Search size={16} color={colors.mutedForeground} />}
          accessibilityLabel="Search estates"
          autoCorrect={false}
        />
      </View>
      <QueryState
        query={list}
        skeleton={<ListSkeleton rows={3} variant="card" height={120} />}
        isEmpty={estates.length === 0}
        empty={{
          icon: <LayoutGrid size={32} color={colors.mutedForeground} />,
          title: 'No estates match',
          description:
            'Only estates on a verified, in-date master parcel are listed. Try another area.',
        }}
        style={{ paddingHorizontal: spacing.xl }}
      >
        <FlashList
          data={estates}
          keyExtractor={(e) => e.id}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }: { item: EstateSummary }) => <EstateCard estate={item} />}
          onEndReached={() => {
            if (list.hasNextPage && !list.isFetchingNextPage) list.fetchNextPage();
          }}
          onEndReachedThreshold={0.4}
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          refreshControl={
            <RefreshControl
              refreshing={list.isRefetching && !list.isFetchingNextPage}
              onRefresh={() => list.refetch()}
              tintColor={colors.mutedForeground}
            />
          }
        />
      </QueryState>
    </View>
  );
}

function EstateCard({ estate: e }: { estate: EstateSummary }) {
  const { spacing } = useTheme();
  const price =
    e.priceFrom === undefined
      ? 'None available'
      : e.priceTo === undefined || e.priceTo === e.priceFrom
        ? formatNaira(e.priceFrom)
        : `${formatNaira(e.priceFrom)} – ${formatNaira(e.priceTo)}`;
  return (
    <PressableScale
      onPress={() => router.push(`/(app)/land-estate/${e.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`${e.name}, ${e.availablePlots} plots available`}
      style={{ marginBottom: spacing.sm }}
    >
      <Card padding={spacing.lg} style={{ gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Text variant="bodyStrong" style={{ flex: 1 }} numberOfLines={2}>
            {e.name}
          </Text>
          <Badge label="Verified parcel" tone="success" />
        </View>
        <Text variant="caption" color="mutedForeground">
          {e.city}, {e.state} · {e.availablePlots} of {e.totalPlots} available
        </Text>
        {e.description ? (
          <Text variant="callout" color="mutedForeground" numberOfLines={2}>
            {e.description}
          </Text>
        ) : null}
        <Text variant="callout" style={{ fontWeight: '600' }}>
          {price}
        </Text>
      </Card>
    </PressableScale>
  );
}
