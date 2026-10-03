import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, Search, Users, X } from 'lucide-react-native';
import {
  Button,
  Chip,
  EmptyState,
  ErrorState,
  IconButton,
  Skeleton,
  Text,
  TextField,
  useTheme,
} from '@getrentos/ui-native';
import { HouseholdRow, HouseholdSheet } from '@/components/estate/EstateUI';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useEstate } from '@/hooks/useEstate';
import { estateManagerApi, type Household } from '@/lib/api/estateManager';
import { qk } from '@/lib/query/keys';

type Filter = '' | 'ACTIVE' | 'INACTIVE';

/** Every home in the estate, searchable by unit, name or phone. */
export default function EstateHouseholds() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const { estate, estateId } = useEstate();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('');
  const [adding, setAdding] = useState(false);
  const term = useDebouncedValue(search.trim(), 300);

  const query = useInfiniteQuery({
    queryKey: qk.estateManager.households(estateId, term, filter),
    queryFn: ({ pageParam }) =>
      estateManagerApi.households(estateId, {
        page: pageParam,
        search: term || undefined,
        status: filter || undefined,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    enabled: !!estateId,
  });
  const items = useMemo<Household[]>(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data]
  );
  const total = query.data?.pages[0]?.total ?? 0;
  const filtered = !!term || !!filter;

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
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text variant="title" accessibilityRole="header">
              Households
            </Text>
            <Text variant="callout" color="mutedForeground">
              {query.data
                ? `${total.toLocaleString('en-NG')} ${filtered ? 'found' : total === 1 ? 'home' : 'homes'}${estate ? ` in ${estate.name}` : ''}`
                : (estate?.name ?? ' ')}
            </Text>
          </View>
          <IconButton
            accessibilityLabel="Add a household"
            disabled={!estateId}
            icon={<Plus size={20} color={colors.primary} />}
            onPress={() => setAdding(true)}
          />
        </View>
        <TextField
          placeholder="Search unit, name or phone"
          accessibilityLabel="Search households"
          leftIcon={<Search size={16} color={colors.mutedForeground} />}
          autoCapitalize="none"
          value={search}
          onChangeText={setSearch}
          rightAccessory={
            search ? (
              <Pressable
                onPress={() => setSearch('')}
                accessibilityRole="button"
                accessibilityLabel="Clear search"
                hitSlop={12}
              >
                <X size={18} color={colors.mutedForeground} />
              </Pressable>
            ) : null
          }
        />
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Chip label="All" selected={filter === ''} onPress={() => setFilter('')} />
          <Chip label="Active" selected={filter === 'ACTIVE'} onPress={() => setFilter('ACTIVE')} />
          <Chip
            label="Inactive"
            selected={filter === 'INACTIVE'}
            onPress={() => setFilter('INACTIVE')}
          />
        </View>
      </View>

      {!estateId ? (
        <EmptyState
          icon={<Users size={34} color={colors.mutedForeground} />}
          title="No estate yet"
          description="Households appear here once your estate is set up."
        />
      ) : query.isError && !query.data ? (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} refreshControl={refresh}>
          <ErrorState onRetry={() => query.refetch()} />
        </ScrollView>
      ) : query.isPending ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={74} radius={radius.lg} />
          ))}
        </View>
      ) : (
        <FlashList
          data={items}
          keyExtractor={(h) => h.id}
          keyboardDismissMode="on-drag"
          refreshControl={refresh}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
          }}
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          renderItem={({ item }: { item: Household }) => <HouseholdRow h={item} />}
          ListFooterComponent={
            query.isFetchingNextPage ? (
              <View style={{ paddingTop: spacing.md }}>
                <Skeleton height={74} radius={radius.lg} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon={<Users size={34} color={colors.mutedForeground} />}
              title={filtered ? 'No household matches' : 'No households yet'}
              description={
                filtered
                  ? 'Try the unit label, the resident’s name or their phone number.'
                  : 'Add each home so you can charge dues, issue visitor passes and reach its resident. Many at once? Import a spreadsheet on the website.'
              }
              action={
                filtered ? undefined : (
                  <Button label="Add a household" onPress={() => setAdding(true)} />
                )
              }
            />
          }
        />
      )}
      <HouseholdSheet open={adding} onClose={() => setAdding(false)} estateId={estateId} />
    </View>
  );
}
