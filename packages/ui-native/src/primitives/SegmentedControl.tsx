import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme';
import { Text } from './Text';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  /** A count beside the label, such as how many items the segment holds. */
  count?: number;
  /** `warning` when something in the segment needs the viewer. */
  countTone?: 'neutral' | 'warning';
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: SegmentedControlProps<T>) {
  const { colors, radius, shadows } = useTheme();

  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      style={[styles.track, { backgroundColor: colors.secondary, borderRadius: radius.md }]}
    >
      {options.map((opt, i) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            accessibilityRole="tab"
            accessibilityLabel={`${opt.label}${opt.count === undefined ? '' : `, ${opt.count}`}, ${i + 1} of ${options.length}`}
            accessibilityState={{ selected: active }}
            aria-selected={active}
            onPress={() => {
              if (!active) onChange(opt.value);
            }}
            style={[
              styles.segment,
              { borderRadius: radius.md - 3 },
              active && [{ backgroundColor: colors.card }, shadows.xs],
            ]}
          >
            {opt.icon}
            <Text
              variant="callout"
              style={{
                flexShrink: 1,
                textAlign: 'center',
                color: active ? colors.primary : colors.mutedForeground,
                fontWeight: active ? '700' : '500',
              }}
              numberOfLines={opt.count === undefined ? 1 : 2}
            >
              {opt.label}
            </Text>
            {opt.count === undefined ? null : (
              <Text
                variant="caption"
                style={{
                  color: opt.countTone === 'warning' ? colors.warning : colors.mutedForeground,
                  fontWeight: '700',
                  fontVariant: ['tabular-nums'],
                }}
              >
                {opt.count}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', padding: 3, gap: 3 },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
});
