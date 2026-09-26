import { Pressable, Share, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gift, Share2, Users } from 'lucide-react-native';
import {
  Card,
  Divider,
  EmptyState,
  ErrorState,
  Price,
  Screen,
  Skeleton,
  Text,
  useTheme,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { referralsApi, type ReferredUser } from '@/lib/api/referrals';
import { formatDate } from '@/lib/format';
import { DetailHeader } from '@/components/dashboard/DetailHeader';

export default function Referrals() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();

  const query = useQuery({ queryKey: qk.renter.referrals, queryFn: referralsApi.getSummary });

  const share = () => {
    if (!query.data) return;
    Share.share({
      message: `Join me on GetRentos — the safer way to rent, buy and manage property. Use my code ${query.data.code} when you sign up.`,
    }).catch(() => undefined);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          paddingTop: insets.top + 8,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.sm,
        }}
      >
        <DetailHeader
          eyebrow="Rewards"
          title="Referrals"
          subtitle="Invite trusted people and track earnings"
          onBack={() => router.back()}
          style={{ flex: 1 }}
        />
      </View>

      {query.isLoading ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          <Skeleton height={180} radius={16} />
        </View>
      ) : query.isError || !query.data ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : (
        <Screen padded>
          {query.data.referredByName ? (
            <Card elevated style={{ backgroundColor: colors.accent }}>
              <Text variant="callout" style={{ color: colors.accentForeground }}>
                You joined via{' '}
                <Text style={{ fontWeight: '700', color: colors.accentForeground }}>
                  {query.data.referredByName}
                </Text>
                &apos;s referral
                {query.data.refereeRewardAmount
                  ? ` — you earned ₦${query.data.refereeRewardAmount.toLocaleString()}`
                  : ''}
                .
              </Text>
            </Card>
          ) : null}

          <Card elevated>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Gift size={20} color={colors.primary} />
              <Text variant="heading">Invite friends, earn rewards</Text>
            </View>
            <Text variant="callout" color="mutedForeground" style={{ marginTop: spacing.sm }}>
              Share your code — when a friend signs up and completes their first move, you both earn
              a reward.
            </Text>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: spacing.lg,
                padding: spacing.lg,
                borderRadius: radius.md,
                borderWidth: 1,
                borderStyle: 'dashed',
                borderColor: colors.border,
              }}
            >
              <Text variant="title" style={{ fontSize: 22, letterSpacing: 2 }}>
                {query.data.code}
              </Text>
              <Pressable
                onPress={share}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                hitSlop={8}
              >
                <Share2 size={16} color={colors.primary} />
                <Text variant="callout" color="primary" style={{ fontWeight: '700' }}>
                  Share
                </Text>
              </Pressable>
            </View>
          </Card>

          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <StatCard
              icon={<Users size={16} color={colors.primary} />}
              label="People referred"
              value={String(query.data.totalReferred)}
            />
            <StatCard
              icon={<Gift size={16} color={colors.primary} />}
              label="Total earned"
              value={`₦${query.data.totalEarned.toLocaleString()}`}
            />
          </View>

          <View style={{ gap: spacing.sm }}>
            <Text variant="heading">Referral history</Text>
            {query.data.referrals.length === 0 ? (
              <EmptyState
                icon={<Users size={34} color={colors.mutedForeground} />}
                title="No referrals yet"
                description="Share your code to start earning rewards."
              />
            ) : (
              <Card elevated padding="none">
                {query.data.referrals.map((r: ReferredUser, i) => (
                  <View key={`${r.name}-${r.date}`}>
                    {i > 0 ? <Divider /> : null}
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: spacing.lg,
                      }}
                    >
                      <View>
                        <Text variant="callout">{r.name}</Text>
                        <Text variant="caption" color="mutedForeground">
                          {formatDate(r.date, 'short')}
                        </Text>
                      </View>
                      <Price amount={r.rewardAmount} variant="callout" />
                    </View>
                  </View>
                ))}
              </Card>
            )}
          </View>
        </Screen>
      )}
    </View>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  const { spacing } = useTheme();
  return (
    <Card elevated style={{ flex: 1 }}>
      {icon}
      <Text variant="title" style={{ fontSize: 20, marginTop: spacing.sm }}>
        {value}
      </Text>
      <Text variant="caption" color="mutedForeground">
        {label}
      </Text>
    </Card>
  );
}
