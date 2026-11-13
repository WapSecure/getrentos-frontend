import { formatLocation } from '@sureground/shared';
import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BedDouble,
  Building2,
  CalendarClock,
  ChevronRight,
  FileSignature,
  MapPin,
  Megaphone,
  Plus,
  UserPlus,
} from '@sureground/icons/native';
import {
  Button,
  Card,
  Chip,
  EmptyState,
  FormAlert,
  IconButton,
  Price,
  QueryState,
  Skeleton,
  Text,
  useTheme,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import {
  LISTING_STATUS,
  listingTitle,
  realtorApi,
  type RealtorListing,
  type RealtorListingStatus,
} from '@/lib/api/realtor';
import { haptics } from '@/lib/haptics';
import { Sheet } from '@/components/Sheet';
import { StatusPill } from '@/components/host/HostUI';
import { AddLeadSheet, ScheduleViewingSheet } from '@/components/realtor/RealtorUI';
import { CommercialDetailsSheet } from '@/components/listing/CommercialDetailsSheet';
import { isCommercialPropertyType } from '@sureground/shared/showroom';

type Filter = 'ALL' | RealtorListingStatus;

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'PUBLISHED', label: 'Live' },
  { value: 'DRAFT', label: 'Drafts' },
  { value: 'PENDING_VERIFICATION', label: 'In review' },
  { value: 'PAUSED', label: 'Paused' },
  { value: 'CLOSED', label: 'Closed' },
];

const perYear = (l: RealtorListing) => (l.listingType === 'RENT' ? ' / yr' : '');

export default function RealtorListings() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>('ALL');
  const [selected, setSelected] = useState<RealtorListing | null>(null);
  const [sheet, setSheet] = useState<'actions' | 'lead' | 'viewing' | 'commercial' | null>(null);
  const qc = useQueryClient();
  const query = useQuery({ queryKey: qk.realtor.listings, queryFn: () => realtorApi.listings() });

  const all = useMemo(() => query.data?.items ?? [], [query.data]);
  const count = (f: Filter) =>
    f === 'ALL' ? all.length : all.filter((l) => l.status === f).length;
  const items = filter === 'ALL' ? all : all.filter((l) => l.status === filter);
  const drafts = count('DRAFT');

  const close = () => {
    setSheet(null);
    setSelected(null);
  };

  const refresh = (
    <RefreshControl
      refreshing={query.isRefetching}
      onRefresh={() => void query.refetch()}
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
              Listings
            </Text>
            <Text variant="callout" color="mutedForeground">
              Homes you market for your clients
            </Text>
          </View>
          <IconButton
            accessibilityLabel="New listing"
            icon={<Plus size={20} color={colors.primary} />}
            onPress={() => router.push('/(app)/realtor-new-listing')}
          />
        </View>
        {all.length ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.sm }}
          >
            {FILTERS.filter((f) => f.value === 'ALL' || count(f.value)).map((f) => (
              <Chip
                key={f.value}
                label={`${f.label} ${count(f.value)}`}
                selected={filter === f.value}
                onPress={() => setFilter(f.value)}
              />
            ))}
          </ScrollView>
        ) : null}
        {drafts && (filter === 'ALL' || filter === 'DRAFT') ? (
          <FormAlert
            tone="info"
            message={
              drafts === 1
                ? 'Your draft goes live once your client publishes it from their account.'
                : 'Drafts go live once your clients publish them from their accounts.'
            }
          />
        ) : null}
      </View>

      <QueryState
        query={query}
        skeleton={
          <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} height={132} radius={radius.lg} />
            ))}
          </View>
        }
      >
        <FlashList
          data={items}
          keyExtractor={(l) => l.id}
          refreshControl={refresh}
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          renderItem={({ item }: { item: RealtorListing }) => (
            <ListingCard
              l={item}
              onPress={() => {
                setSelected(item);
                setSheet('actions');
              }}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon={<Megaphone size={34} color={colors.mutedForeground} />}
              title="No listings yet"
              description="Once a client assigns you a property, draft its listing here and they publish it."
              action={
                <Button
                  label="Create a listing"
                  onPress={() => router.push('/(app)/realtor-new-listing')}
                />
              }
            />
          }
        />
      </QueryState>

      <Sheet open={sheet === 'actions'} onClose={close} title="Listing">
        {selected ? (
          <ListingActions
            l={selected}
            onLead={() => setSheet('lead')}
            onViewing={() => setSheet('viewing')}
            onCommercial={() => setSheet('commercial')}
            onOffers={() => {
              close();
              router.push('/(app)/realtor-offers');
            }}
          />
        ) : null}
      </Sheet>
      <AddLeadSheet open={sheet === 'lead'} onClose={close} listingId={selected?.id} />
      <ScheduleViewingSheet open={sheet === 'viewing'} onClose={close} listingId={selected?.id} />
      <CommercialDetailsSheet
        target={
          sheet === 'commercial' && selected
            ? { id: selected.id, title: listingTitle(selected), commercial: selected.commercial }
            : null
        }
        onClose={close}
        save={(id, details) => realtorApi.updateListingCommercial(id, details)}
        onSaved={() => qc.invalidateQueries({ queryKey: qk.realtor.listings })}
        deal={selected?.listingType === 'SALE' ? 'sale' : 'rent'}
      />
    </View>
  );
}

function ListingCard({ l, onPress }: { l: RealtorListing; onPress: () => void }) {
  const { colors, spacing } = useTheme();
  const s = LISTING_STATUS[l.status];
  const where = formatLocation(l.property.city, l.property.state);
  return (
    <Pressable
      onPress={() => {
        void haptics.tap();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={`${listingTitle(l)}, for ${l.listingType === 'SALE' ? 'sale' : 'rent'}, ${Math.round(l.price).toLocaleString('en-NG')} naira${perYear(l) ? ' a year' : ''}, ${where}, ${s.label}`}
    >
      {({ pressed }) => (
        <Card elevated style={{ gap: spacing.sm, opacity: pressed ? 0.92 : 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <StatusPill label={s.label} tone={s.tone} />
            <Text variant="caption" color="mutedForeground">
              For {l.listingType === 'SALE' ? 'sale' : 'rent'}
            </Text>
            <View style={{ flex: 1 }} />
            <ChevronRight size={18} color={colors.mutedForeground} />
          </View>
          <Text variant="bodyStrong" numberOfLines={2}>
            {listingTitle(l)}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <Price amount={l.price} variant="heading" />
            {perYear(l) ? (
              <Text variant="callout" color="mutedForeground">
                {perYear(l)}
              </Text>
            ) : null}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 }}>
              <MapPin size={13} color={colors.mutedForeground} />
              <Text variant="caption" color="mutedForeground" numberOfLines={1}>
                {where || 'Location not set'}
              </Text>
            </View>
            {l.property.bedrooms ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <BedDouble size={13} color={colors.mutedForeground} />
                <Text variant="caption" color="mutedForeground">
                  {l.property.bedrooms} bed
                </Text>
              </View>
            ) : null}
          </View>
          <Text variant="caption" color="mutedForeground" numberOfLines={1}>
            For {l.property.owner.legalName ?? 'your client'}
          </Text>
        </Card>
      )}
    </Pressable>
  );
}

function ListingActions({
  l,
  onLead,
  onViewing,
  onCommercial,
  onOffers,
}: {
  l: RealtorListing;
  onLead: () => void;
  onViewing: () => void;
  onCommercial: () => void;
  onOffers: () => void;
}) {
  const { colors, spacing } = useTheme();
  const s = LISTING_STATUS[l.status];
  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ gap: spacing.xs }}>
        <Text variant="heading">{listingTitle(l)}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
          <Price amount={l.price} variant="title" />
          {perYear(l) ? (
            <Text variant="callout" color="mutedForeground">
              {perYear(l)}
            </Text>
          ) : null}
        </View>
        <View style={{ flexDirection: 'row' }}>
          <StatusPill label={s.label} tone={s.tone} />
        </View>
      </View>
      {l.status === 'DRAFT' ? (
        <FormAlert
          tone="info"
          message={`${l.property.owner.legalName ?? 'Your client'} publishes this from their account. You can still add leads and book viewings for it.`}
        />
      ) : null}
      {l.status !== 'CLOSED' ? (
        <>
          <Button
            label="Add a lead for this listing"
            variant="secondary"
            icon={<UserPlus size={16} color={colors.foreground} />}
            onPress={onLead}
          />
          <Button
            label="Book a viewing"
            variant="secondary"
            icon={<CalendarClock size={16} color={colors.foreground} />}
            onPress={onViewing}
          />
        </>
      ) : null}
      {isCommercialPropertyType(l.property.propertyType) ? (
        <Button
          label={l.commercial ? 'Edit commercial details' : 'Add commercial details'}
          variant="secondary"
          icon={<Building2 size={16} color={colors.foreground} />}
          onPress={onCommercial}
        />
      ) : null}
      <Button
        label="See offers"
        variant="ghost"
        icon={<FileSignature size={16} color={colors.primary} />}
        onPress={onOffers}
      />
    </View>
  );
}
