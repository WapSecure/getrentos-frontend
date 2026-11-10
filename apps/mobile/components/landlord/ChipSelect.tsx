import { ScrollView, View } from 'react-native';
import { Chip, Text, useTheme } from '@sureground/ui-native';

interface Option<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  label?: string;
  options: Option<T>[];
  value: T | undefined;
  onChange: (value: T) => void;
  emptyText?: string;
  disabled?: boolean;
  /** One scrolling row instead of wrapping, for long lists such as property names. */
  scroll?: boolean;
}

export function ChipSelect<T extends string>({
  label,
  options,
  value,
  onChange,
  emptyText,
  disabled = false,
  scroll = false,
}: Props<T>) {
  const { spacing } = useTheme();
  const chips = options.map((o) => (
    <Chip
      key={o.value}
      label={o.label}
      selected={o.value === value}
      onPress={() => onChange(o.value)}
      disabled={disabled}
    />
  ));

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
      ) : scroll ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.sm }}
          accessibilityLabel={label}
        >
          {chips}
        </ScrollView>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>{chips}</View>
      )}
    </View>
  );
}
