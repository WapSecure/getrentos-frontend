import { View } from 'react-native';
import { Chip, Text, useTheme } from '@getrentos/ui-native';

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
  disabled?: boolean;
}

/** Single-choice chips: the landlord forms' stand-in for a select. */
export function ChipSelect<T extends string>({
  label,
  options,
  value,
  onChange,
  emptyText,
  disabled = false,
}: Props<T>) {
  const { spacing } = useTheme();

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
              <Chip
                key={o.value}
                label={o.label}
                selected={selected}
                onPress={() => onChange(o.value)}
                disabled={disabled}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}
