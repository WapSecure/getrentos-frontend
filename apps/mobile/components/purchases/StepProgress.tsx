import { View } from 'react-native';
import { Progress, Text, useTheme } from '@sureground/ui-native';

/** "Purchase steps 3/8" over a bar: how far along a path something is. */
export function StepProgress({
  label,
  done,
  total,
}: {
  label: string;
  done: number;
  total: number;
}) {
  const { spacing } = useTheme();
  return (
    <View style={{ gap: spacing.xs }}>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <Text variant="caption" color="mutedForeground" style={{ flex: 1 }}>
          {label}
        </Text>
        <Text variant="caption" color="mutedForeground" style={{ fontVariant: ['tabular-nums'] }}>
          {done}/{total}
        </Text>
      </View>
      <Progress
        value={total > 0 ? done / total : 0}
        height={6}
        accessibilityLabel={`${label}, ${done} of ${total}`}
      />
    </View>
  );
}
