import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronRight,
  FileSignature,
  FileText,
  Heart,
  Home as HomeIcon,
  ShoppingBag,
  Wallet,
} from 'lucide-react-native';
import {
  Card,
  EmptyState,
  ErrorState,
  Price,
  Screen,
  SectionHeader,
  Skeleton,
  Text,
  useTheme,
} from '@getrentos/ui-native';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { MetricGrid } from '@/components/dashboard/MetricGrid';
import { qk } from '@/lib/query/keys';
import { buyerApi } from '@/lib/api/buyer';
import { useAuth } from '@/lib/auth/AuthProvider';
import { firstName, relativeTime } from '@/lib/format';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function BuyerHome() {
  const { profile } = useAuth();
  const { colors, spacing } = useTheme();

  const dashboard = useQuery({ queryKey: qk.buyer.dashboard, queryFn: buyerApi.dashboard });

  const metrics = dashboard.data
    ? [
        {
          label: 'Saved',
          value: dashboard.data.savedListings,
          Icon: Heart,
          onPress: () => router.push('/(app)/buyer-saved'),
        },
        {
          label: 'Offers',
          value: dashboard.data.activeOffers,
          Icon: FileSignature,
          onPress: () => router.push('/(app)/(buyer)/offers'),
        },
        {
          label: 'Viewings',
          value: dashboard.data.upcomingViewings,
          Icon: HomeIcon,
          onPress: () => router.push('/(app)/buyer-viewings'),
        },
        { label: 'Purchases', value: dashboard.data.completedPurchases, Icon: ShoppingBag },
        {
          label: 'Documents',
          value: dashboard.data.documentsUploaded,
          Icon: FileText,
          onPress: () => router.push('/(app)/buyer-documents'),
        },
      ]
    : [];

  if (dashboard.isError) {
    return (
      <Screen refreshing={dashboard.isRefetching} onRefresh={() => dashboard.refetch()}>
        <DashboardHeader
          eyebrow={greeting()}
          title={firstName(profile?.legalName)}
          roleBadge="BY"
          subtitle="Your property journey, at a glance"
        />
        <ErrorState
          title="We couldn't load your dashboard"
          description="Check your connection and try again. Your saved homes and offers are safe."
          onRetry={() => dashboard.refetch()}
        />
      </Screen>
    );
  }

  return (
    <Screen refreshing={dashboard.isRefetching} onRefresh={() => dashboard.refetch()}>
      <DashboardHeader
        eyebrow={greeting()}
        title={firstName(profile?.legalName)}
        roleBadge="BY"
        subtitle="Your property journey, at a glance"
      />

      <MetricGrid metrics={metrics} loading={dashboard.isPending} />

      {dashboard.data?.activeTransactions ? (
        <Pressable
          onPress={() => router.push('/(app)/buyer-transactions')}
          accessibilityRole="button"
          accessibilityLabel={`${dashboard.data.activeTransactions} active ${dashboard.data.activeTransactions === 1 ? 'transaction' : 'transactions'}`}
          accessibilityHint="Opens your purchase payment progress"
        >
          <Card
            elevated
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.md,
              backgroundColor: colors.accent,
            }}
          >
            <Wallet size={20} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">
                {dashboard.data.activeTransactions} active{' '}
                {dashboard.data.activeTransactions === 1 ? 'transaction' : 'transactions'}
              </Text>
              <Text variant="caption" color="mutedForeground">
                Track your purchase payment
              </Text>
            </View>
            <ChevronRight size={18} color={colors.primary} />
          </Card>
        </Pressable>
      ) : null}

      <View style={{ gap: spacing.md }}>
        <SectionHeader
          title="Recommended for you"
          description="Verified opportunities matched to your activity"
          actionLabel="See all"
          onAction={() => router.push('/(app)/(buyer)/discover')}
        />

        {dashboard.isPending ? (
          <Skeleton height={140} radius={16} />
        ) : !dashboard.data?.recommendations?.length ? (
          <EmptyState
            icon={<HomeIcon size={30} color={colors.mutedForeground} />}
            title="Your recommendations are warming up"
            description="Browse and save a few properties so we can tailor this space to you."
          />
        ) : (
          dashboard.data.recommendations.map((r) => (
            <Pressable
              key={r.id}
              onPress={() => router.push(`/(app)/buyer-listing/${r.id}`)}
              accessibilityRole="button"
              accessibilityLabel={`${r.title}, ${r.city}, ${Math.round(r.price).toLocaleString('en-NG')} naira`}
              accessibilityHint="Opens property details"
            >
              <Card elevated>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyStrong" numberOfLines={1}>
                      {r.title}
                    </Text>
                    <Text variant="caption" color="mutedForeground">
                      {r.city}
                    </Text>
                  </View>
                  <Price amount={r.price} variant="bodyStrong" />
                </View>
              </Card>
            </Pressable>
          ))
        )}
      </View>

      {dashboard.data?.recentActivity?.length ? (
        <View style={{ gap: spacing.md }}>
          <SectionHeader
            title="Recent activity"
            description="Offers, viewings and payment updates"
          />
          <Card elevated padding="none">
            {dashboard.data.recentActivity.slice(0, 6).map((a, i) => (
              <View
                key={a.id}
                accessible
                accessibilityLabel={`${a.message}, ${relativeTime(a.timestamp)}`}
                style={{
                  flexDirection: 'row',
                  gap: spacing.md,
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.md,
                  borderTopWidth: i ? 1 : 0,
                  borderTopColor: colors.border,
                }}
              >
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    marginTop: 6,
                    backgroundColor: colors.primary,
                  }}
                />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="callout">{a.message}</Text>
                  <Text variant="caption" color="mutedForeground">
                    {relativeTime(a.timestamp)}
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        </View>
      ) : null}
    </Screen>
  );
}
