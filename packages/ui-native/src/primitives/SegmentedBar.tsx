import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../theme';
import { Text } from './Text';

export interface SegmentedBarSegment {
  label: string;
  value: number;
  tone: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
}

/** Parts of a whole (occupied, reserved, vacant) as one bar with a legend. */
export function SegmentedBar({
  segments,
  label,
  style,
}: {
  segments: SegmentedBarSegment[];
  /** What the whole bar measures, for screen readers ("Units by status"). */
  label: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors, spacing } = useTheme();
  const tone = {
    primary: colors.primary,
    success: colors.success,
    warning: colors.warning,
    danger: colors.destructive,
    neutral: colors.border,
  };
  const total = segments.reduce((sum, s) => sum + Math.max(0, s.value), 0);
  const summary = segments.map((s) => `${s.label} ${s.value}`).join(', ');
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`${label}: ${summary}`}
      style={[{ gap: spacing.md }, style]}
    >
      <View
        style={{
          flexDirection: 'row',
          height: 8,
          borderRadius: 4,
          overflow: 'hidden',
          backgroundColor: colors.secondary,
        }}
      >
        {total > 0 &&
          segments.map((s) =>
            s.value > 0 ? (
              <View key={s.label} style={{ flex: s.value, backgroundColor: tone[s.tone] }} />
            ) : null
          )}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: spacing.lg, rowGap: 6 }}>
        {segments.map((s) => (
          <View key={s.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: tone[s.tone] }} />
            <Text variant="caption" color="mutedForeground">
              {s.label}
            </Text>
            <Text variant="caption" style={{ fontWeight: '600', fontVariant: ['tabular-nums'] }}>
              {s.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
