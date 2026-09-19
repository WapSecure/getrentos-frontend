import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronRight,
  FileSignature,
  Heart,
  Home as HomeIcon,
  ShoppingBag,
  Wallet,
} from 'lucide-react-native';
import { Card, Price, Screen, Skeleton, Text, useTheme } from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { buyerApi } from '@/lib/api/buyer';
import { useAuth } from '@/lib/auth/AuthProvider';
import { firstName } from '@/lib/format';

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
      ]
    : [];

  return (
    <Screen refreshing={dashboard.isRefetching} onRefresh={() => dashboard.refetch()}>
      <View style={{ gap: spacing.xxs }}>
        <Text variant="label" color="primary" uppercase>
          {greeting()}
        </Text>
        <Text variant="title">{firstName(profile?.legalName)}</Text>
      </View>

      <Card elevated padding="none">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {dashboard.isPending
            ? [0, 1, 2, 3].map((i) => (
                <View
                  key={i}
                  style={{
                    width: '50%',
                    alignItems: 'center',
                    gap: 6,
                    paddingVertical: spacing.lg,
                  }}
                >
                  <Skeleton height={22} width={22} />
                </View>
              ))
            : metrics.map(({ label, value, Icon, onPress }, i) => (
                <Pressable
                  key={label}
                  onPress={onPress}
                  disabled={!onPress}
                  style={{
                    width: '50%',
                    alignItems: 'center',
                    gap: 6,
                    paddingVertical: spacing.lg,
                    borderLeftWidth: i % 2 === 1 ? 1 : 0,
                    borderTopWidth: i >= 2 ? 1 : 0,
                    borderColor: colors.border,
                  }}
                >
                  <Icon size={17} color={colors.mutedForeground} />
                  <Text variant="title" style={{ fontSize: 20, lineHeight: 24 }}>
                    {value}
                  </Text>
                  <Text variant="caption" color="mutedForeground">
                    {label}
                  </Text>
                </Pressable>
              ))}
        </View>
      </Card>

      {dashboard.data?.activeTransactions ? (
        <Pressable onPress={() => router.push('/(app)/buyer-transactions')}>
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
                Track your escrow progress
              </Text>
            </View>
            <ChevronRight size={18} color={colors.primary} />
          </Card>
        </Pressable>
      ) : null}

      <View style={{ gap: spacing.md }}>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Text variant="heading">Recommended for you</Text>
          <Pressable
            onPress={() => router.push('/(app)/(buyer)/discover')}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}
          >
            <Text variant="callout" color="primary" style={{ fontWeight: '600' }}>
              See all
            </Text>
            <ChevronRight size={15} color={colors.primary} />
          </Pressable>
        </View>

        {dashboard.isPending ? (
          <Skeleton height={140} radius={16} />
        ) : !dashboard.data?.recommendations?.length ? (
          <Card elevated>
            <Text variant="callout" color="mutedForeground">
              No recommendations yet — start browsing to help us learn what you like.
            </Text>
          </Card>
        ) : (
          dashboard.data.recommendations.map((r) => (
            <Pressable key={r.id} onPress={() => router.push(`/(app)/buyer-listing/${r.id}`)}>
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
    </Screen>
  );
}
