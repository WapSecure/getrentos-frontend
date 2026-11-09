import type { ReactNode } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useTheme } from '../theme';
import { Text } from './Text';
import { Card } from './Card';
import { Skeleton } from './misc';

export interface StatGroupItem {
  label: string;
  value: string | number;
  subtitle?: string;
  /** A change against an earlier period; `tone` says whether it is good news, not its direction. */
  trend?: { label: string; tone: 'positive' | 'negative' | 'neutral' };
  /** Makes the figure the way into its screen. */
  onPress?: () => void;
  /** Draws attention to a figure that needs action (overdue rent), without colouring the value. */
  attention?: boolean;
}

export interface StatGroupProps {
  title: string;
  items: StatGroupItem[];
  /** Content under the figures, such as a SegmentedBar. */
  footer?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

// Two figures to a row on a phone; an odd last figure takes the full row.
function cellFrame(index: number, count: number) {
  const fullRow = count % 2 === 1 && index === count - 1;
  return {
    width: fullRow ? ('100%' as const) : ('50%' as const),
    borderLeftWidth: !fullRow && index % 2 === 1 ? 1 : 0,
    borderTopWidth: index >= 2 ? 1 : 0,
  };
}

function Figure({ item, index, count }: { item: StatGroupItem; index: number; count: number }) {
  const { colors, spacing } = useTheme();
  const trendColor =
    item.trend?.tone === 'positive'
      ? 'success'
      : item.trend?.tone === 'negative'
        ? 'destructive'
        : 'foreground';
  const description = [
    `${item.label}: ${item.value}`,
    item.trend?.label,
    item.subtitle,
    item.attention ? 'needs attention' : undefined,
  ]
    .filter(Boolean)
    .join(', ');

  const body = (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {item.attention ? (
          <View
            style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.destructive }}
          />
        ) : null}
        <Text variant="caption" color="mutedForeground" numberOfLines={2} style={{ flexShrink: 1 }}>
          {item.label}
        </Text>
        {item.onPress ? <ChevronRight size={14} color={colors.mutedForeground} /> : null}
      </View>
      <Text
        variant="title"
        style={{ fontSize: 24, lineHeight: 30, fontVariant: ['tabular-nums'] }}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {item.value}
      </Text>
      {item.trend || item.subtitle ? (
        <Text variant="caption" color="mutedForeground" numberOfLines={2}>
          {item.trend ? (
            <Text variant="caption" color={trendColor} style={{ fontWeight: '600' }}>
              {item.trend.label}
              {item.subtitle ? '  ' : ''}
            </Text>
          ) : null}
          {item.subtitle}
        </Text>
      ) : null}
    </>
  );

  const style = {
    ...cellFrame(index, count),
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderColor: colors.border,
  };

  return item.onPress ? (
    <Pressable
      onPress={item.onPress}
      accessibilityRole="button"
      accessibilityLabel={description}
      style={({ pressed }) => [style, pressed && { backgroundColor: colors.secondary }]}
    >
      {body}
    </Pressable>
  ) : (
    <View accessible accessibilityRole="text" accessibilityLabel={description} style={style}>
      {body}
    </View>
  );
}

/** Related figures in one panel, divided by hairlines, instead of a box per number. */
export function StatGroup({ title, items, footer, style }: StatGroupProps) {
  const { colors, spacing } = useTheme();
  return (
    <Card padding="none" style={style}>
      <View
        style={{
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          borderBottomWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Text variant="callout" headingLevel={2} style={{ fontWeight: '600' }}>
          {title}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {items.map((item, index) => (
          <Figure key={item.label} item={item} index={index} count={items.length} />
        ))}
      </View>
      {footer ? (
        <View
          style={{
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            borderTopWidth: 1,
            borderColor: colors.border,
          }}
        >
          {footer}
        </View>
      ) : null}
    </Card>
  );
}

/** Shaped like StatGroup panels; `groups` gives the number of figures in each panel. */
export function StatGroupSkeleton({
  groups = [4],
  style,
}: {
  groups?: number[];
  style?: StyleProp<ViewStyle>;
}) {
  const { colors, spacing } = useTheme();
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
      accessibilityState={{ busy: true }}
      style={[{ gap: spacing.lg }, style]}
    >
      {groups.map((count, groupIndex) => (
        <Card key={groupIndex} padding="none">
          <View
            style={{
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.md,
              borderBottomWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Skeleton height={14} width="40%" />
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {Array.from({ length: count }).map((_, index) => (
              <View
                key={index}
                style={{
                  ...cellFrame(index, count),
                  gap: 8,
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.md,
                  borderColor: colors.border,
                }}
              >
                <Skeleton height={12} width="60%" />
                <Skeleton height={24} width="70%" />
                <Skeleton height={11} width="50%" />
              </View>
            ))}
          </View>
        </Card>
      ))}
    </View>
  );
}
