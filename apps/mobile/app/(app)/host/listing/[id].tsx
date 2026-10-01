import { Alert, Pressable, RefreshControl, ScrollView, Switch, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CalendarDays,
  CalendarSync,
  ChevronRight,
  Images,
  Pencil,
  ShieldCheck,
  Tags,
  type LucideIcon,
} from 'lucide-react-native';
import {
  Button,
  Card,
  Divider,
  EmptyState,
  ErrorState,
  Price,
  Skeleton,
  Text,
  formatTimeLabel,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  CANCELLATION_POLICIES,
  hostShortletsApi,
  rulesSummary,
  type HostListing,
} from '@/lib/api/hostShortlets';
import { ApiError } from '@/lib/api/client';
import { haptics } from '@/lib/haptics';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { PropertyGallery } from '@/components/property/PropertyGallery';
import { StatusPill, listingStatus } from '@/components/host/HostUI';

/** Everything about one listing, one tap from each tool. */
export default function HostListingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const listings = useQuery({
    queryKey: qk.host.listings,
    queryFn: () => hostShortletsApi.listings(),
  });
  const l = listings.data?.items.find((x) => x.id === id);
  const stays = useQuery({
    queryKey: qk.host.listingBookings(id),
    queryFn: () => hostShortletsApi.bookingsForListing(id),
    enabled: !!l,
  });

  const setStatus = useMutation({
    mutationFn: (status: 'PUBLISHED' | 'PAUSED' | 'CLOSED') =>
      hostShortletsApi.setStatus(id, status),
    onMutate: async (status) => {
      // The switch moves at once; put it back if the API says no.
      await qc.cancelQueries({ queryKey: qk.host.listings });
      const previous = qc.getQueryData<typeof listings.data>(qk.host.listings);
      qc.setQueryData<typeof listings.data>(qk.host.listings, (old) =>
        old ? { ...old, items: old.items.map((x) => (x.id === id ? { ...x, status } : x)) } : old
      );
      return { previous };
    },
    onSuccess: (_d, status) => {
      void haptics.success();
      toast.show(
        status === 'PUBLISHED'
          ? 'Live: guests can book again.'
          : status === 'PAUSED'
            ? 'Paused: hidden from search, bookings kept.'
            : 'Listing closed.',
        'success'
      );
    },
    onError: (err, _s, ctx) => {
      if (ctx?.previous) qc.setQueryData(qk.host.listings, ctx.previous);
      toast.show(err instanceof ApiError ? err.message : 'Could not change the status.', 'error');
    },
    onSettled: () => qc.invalidateQueries({ queryKey: qk.host.listings }),
  });

  const confirmClose = () =>
    Alert.alert(
      'Close this listing?',
      'It comes off GetRentos for good. Confirmed stays still go ahead. To stop bookings for a while, pause it instead.',
      [
        { text: 'Keep it', style: 'cancel' },
        { text: 'Close listing', style: 'destructive', onPress: () => setStatus.mutate('CLOSED') },
      ]
    );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      refreshControl={
        <RefreshControl
          refreshing={listings.isRefetching}
          onRefresh={() => {
            listings.refetch();
            stays.refetch();
          }}
          tintColor={colors.mutedForeground}
        />
      }
      contentContainerStyle={{ paddingBottom: insets.bottom + spacing['3xl'] }}
    >
      <View style={{ paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.xl }}>
        <DetailHeader
          eyebrow="Listing"
          title={l?.title ?? 'Listing'}
          subtitle={l ? `${l.city}, ${l.state}` : undefined}
          onBack={() => router.back()}
        />
      </View>

      {listings.isError && !listings.data ? (
        <ErrorState onRetry={() => listings.refetch()} />
      ) : listings.isPending ? (
        <View style={{ padding: spacing.xl, gap: spacing.md }}>
          <Skeleton height={220} radius={radius.xl} />
          <Skeleton height={120} radius={radius.lg} />
        </View>
      ) : !l ? (
        <EmptyState title="Listing not found" description="It may have been closed or moved." />
      ) : (
        <View style={{ gap: spacing.lg }}>
          <PropertyGallery images={l.images} height={240} emptyLabel="Add photos to go live" />
          <View style={{ paddingHorizontal: spacing.xl, gap: spacing.lg }}>
            <LiveCard l={l} busy={setStatus.isPending} onChange={(s) => setStatus.mutate(s)} />
            <PriceCard l={l} upcoming={stays.data?.items.length} />

            <Card elevated padding="none">
              <ToolRow
                Icon={CalendarDays}
                label="Calendar"
                hint={
                  stays.data?.items.length
                    ? `${stays.data.items.length} upcoming stay${stays.data.items.length === 1 ? '' : 's'} · block dates`
                    : 'Block dates you can’t host'
                }
                onPress={() =>
                  router.push({ pathname: '/(app)/host/calendar/[id]', params: { id } })
                }
              />
              <Divider />
              <ToolRow
                Icon={Tags}
                label="Pricing rules & seasons"
                hint={rulesSummary(l) ?? 'Discounts, peak seasons, notice and prep days'}
                onPress={() =>
                  router.push({ pathname: '/(app)/host/pricing/[id]', params: { id } })
                }
              />
              <Divider />
              <ToolRow
                Icon={ShieldCheck}
                label="House rules & essentials"
                hint={essentialsHint(l)}
                onPress={() =>
                  router.push({ pathname: '/(app)/host/essentials/[id]', params: { id } })
                }
              />
              <Divider />
              <ToolRow
                Icon={Images}
                label="Photos"
                hint={`${l.imageKeys.length} photo${l.imageKeys.length === 1 ? '' : 's'} · first is the cover`}
                onPress={() => router.push({ pathname: '/(app)/host/photos/[id]', params: { id } })}
              />
              <Divider />
              <ToolRow
                Icon={CalendarSync}
                label="Sync with Airbnb & others"
                hint="Keep calendars in step, no double bookings"
                onPress={() => router.push({ pathname: '/(app)/host/sync/[id]', params: { id } })}
              />
            </Card>

            {l.status !== 'CLOSED' ? (
              <Button
                label="Close listing"
                variant="ghost"
                onPress={confirmClose}
                disabled={setStatus.isPending}
              />
            ) : null}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

function essentialsHint(l: HostListing): string {
  const parts = [
    l.houseRules || l.petsAllowed != null || l.smokingAllowed != null ? 'Rules set' : null,
    l.powerSources?.length ? 'power' : null,
    l.waterSupply ? 'water' : null,
    l.internetType ? 'internet' : null,
    l.checkInInstructions ? 'check-in steps' : null,
  ].filter(Boolean);
  return parts.length ? parts.join(' · ') : 'Rules, power, water, Wi-Fi, how to get in';
}

function LiveCard({
  l,
  busy,
  onChange,
}: {
  l: HostListing;
  busy: boolean;
  onChange: (s: 'PUBLISHED' | 'PAUSED') => void;
}) {
  const { colors, spacing } = useTheme();
  const s = listingStatus(l.status);
  const togglable = l.status === 'PUBLISHED' || l.status === 'PAUSED';
  return (
    <Card elevated style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <View style={{ flex: 1, gap: 4 }}>
          <StatusPill label={s.label} tone={s.tone} />
          <Text variant="caption" color="mutedForeground">
            {l.status === 'PUBLISHED'
              ? 'Guests can find and book it.'
              : l.status === 'PAUSED'
                ? 'Hidden from search. Existing stays go ahead.'
                : l.status === 'PENDING_VERIFICATION'
                  ? 'We’re checking the property. It goes live when approved.'
                  : 'Closed. Create a new listing to host here again.'}
          </Text>
        </View>
        {togglable ? (
          <Switch
            value={l.status === 'PUBLISHED'}
            disabled={busy}
            onValueChange={(v) => onChange(v ? 'PUBLISHED' : 'PAUSED')}
            accessibilityLabel="Listing live"
            trackColor={{ true: colors.success, false: colors.border }}
          />
        ) : null}
      </View>
    </Card>
  );
}

function PriceCard({ l, upcoming }: { l: HostListing; upcoming?: number }) {
  const { colors, spacing } = useTheme();
  const policy = CANCELLATION_POLICIES.find((p) => p.value === l.cancellationPolicy);
  const facts: [string, string][] = [
    ['Minimum stay', `${l.minNights} night${l.minNights === 1 ? '' : 's'}`],
    ['Guests', `Up to ${l.maxGuests}`],
    [
      'Check-in / out',
      `${l.checkInTime ? formatTimeLabel(l.checkInTime) : '—'} / ${l.checkOutTime ? formatTimeLabel(l.checkOutTime) : '—'}`,
    ],
    ['Booking', l.instantBooking ? 'Instant' : 'You approve each request'],
    ['Cancellation', policy?.label ?? l.cancellationPolicy],
  ];
  return (
    <Card elevated style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
            {l.nightlyRate != null ? <Price amount={l.nightlyRate} variant="title" /> : null}
            <Text variant="callout" color="mutedForeground">
              {l.pricingMode === 'PER_NIGHT' ? 'per night' : 'per stay'}
            </Text>
          </View>
          <Text variant="caption" color="mutedForeground">
            {[
              l.cleaningFee ? `₦${l.cleaningFee.toLocaleString('en-NG')} cleaning` : null,
              l.deposit ? `₦${l.deposit.toLocaleString('en-NG')} refundable deposit` : null,
              l.weekendUpliftPct ? `+${l.weekendUpliftPct}% weekends` : null,
            ]
              .filter(Boolean)
              .join(' · ') || 'No extra fees'}
          </Text>
        </View>
        <Pressable
          onPress={() =>
            router.push({ pathname: '/(app)/host/listing-editor', params: { id: l.id } })
          }
          accessibilityRole="button"
          accessibilityLabel="Edit price and details"
          hitSlop={8}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44 }}
        >
          <Pencil size={15} color={colors.primary} />
          <Text variant="callout" color="primary" style={{ fontWeight: '700' }}>
            Edit
          </Text>
        </Pressable>
      </View>
      <Divider />
      {facts.map(([k, v]) => (
        <View
          key={k}
          style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md }}
        >
          <Text variant="callout" color="mutedForeground">
            {k}
          </Text>
          <Text variant="callout" style={{ fontWeight: '600', flexShrink: 1, textAlign: 'right' }}>
            {v}
          </Text>
        </View>
      ))}
      {upcoming != null ? (
        <Text variant="caption" color="mutedForeground">
          {upcoming
            ? `Changes apply to new bookings; your ${upcoming} upcoming stay${upcoming === 1 ? ' keeps its' : 's keep their'} price.`
            : 'Changes apply to new bookings.'}
        </Text>
      ) : null}
    </Card>
  );
}

function ToolRow({
  Icon,
  label,
  hint,
  onPress,
}: {
  Icon: LucideIcon;
  label: string;
  hint: string;
  onPress: () => void;
}) {
  const { colors, spacing } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}. ${hint}`}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.lg,
        backgroundColor: pressed ? colors.secondary : 'transparent',
      })}
    >
      <Icon size={20} color={colors.primary} />
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong">{label}</Text>
        <Text variant="caption" color="mutedForeground" numberOfLines={2}>
          {hint}
        </Text>
      </View>
      <ChevronRight size={18} color={colors.mutedForeground} />
    </Pressable>
  );
}
