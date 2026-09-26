import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import {
  Bell,
  CalendarClock,
  CheckSquare,
  ChevronRight,
  FileCheck2,
  FileText,
  Heart,
  MapPin,
  MessageCircle,
  ShieldAlert,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react-native';
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
  Text,
  useTheme,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { renterApi, type RenterDashboardStats } from '@/lib/api/renter';
import type { RenterProperty } from '@/lib/api/properties';
import {
  applicationsApi,
  APPLICATION_STATUS_LABEL,
  APPLICATION_STATUS_TONE,
} from '@/lib/api/applications';
import { kycApi } from '@/lib/api/kyc';
import { notificationsApi } from '@/lib/api/notifications';
import { useSavedListings } from '@/hooks/useSavedListings';
import { useAuth } from '@/lib/auth/AuthProvider';
import { firstName } from '@/lib/format';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

interface Metric {
  key: keyof RenterDashboardStats;
  label: string;
  Icon: LucideIcon;
  onPress?: () => void;
}

const CARD_WIDTH = 200;

export default function RenterHome() {
  const { profile } = useAuth();
  const { colors, spacing } = useTheme();
  const { savedIds, toggle } = useSavedListings();

  const stats = useQuery({ queryKey: qk.renter.dashboardStats, queryFn: renterApi.dashboardStats });

  // Drives the bell badge; the notifications screen owns the full list.
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

  const kyc = useQuery({ queryKey: ['kyc-status'], queryFn: kycApi.getStatus });
  const identityVerified = kyc.data?.identity?.status === 'APPROVED';
  const showVerifyNudge = !!kyc.data && !identityVerified;

  const moveInChecklist = useQuery({
    queryKey: qk.renter.moveInChecklist,
    queryFn: renterApi.moveInChecklist,
  });
  const moveInItems = moveInChecklist.data ?? [];
  const moveInDone = moveInItems.filter((i) => i.completed).length;

  const METRICS: Metric[] = [
    {
      key: 'savedPropertiesCount',
      label: 'Saved',
      Icon: Heart,
      onPress: () => router.push('/(app)/saved'),
    },
    {
      key: 'activeApplicationsCount',
      label: 'Applications',
      Icon: FileText,
      onPress: () => router.push('/(app)/(renter)/applications'),
    },
    {
      key: 'unreadMessagesCount',
      label: 'Unread',
      Icon: MessageCircle,
      onPress: () => router.push('/(app)/(renter)/messages'),
    },
    {
      key: 'upcomingViewingsCount',
      label: 'Viewings',
      Icon: CalendarClock,
      onPress: () => router.push('/(app)/viewings'),
    },
  ];

  return (
    <Screen
      refreshing={stats.isRefetching || listings.isRefetching}
      onRefresh={() => {
        stats.refetch();
        listings.refetch();
        applications.refetch();
        moveInChecklist.refetch();
        notifications.refetch();
        kyc.refetch();
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <View style={{ flex: 1, gap: spacing.xxs }}>
          <Text variant="label" color="primary" uppercase>
            {greeting()}
          </Text>
          <Text variant="title">{firstName(profile?.legalName)}</Text>
        </View>
        <IconButton
          onPress={() => router.push('/(app)/notifications')}
          accessibilityLabel="Notifications"
          badge={unreadCount}
          icon={<Bell size={21} color={colors.foreground} />}
        />
      </View>

      {showVerifyNudge ? (
        <Pressable
          onPress={() => router.push('/(app)/verify-identity')}
          accessibilityRole="button"
          accessibilityLabel="Verify your identity. Unlocks applications and offers."
        >
          <Card
            elevated
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.md,
              backgroundColor: colors.warningSubtle,
            }}
          >
            <ShieldAlert size={20} color={colors.warning} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong" style={{ color: colors.warning }}>
                Verify your identity
              </Text>
              <Text variant="caption" color="mutedForeground">
                Unlocks applications and offers — takes two minutes
              </Text>
            </View>
            <ChevronRight size={18} color={colors.warning} />
          </Card>
        </Pressable>
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

      <Card elevated padding="none">
        <View style={{ flexDirection: 'row' }}>
          {METRICS.map(({ key, label, Icon, onPress }, i) => (
            <Pressable
              key={key}
              onPress={onPress}
              disabled={!onPress}
              accessibilityRole="button"
              accessibilityLabel={
                stats.isPending ? `${label}, loading` : `${label}: ${stats.data?.[key] ?? 0}`
              }
              style={({ pressed }) => ({
                flex: 1,
                alignItems: 'center',
                gap: 6,
                paddingVertical: spacing.lg,
                borderLeftWidth: i > 0 ? 1 : 0,
                borderLeftColor: colors.border,
                backgroundColor: pressed ? colors.secondary : 'transparent',
              })}
            >
              <Icon size={17} color={colors.mutedForeground} />
              {stats.isPending ? (
                <Skeleton height={22} width={22} />
              ) : (
                <Text variant="title" style={{ fontSize: 20, lineHeight: 24 }}>
                  {stats.data?.[key] ?? 0}
                </Text>
              )}
              <Text variant="caption" color="mutedForeground">
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      </Card>

      {stats.isError ? (
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
            onPress={() => stats.refetch()}
          />
        </Card>
      ) : null}

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
              No listings available right now — check back soon.
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
                  property={item}
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

/* ------------------------------ pieces ----------------------------------- */

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
        accessibilityLabel={describeProperty(property)}
        style={{
          flex: 1,
        }}
      >
        {property.image ? (
          <Image
            source={{ uri: property.image }}
            contentFit="cover"
            transition={250}
            accessible={false}
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <LinearGradient
            colors={[colors.primaryHover, colors.primary]}
            style={StyleSheet.absoluteFill}
          />
        )}
        <LinearGradient
          colors={['rgba(0,0,0,0.25)', 'rgba(0,0,0,0.05)', 'rgba(0,0,0,0.85)']}
          locations={[0, 0.4, 1]}
          style={StyleSheet.absoluteFill}
        />

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
          {property.verified ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                paddingVertical: 6,
                paddingHorizontal: 10,
                borderRadius: radius.full,
                backgroundColor: 'rgba(9,32,66,0.72)',
              }}
            >
              <ShieldCheck size={12} color={colors.primaryForeground} />
              <Text
                variant="caption"
                style={{ color: colors.primaryForeground, fontWeight: '700' }}
              >
                Verified
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
