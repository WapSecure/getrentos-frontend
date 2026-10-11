import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Inbox, Search, ShieldCheck } from 'lucide-react-native';
import {
  EmptyState,
  ErrorState,
  SegmentedControl,
  Skeleton,
  Text,
  TextField,
  useTheme,
} from '@getrentos/ui-native';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { LeadCard } from '@/components/estate/marketplace/LeadCard';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useEstate } from '@/hooks/useEstate';
import {
  estateMarketplaceApi,
  marketplaceKeys,
  type EstateLead,
  type LeadMarket,
} from '@/lib/api/estateMarketplace';

type Market = 'ALL' | LeadMarket;

/**
 * Everyone who has responded to a property the estate markets: viewings,
 * applications, offers and short-let bookings in one inbox. Only properties
 * whose owner gave the estate permission show here; the rest stay private to
 * their owner.
 */
export default function EstateEnquiries() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const { estate, estateId, isPending: estatePending } = useEstate();
  const [market, setMarket] = useState<Market>('ALL');
  const [search, setSearch] = useState('');
  const term = useDebouncedValue(search.trim(), 350);

  const query = useInfiniteQuery({
    queryKey: marketplaceKeys.leads(estateId, market, term),
    queryFn: ({ pageParam }) =>
      estateMarketplaceApi.leads(estateId, {
        market: market === 'ALL' ? undefined : market,
        search: term || undefined,
        page: pageParam,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    enabled: !!estateId,
    // Keep the list on screen while a new search or market loads.
    placeholderData: keepPreviousData,
  });
  const leads = useMemo<EstateLead[]>(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data]
  );
  const total = query.data?.pages[0]?.total ?? 0;
  const filtered = market !== 'ALL' || !!term;

  const refresh = (
    <RefreshControl
      refreshing={query.isRefetching && !query.isFetchingNextPage}
      onRefresh={() => query.refetch()}
      tintColor={colors.mutedForeground}
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.md,
          gap: spacing.md,
        }}
      >
        <DetailHeader
          eyebrow={estate?.name ?? 'Marketplace'}
          title="Enquiries"
          subtitle="People interested in homes you market"
          onBack={() => router.back()}
        />
        <SegmentedControl
          accessibilityLabel="Which market"
          value={market}
          onChange={setMarket}
          options={[
            { value: 'ALL', label: 'All' },
            { value: 'RENT', label: 'Rent' },
            { value: 'SALE', label: 'Sale' },
            { value: 'SHORTLET', label: 'Short let' },
          ]}
        />
        <TextField
          placeholder="Search a name or property"
          accessibilityLabel="Search enquiries"
          leftIcon={<Search size={16} color={colors.mutedForeground} />}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          returnKeyType="search"
        />
      </View>

      {!estatePending && !estateId ? (
        <EmptyState
          icon={<Inbox size={34} color={colors.mutedForeground} />}
          title="No estate yet"
          description="Enquiries appear here once your estate is set up."
        />
      ) : query.isError && !query.data ? (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} refreshControl={refresh}>
          <ErrorState onRetry={() => query.refetch()} />
        </ScrollView>
      ) : estatePending || query.isPending ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={128} radius={radius.lg} />
          ))}
        </View>
      ) : (
        <FlashList
          data={leads}
          keyExtractor={(l) => l.id}
          refreshControl={refresh}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
          }}
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          ListHeaderComponent={
            leads.length ? (
              <Text
                variant="caption"
                color="mutedForeground"
                style={{ paddingBottom: spacing.md }}
                accessibilityLiveRegion="polite"
              >
                {total.toLocaleString('en-NG')} {total === 1 ? 'enquiry' : 'enquiries'}
                {filtered ? ' match' : ''}
              </Text>
            ) : null
          }
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          renderItem={({ item }: { item: EstateLead }) => <LeadCard lead={item} />}
          ListEmptyComponent={
            <EmptyState
              icon={<Inbox size={34} color={colors.mutedForeground} />}
              title={filtered ? 'No matches' : 'No enquiries yet'}
              description={
                filtered
                  ? 'No enquiry matches that. Try another name, or all markets.'
                  : 'When someone books a viewing, applies, makes an offer or books a short let on a home you market, they appear here.'
              }
            />
          }
          ListFooterComponent={
            <View
              style={{
                flexDirection: 'row',
                gap: spacing.sm,
                paddingTop: spacing.xl,
              }}
            >
              <ShieldCheck size={16} color={colors.mutedForeground} style={{ marginTop: 1 }} />
              <Text variant="caption" color="mutedForeground" style={{ flex: 1 }}>
                You only see enquiries on homes whose owner lets the estate market them. The owner
                sees these too, so bring them in when someone is serious.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
