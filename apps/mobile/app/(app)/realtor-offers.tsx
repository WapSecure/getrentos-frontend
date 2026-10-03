import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FileSignature } from 'lucide-react-native';
import { EmptyState, ErrorState, SegmentedControl, Skeleton, useTheme } from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { canCounter, realtorApi, type RealtorOffer } from '@/lib/api/realtor';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { OfferCard } from '@/components/realtor/RealtorUI';

type View_ = 'open' | 'closed';

/** Offers buyers made on listings the realtor manages; open ones first. */
export default function RealtorOffers() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const [view, setView] = useState<View_>('open');
  const query = useQuery({ queryKey: qk.realtor.offers, queryFn: () => realtorApi.offers() });

  const items = useMemo(() => {
    const all = query.data?.items ?? [];
    return all.filter((o) => (view === 'open' ? canCounter(o.status) : !canCounter(o.status)));
  }, [query.data, view]);
  const openCount = query.data?.items.filter((o) => canCounter(o.status)).length ?? 0;

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
          paddingBottom: spacing.md,
          gap: spacing.md,
        }}
      >
        <DetailHeader
          eyebrow="Deals"
          title="Offers"
          subtitle="Negotiate for your clients; they accept"
          onBack={() => router.back()}
        />
        <SegmentedControl
          accessibilityLabel="Which offers"
          value={view}
          onChange={setView}
          options={[
            { value: 'open', label: openCount ? `In play ${openCount}` : 'In play' },
            { value: 'closed', label: 'Settled' },
          ]}
        />
      </View>
      {query.isError && !query.data ? (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} refreshControl={refresh}>
          <ErrorState onRetry={() => query.refetch()} />
        </ScrollView>
      ) : query.isPending ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={116} radius={radius.lg} />
          ))}
        </View>
      ) : (
        <FlashList
          data={items}
          keyExtractor={(o) => o.id}
          refreshControl={refresh}
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          renderItem={({ item }: { item: RealtorOffer }) => <OfferCard o={item} />}
          ListEmptyComponent={
            <EmptyState
              icon={<FileSignature size={34} color={colors.mutedForeground} />}
              title={view === 'open' ? 'No offers in play' : 'Nothing settled yet'}
              description={
                view === 'open'
                  ? 'When a buyer makes an offer on one of your listings, it lands here.'
                  : 'Accepted and declined offers are kept here.'
              }
            />
          }
        />
      )}
    </View>
  );
}
