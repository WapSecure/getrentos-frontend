import { View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, useTheme } from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import { trustScoreApi } from '@/lib/api/trustScore';
import { formatDate } from '@/lib/format';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { TrustOverview } from '@/components/trust/TrustOverview';
import { goBack } from '@/lib/goBack';

/** The renter's Trust & Verification screen (same content as the web page). */
export default function TrustScore() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  // Recorded score changes, each with its reason, shown inside the details.
  const history = useQuery({
    queryKey: qk.renter.trustScore,
    queryFn: trustScoreApi.getOverview,
    select: (d) => d.history,
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.sm,
        }}
      >
        <DetailHeader
          eyebrow="Trust and verification"
          title="Trust score"
          subtitle="Your identity, what renting needs, and your score"
          onBack={() => goBack()}
        />
      </View>
      <TrustOverview
        portal="renter"
        onAction={(key) =>
          router.push(key === 'EMAIL' ? '/(app)/edit-profile' : '/(app)/verify-identity')
        }
        moreDetails={
          history.data?.length ? (
            <View style={{ gap: spacing.xs }}>
              <Text variant="bodyStrong">Score changes</Text>
              {history.data.map((h, i) => (
                <Text key={`${h.date}-${i}`} variant="caption" color="mutedForeground">
                  {formatDate(h.date, 'short')}: {h.reason} ({h.change >= 0 ? '+' : ''}
                  {h.change})
                </Text>
              ))}
            </View>
          ) : null
        }
      />
    </View>
  );
}
