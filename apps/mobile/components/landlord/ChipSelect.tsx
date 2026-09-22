import { Pressable, View } from 'react-native';
import { Text, useTheme } from '@getrentos/ui-native';

interface Option<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  label?: string;
  options: Option<T>[];
  value: T | undefined;
  onChange: (value: T) => void;
  /** Shown instead of the chips when there is nothing to choose from. */
  emptyText?: string;
}

/** Single-choice chips — the landlord forms' stand-in for a select. */
export function ChipSelect<T extends string>({
  label,
  options,
  value,
  onChange,
  emptyText,
}: Props<T>) {
  const { colors, spacing, radius } = useTheme();

  return (
    <View style={{ gap: spacing.sm }}>
      {label ? (
        <Text variant="callout" color="mutedForeground" style={{ marginLeft: 4 }}>
          {label}
        </Text>
      ) : null}

      {options.length === 0 && emptyText ? (
        <Text variant="caption" color="mutedForeground" style={{ marginLeft: 4 }}>
          {emptyText}
        </Text>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {options.map((o) => {
            const selected = o.value === value;
            return (
              <Pressable
                key={o.value}
                onPress={() => onChange(o.value)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={{
                  paddingHorizontal: spacing.md,
                  paddingVertical: 8,
                  borderRadius: radius.full,
                  borderWidth: 1.5,
                  borderColor: selected ? colors.primary : colors.border,
                  backgroundColor: selected ? colors.primary + '14' : 'transparent',
                }}
              >
                <Text
                  variant="caption"
                  numberOfLines={1}
                  style={{ color: selected ? colors.primary : colors.mutedForeground }}
                >
                  {o.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
