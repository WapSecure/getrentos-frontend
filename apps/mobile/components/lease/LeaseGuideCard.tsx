import { Share, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, TriangleAlert } from 'lucide-react-native';
import { Button, Card, Skeleton, Text, useTheme } from '@sureground/ui-native';
import { leaseGuideApi } from '@/lib/api/leaseGuide';
import { qk } from '@/lib/query/keys';

export function LeaseGuideCard() {
  const { colors, spacing, radius } = useTheme();
  const q = useQuery({
    queryKey: qk.renter.leaseGuide,
    queryFn: leaseGuideApi.get,
    staleTime: 10 * 60_000,
  });
  if (q.isLoading) return <Skeleton height={140} radius={radius.md} />;
  const g = q.data;
  if (!g) return null;
  const notice = g.facts.notices[0];

  return (
    <Card elevated padding={spacing.lg}>
      <View style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <BookOpen size={18} color={colors.primary} />
          <Text variant="bodyStrong" headingLevel={2}>
            Your lease, explained
          </Text>
        </View>
        {notice ? (
          <View style={{ flexDirection: 'row', gap: spacing.xs }} accessibilityRole="alert">
            <TriangleAlert size={16} color={colors.destructive} />
            <Text variant="callout" style={{ flex: 1 }}>
              You have been served a {notice.kind}
              {notice.served ? ` on ${notice.served}` : ''}
              {notice.expires ? `, running out on ${notice.expires}` : ''}. Consider speaking to a
              lawyer.
            </Text>
          </View>
        ) : null}
        {g.summary.map((point) => (
          <Text key={point} variant="callout">
            • {point}
          </Text>
        ))}
        {g.renewalAdvice ? (
          <View style={{ gap: 4, marginTop: spacing.xs }}>
            <Text variant="label">About your renewal offer</Text>
            <Text variant="callout">{g.renewalAdvice}</Text>
            {g.termsToAsk.map((t) => (
              <Text key={t} variant="caption" color="mutedForeground">
                • {t}
              </Text>
            ))}
          </View>
        ) : null}
        {g.counterOfferDraft ? (
          <Button
            label="Send a counter-offer message"
            variant="outline"
            size="sm"
            onPress={() => Share.share({ message: g.counterOfferDraft! })}
            accessibilityHint="Opens your share options with a drafted message to your landlord"
          />
        ) : null}
        <Text variant="caption" color="mutedForeground">
          {g.disclaimer}
        </Text>
      </View>
    </Card>
  );
}
