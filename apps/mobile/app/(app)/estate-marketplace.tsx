import { useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Building2,
  CheckCircle2,
  Clock,
  Home,
  Plus,
  ShieldCheck,
  Store,
} from 'lucide-react-native';
import {
  Button,
  EmptyState,
  ErrorState,
  IconButton,
  SegmentedControl,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { MetricGrid } from '@/components/dashboard/MetricGrid';
import { AddPropertySheet } from '@/components/estate/marketplace/AddPropertySheet';
import { AgreementCard } from '@/components/estate/marketplace/AgreementCard';
import { ListingCard } from '@/components/estate/marketplace/ListingCard';
import { ListingSheet } from '@/components/estate/marketplace/ListingSheet';
import { FreePlanNote, reportError } from '@/components/estate/marketplace/MarketplaceUI';
import { NewListingSheet } from '@/components/estate/marketplace/NewListingSheet';
import { useEstate } from '@/hooks/useEstate';
import { isFreeEstate } from '@/lib/api/estateManager';
import {
  agreementOrder,
  bulkPublishMessage,
  estateMarketplaceApi,
  marketplaceKeys,
  unpublishedIds,
  type EstateListing,
  type MarketingAgreement,
} from '@/lib/api/estateMarketplace';
import { haptics } from '@/lib/haptics';

type Tab = 'listings' | 'properties';

/**
 * The estate advertising the homes inside it. Owners keep their property; the
 * estate gains, with each owner's say-so, the right to market it.
 */
export default function EstateMarketplace() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const { estate, estateId, isPending: estatePending } = useEstate();
  const [tab, setTab] = useState<Tab>('listings');
  const [adding, setAdding] = useState(false);
  const [creating, setCreating] = useState(false);
  const [managingId, setManagingId] = useState<string | null>(null);
  const on = { enabled: !!estateId };

  const inventory = useQuery({
    queryKey: marketplaceKeys.inventory(estateId),
    queryFn: () => estateMarketplaceApi.inventory(estateId),
    ...on,
  });
  const agreements = useQuery({
    queryKey: marketplaceKeys.agreements(estateId),
    queryFn: () => estateMarketplaceApi.agreements(estateId),
    ...on,
  });
  const listingsQuery = useInfiniteQuery({
    queryKey: marketplaceKeys.listings(estateId),
    queryFn: ({ pageParam }) => estateMarketplaceApi.listings(estateId, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    ...on,
  });

  const listings = useMemo<EstateListing[]>(
    () => listingsQuery.data?.pages.flatMap((p) => p.items) ?? [],
    [listingsQuery.data]
  );
  const properties = useMemo(() => agreementOrder(agreements.data ?? []), [agreements.data]);
  const managing = listings.find((l) => l.id === managingId) ?? null;
  const drafts = unpublishedIds(listings);
  // Bulk publishing is Enterprise; a plan we can't read is given the benefit
  // of the doubt and the server has the final say.
  const canBulk = drafts.length > 1 && estate?.planTier !== 'FREE' && estate?.planTier !== 'PRO';

  const refreshAll = () => {
    void inventory.refetch();
    void agreements.refetch();
    void listingsQuery.refetch();
  };

  const detach = useMutation({
    mutationFn: (a: MarketingAgreement) =>
      estateMarketplaceApi.detachProperty(estateId, a.propertyId),
    onSuccess: (_r, a) => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: marketplaceKeys.all(estateId) });
      toast.show(`${a.propertyTitle} is no longer part of the estate.`, 'success');
    },
    onError: (e) => reportError(e, 'Could not remove this property.', toast),
  });

  const bulk = useMutation({
    mutationFn: () => estateMarketplaceApi.bulkPublish(estateId, drafts),
    onSuccess: (r) => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: marketplaceKeys.all(estateId) });
      toast.show(bulkPublishMessage(r), r.skipped.length ? 'warning' : 'success');
    },
    onError: (e) => reportError(e, 'Could not publish your drafts.', toast),
  });

  const confirmDetach = (a: MarketingAgreement) =>
    Alert.alert(
      `Remove ${a.propertyTitle}?`,
      a.estateListingCount
        ? `It leaves the estate, the owner’s permission ends, and the ${a.estateListingCount === 1 ? 'listing' : `${a.estateListingCount} listings`} you published for it close. The owner keeps the property.`
        : 'It leaves the estate and any permission to market it ends. The owner keeps the property.',
      [
        { text: 'Keep it', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => detach.mutate(a) },
      ]
    );

  const confirmBulk = () =>
    Alert.alert(
      `Publish ${drafts.length} drafts?`,
      'Each goes live in the market and on the estate page. Any that aren’t ready are skipped and you’re told why.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Publish all', onPress: () => bulk.mutate() },
      ]
    );

  const inv = inventory.data;
  const failed =
    (inventory.isError && !inv) ||
    (agreements.isError && !agreements.data) ||
    (listingsQuery.isError && !listingsQuery.data);
  const loading =
    estatePending || (!!estateId && (agreements.isPending || listingsQuery.isPending));

  const refresh = (
    <RefreshControl
      refreshing={
        (inventory.isRefetching || agreements.isRefetching || listingsQuery.isRefetching) &&
        !listingsQuery.isFetchingNextPage
      }
      onRefresh={refreshAll}
      tintColor={colors.mutedForeground}
    />
  );

  const header = (
    <View style={{ gap: spacing.md, paddingBottom: spacing.md }}>
      <MetricGrid
        loading={inventory.isPending}
        metrics={[
          {
            label: 'Properties',
            value: inv?.properties ?? 0,
            Icon: Building2,
            onPress: () => setTab('properties'),
          },
          {
            label: 'Awaiting owner',
            value: inv?.agreementsPending ?? 0,
            Icon: Clock,
            onPress: () => setTab('properties'),
          },
          {
            label: 'Cleared to market',
            value: inv?.agreementsActive ?? 0,
            Icon: ShieldCheck,
            onPress: () => setTab('properties'),
          },
          {
            label: 'Live listings',
            value: inv?.listingsPublished ?? 0,
            Icon: Home,
            onPress: () => setTab('listings'),
          },
        ]}
      />
      {isFreeEstate(estate) ? <FreePlanNote /> : null}
      {tab === 'listings' ? (
        canBulk ? (
          <Button
            label={`Publish all ${drafts.length} drafts`}
            variant="secondary"
            loading={bulk.isPending}
            icon={<CheckCircle2 size={16} color={colors.foreground} />}
            onPress={confirmBulk}
          />
        ) : null
      ) : (
        <>
          <Text variant="caption" color="mutedForeground">
            A property’s owner must agree before the estate can advertise it. They answer in their
            own GetRentos app.
          </Text>
          {properties.length ? (
            <Button
              label="Add a property"
              variant="secondary"
              icon={<Plus size={16} color={colors.foreground} />}
              onPress={() => setAdding(true)}
            />
          ) : null}
        </>
      )}
    </View>
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
          eyebrow={estate?.name ?? 'Estate'}
          title="Marketplace"
          subtitle="Advertise the homes in your estate"
          onBack={() => router.back()}
          accessory={
            <IconButton
              accessibilityLabel={tab === 'listings' ? 'New listing' : 'Add a property'}
              disabled={!estateId}
              icon={<Plus size={20} color={colors.primary} />}
              onPress={() => (tab === 'listings' ? setCreating(true) : setAdding(true))}
            />
          }
        />
        <SegmentedControl
          accessibilityLabel="Listings or properties"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'listings', label: 'Listings' },
            { value: 'properties', label: 'Properties' },
          ]}
        />
      </View>

      {!estatePending && !estateId ? (
        <EmptyState
          icon={<Store size={34} color={colors.mutedForeground} />}
          title="No estate yet"
          description="The marketplace appears here once your estate is set up."
        />
      ) : failed ? (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} refreshControl={refresh}>
          <ErrorState onRetry={refreshAll} />
        </ScrollView>
      ) : loading ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          <Skeleton height={208} radius={radius.lg} />
          {[0, 1].map((i) => (
            <Skeleton key={i} height={92} radius={radius.lg} />
          ))}
        </View>
      ) : tab === 'listings' ? (
        <FlashList
          key="listings"
          data={listings}
          keyExtractor={(l) => l.id}
          refreshControl={refresh}
          onEndReached={() => {
            if (listingsQuery.hasNextPage && !listingsQuery.isFetchingNextPage)
              void listingsQuery.fetchNextPage();
          }}
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          ListHeaderComponent={header}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          renderItem={({ item }: { item: EstateListing }) => (
            <ListingCard listing={item} onPress={() => setManagingId(item.id)} />
          )}
          ListEmptyComponent={
            <EmptyState
              icon={<Home size={34} color={colors.mutedForeground} />}
              title="Nothing advertised yet"
              description={
                inv?.agreementsActive
                  ? 'Create a listing for a property you’re cleared to market and it goes live in the market and on the estate page.'
                  : 'Add a property and, once its owner agrees, create a listing for it here.'
              }
              action={
                <Button
                  label={inv?.agreementsActive ? 'New listing' : 'Add a property'}
                  onPress={() => (inv?.agreementsActive ? setCreating(true) : setAdding(true))}
                />
              }
            />
          }
        />
      ) : (
        <FlashList
          key="properties"
          data={properties}
          keyExtractor={(a) => a.id}
          refreshControl={refresh}
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          ListHeaderComponent={header}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          renderItem={({ item }: { item: MarketingAgreement }) => (
            <AgreementCard
              agreement={item}
              removing={detach.isPending && detach.variables?.id === item.id}
              onRemove={() => confirmDetach(item)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon={<Building2 size={34} color={colors.mutedForeground} />}
              title="No properties yet"
              description="Find a home in the estate by its address and ask its owner for permission to advertise it."
              action={<Button label="Add a property" onPress={() => setAdding(true)} />}
            />
          }
        />
      )}

      <AddPropertySheet open={adding} onClose={() => setAdding(false)} estateId={estateId} />
      <NewListingSheet
        open={creating}
        onClose={() => setCreating(false)}
        estateId={estateId}
        agreements={agreements.data ?? []}
        onAddProperty={() => {
          setCreating(false);
          setTab('properties');
        }}
      />
      <ListingSheet estateId={estateId} listing={managing} onClose={() => setManagingId(null)} />
    </View>
  );
}
