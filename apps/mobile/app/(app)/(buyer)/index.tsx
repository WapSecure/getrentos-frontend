import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  BedDouble,
  Bell,
  CheckCircle2,
  ChevronRight,
  MessageCircleQuestion,
  CalendarClock,
  FileSignature,
  FileText,
  Heart,
  Home as HomeIcon,
  LandPlot,
  MapPin,
  Search,
  Wallet,
  type SgIcon,
} from '@sureground/icons/native';
import {
  Button,
  Card,
  EmptyState,
  IconButton,
  IconTile,
  Price,
  QueryState,
  Screen,
  SectionHeader,
  Skeleton,
  StatGroup,
  StatGroupSkeleton,
  Text,
  useTheme,
} from '@sureground/ui-native';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import {
  ActivityFeed,
  AttentionCard,
  QuickActions,
  dashboardGreeting,
} from '@/components/dashboard/DashboardParts';
import { qk } from '@/lib/query/keys';
import { buyerApi } from '@/lib/api/buyer';
import { buyerSettingsApi } from '@/lib/api/buyerSettings';
import { useAuth } from '@/lib/auth/AuthProvider';
import { firstName } from '@/lib/format';

const ACTIVITY_ICON: Record<string, SgIcon> = {
  offer: FileSignature,
  transaction: Wallet,
  escrow: Wallet,
  payment: Wallet,
  viewing: CalendarClock,
  document: FileText,
  saved: Heart,
};

export default function BuyerHome() {
  const { profile } = useAuth();
  const { colors, spacing } = useTheme();

  const dashboard = useQuery({ queryKey: qk.buyer.dashboard, queryFn: buyerApi.dashboard });
  const notifications = useQuery({
    queryKey: qk.buyer.notifications(1, 50),
    queryFn: () => buyerSettingsApi.notifications(1, 50),
  });
  const unread = notifications.data?.items.filter((n) => !n.read).length ?? 0;
  const d = dashboard.data;

  const header = (
    <DashboardHeader
      eyebrow={dashboardGreeting()}
      title={firstName(profile?.legalName)}
      roleBadge="BY"
      subtitle="Your offers, viewings and purchases"
      accessory={
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <IconButton
            onPress={() => router.push({ pathname: '/(app)/ask', params: { persona: 'buyer' } })}
            accessibilityLabel="Ask Sureground"
            icon={<MessageCircleQuestion size={21} color={colors.foreground} />}
          />
          <IconButton
            onPress={() => router.push('/(app)/buyer-notification-inbox')}
            accessibilityLabel="Notifications"
            badge={unread}
            icon={<Bell size={21} color={colors.foreground} />}
          />
        </View>
      }
    />
  );

  const statGroups = d ? (
    <>
      <StatGroup
        title="Your search"
        items={[
          {
            label: 'Saved properties',
            value: d.savedListings,
            subtitle: 'In your shortlist',
            Icon: Heart,
            onPress: () => router.push('/(app)/buyer-saved'),
          },
          {
            label: 'Upcoming viewings',
            value: d.upcomingViewings,
            subtitle: 'Scheduled tours',
            Icon: CalendarClock,
            onPress: () => router.push('/(app)/buyer-viewings'),
          },
        ]}
      />
      <StatGroup
        title="Purchases"
        items={[
          {
            label: 'Active offers',
            value: d.activeOffers,
            subtitle: 'Awaiting a response',
            Icon: FileSignature,
            onPress: () => router.push('/(app)/(buyer)/offers'),
          },
          {
            label: 'Active purchases',
            value: d.activeTransactions,
            subtitle: 'Protected transactions',
            Icon: Wallet,
            onPress: () => router.push('/(app)/buyer-transactions'),
          },
          {
            label: 'Completed',
            value: d.completedPurchases,
            subtitle: 'Lifetime',
            Icon: CheckCircle2,
            onPress: () => router.push('/(app)/buyer-transactions'),
          },
          {
            label: 'Documents',
            value: d.documentsUploaded,
            subtitle: 'Uploaded to your vault',
            Icon: FileText,
            onPress: () => router.push('/(app)/buyer-documents'),
          },
        ]}
      />
    </>
  ) : null;

  const quickActions = (
    <QuickActions
      actions={[
        {
          label: 'Find a property',
          Icon: Search,
          onPress: () => router.push('/(app)/(buyer)/discover'),
        },
        { label: 'Land', Icon: LandPlot, onPress: () => router.push('/(app)/land') },
        {
          label: 'Documents',
          Icon: FileText,
          onPress: () => router.push('/(app)/buyer-documents'),
        },
        { label: 'Short stays', Icon: BedDouble, onPress: () => router.push('/(app)/shortlets') },
      ]}
    />
  );

  return (
    <Screen refreshing={dashboard.isRefetching} onRefresh={() => void dashboard.refetch()}>
      {header}

      <QueryState
        query={dashboard}
        skeleton={
          <View style={{ gap: spacing.lg }}>
            <StatGroupSkeleton groups={[2, 4]} />
            {quickActions}
            <Skeleton height={140} radius={16} />
          </View>
        }
        errorTitle="We couldn't load your dashboard"
        errorDescription="Check your connection and try again. Your saved homes and offers are safe."
      >
        {d?.activeTransactions ? (
          <AttentionCard
            Icon={Wallet}
            title={`${d.activeTransactions} ${d.activeTransactions === 1 ? 'purchase' : 'purchases'} in progress`}
            detail="See what’s paid and what happens next"
            eyebrow="In progress"
            actionLabel="Track your purchases"
            onPress={() => router.push('/(app)/buyer-transactions')}
          />
        ) : null}

        {statGroups}

        {quickActions}

        <View style={{ gap: spacing.md }}>
          <SectionHeader
            title="Recommended for you"
            description="Verified opportunities matched to your activity"
            actionLabel="See all"
            onAction={() => router.push('/(app)/(buyer)/discover')}
          />

          {!dashboard.data?.recommendations?.length ? (
            <Card padding="none">
              <EmptyState
                size="compact"
                icon={<IconTile Icon={HomeIcon} size="xl" />}
                title="Your recommendations are warming up"
                description="Browse and save a few properties so we can tailor this space to you."
                action={
                  <Button
                    label="Find a property"
                    size="sm"
                    fullWidth={false}
                    onPress={() => router.push('/(app)/(buyer)/discover')}
                  />
                }
              />
            </Card>
          ) : (
            dashboard.data.recommendations.map((r) => (
              <Pressable
                key={r.id}
                onPress={() => router.push(`/(app)/buyer-listing/${r.id}`)}
                accessibilityRole="button"
                accessibilityLabel={`${r.title}, ${r.city}, ${Math.round(r.price).toLocaleString('en-NG')} naira`}
                accessibilityHint="Opens property details"
              >
                <Card
                  elevated
                  padding={spacing.lg}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
                >
                  <IconTile Icon={HomeIcon} size="lg" />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text variant="bodyStrong" numberOfLines={1}>
                      {r.title}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <MapPin size={12} color={colors.mutedForeground} />
                      <Text variant="caption" color="mutedForeground" numberOfLines={1}>
                        {r.city}
                      </Text>
                    </View>
                    <Price
                      amount={r.price}
                      variant="bodyStrong"
                      color="primary"
                      style={{ fontWeight: '700' }}
                    />
                  </View>
                  <ChevronRight size={18} color={colors.mutedForeground} />
                </Card>
              </Pressable>
            ))
          )}
        </View>

        <ActivityFeed
          description="Offers, viewings and payment updates"
          loading={false}
          emptyText="Your offers, viewings and payments will show up here."
          items={(d?.recentActivity ?? []).slice(0, 6).map((a) => ({
            id: a.id,
            Icon: ACTIVITY_ICON[a.type] ?? Bell,
            title: a.message,
            timestamp: a.timestamp,
          }))}
        />
      </QueryState>
    </Screen>
  );
}
