import { useState } from 'react';
import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { AlertOctagon, CheckCircle2, Circle, ClipboardCheck, Clock } from 'lucide-react-native';
import { Button, Card, Skeleton, Text, useTheme } from '@getrentos/ui-native';
import { buyerApi, type BuyerDiligence } from '@/lib/api/buyer';
import { qk } from '@/lib/query/keys';

/**
 * "Check before you buy" on the phone: each due-diligence step marked from
 * what is on file, with questions for the seller. Loads only when asked.
 */
export function DiligenceCard({ listingId }: { listingId: string }) {
  const { colors, spacing, radius } = useTheme();
  const [asked, setAsked] = useState(false);
  const q = useQuery({
    queryKey: qk.buyer.diligence(listingId),
    queryFn: () => buyerApi.diligence(listingId),
    enabled: asked,
    staleTime: 5 * 60_000,
    retry: false,
  });
  const STATUS: Record<
    BuyerDiligence['items'][number]['status'],
    { Icon: typeof Circle; color: string; label: string }
  > = {
    done: { Icon: CheckCircle2, color: colors.success, label: 'Done' },
    in_progress: { Icon: Clock, color: colors.warning, label: 'In progress' },
    to_do: { Icon: Circle, color: colors.mutedForeground, label: 'To do' },
    concern: { Icon: AlertOctagon, color: colors.destructive, label: 'Concern' },
  };

  if (!asked) {
    return (
      <Button
        label="Check before you buy"
        variant="outline"
        icon={<ClipboardCheck size={16} color={colors.foreground} />}
        onPress={() => setAsked(true)}
      />
    );
  }
  if (q.isLoading) return <Skeleton height={140} radius={radius.md} />;
  const d = q.data;
  if (!d) {
    return (
      <Text variant="caption" color="mutedForeground">
        The checklist did not load. Ask the seller for the title document and use a property lawyer
        before you pay.
      </Text>
    );
  }
  return (
    <Card elevated>
      <View style={{ gap: spacing.sm }}>
        <Text variant="bodyStrong" headingLevel={2}>
          Check before you buy
        </Text>
        <Text variant="callout">{d.summary}</Text>
        {d.price.vsSimilar ? (
          <Text variant="caption" color="mutedForeground">
            {d.price.vsSimilar}
          </Text>
        ) : null}
        {d.items.map((item) => {
          const { Icon, color, label } = STATUS[item.status];
          return (
            <View
              key={item.key}
              style={{ flexDirection: 'row', gap: spacing.xs }}
              accessibilityLabel={`${label}: ${item.title}. ${item.finding}`}
            >
              <Icon size={16} color={color} style={{ marginTop: 2 }} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="label">{item.title}</Text>
                <Text variant="caption">{item.finding}</Text>
                <Text variant="caption" color="mutedForeground">
                  Why it matters: {item.why}
                </Text>
              </View>
            </View>
          );
        })}
        {d.questions.length ? (
          <>
            <Text variant="label">Ask the seller</Text>
            {d.questions.map((x) => (
              <Text key={x} variant="caption" color="mutedForeground">
                • {x}
              </Text>
            ))}
          </>
        ) : null}
        <Text variant="caption" color="mutedForeground">
          {d.disclaimer}
        </Text>
      </View>
    </Card>
  );
}
