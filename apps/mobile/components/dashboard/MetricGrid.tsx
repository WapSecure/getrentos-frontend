import { Pressable, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Card, Skeleton, Text, useTheme } from '@getrentos/ui-native';

export type DashboardMetric = {
  label: string;
  value: string | number;
  Icon: LucideIcon;
  onPress?: () => void;
};

export function MetricGrid({ metrics, loading }: { metrics: DashboardMetric[]; loading: boolean }) {
  const { colors, spacing, radius } = useTheme();
  const rows: { metric?: DashboardMetric; index: number }[] = loading
    ? Array.from({ length: 4 }, (_, index) => ({ index }))
    : metrics.map((metric, index) => ({ metric, index }));

  return (
    <Card elevated padding="none" accessibilityLabel="Dashboard summary">
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {rows.map((row) => {
          const metric = row.metric;
          const content = loading ? (
            <>
              <Skeleton height={34} width={34} radius={radius.md} />
              <Skeleton height={22} width={42} />
              <Skeleton height={12} width={58} />
            </>
          ) : metric ? (
            <>
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: radius.md,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.accent,
                }}
              >
                <metric.Icon size={17} color={colors.primary} />
              </View>
              <Text variant="title" style={{ fontSize: 21, lineHeight: 25 }}>
                {metric.value}
              </Text>
              <Text variant="caption" color="mutedForeground">
                {metric.label}
              </Text>
            </>
          ) : null;

          const style = {
            width: '50%' as const,
            minHeight: 112,
            alignItems: 'flex-start' as const,
            justifyContent: 'center' as const,
            gap: 6,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            borderLeftWidth: row.index % 2 === 1 ? 1 : 0,
            borderTopWidth: row.index >= 2 ? 1 : 0,
            borderColor: colors.border,
          };

          return metric?.onPress ? (
            <Pressable
              key={metric.label}
              onPress={metric.onPress}
              accessibilityRole="button"
              accessibilityLabel={`${metric.label}: ${metric.value}`}
              style={({ pressed }) => [style, pressed && { backgroundColor: colors.secondary }]}
            >
              {content}
            </Pressable>
          ) : (
            <View
              key={metric?.label ?? row.index}
              accessibilityLabel={metric ? `${metric.label}: ${metric.value}` : undefined}
              style={style}
            >
              {content}
            </View>
          );
        })}
      </View>
    </Card>
  );
}
