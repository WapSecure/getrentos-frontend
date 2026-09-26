import { View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle,
  Crown,
  Mail,
  Phone,
  Shield,
  Star,
  User,
  Users,
  Award,
  ClipboardCheck,
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
import {
  buyerTrustProfileApi,
  type TrustBadge,
  type VerificationItem,
} from '@/lib/api/buyerTrustProfile';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';

const ICONS: Record<string, typeof Shield> = {
  User,
  Mail,
  Phone,
  Shield,
  Users,
  CheckCircle,
  Star,
  Crown,
  Award,
  ClipboardCheck,
};

function Icon({ name, size, color }: { name: string; size: number; color: string }) {
  const Comp = ICONS[name] ?? Shield;
  return <Comp size={size} color={color} />;
}

export default function BuyerTrustProfile() {
  const { colors, spacing } = useTheme();
  const query = useQuery({ queryKey: qk.buyer.trustProfile, queryFn: buyerTrustProfileApi.get });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Buyer reputation"
        title="Trust & verification"
        subtitle="Identity checks, activity and earned badges"
        onBack={() => router.back()}
      />

      {query.isLoading ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          <Skeleton height={120} radius={16} />
          <Skeleton height={200} radius={16} />
        </View>
      ) : query.isError || !query.data ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : (
        <Screen padded>
          <Card elevated>
            <View style={{ alignItems: 'center', gap: spacing.xs }}>
              <Text variant="display" style={{ fontSize: 44, fontWeight: '800' }}>
                {query.data.trustScore}
              </Text>
              <Text variant="caption" color="mutedForeground">
                out of 100
              </Text>
            </View>
            <View style={{ marginTop: spacing.md }}>
              <Progress value={Math.max(0, Math.min(1, query.data.trustScore / 100))} height={8} />
            </View>
            <Text
              variant="caption"
              color="mutedForeground"
              style={{ marginTop: spacing.sm, textAlign: 'center' }}
            >
              {query.data.trustScore >= query.data.averageScore ? 'Above' : 'Below'} the average
              buyer score of {query.data.averageScore}
            </Text>
          </Card>

          {query.data.stats.length > 0 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
              {query.data.stats.map((s) => (
                <View key={s.label} style={{ flex: 1, minWidth: '45%' }}>
                  <Card elevated>
                    <Text variant="bodyStrong">{s.value}</Text>
                    <Text variant="caption" color="mutedForeground">
                      {s.label}
                    </Text>
                  </Card>
                </View>
              ))}
            </View>
          ) : null}

          <View style={{ gap: spacing.sm }}>
            <Text variant="heading">Verifications</Text>
            <Card elevated padding="none">
              {query.data.verifications.map((v: VerificationItem, i) => (
                <View key={v.id}>
                  {i > 0 ? <Divider /> : null}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.md,
                      padding: spacing.lg,
                    }}
                  >
                    <View
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 17,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: v.verified ? colors.successSubtle : colors.secondary,
                      }}
                    >
                      <Icon
                        name={v.icon}
                        size={16}
                        color={v.verified ? colors.success : colors.mutedForeground}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyStrong">{v.label}</Text>
                      <Text variant="caption" color="mutedForeground">
                        {v.description}
                      </Text>
                    </View>
                    {v.verified ? <CheckCircle size={18} color={colors.success} /> : null}
                  </View>
                </View>
              ))}
            </Card>
          </View>

          {query.data.badges.length > 0 ? (
            <View style={{ gap: spacing.sm }}>
              <Text variant="heading">Badges</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {query.data.badges.map((b: TrustBadge) => (
                  <View
                    key={b.id}
                    style={{
                      width: '31%',
                      alignItems: 'center',
                      gap: 6,
                      padding: spacing.md,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: colors.border,
                      backgroundColor: b.earned ? colors.accent : colors.card,
                      opacity: b.earned ? 1 : 0.55,
                    }}
                  >
                    <Icon
                      name={b.icon}
                      size={22}
                      color={b.earned ? colors.accentForeground : colors.mutedForeground}
                    />
                    <Text variant="caption" center numberOfLines={2} style={{ fontWeight: '600' }}>
                      {b.name}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </Screen>
      )}
    </View>
  );
}
