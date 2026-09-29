import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarCheck,
  ChevronRight,
  Gavel,
  Heart,
  MessageSquare,
  Star,
} from 'lucide-react-native';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  IconButton,
  PressableScale,
  Price,
  SegmentedControl,
  Skeleton,
  Text,
  useTheme,
} from '@getrentos/ui-native';
import { StatusPill, Thumb } from '@/components/host/HostUI';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { useMyStays } from '@/components/shortlet/useMyStays';
import { shortletsApi, type ShortletBooking } from '@/lib/api/shortlets';
import { qk } from '@/lib/query/keys';
import { formatDate } from '@/lib/format';
import { isoDay } from '@/lib/hostDates';
import {
  guestTotal,
  guestsLabel,
  nightsLabel,
  seasonRange,
  stayHeadline,
  stayTab,
  type StayTab,
} from '@/lib/stays';

const TABS: { value: StayTab; label: string }[] = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
  { value: 'cancelled', label: 'Cancelled' },
];

const EMPTY: Record<StayTab, { title: string; description: string }> = {
  upcoming: { title: 'No trips booked yet', description: 'When you book a stay, it lives here.' },
  past: { title: 'No past stays', description: 'Stays you’ve completed will show up here.' },
  cancelled: { title: 'Nothing cancelled', description: 'Cancelled and declined stays show here.' },
};

/** Every stay the guest has, split the way trips are remembered. */
export default function MyStays() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<StayTab>('upcoming');
  const stays = useMyStays();
  const today = isoDay(new Date());

  const groups = useMemo(() => {
    const g: Record<StayTab, ShortletBooking[]> = { upcoming: [], past: [], cancelled: [] };
    for (const b of stays.data ?? []) g[stayTab(b, today)].push(b);
    g.upcoming.sort((a, b) => a.checkIn.localeCompare(b.checkIn));
    return g;
  }, [stays.data, today]);
  const items = groups[tab];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing['3xl'],
          gap: spacing.lg,
        }}
        refreshControl={
          <RefreshControl
            refreshing={stays.isRefetching}
            onRefresh={() => stays.refetch()}
            tintColor={colors.mutedForeground}
          />
        }
      >
        <DetailHeader
          eyebrow="Short stays"
          title="My stays"
          onBack={() => router.back()}
          accessory={
            <View style={{ flexDirection: 'row' }}>
              <IconButton
                accessibilityLabel="Messages with hosts"
                onPress={() => router.push('/(app)/shortlet-messages')}
                icon={<MessageSquare size={19} color={colors.foreground} />}
                style={{ borderWidth: 0, backgroundColor: 'transparent' }}
              />
              <IconButton
                accessibilityLabel="Disputes and deposit claims"
                onPress={() => router.push('/(app)/shortlet-disputes')}
                icon={<Gavel size={19} color={colors.foreground} />}
                style={{ borderWidth: 0, backgroundColor: 'transparent' }}
              />
              <IconButton
                accessibilityLabel="Wishlist"
                onPress={() => router.push('/(app)/shortlet-wishlist')}
                icon={<Heart size={19} color={colors.foreground} />}
                style={{ borderWidth: 0, backgroundColor: 'transparent' }}
              />
            </View>
          }
        />

        <SegmentedControl
          accessibilityLabel="Which stays"
          options={TABS}
          value={tab}
          onChange={setTab}
        />

        {stays.isError && !stays.data ? (
          <ErrorState onRetry={() => stays.refetch()} />
        ) : stays.isPending ? (
          [0, 1].map((i) => <Skeleton key={i} height={150} radius={radius.lg} />)
        ) : items.length === 0 ? (
          <EmptyState
            icon={<CalendarCheck size={34} color={colors.mutedForeground} />}
            title={EMPTY[tab].title}
            description={EMPTY[tab].description}
            action={
              tab === 'upcoming' ? (
                <Button
                  label="Find a stay"
                  fullWidth={false}
                  onPress={() => router.push('/(app)/shortlets')}
                />
              ) : undefined
            }
          />
        ) : (
          items.map((b) => <StayRow key={b.id} b={b} today={today} />)
        )}

        {tab === 'past' ? <HostsOnYou /> : null}
      </ScrollView>
    </View>
  );
}

/** What hosts have said about this guest — the record hosts see when you book. */
function HostsOnYou() {
  const { colors, spacing } = useTheme();
  const reviews = useQuery({
    queryKey: qk.shortlets.reviewsOfMe,
    queryFn: () => shortletsApi.reviewsOfMe(),
  });
  const items = reviews.data?.items ?? [];
  if (!items.length) return null;
  const avg = items.reduce((t, r) => t + r.rating, 0) / items.length;
  return (
    <View style={{ gap: spacing.md, marginTop: spacing.lg }}>
      <View style={{ gap: 2 }}>
        <Text variant="heading" accessibilityRole="header">
          What hosts say about you
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <Star size={14} color={colors.foreground} fill={colors.foreground} />
          <Text variant="callout" color="mutedForeground">
            {avg.toFixed(1)} from {items.length} {items.length === 1 ? 'host' : 'hosts'} · hosts see
            this when you book
          </Text>
        </View>
      </View>
      {items.slice(0, 10).map((r) => (
        <Card key={r.id} elevated style={{ gap: spacing.xs }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Text variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
              {r.hostName}
            </Text>
            <View style={{ flexDirection: 'row', gap: 1 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  size={12}
                  color={colors.foreground}
                  fill={n <= r.rating ? colors.foreground : 'transparent'}
                />
              ))}
            </View>
          </View>
          <Text variant="caption" color="mutedForeground">
            {r.listingTitle ? `${r.listingTitle} · ` : ''}
            {formatDate(r.createdAt, 'short')}
          </Text>
          {r.comment ? (
            <Text variant="callout" color="mutedForeground">
              {r.comment}
            </Text>
          ) : null}
        </Card>
      ))}
    </View>
  );
}

function StayRow({ b, today }: { b: ShortletBooking; today: string }) {
  const { colors, spacing } = useTheme();
  const h = stayHeadline(b, today);
  return (
    <PressableScale
      onPress={() => router.push({ pathname: '/(app)/shortlet-stay/[id]', params: { id: b.id } })}
      activeScale={0.985}
      accessibilityRole="button"
      accessibilityLabel={`${b.propertyTitle}, ${seasonRange(b.checkIn, b.checkOut)}, ${h.pill}. ${h.title}`}
    >
      <Card elevated style={{ gap: spacing.md }}>
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <Thumb uri={b.coverImageUrl} size={72} />
          <View style={{ flex: 1, gap: 3 }}>
            <Text variant="bodyStrong" numberOfLines={1}>
              {b.propertyTitle}
            </Text>
            <Text variant="callout" color="mutedForeground" numberOfLines={1}>
              {b.city} · {seasonRange(b.checkIn, b.checkOut)}
            </Text>
            <Text variant="caption" color="mutedForeground">
              {nightsLabel(b.nights)} · {guestsLabel(b.guestCount)}
            </Text>
          </View>
          <ChevronRight size={18} color={colors.mutedForeground} style={{ alignSelf: 'center' }} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <StatusPill label={h.pill} tone={h.tone} />
          <View style={{ flex: 1 }} />
          <Price amount={guestTotal(b)} variant="bodyStrong" />
        </View>
        {h.title ? (
          <Text
            variant="callout"
            style={{
              color:
                h.action === 'pay' || h.action === 'report'
                  ? colors.warning
                  : colors.mutedForeground,
            }}
          >
            {h.title}
          </Text>
        ) : null}
      </Card>
    </PressableScale>
  );
}
