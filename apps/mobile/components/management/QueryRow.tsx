import { View } from 'react-native';
import { router } from 'expo-router';
import { Badge, Card, PressableScale, Text, useTheme } from '@sureground/ui-native';
import { querySlaText, queryStatusBadge, type QuerySummary } from '@/lib/api/management';
import { formatDateTime } from '@/lib/format';

/**
 * One owner–manager question in a list. The owner sees who manages the
 * property; the manager sees which owner asked.
 */
export function QueryRow({ query: q }: { query: QuerySummary }) {
  const { spacing, colors } = useTheme();
  const badge = queryStatusBadge(q);
  const counterpart = q.viewerSide === 'OWNER' ? q.manager : (q.ownerName ?? 'Owner');
  return (
    <PressableScale
      onPress={() => router.push(`/(app)/manager-query/${q.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`${q.subject}, ${badge.label}`}
      style={{ marginBottom: spacing.sm }}
    >
      <Card padding={spacing.lg}>
        <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="bodyStrong">{q.subject}</Text>
            <Text variant="caption" color="mutedForeground" numberOfLines={1}>
              {q.propertyTitle} · {counterpart}
              {q.lastMessage ? ` · ${q.lastMessage.preview}` : ''}
            </Text>
            <Text
              variant="caption"
              style={{ color: q.late ? colors.destructive : colors.mutedForeground }}
            >
              {querySlaText(q, (iso) => formatDateTime(iso))}
            </Text>
          </View>
          <Badge label={badge.label} tone={badge.tone} />
        </View>
      </Card>
    </PressableScale>
  );
}
