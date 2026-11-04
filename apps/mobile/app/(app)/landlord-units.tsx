import { useState } from 'react';
import { Alert, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BedDouble,
  DoorClosed,
  DoorOpen,
  Plus,
  ReceiptText,
  Search,
  ShowerHead,
  Tag,
  UserPlus,
} from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  IconButton,
  ListSkeleton,
  PressableScale,
  Price,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  landlordApi,
  OCCUPANCY_LABEL,
  OCCUPANCY_TONE,
  type LandlordUnit,
} from '@/lib/api/landlord';
import { ApiError } from '@/lib/api/client';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useMyHomes } from '@/hooks/useMyHomes';
import { Sheet } from '@/components/Sheet';
import { ChipSelect } from '@/components/landlord/ChipSelect';
import { AddUnitSheet } from '@/components/landlord/AddUnitSheet';
import { BulkPriceSheet } from '@/components/landlord/BulkPriceSheet';
import { ChargeRentSheet } from '@/components/landlord/ChargeRentSheet';
import { RecordOccupierSheet } from '@/components/landlord/RecordOccupierSheet';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

const PAGE_SIZE = 20;
const ALL = 'all';

/**
 * Every unit across the portfolio in one list: search by unit or tenant,
 * narrow to a property, and act on a unit without opening its property.
 */
export default function LandlordUnits() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const homes = useMyHomes();
  const [search, setSearch] = useState('');
  const [propertyId, setPropertyId] = useState(ALL);
  const [assigning, setAssigning] = useState<LandlordUnit | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [pickingProperty, setPickingProperty] = useState(false);
  const [charging, setCharging] = useState(false);
  const [bulkPricing, setBulkPricing] = useState(false);
  const term = useDebouncedValue(search.trim(), 300);
  const scope = propertyId === ALL ? '' : propertyId;

  const query = useInfiniteQuery({
    queryKey: qk.landlord.unitsPortfolio(term, scope),
    queryFn: ({ pageParam }) =>
      landlordApi.unitsPage({
        search: term || undefined,
        propertyId: scope || undefined,
        page: pageParam,
        pageSize: PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    placeholderData: keepPreviousData,
  });
  const units = query.data?.pages.flatMap((p) => p.items) ?? [];
  const total = query.data?.pages[0]?.total ?? 0;
  const properties = homes.data ?? [];

  const markVacant = useMutation({
    mutationFn: (unitId: string) => landlordApi.markUnitVacant(unitId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['landlord', 'units'] });
      qc.invalidateQueries({ queryKey: ['landlord', 'properties'] });
      toast.show('Tenant removed and unit marked vacant.', 'success');
    },
    onError: (e) =>
      toast.show(e instanceof ApiError ? e.message : 'Could not update that unit.', 'error'),
  });

  const startAdd = () => {
    if (scope) setAdding(scope);
    else if (properties.length === 1) setAdding(properties[0].id);
    else setPickingProperty(true);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Portfolio"
        title="Units"
        subtitle={
          query.data
            ? `${total} unit${total === 1 ? '' : 's'}${scope ? ' on this property' : ` across ${properties.length} propert${properties.length === 1 ? 'y' : 'ies'}`}`
            : 'Every unit across your properties'
        }
        onBack={() => goBack()}
        accessory={
          properties.length > 0 ? (
            <IconButton
              onPress={startAdd}
              accessibilityLabel="Add a unit"
              icon={<Plus size={20} color={colors.primary} />}
            />
          ) : null
        }
      />

      {query.isError && !query.data ? (
        <ErrorState title="We couldn't load your units" onRetry={() => query.refetch()} />
      ) : (
        <FlashList
          data={units}
          keyExtractor={(u) => u.id}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View style={{ gap: spacing.md, marginBottom: spacing.lg }}>
              <TextField
                placeholder="Search units or tenants"
                value={search}
                onChangeText={setSearch}
                leftIcon={<Search size={16} color={colors.mutedForeground} />}
                accessibilityLabel="Search units"
                autoCorrect={false}
              />
              {properties.length > 1 ? (
                <ChipSelect
                  options={[
                    { value: ALL, label: 'All properties' },
                    ...properties.map((p) => ({ value: p.id, label: p.name })),
                  ]}
                  value={propertyId}
                  onChange={setPropertyId}
                />
              ) : null}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                <Button
                  label="Charge"
                  size="sm"
                  variant="secondary"
                  icon={<ReceiptText size={14} color={colors.foreground} />}
                  disabled={total === 0}
                  onPress={() => setCharging(true)}
                />
                <Button
                  label="Set rent for several"
                  size="sm"
                  variant="secondary"
                  icon={<Tag size={14} color={colors.foreground} />}
                  disabled={units.length < 2}
                  onPress={() => setBulkPricing(true)}
                />
              </View>
            </View>
          }
          renderItem={({ item }: { item: LandlordUnit }) => (
            <UnitRow
              unit={item}
              busy={markVacant.isPending && markVacant.variables === item.id}
              onMarkVacant={() =>
                Alert.alert(
                  `Mark ${item.unitName} vacant?`,
                  item.tenantName
                    ? `${item.tenantName} is removed from the unit.`
                    : 'The occupier is removed from the unit.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Mark vacant',
                      style: 'destructive',
                      onPress: () => markVacant.mutate(item.id),
                    },
                  ]
                )
              }
              onRecord={() => setAssigning(item)}
            />
          )}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            query.isFetchingNextPage ? <ListSkeleton rows={1} variant="card" height={96} /> : null
          }
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching && !query.isFetchingNextPage}
              onRefresh={() => query.refetch()}
              tintColor={colors.mutedForeground}
            />
          }
          ListEmptyComponent={
            query.isLoading ? (
              <ListSkeleton rows={4} variant="card" height={96} />
            ) : (
              <EmptyState
                icon={<DoorClosed size={32} color={colors.mutedForeground} />}
                title={term ? 'No units match' : 'No units found'}
                description={
                  term
                    ? 'Try a unit name or a tenant’s name.'
                    : properties.length
                      ? 'Add a unit to one of your properties.'
                      : 'Add a property first, then its units.'
                }
              />
            )
          }
        />
      )}

      <Sheet open={pickingProperty} onClose={() => setPickingProperty(false)} title="Add a unit to">
        <ChipSelect
          options={properties.map((p) => ({ value: p.id, label: p.name }))}
          value={undefined}
          onChange={(id) => {
            setPickingProperty(false);
            setAdding(id);
          }}
        />
      </Sheet>
      <AddUnitSheet open={!!adding} onClose={() => setAdding(null)} propertyId={adding ?? ''} />
      <RecordOccupierSheet open={!!assigning} onClose={() => setAssigning(null)} unit={assigning} />
      <ChargeRentSheet open={charging} onClose={() => setCharging(false)} />
      <BulkPriceSheet open={bulkPricing} onClose={() => setBulkPricing(false)} units={units} />
    </View>
  );
}

function UnitRow({
  unit: u,
  busy,
  onMarkVacant,
  onRecord,
}: {
  unit: LandlordUnit;
  busy: boolean;
  onMarkVacant: () => void;
  onRecord: () => void;
}) {
  const { colors, spacing } = useTheme();
  const rent = u.leaseRent ?? u.askingRent;
  return (
    <Card padding={spacing.lg} style={{ gap: 6, marginBottom: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Text variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
          {u.unitName}
        </Text>
        <Badge
          label={OCCUPANCY_LABEL[u.occupancyStatus]}
          tone={OCCUPANCY_TONE[u.occupancyStatus]}
        />
      </View>
      <PressableScale
        onPress={() => router.push(`/(app)/landlord-property/${u.propertyId}`)}
        accessibilityRole="link"
        accessibilityLabel={`Open ${u.propertyName}`}
      >
        <Text variant="caption" color="primary" numberOfLines={1}>
          {u.propertyName}
        </Text>
      </PressableScale>
      {u.tenantName ? (
        <Text variant="caption" color="mutedForeground">
          {u.tenantName}
        </Text>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <BedDouble size={13} color={colors.mutedForeground} />
          <Text variant="caption" color="mutedForeground">
            {u.bedrooms}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <ShowerHead size={13} color={colors.mutedForeground} />
          <Text variant="caption" color="mutedForeground">
            {u.bathrooms}
          </Text>
        </View>
        <View style={{ flex: 1 }} />
        {rent ? (
          <Price amount={rent} period={u.leaseRentPeriod ?? u.askingRentPeriod} variant="callout" />
        ) : (
          <Text variant="caption" color="mutedForeground">
            No rent set
          </Text>
        )}
      </View>
      {u.occupancyStatus === 'occupied' ? (
        <Button
          label="Mark vacant"
          size="sm"
          variant="ghost"
          icon={<DoorOpen size={14} color={colors.mutedForeground} />}
          loading={busy}
          onPress={onMarkVacant}
          style={{ alignSelf: 'flex-start' }}
        />
      ) : u.occupancyStatus === 'vacant' ? (
        <Button
          label="Record occupier"
          size="sm"
          variant="ghost"
          icon={<UserPlus size={14} color={colors.primary} />}
          onPress={onRecord}
          style={{ alignSelf: 'flex-start' }}
        />
      ) : null}
    </Card>
  );
}
