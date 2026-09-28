import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BedDouble, Plus } from 'lucide-react-native';
import {
  Button,
  Chip,
  EmptyState,
  ErrorState,
  IconButton,
  Skeleton,
  Text,
  useTheme,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { hostShortletsApi, type HostListing } from '@/lib/api/hostShortlets';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { ListingRow } from '@/components/host/HostUI';

type Filter = 'all' | 'live' | 'paused' | 'other';

const FILTERS: { key: Filter; label: string; test: (l: HostListing) => boolean }[] = [
  { key: 'all', label: 'All', test: () => true },
  { key: 'live', label: 'Live', test: (l) => l.status === 'PUBLISHED' },
  { key: 'paused', label: 'Paused', test: (l) => l.status === 'PAUSED' },
  {
    key: 'other',
    label: 'In review & closed',
    test: (l) => l.status !== 'PUBLISHED' && l.status !== 'PAUSED',
  },
];

export default function HostListings() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>('all');
  const query = useQuery({
    queryKey: qk.host.listings,
    queryFn: () => hostShortletsApi.listings(),
  });
  const all = useMemo(() => query.data?.items ?? [], [query.data]);
  const shown = useMemo(
    () => all.filter(FILTERS.find((f) => f.key === filter)!.test),
    [all, filter]
  );

  const refresh = (
    <RefreshControl
      refreshing={query.isRefetching}
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
          gap: spacing.md,
        }}
      >
        <DetailHeader
          eyebrow="Hosting"
          title="Listings"
          subtitle="Price, calendar and house rules per home"
          onBack={() => router.back()}
          accessory={
            <IconButton
              accessibilityLabel="New listing"
              icon={<Plus size={20} color={colors.primary} />}
              onPress={() => router.push('/(app)/host/listing-editor')}
            />
          }
        />
        {all.length > 1 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm }}
          >
            {FILTERS.map((f) => {
              const n = all.filter(f.test).length;
              return (
                <Chip
                  key={f.key}
                  label={`${f.label} ${n}`}
                  selected={filter === f.key}
                  onPress={() => setFilter(f.key)}
                />
              );
            })}
          </ScrollView>
        ) : null}
      </View>

      {query.isError && !query.data ? (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} refreshControl={refresh}>
          <ErrorState onRetry={() => query.refetch()} />
        </ScrollView>
      ) : query.isPending ? (
        <View style={{ padding: spacing.xl, gap: spacing.md }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={108} radius={radius.lg} />
          ))}
        </View>
      ) : (
        <FlashList
          data={shown}
          keyExtractor={(l) => l.id}
          refreshControl={refresh}
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingTop: spacing.sm,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          renderItem={({ item }: { item: HostListing }) => (
            <ListingRow
              l={item}
              onPress={() =>
                router.push({ pathname: '/(app)/host/listing/[id]', params: { id: item.id } })
              }
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon={<BedDouble size={34} color={colors.mutedForeground} />}
              title={all.length ? 'Nothing here' : 'No listings yet'}
              description={
                all.length
                  ? 'No listings match this filter.'
                  : 'Turn a furnished home into a nightly stay in a few minutes.'
              }
              action={
                all.length ? undefined : (
                  <Button
                    label="Create a listing"
                    onPress={() => router.push('/(app)/host/listing-editor')}
                  />
                )
              }
            />
          }
          ListFooterComponent={
            shown.length ? (
              <Text
                variant="caption"
                color="mutedForeground"
                center
                style={{ marginTop: spacing.lg }}
              >
                Tap a listing to change its price, calendar, photos or rules.
              </Text>
            ) : null
          }
        />
      )}
    </View>
  );
}
