import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useInfiniteQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import {
  BedDouble,
  Building2,
  ChevronLeft,
  Home,
  KeyRound,
  LandPlot,
  Search,
  ShieldCheck,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import {
  BrandLogo,
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  IconButton,
  PropertyCard,
  Skeleton,
  Text,
  TextField,
  useTheme,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  isMarketKind,
  MARKET_LABEL,
  MARKET_SORT_LABEL,
  publicMarketApi,
  type EstateDirectoryEntry,
  type MarketCard,
  type MarketKind,
  type MarketSort,
} from '@/lib/api/publicMarket';
import { track } from '@/lib/analytics';

type Tab = MarketKind | 'estates';

const TABS: { value: Tab; label: string; Icon: LucideIcon }[] = [
  { value: 'rent', label: MARKET_LABEL.rent, Icon: KeyRound },
  { value: 'sale', label: MARKET_LABEL.sale, Icon: Home },
  { value: 'shortlet', label: MARKET_LABEL.shortlet, Icon: BedDouble },
  { value: 'land', label: MARKET_LABEL.land, Icon: LandPlot },
  { value: 'estates', label: 'Estates', Icon: Building2 },
];

const INTRO: Record<Tab, { title: string; body: string; search: string }> = {
  rent: {
    title: 'Homes to rent',
    body: 'Verified properties and landlords are marked. Sign in to enquire and apply.',
    search: 'Search area, city or title',
  },
  sale: {
    title: 'Homes for sale',
    body: 'Make an offer and pay through escrow once you sign in.',
    search: 'Search by city',
  },
  shortlet: {
    title: 'Shortlets',
    body: 'Furnished short stays from verified hosts, paid through escrow.',
    search: 'Search area or city',
  },
  land: {
    title: 'Land',
    body: 'Verified, in-date parcels with title and due-diligence details.',
    search: 'Search by city',
  },
  estates: {
    title: 'Estates',
    body: 'Browse what is available inside an estate, and who is marketing it.',
    search: 'Search estate name or area',
  },
};

const SORTS: MarketSort[] = ['newest', 'price_asc', 'price_desc'];
const PAGE_SIZE = 20;

export default function Marketplace() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ kind?: string }>();
  const [tab, setTab] = useState<Tab>(() =>
    params.kind === 'estates' || isMarketKind(params.kind) ? (params.kind as Tab) : 'rent'
  );
  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<MarketSort>('newest');
  const [estate, setEstate] = useState<{ slug: string; name: string } | null>(null);

  // Debounce typing into the query.
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchText.trim()), 350);
    return () => clearTimeout(t);
  }, [searchText]);

  const selectTab = (next: Tab) => {
    if (next === tab) return;
    setTab(next);
    // Land is the one market the API can't scope to an estate.
    if (next === 'land' || next === 'estates') setEstate(null);
    track('market_tab_changed', { tab: next });
  };

  const intro = INTRO[tab];
  const canGoBack = router.canGoBack();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Fixed chrome: brand, search and the market switcher stay in reach. */}
      <View
        style={{
          paddingTop: insets.top + spacing.sm,
          paddingHorizontal: spacing.xl,
          gap: spacing.md,
          paddingBottom: spacing.sm,
          backgroundColor: colors.background,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: 44,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            {canGoBack ? (
              <IconButton
                onPress={() => router.back()}
                haptic={false}
                accessibilityLabel="Go back"
                icon={<ChevronLeft size={22} color={colors.foreground} />}
              />
            ) : null}
            <View accessible accessibilityRole="image" accessibilityLabel="GetRentos">
              <BrandLogo size={22} />
            </View>
          </View>
          <Button
            label="Sign in"
            size="sm"
            variant="outline"
            fullWidth={false}
            onPress={() => router.push('/(auth)/sign-in')}
          />
        </View>

        <TextField
          placeholder={intro.search}
          accessibilityLabel={intro.search}
          leftIcon={<Search size={18} color={colors.mutedForeground} />}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          value={searchText}
          onChangeText={setSearchText}
          rightAccessory={
            searchText ? (
              <Pressable
                onPress={() => setSearchText('')}
                accessibilityRole="button"
                accessibilityLabel="Clear search"
                hitSlop={12}
              >
                <X size={18} color={colors.mutedForeground} />
              </Pressable>
            ) : null
          }
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          accessibilityRole="tablist"
          style={{ marginHorizontal: -spacing.xl }}
          contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: spacing.sm }}
        >
          {TABS.map(({ value, label, Icon }) => {
            const selected = tab === value;
            return (
              <Pressable
                key={value}
                onPress={() => selectTab(value)}
                accessibilityRole="tab"
                accessibilityLabel={label}
                accessibilityState={{ selected }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  minHeight: 40,
                  paddingHorizontal: 14,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: selected ? colors.primary : colors.border,
                  backgroundColor: selected ? colors.primary : colors.card,
                }}
              >
                <Icon size={15} color={selected ? colors.primaryForeground : colors.foreground} />
                <Text
                  variant="callout"
                  style={{
                    fontWeight: '700',
                    color: selected ? colors.primaryForeground : colors.foreground,
                  }}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {tab === 'estates' ? (
        <EstatesDirectory
          search={search}
          intro={intro}
          onOpen={(entry, kind) => {
            if (!entry.slug) return;
            setEstate({ slug: entry.slug, name: entry.name });
            setSearchText('');
            setTab(kind);
            track('market_estate_opened', { kind });
          }}
        />
      ) : (
        <Listings
          key={tab}
          kind={tab}
          search={search}
          sort={sort}
          onSort={setSort}
          estate={estate}
          onClearEstate={() => setEstate(null)}
          intro={intro}
        />
      )}

      <JoinBar />
    </View>
  );
}

/* ------------------------------- listings ------------------------------- */

function Listings({
  kind,
  search,
  sort,
  onSort,
  estate,
  onClearEstate,
  intro,
}: {
  kind: MarketKind;
  search: string;
  sort: MarketSort;
  onSort: (s: MarketSort) => void;
  estate: { slug: string; name: string } | null;
  onClearEstate: () => void;
  intro: { title: string; body: string };
}) {
  const { colors, spacing } = useTheme();
  const filters = useMemo(
    () => ({ search: search || undefined, sort, estate: estate?.slug }),
    [search, sort, estate]
  );

  const query = useInfiniteQuery({
    queryKey: qk.market.list(kind, filters),
    queryFn: ({ pageParam }) => publicMarketApi.list(kind, filters, pageParam, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
  });

  const items = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);
  const total = query.data?.pages[0]?.total ?? 0;

  const onEndReached = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
  }, [query]);

  const open = useCallback(
    (id: string) =>
      router.push({ pathname: '/(market)/listing/[kind]/[id]', params: { kind, id } }),
    [kind]
  );

  const renderItem = useCallback(
    ({ item }: { item: MarketCard }) => (
      <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}>
        <PropertyCard property={{ ...item, tag: item.highlight }} onPress={open} />
      </View>
    ),
    [open, spacing.xl, spacing.md]
  );

  const header = (
    <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.sm, gap: spacing.md }}>
      <View style={{ gap: spacing.xxs }}>
        <Text variant="title" accessibilityRole="header">
          {intro.title}
        </Text>
        <Text variant="callout" color="mutedForeground">
          {intro.body}
        </Text>
      </View>

      {estate ? (
        <Card
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            backgroundColor: colors.accent,
          }}
        >
          <Building2 size={18} color={colors.primary} />
          <Text variant="callout" style={{ flex: 1 }}>
            Only listings inside{' '}
            <Text variant="callout" style={{ fontWeight: '700' }}>
              {estate.name}
            </Text>
          </Text>
          <Chip label="Show all" size="sm" onPress={onClearEstate} />
        </Card>
      ) : null}

      {/* Shortlets have no server-side price sort; they sort within a page. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -spacing.xl }}
        contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: spacing.sm }}
      >
        {SORTS.map((s) => (
          <Chip
            key={s}
            size="sm"
            label={MARKET_SORT_LABEL[s]}
            selected={sort === s}
            onPress={() => onSort(s)}
          />
        ))}
      </ScrollView>

      {query.data ? (
        <Text variant="caption" color="mutedForeground" accessibilityLiveRegion="polite">
          {total.toLocaleString()} {total === 1 ? 'listing' : 'listings'}
        </Text>
      ) : null}
    </View>
  );

  if (query.isError && items.length === 0) {
    return (
      <View style={{ flex: 1 }}>
        {header}
        <ErrorState
          title="We couldn’t load these listings"
          description="Check your connection and try again."
          onRetry={() => query.refetch()}
        />
      </View>
    );
  }

  if (query.isPending) {
    return (
      <View style={{ flex: 1 }}>
        {header}
        <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md, gap: spacing.lg }}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={{ gap: spacing.sm }}>
              <Skeleton height={176} radius={16} />
              <Skeleton height={16} width="45%" />
              <Skeleton height={13} width="70%" />
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <FlashList
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.6}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={<View style={{ paddingBottom: spacing.md }}>{header}</View>}
      ListEmptyComponent={
        <EmptyState
          icon={<Search size={34} color={colors.mutedForeground} />}
          title={estate ? 'Nothing listed here yet' : 'No listings match that'}
          description={
            estate
              ? `${estate.name} has nothing in this market right now.`
              : 'Try a different area, or clear the search.'
          }
          action={
            estate ? (
              <Button label="Show all listings" variant="outline" onPress={onClearEstate} />
            ) : undefined
          }
        />
      }
      ListFooterComponent={
        query.isFetchingNextPage ? (
          <View style={{ paddingVertical: spacing.xl }}>
            <ActivityIndicator color={colors.mutedForeground} accessibilityLabel="Loading more" />
          </View>
        ) : (
          <View style={{ height: 120 }} />
        )
      }
      refreshControl={
        <RefreshControl
          refreshing={query.isRefetching && !query.isFetchingNextPage}
          onRefresh={() => query.refetch()}
          tintColor={colors.mutedForeground}
        />
      }
    />
  );
}

/* ------------------------------- estates ------------------------------- */

function EstatesDirectory({
  search,
  intro,
  onOpen,
}: {
  search: string;
  intro: { title: string; body: string };
  onOpen: (entry: EstateDirectoryEntry, kind: 'rent' | 'sale') => void;
}) {
  const { colors, spacing, radius } = useTheme();
  const query = useInfiniteQuery({
    queryKey: qk.market.estates(search || undefined),
    queryFn: ({ pageParam }) => publicMarketApi.estates(search || undefined, pageParam, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
  });
  const items = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);

  const header = (
    <View
      style={{
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.sm,
        paddingBottom: spacing.md,
        gap: spacing.xxs,
      }}
    >
      <Text variant="title" accessibilityRole="header">
        {intro.title}
      </Text>
      <Text variant="callout" color="mutedForeground">
        {intro.body}
      </Text>
    </View>
  );

  if (query.isError && items.length === 0) {
    return (
      <View style={{ flex: 1 }}>
        {header}
        <ErrorState onRetry={() => query.refetch()} />
      </View>
    );
  }

  return (
    <FlashList
      data={items}
      keyExtractor={(e) => e.estateId}
      keyboardDismissMode="on-drag"
      ListHeaderComponent={header}
      onEndReached={() => {
        if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
      }}
      ListEmptyComponent={
        query.isPending ? (
          <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} height={112} radius={radius.lg} />
            ))}
          </View>
        ) : (
          <EmptyState
            icon={<Building2 size={34} color={colors.mutedForeground} />}
            title="No estates found"
            description="Try another name or area."
          />
        )
      }
      ListFooterComponent={<View style={{ height: 120 }} />}
      renderItem={({ item }) => (
        <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}>
          <Card elevated style={{ gap: spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: radius.md,
                  backgroundColor: colors.accent,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Building2 size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong" numberOfLines={1}>
                  {item.name}
                </Text>
                <Text variant="caption" color="mutedForeground" numberOfLines={1}>
                  {[item.city, item.state].filter(Boolean).join(', ')}
                </Text>
              </View>
            </View>
            {item.slug ? (
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <Chip
                  label={`For rent · ${item.rentCount}`}
                  disabled={item.rentCount === 0}
                  onPress={() => onOpen(item, 'rent')}
                />
                <Chip
                  label={`For sale · ${item.saleCount}`}
                  disabled={item.saleCount === 0}
                  onPress={() => onOpen(item, 'sale')}
                />
              </View>
            ) : (
              <Text variant="caption" color="mutedForeground">
                {item.listingCount} {item.listingCount === 1 ? 'listing' : 'listings'} · no public
                page yet
              </Text>
            )}
          </Card>
        </View>
      )}
    />
  );
}

/* ------------------------------- join bar ------------------------------- */

/** The one thing browsing can't do — said plainly, not as a paywall. */
function JoinBar() {
  const { colors, spacing, radius, shadows } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: spacing.lg,
        right: spacing.lg,
        bottom: insets.bottom + spacing.sm,
      }}
    >
      <View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            padding: spacing.md,
            paddingLeft: spacing.lg,
            borderRadius: radius.xl,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
          },
          shadows.md,
        ]}
      >
        <ShieldCheck size={20} color={colors.primary} />
        <Text variant="caption" color="mutedForeground" style={{ flex: 1 }}>
          Create a free account to save homes, enquire, and pay safely through escrow.
        </Text>
        <Button
          label="Join free"
          size="sm"
          fullWidth={false}
          onPress={() => router.push('/(auth)/sign-up')}
        />
      </View>
    </View>
  );
}
