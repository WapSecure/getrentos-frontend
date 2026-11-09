import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Banknote,
  Bell,
  CheckSquare,
  ChevronRight,
  FileCheck2,
  FileSignature,
  Heart,
  MapPin,
  MessageCircleQuestion,
  Search,
  ShieldCheck,
  Wrench,
} from '@sureground/icons/native';
import {
  Badge,
  Button,
  Card,
  describeProperty,
  IconButton,
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
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { RefreshFailedNotice } from '@/components/RefreshFailedNotice';
import { QuickActions, dashboardGreeting } from '@/components/dashboard/DashboardParts';
import { qk } from '@/lib/query/keys';
import { renterApi, type RenterDashboardStats } from '@/lib/api/renter';
import type { RenterProperty } from '@/lib/api/properties';
import {
  applicationsApi,
  APPLICATION_STATUS_LABEL,
  APPLICATION_STATUS_TONE,
} from '@/lib/api/applications';
import { IdentityNudge, useIdentityVerified } from '@/components/trust/IdentityNudge';
import { notificationsApi } from '@/lib/api/notifications';
import { useSavedListings } from '@/hooks/useSavedListings';
import { useAuth } from '@/lib/auth/AuthProvider';
import { firstName } from '@/lib/format';
import { withTrustLabel } from '@/lib/trustLabel';
import { trustChainLabel } from '@sureground/shared';

interface Metric {
  key: keyof RenterDashboardStats;
  label: string;
  subtitle: string;
  onPress: () => void;
}

const CARD_WIDTH = 200;
// Fixed colours: the badge sits on a fixed navy scrim in both themes, where the theme's success green is too dark.
const ON_SCRIM = { bg: 'rgba(9,32,66,0.72)', partial: '#4ade80' };

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
  const activeApplication = applications.data?.items.find(
    (a) => a.status === 'pending' || a.status === 'under_review'
  );

  const qc = useQueryClient();
  const showVerifyNudge = useIdentityVerified() === false;

  const moveInChecklist = useQuery({
    queryKey: qk.renter.moveInChecklist,
    queryFn: renterApi.moveInChecklist,
  });
  const moveInItems = moveInChecklist.data ?? [];
  const moveInDone = moveInItems.filter((i) => i.completed).length;

  const METRICS: Metric[] = [
    {
      key: 'savedPropertiesCount',
      label: 'Saved properties',
      subtitle: 'In your shortlist',
      onPress: () => router.push('/(app)/saved'),
    },
    {
      key: 'activeApplicationsCount',
      label: 'Active applications',
      subtitle: 'In your pipeline',
      onPress: () => router.push('/(app)/(renter)/applications'),
    },
    {
      key: 'upcomingViewingsCount',
      label: 'Upcoming viewings',
      subtitle: 'Scheduled tours',
      onPress: () => router.push('/(app)/viewings'),
    },
    {
      key: 'unreadMessagesCount',
      label: 'Unread messages',
      subtitle: 'Across conversations',
      onPress: () => router.push('/(app)/(renter)/messages'),
    },
  ];

  const refreshAll = () => {
    stats.refetch();
    listings.refetch();
    applications.refetch();
    moveInChecklist.refetch();
    notifications.refetch();
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
      ) : activeApplication ? (
        <Pressable
          onPress={() => router.push(`/(app)/application/${activeApplication.id}`)}
          accessibilityRole="button"
          accessibilityLabel={`Open application ${activeApplication.title}`}
        >
          <Card elevated padding="none">
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
                padding: spacing.lg,
              }}
            >
              <FileCheck2 size={20} color={colors.primary} />
              <View style={{ flex: 1, gap: 3 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <Text variant="bodyStrong" numberOfLines={1} style={{ flexShrink: 1 }}>
                    {activeApplication.title}
                  </Text>
                  <Badge
                    label={APPLICATION_STATUS_LABEL[activeApplication.status]}
                    tone={APPLICATION_STATUS_TONE[activeApplication.status]}
                  />
                </View>
                <Price
                  amount={activeApplication.price}
                  period={activeApplication.period}
                  variant="callout"
                />
              </View>
              <ChevronRight size={18} color={colors.mutedForeground} />
            </View>
          </Card>
        </Pressable>
      ) : null}

      {moveInItems.length > 0 ? (
        <Pressable
          onPress={() => router.push('/(app)/move-checklist')}
          accessibilityRole="button"
          accessibilityLabel={`Move-in checklist, ${moveInDone} of ${moveInItems.length} complete`}
        >
          <Card elevated>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <CheckSquare size={20} color={colors.primary} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="bodyStrong">Move-in checklist</Text>
                <Text variant="caption" color="mutedForeground">
                  {moveInDone} of {moveInItems.length} done
                </Text>
              </View>
              <ChevronRight size={18} color={colors.mutedForeground} />
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
        <StatGroupSkeleton groups={[4]} />
      ) : (
        <StatGroup
          title="Your search"
          items={METRICS.map(({ key, ...item }) => ({ ...item, value: stats.data?.[key] ?? 0 }))}
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
          description="Verified homes matched to your activity"
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
          <Card elevated>
            <Text variant="callout" color="mutedForeground">
              No listings available right now: check back soon.
            </Text>
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
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.muted }]} />
        )}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.42)' }]} />

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
                backgroundColor: trust?.tone === 'verified' ? colors.success : ON_SCRIM.bg,
                flexShrink: 1,
              }}
            >
              <ShieldCheck
                size={12}
                color={trust?.tone === 'partial' ? ON_SCRIM.partial : colors.primaryForeground}
              />
              <Text
                variant="caption"
                numberOfLines={1}
                style={{ color: colors.primaryForeground, fontWeight: '700', flexShrink: 1 }}
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
          <Text variant="bodyStrong" numberOfLines={1} style={{ color: colors.primaryForeground }}>
            {property.title}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <MapPin size={11} color="rgba(255,255,255,0.85)" />
            <Text variant="caption" style={{ color: 'rgba(255,255,255,0.85)' }} numberOfLines={1}>
              {property.location}
            </Text>
          </View>
          <Price
            amount={property.price}
            period={property.period}
            variant="callout"
            style={{ color: colors.primaryForeground, fontWeight: '700' }}
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
          backgroundColor: 'rgba(9,32,66,0.54)',
        }}
      >
        <Heart
          size={16}
          color={saved ? colors.destructive : colors.primaryForeground}
          fill={saved ? colors.destructive : 'transparent'}
        />
      </Pressable>
    </View>
  );
}
