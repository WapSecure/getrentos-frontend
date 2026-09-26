import { View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CheckCircle,
  Crown,
  Mail,
  Phone,
  Shield,
  Star,
  User,
  Users,
  TrendingUp,
  TrendingDown,
} from 'lucide-react-native';
import {
  Card,
  Divider,
  ErrorState,
  Progress,
  Screen,
  Skeleton,
  Text,
  useTheme,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { trustScoreApi, type TrustBadge, type VerificationItem } from '@/lib/api/trustScore';
import { formatDate } from '@/lib/format';
import { DetailHeader } from '@/components/dashboard/DetailHeader';

const ICONS: Record<string, typeof Shield> = {
  User,
  Mail,
  Phone,
  Shield,
  Users,
  CheckCircle,
  Star,
  Crown,
};

function Icon({ name, size, color }: { name: string; size: number; color: string }) {
  const Comp = ICONS[name] ?? Shield;
  return <Comp size={size} color={color} />;
}

export default function TrustScore() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();

  const query = useQuery({ queryKey: qk.renter.trustScore, queryFn: trustScoreApi.getOverview });

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
          eyebrow="Renter reputation"
          title="Trust score"
          subtitle="Verification, payment behavior and earned badges"
          onBack={() => router.back()}
          style={{ flex: 1 }}
        />
      </View>

      {query.isLoading ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          <Skeleton height={120} radius={16} />
          <Skeleton height={200} radius={16} />
        </View>
      ) : query.isError || !query.data ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : (
        <Screen padded>
          <ScoreCard trustScore={query.data.trustScore} averageScore={query.data.averageScore} />

          <View style={{ gap: spacing.sm }}>
            <Text variant="heading">Verifications</Text>
            <Card elevated padding="none">
              {query.data.verifications.map((v, i) => (
                <VerificationRow key={v.id} item={v} showDivider={i > 0} />
              ))}
            </Card>
          </View>

          <View style={{ gap: spacing.sm }}>
            <Text variant="heading">Badges</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {query.data.badges.map((b) => (
                <BadgeTile key={b.id} badge={b} />
              ))}
            </View>
          </View>

          {query.data.history.length > 0 ? (
            <View style={{ gap: spacing.sm }}>
              <Text variant="heading">History</Text>
              <Card elevated padding="none">
                {query.data.history.map((h, i) => (
                  <View key={`${h.date}-${h.reason}`}>
                    {i > 0 ? <Divider /> : null}
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: spacing.sm,
                        padding: spacing.lg,
                      }}
                    >
                      {h.change >= 0 ? (
                        <TrendingUp size={16} color={colors.success} />
                      ) : (
                        <TrendingDown size={16} color={colors.destructive} />
                      )}
                      <View style={{ flex: 1 }}>
                        <Text variant="callout" numberOfLines={1}>
                          {h.reason}
                        </Text>
                        <Text variant="caption" color="mutedForeground">
                          {formatDate(h.date, 'short')}
                        </Text>
                      </View>
                      <Text
                        variant="callout"
                        color={h.change >= 0 ? 'success' : 'destructive'}
                        style={{ fontWeight: '700' }}
                      >
                        {h.change >= 0 ? '+' : ''}
                        {h.change}
                      </Text>
                    </View>
                  </View>
                ))}
              </Card>
            </View>
          ) : null}
        </Screen>
      )}
    </View>
  );
}

function ScoreCard({ trustScore, averageScore }: { trustScore: number; averageScore: number }) {
  const { spacing } = useTheme();
  const aboveAverage = trustScore >= averageScore;

  return (
    <Card elevated>
      <View style={{ alignItems: 'center', gap: spacing.xs }}>
        <Text variant="display" style={{ fontSize: 44, fontWeight: '800' }}>
          {trustScore}
        </Text>
        <Text variant="caption" color="mutedForeground">
          out of 100
        </Text>
      </View>
      <View style={{ marginTop: spacing.md }}>
        <Progress value={Math.max(0, Math.min(1, trustScore / 100))} height={8} />
      </View>
      <Text
        variant="caption"
        color="mutedForeground"
        style={{ marginTop: spacing.sm, textAlign: 'center' }}
      >
        {aboveAverage ? 'Above' : 'Below'} the average renter score of {averageScore}
      </Text>
    </Card>
  );
}

function VerificationRow({ item, showDivider }: { item: VerificationItem; showDivider: boolean }) {
  const { colors, spacing } = useTheme();
  return (
    <View>
      {showDivider ? <Divider /> : null}
      <View
        style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg }}
      >
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: item.verified ? colors.successSubtle : colors.secondary,
          }}
        >
          <Icon
            name={item.icon}
            size={16}
            color={item.verified ? colors.success : colors.mutedForeground}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong">{item.label}</Text>
          <Text variant="caption" color="mutedForeground">
            {item.description}
          </Text>
        </View>
        {item.verified ? <CheckCircle size={18} color={colors.success} /> : null}
      </View>
    </View>
  );
}

function BadgeTile({ badge }: { badge: TrustBadge }) {
  const { colors, spacing, radius } = useTheme();
  return (
    <View
      style={{
        width: '31%',
        alignItems: 'center',
        gap: 6,
        padding: spacing.md,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: badge.earned ? colors.accent : colors.card,
        opacity: badge.earned ? 1 : 0.55,
      }}
    >
      <Icon
        name={badge.icon}
        size={22}
        color={badge.earned ? colors.accentForeground : colors.mutedForeground}
      />
      <Text variant="caption" center numberOfLines={2} style={{ fontWeight: '600' }}>
        {badge.name}
      </Text>
    </View>
  );
}
