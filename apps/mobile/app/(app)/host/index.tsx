import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BedDouble,
  CalendarDays,
  ChevronRight,
  Gavel,
  MessageCircle,
  Plus,
  Wallet,
  type LucideIcon,
} from 'lucide-react-native';
import {
  Button,
  Card,
  ErrorState,
  IconButton,
  Price,
  Skeleton,
  Text,
  useTheme,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { hostShortletsApi } from '@/lib/api/hostShortlets';
import { formatDate } from '@/lib/format';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { HostFeeNote, StayCard } from '@/components/host/HostUI';

/**
 * The host's morning view: what needs a reply, who's arriving, and what's
 * ready to withdraw. Everything else is one tap away.
 */
export default function HostingHome() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const listings = useQuery({
    queryKey: qk.host.listings,
    queryFn: () => hostShortletsApi.listings(),
  });
  const ready = !!listings.data;
  const requests = useQuery({
    queryKey: qk.host.bookings('requests'),
    queryFn: () => hostShortletsApi.bookings('requests'),
    enabled: ready,
  });
  const upcoming = useQuery({
    queryKey: qk.host.bookings('upcoming'),
    queryFn: () => hostShortletsApi.bookings('upcoming'),
    enabled: ready,
  });
  const summary = useQuery({
    queryKey: qk.host.payoutSummary,
    queryFn: hostShortletsApi.payoutSummary,
    enabled: ready,
  });
  const conversations = useQuery({
    queryKey: qk.host.conversations,
    queryFn: () => hostShortletsApi.conversations(),
    enabled: ready,
  });

  const unread = conversations.data?.items.reduce((n, c) => n + c.unreadCount, 0) ?? 0;
  const pending = requests.data?.total ?? 0;
  const live = listings.data?.items.filter((l) => l.status === 'PUBLISHED').length ?? 0;
  const noListings = ready && listings.data.items.length === 0;

  const refresh = () => {
    listings.refetch();
    requests.refetch();
    upcoming.refetch();
    summary.refetch();
    conversations.refetch();
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      refreshControl={
        <RefreshControl
          refreshing={listings.isRefetching || requests.isRefetching}
          onRefresh={refresh}
          tintColor={colors.mutedForeground}
        />
      }
      contentContainerStyle={{
        paddingTop: insets.top + spacing.md,
        paddingHorizontal: spacing.xl,
        paddingBottom: insets.bottom + spacing['3xl'],
        gap: spacing.xl,
      }}
    >
      <DetailHeader
        eyebrow="Hosting"
        title="Short stays"
        subtitle={
          ready && !noListings
            ? `${live} live listing${live === 1 ? '' : 's'}${pending ? ` · ${pending} to answer` : ''}`
            : 'Nightly stays in your furnished homes'
        }
        onBack={() => router.back()}
        accessory={
          ready && !noListings ? (
            <IconButton
              accessibilityLabel="New listing"
              icon={<Plus size={20} color={colors.primary} />}
              onPress={() => router.push('/(app)/host/listing-editor')}
            />
          ) : null
        }
      />

      {listings.isError && !listings.data ? (
        <ErrorState onRetry={() => listings.refetch()} />
      ) : !listings.data ? (
        <View style={{ gap: spacing.md }}>
          <Skeleton height={148} radius={radius.xl} />
          <Skeleton height={120} radius={radius.lg} />
        </View>
      ) : noListings ? (
        <FirstListing />
      ) : (
        <>
          <MoneyHero
            available={summary.data?.available}
            upcoming={summary.data?.upcoming}
            nextRelease={summary.data?.nextReleaseAt ?? null}
          />

          {pending ? (
            <Section
              title="Needs your reply"
              action={pending > 2 ? `All ${pending}` : undefined}
              onAction={() =>
                router.push({ pathname: '/(app)/host/bookings', params: { view: 'requests' } })
              }
            >
              {requests.data!.items.slice(0, 2).map((b) => (
                <StayCard key={b.id} b={b} />
              ))}
            </Section>
          ) : null}

          <Section
            title="Coming up"
            action={upcoming.data?.items.length ? 'All stays' : undefined}
            onAction={() =>
              router.push({ pathname: '/(app)/host/bookings', params: { view: 'upcoming' } })
            }
          >
            {upcoming.isPending ? (
              <Skeleton height={112} radius={radius.lg} />
            ) : upcoming.data?.items.length ? (
              upcoming.data.items.slice(0, 3).map((b) => <StayCard key={b.id} b={b} compact />)
            ) : (
              <Text variant="callout" color="mutedForeground">
                No confirmed stays yet. Keep your calendar open and prices sharp.
              </Text>
            )}
          </Section>

          <View style={{ gap: spacing.sm }}>
            <Tile
              Icon={BedDouble}
              label="Listings"
              hint={`${listings.data.items.length} total · ${live} live`}
              onPress={() => router.push('/(app)/host/listings')}
            />
            <Tile
              Icon={CalendarDays}
              label="Bookings"
              hint="Requests, stays and history"
              onPress={() => router.push('/(app)/host/bookings')}
            />
            <Tile
              Icon={MessageCircle}
              label="Guest messages"
              hint={unread ? `${unread} unread` : 'Chats with guests'}
              badge={unread}
              onPress={() => router.push('/(app)/host/inbox')}
            />
            <Tile
              Icon={Wallet}
              label="Earnings & payouts"
              hint="Withdraw, history and fees"
              onPress={() => router.push('/(app)/host/earnings')}
            />
            <Tile
              Icon={Gavel}
              label="Disputes & claims"
              hint="Damage claims and resolutions"
              onPress={() => router.push('/(app)/host/disputes')}
            />
          </View>
        </>
      )}
    </ScrollView>
  );
}

function MoneyHero({
  available,
  upcoming,
  nextRelease,
}: {
  available?: number;
  upcoming?: number;
  nextRelease: string | null;
}) {
  const { colors, spacing, radius } = useTheme();
  return (
    <Pressable
      onPress={() => router.push('/(app)/host/earnings')}
      accessibilityRole="button"
      accessibilityLabel={`Available to withdraw ${available ?? 0} naira. Open earnings`}
    >
      {({ pressed }) => (
        <View
          style={{
            borderRadius: radius.xl,
            padding: spacing.xl,
            gap: spacing.md,
            backgroundColor: colors.primary,
            opacity: pressed ? 0.94 : 1,
          }}
        >
          <Text variant="label" uppercase style={{ color: colors.primaryForeground, opacity: 0.8 }}>
            Available to withdraw
          </Text>
          {available == null ? (
            <Skeleton height={34} width="55%" />
          ) : (
            <Price
              amount={available}
              variant="display"
              style={{ color: colors.primaryForeground }}
            />
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Text
              variant="callout"
              style={{ color: colors.primaryForeground, opacity: 0.85, flex: 1 }}
            >
              {upcoming
                ? `+ ₦${Math.round(upcoming).toLocaleString('en-NG')} on the way${
                    nextRelease ? ` · next ${formatDate(nextRelease, 'short')}` : ''
                  }`
                : 'Earnings unlock after each check-in'}
            </Text>
            <ChevronRight size={18} color={colors.primaryForeground} />
          </View>
        </View>
      )}
    </Pressable>
  );
}

function Section({
  title,
  action,
  onAction,
  children,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  children: React.ReactNode;
}) {
  const { spacing } = useTheme();
  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text variant="heading" accessibilityRole="header" style={{ flex: 1 }}>
          {title}
        </Text>
        {action ? (
          <Pressable onPress={onAction} hitSlop={10} accessibilityRole="button">
            <Text variant="callout" color="primary" style={{ fontWeight: '700' }}>
              {action}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function Tile({
  Icon,
  label,
  hint,
  onPress,
  badge,
}: {
  Icon: LucideIcon;
  label: string;
  hint: string;
  onPress: () => void;
  badge?: number;
}) {
  const { colors, spacing, radius } = useTheme();
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
        borderRadius: radius.lg,
        backgroundColor: pressed ? colors.secondary : colors.card,
        borderWidth: 1,
        borderColor: colors.border,
      })}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: radius.md,
          backgroundColor: colors.accent,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={19} color={colors.accentForeground} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong">{label}</Text>
        <Text variant="caption" color="mutedForeground">
          {hint}
        </Text>
      </View>
      {badge ? (
        <View
          style={{
            minWidth: 22,
            height: 22,
            paddingHorizontal: 6,
            borderRadius: 11,
            backgroundColor: colors.destructive,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            variant="caption"
            style={{ color: colors.destructiveForeground, fontWeight: '800' }}
          >
            {badge}
          </Text>
        </View>
      ) : null}
      <ChevronRight size={18} color={colors.mutedForeground} />
    </Pressable>
  );
}

/** First visit: what hosting is and one clear next step. */
function FirstListing() {
  const { colors, spacing } = useTheme();
  const steps = [
    ['Pick a furnished property', 'Any home you own or manage.'],
    ['Set your nightly price', 'Add cleaning, a deposit and your house rules.'],
    ['Go live', 'Guests book and pay upfront; you get paid after check-in.'],
  ];
  return (
    <Card elevated style={{ gap: spacing.lg }}>
      <Text variant="heading">Host your first stay</Text>
      {steps.map(([title, body], i) => (
        <View key={title} style={{ flexDirection: 'row', gap: spacing.md }}>
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: colors.accent,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text variant="callout" style={{ color: colors.accentForeground, fontWeight: '800' }}>
              {i + 1}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">{title}</Text>
            <Text variant="caption" color="mutedForeground">
              {body}
            </Text>
          </View>
        </View>
      ))}
      <HostFeeNote />
      <Button label="Create a listing" onPress={() => router.push('/(app)/host/listing-editor')} />
    </Card>
  );
}
