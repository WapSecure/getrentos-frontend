import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Text, useTheme } from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import { trustScoreApi } from '@/lib/api/trustScore';
import { formatDate } from '@/lib/format';
import { TrustScreen } from '@/components/trust/TrustScreen';

function ScoreHistory() {
  const { spacing } = useTheme();
  const history = useQuery({
    queryKey: qk.renter.trustScore,
    queryFn: trustScoreApi.getOverview,
    select: (d) => d.history,
  });
  if (!history.data?.length) return null;

  return (
    <View style={{ gap: spacing.xs }}>
      <Text variant="bodyStrong">Score changes</Text>
      {history.data.map((h, i) => (
        <Text key={`${h.date}-${i}`} variant="caption" color="mutedForeground">
          {formatDate(h.date, 'short')}: {h.reason} ({h.change >= 0 ? '+' : ''}
          {h.change})
        </Text>
      ))}
    </View>
  );
}

export default function TrustScore() {
  return <TrustScreen portal="renter" eyebrow="Renter reputation" moreDetails={<ScoreHistory />} />;
}
