import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme';
import { Text } from './Text';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Names the group for screen readers, e.g. "Sign-in method". */
  accessibilityLabel?: string;
}

/** iOS-style segmented control — used for the auth method switchers. */
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
            accessibilityLabel={`${opt.label}, ${i + 1} of ${options.length}`}
            accessibilityState={{ selected: active }}
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
                color: active ? colors.primary : colors.mutedForeground,
                fontWeight: active ? '700' : '500',
              }}
              numberOfLines={1}
            >
              {opt.label}
            </Text>
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
    minHeight: 40,
    paddingVertical: 8,
  },
});
