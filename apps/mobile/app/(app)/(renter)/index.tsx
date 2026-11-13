import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Banknote,
  Bell,
  CalendarClock,
  CheckSquare,
  ChevronRight,
  FileCheck2,
  FileSignature,
  Heart,
  MapPin,
  MessageCircle,
  MessageCircleQuestion,
  Search,
  ShieldCheck,
  Clock,
  Wrench,
  type SgIcon,
} from '@sureground/icons/native';
import {
  Button,
  Card,
  describeProperty,
  EmptyState,
  IconButton,
  IconTile,
  ListingPlaceholder,
  Price,
  Progress,
  PropertyCard,
  Screen,
  SectionHeader,
  Skeleton,
  StatGroup,
  StatGroupSkeleton,
  Text,
  useTheme,
} from '@sureground/ui-native';
import { RenterPriorityCard, pickRenterPriority } from '@/components/dashboard/RenterPriorityCard';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { RefreshFailedNotice } from '@/components/RefreshFailedNotice';
import { QuickActions, dashboardGreeting } from '@/components/dashboard/DashboardParts';
import { qk } from '@/lib/query/keys';
import { renterApi, type RenterDashboardStats } from '@/lib/api/renter';
import { leaseApi } from '@/lib/api/lease';
import { paymentsApi } from '@/lib/api/payments';
import type { RenterProperty } from '@/lib/api/properties';
import { applicationsApi } from '@/lib/api/applications';
import { IdentityNudge, useIdentityVerified } from '@/components/trust/IdentityNudge';
import { notificationsApi } from '@/lib/api/notifications';
import { useSavedListings } from '@/hooks/useSavedListings';
import { useAuth } from '@/lib/auth/AuthProvider';
import { APP_TIME_ZONE, firstName, formatNaira } from '@/lib/format';
import { withTrustLabel } from '@/lib/trustLabel';
import { trustChainLabel, formatLocation } from '@sureground/shared';

interface Metric {
  key: keyof RenterDashboardStats;
  label: string;
  subtitle: string;
  Icon: SgIcon;
  onPress: () => void;
}

const CARD_WIDTH = 200;
// Fixed colours: the hero text and badge sit on a photo under a dark scrim in both themes. Theme tokens such as
// primaryForeground turn near-black in dark mode and vanish there.
const ON_SCRIM = {
  text: '#ffffff',
  glass: 'rgba(10,14,22,0.74)',
  glassEdge: 'rgba(255,255,255,0.16)',
  // The Sureground Verified blue, fixed rather than themed for the same reason.
  verified: '#0057d9',
  partial: '#4ade80',
  pending: '#ffb454',
  button: 'rgba(10,14,22,0.6)',
};

export default function RenterHome() {
  const { profile } = useAuth();
  const { colors, spacing } = useTheme();
  const { savedIds, toggle } = useSavedListings();

  const stats = useQuery({ queryKey: qk.renter.dashboardStats, queryFn: renterApi.dashboardStats });

  const notifications = useQuery({
    queryKey: qk.renter.notifications(1, 30),
    queryFn: () => notificationsApi.list(1, 30),
  });
  const unreadCount = (notifications.data?.items ?? []).filter((n) => !n.read).length;

  const listings = useQuery({
    queryKey: qk.renter.recommended,
    queryFn: renterApi.recommendations,
  });
  const [hero, ...rest] = listings.data ?? [];

  const applications = useQuery({
    queryKey: qk.renter.applications,
    queryFn: () => applicationsApi.list(1, 10),
  });

  const qc = useQueryClient();
  const showVerifyNudge = useIdentityVerified() === false;

  const moveInChecklist = useQuery({
    queryKey: qk.renter.moveInChecklist,
    queryFn: renterApi.moveInChecklist,
  });
  const moveInItems = moveInChecklist.data ?? [];
  const moveInDone = moveInItems.filter((i) => i.completed).length;

  // Same key and options as the lease screen, so the two share one cache entry.
  const lease = useQuery({ queryKey: qk.renter.lease, queryFn: leaseApi.getLease, retry: false });
  const leaseStatus = lease.data
    ? lease.data.status.charAt(0).toUpperCase() + lease.data.status.slice(1)
    : 'None yet';
  const leaseEndLabel = !lease.data
    ? 'Your lease appears here once you rent'
    : lease.data.endDate
      ? `Ends ${new Date(lease.data.endDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: APP_TIME_ZONE })}`
      : 'Active lease';

  // Shares the payments screen's paged query; its summary is account-wide, the loaded page is the fallback for older APIs.
  const payments = useInfiniteQuery({
    queryKey: qk.renter.paymentsHistory,
    queryFn: ({ pageParam }) => paymentsApi.list(pageParam, 20),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
  });
  const firstPage = payments.data?.pages[0];
  const totalRentPaid =
    firstPage?.summary?.totalPaidNaira ??
    (firstPage?.items ?? [])
      .filter((p) => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);

  const renewalOffer = useQuery({
    queryKey: qk.renter.renewalOffer,
    queryFn: leaseApi.getRenewalOffer,
    retry: false,
  });
  // Wait for every input: picking early shows a lower item, then swaps it when payments load.
  const priorityReady =
    !payments.isPending && !renewalOffer.isPending && !applications.isPending && !stats.isPending;
  const priority =
    priorityReady &&
    pickRenterPriority({
      summary: firstPage?.summary,
      payments: firstPage?.items ?? [],
      renewalOffer: renewalOffer.data,
      applications: applications.data?.items ?? [],
      upcomingViewings: stats.data?.upcomingViewingsCount ?? 0,
    });

  const METRICS: Metric[] = [
    {
      key: 'savedPropertiesCount',
      label: 'Saved properties',
      subtitle: 'In your shortlist',
      Icon: Heart,
      onPress: () => router.push('/(app)/saved'),
    },
    {
      key: 'activeApplicationsCount',
      label: 'Active applications',
      subtitle: 'In your pipeline',
      Icon: FileCheck2,
      onPress: () => router.push('/(app)/(renter)/applications'),
    },
    {
      key: 'upcomingViewingsCount',
      label: 'Upcoming viewings',
      subtitle: 'Scheduled tours',
      Icon: CalendarClock,
      onPress: () => router.push('/(app)/viewings'),
    },
    {
      key: 'unreadMessagesCount',
      label: 'Unread messages',
      subtitle: 'Across conversations',
      Icon: MessageCircle,
      onPress: () => router.push('/(app)/(renter)/messages'),
    },
  ];

  const refreshAll = () => {
    stats.refetch();
    listings.refetch();
    applications.refetch();
    moveInChecklist.refetch();
    notifications.refetch();
    lease.refetch();
    payments.refetch();
    qc.invalidateQueries({ queryKey: ['kyc-status'] });
  };
  const staleQueries = [stats, listings, applications, moveInChecklist].filter(
    (q) => q.isRefetchError
  );

  return (
    <Screen refreshing={stats.isRefetching || listings.isRefetching} onRefresh={refreshAll}>
      <DashboardHeader
        eyebrow={dashboardGreeting()}
        title={firstName(profile?.legalName)}
        roleBadge="RT"
        subtitle="Your home search, applications and rent"
        accessory={
          <View style={{ flexDirection: 'row', gap: 4 }}>
            <IconButton
              onPress={() => router.push('/(app)/ask')}
              accessibilityLabel="Ask Sureground"
              icon={<MessageCircleQuestion size={21} color={colors.foreground} />}
            />
            <IconButton
              onPress={() => router.push('/(app)/notifications')}
              // IconButton already appends ", N unread" from the badge, so the label must not repeat the count.
              accessibilityLabel="Notifications"
              badge={unreadCount}
              icon={<Bell size={21} color={colors.foreground} />}
            />
          </View>
        }
      />

      {staleQueries.length > 0 ? (
        <RefreshFailedNotice
          onRetry={refreshAll}
          retrying={staleQueries.some((q) => q.isFetching)}
        />
      ) : null}

      {showVerifyNudge ? (
        <IdentityNudge unlocks="applications and offers" />
      ) : priority ? (
        <RenterPriorityCard priority={priority} />
      ) : null}

      {moveInItems.length > 0 ? (
        <Pressable
          onPress={() => router.push('/(app)/move-checklist')}
          accessibilityRole="button"
          accessibilityLabel={`Move-in checklist, ${moveInDone} of ${moveInItems.length} complete`}
        >
          <Card elevated>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <IconTile Icon={CheckSquare} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="bodyStrong">Move-in checklist</Text>
                <Text variant="caption" color="mutedForeground">
                  {moveInDone} of {moveInItems.length} done
                </Text>
              </View>
              <ChevronRight size={18} color={colors.primary} />
            </View>
            <View style={{ marginTop: spacing.md }}>
              <Progress
                value={moveInItems.length ? moveInDone / moveInItems.length : 0}
                height={5}
              />
            </View>
          </Card>
        </Pressable>
      ) : null}

      {stats.isError && !stats.data ? (
        <Card elevated style={{ gap: spacing.sm }}>
          <Text variant="bodyStrong">Couldn’t load your dashboard</Text>
          <Text variant="callout" color="mutedForeground">
            Check your connection, then try again.
          </Text>
          <Button
            label="Try again"
            variant="secondary"
            size="sm"
            fullWidth={false}
            loading={stats.isFetching}
            onPress={() => stats.refetch()}
          />
        </Card>
      ) : stats.isPending ? (
        <StatGroupSkeleton groups={[4, 2]} />
      ) : (
        <StatGroup
          title="Your search"
          items={visibleMetrics(
            METRICS.map(({ key, ...item }) => ({ ...item, value: stats.data?.[key] ?? 0 }))
          )}
        />
      )}

      {stats.isPending ? null : lease.isPending || payments.isPending ? (
        <StatGroupSkeleton groups={[2]} />
      ) : (
        <StatGroup
          title="Your home"
          items={[
            {
              label: 'Current lease',
              value: leaseStatus,
              subtitle: leaseEndLabel,
              Icon: FileSignature,
              onPress: () => router.push('/(app)/lease'),
            },
            {
              label: 'Total rent paid',
              value: formatNaira(totalRentPaid, { compact: true }),
              subtitle: 'Lifetime',
              Icon: Banknote,
              onPress: () => router.push('/(app)/payments'),
            },
          ]}
        />
      )}

      <QuickActions
        actions={[
          {
            label: 'Find a home',
            Icon: Search,
            onPress: () => router.push('/(app)/(renter)/discover'),
          },
          { label: 'Pay rent', Icon: Banknote, onPress: () => router.push('/(app)/payments') },
          {
            label: 'Report a repair',
            Icon: Wrench,
            onPress: () => router.push('/(app)/report-maintenance'),
          },
          { label: 'My lease', Icon: FileSignature, onPress: () => router.push('/(app)/lease') },
        ]}
      />

      <View style={{ gap: spacing.md }}>
        <SectionHeader
          title="Featured for you"
          description="Homes matched to your activity"
          actionLabel="See all"
          onAction={() => router.push('/(app)/(renter)/discover')}
        />

        {listings.isPending ? (
          <Skeleton height={220} radius={16} />
        ) : listings.isError && !hero ? (
          <Card elevated style={{ gap: spacing.sm }}>
            <Text variant="callout" color="mutedForeground">
              We couldn’t load recommendations right now.
            </Text>
            <Button
              label="Try again"
              variant="secondary"
              size="sm"
              fullWidth={false}
              onPress={() => listings.refetch()}
            />
          </Card>
        ) : hero ? (
          <HeroCard property={hero} saved={savedIds.has(hero.id)} onToggleSave={toggle} />
        ) : (
          <Card padding="none">
            <EmptyState
              size="compact"
              icon={<IconTile Icon={Search} size="xl" />}
              title="No homes to suggest yet"
              description="No listings available right now: check back soon."
              action={
                <Button
                  label="Browse homes"
                  size="sm"
                  fullWidth={false}
                  onPress={() => router.push('/(app)/(renter)/discover')}
                />
              }
            />
          </Card>
        )}

        {rest.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginHorizontal: -spacing.xl }}
            contentContainerStyle={{ paddingHorizontal: spacing.xl }}
          >
            {rest.map((item) => (
              <View key={item.id} style={{ width: CARD_WIDTH, marginRight: spacing.md }}>
                <PropertyCard
                  property={withTrustLabel(item)}
                  saved={savedIds.has(item.id)}
                  onToggleSave={toggle}
                  onPress={(id) => router.push(`/(app)/property/${id}`)}
                />
              </View>
            ))}
          </ScrollView>
        ) : null}
      </View>
    </Screen>
  );
}

function HeroCard({
  property,
  saved,
  onToggleSave,
}: {
  property: RenterProperty;
  saved: boolean;
  onToggleSave: (id: string) => void;
}) {
  const { colors, radius } = useTheme();
  const trust = property.trustChain?.steps.length ? trustChainLabel(property.trustChain) : null;
  const badgeText = trust ? trust.label : property.verified ? 'Verified' : null;
  return (
    <View
      style={{
        height: 220,
        borderRadius: radius.lg,
        overflow: 'hidden',
        backgroundColor: colors.secondary,
      }}
    >
      <Pressable
        onPress={() => router.push(`/(app)/property/${property.id}`)}
        accessibilityRole="button"
        accessibilityLabel={describeProperty(withTrustLabel(property))}
        style={{
          flex: 1,
        }}
      >
        {property.image ? (
          <Image
            source={{ uri: property.image }}
            contentFit="cover"
            cachePolicy="memory-disk"
            recyclingKey={property.id}
            transition={250}
            accessible={false}
            style={StyleSheet.absoluteFill}
          />
        ) : (
          // No photo: the branded placeholder on a fixed deep slate, so the white text reads in both themes.
          <ListingPlaceholder size="hero" tone="onDark" style={{ paddingBottom: 56 }} />
        )}
        {property.image ? (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.42)' }]} />
        ) : null}

        <View
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            right: 12,
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}
        >
          {badgeText ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                paddingVertical: 6,
                paddingHorizontal: 10,
                borderRadius: radius.full,
                backgroundColor: trust?.tone === 'verified' ? ON_SCRIM.verified : ON_SCRIM.glass,
                borderWidth: trust?.tone === 'verified' ? 0 : StyleSheet.hairlineWidth,
                borderColor: ON_SCRIM.glassEdge,
                flexShrink: 1,
              }}
            >
              {trust?.tone === 'pending' ? (
                <Clock size={12} color={ON_SCRIM.pending} />
              ) : (
                <ShieldCheck
                  size={12}
                  color={trust?.tone === 'partial' ? ON_SCRIM.partial : ON_SCRIM.text}
                />
              )}
              <Text
                variant="caption"
                numberOfLines={1}
                style={{ color: ON_SCRIM.text, fontWeight: '700', flexShrink: 1 }}
              >
                {badgeText}
              </Text>
            </View>
          ) : (
            <View />
          )}
          <View style={{ width: 36 }} />
        </View>

        <View style={{ position: 'absolute', left: 16, right: 16, bottom: 14, gap: 3 }}>
          <Text variant="bodyStrong" numberOfLines={1} style={{ color: ON_SCRIM.text }}>
            {property.title}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <MapPin size={11} color="rgba(255,255,255,0.85)" />
            <Text variant="caption" style={{ color: 'rgba(255,255,255,0.85)' }} numberOfLines={1}>
              {formatLocation(property.location)}
            </Text>
          </View>
          <Price
            amount={property.price}
            period={property.period}
            variant="subheading"
            style={{ color: ON_SCRIM.text, fontWeight: '700' }}
            periodColor="rgba(255,255,255,0.75)"
          />
        </View>
      </Pressable>
      <Pressable
        onPress={() => onToggleSave(property.id)}
        hitSlop={7}
        accessibilityRole="button"
        accessibilityLabel={
          saved ? `Remove ${property.title} from saved` : `Save ${property.title}`
        }
        accessibilityState={{ selected: saved }}
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: ON_SCRIM.button,
        }}
      >
        <Heart
          size={16}
          color={saved ? colors.destructive : ON_SCRIM.text}
          fill={saved ? colors.destructive : 'transparent'}
        />
      </Pressable>
    </View>
  );
}

/** Tiles reading 0 crowd out the ones that matter; a brand-new renter still sees all four. */
function visibleMetrics<T extends { value: number }>(items: T[]): T[] {
  const nonZero = items.filter((i) => i.value > 0);
  return nonZero.length > 0 ? nonZero : items;
}
