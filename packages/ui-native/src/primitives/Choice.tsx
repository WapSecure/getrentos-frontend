import type { ReactNode } from 'react';
import { Pressable, Switch, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../theme';
import { Text } from './Text';

export interface SwitchRowProps {
  label: string;
  description?: string;
  accessibilityLabel?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  icon?: ReactNode;
  tone?: 'default' | 'destructive';
  style?: StyleProp<ViewStyle>;
}

export function SwitchRow({
  label,
  description,
  accessibilityLabel,
  value,
  onValueChange,
  disabled,
  icon,
  tone = 'default',
  style,
}: SwitchRowProps) {
  const { colors, spacing } = useTheme();
  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={description}
      accessibilityState={{ checked: value, disabled }}
      aria-checked={value}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          minHeight: 52,
          paddingVertical: spacing.xs,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {icon ? <View>{icon}</View> : null}
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="bodyStrong">{label}</Text>
        {description ? (
          <Text variant="caption" color="mutedForeground">
            {description}
          </Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        trackColor={{
          true: tone === 'destructive' ? colors.destructive : colors.primary,
          false: colors.border,
        }}
        // A card-coloured thumb disappears into a dark track.
        thumbColor={colors.primaryForeground}
        ios_backgroundColor={colors.border}
        // react-native-web paints the on thumb with its own teal unless told otherwise.
        {...({ activeThumbColor: colors.primaryForeground } as object)}
      />
    </Pressable>
  );
}

export interface RadioOption<T extends string = string> {
  value: T;
  label: string;
  description?: string;
  aside?: string;
  disabled?: boolean;
}

export interface RadioGroupProps<T extends string> {
  value: T | null | undefined;
  onChange: (value: T) => void;
  options: readonly RadioOption<T>[];
  variant?: 'list' | 'card';
  label?: string;
  accessibilityLabel?: string;
  error?: string;
  style?: StyleProp<ViewStyle>;
}

export function RadioGroup<T extends string>({
  value,
  onChange,
  options,
  variant = 'list',
  label,
  accessibilityLabel,
  error,
  style,
}: RadioGroupProps<T>) {
  const { colors, spacing, radius } = useTheme();
  const card = variant === 'card';
  return (
    <View
      style={[{ gap: spacing.sm }, style]}
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel ?? label}
    >
      {label ? (
        <Text
          variant="callout"
          color="mutedForeground"
          style={{ marginLeft: 4, fontWeight: '600' }}
        >
          {label}
        </Text>
      ) : null}
      <View style={{ gap: card ? spacing.sm : 0 }}>
        {options.map((option, index) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              disabled={option.disabled}
              accessibilityRole="radio"
              accessibilityLabel={[option.label, option.aside].filter(Boolean).join(', ')}
              accessibilityHint={option.description}
              accessibilityState={{ checked: selected, disabled: option.disabled }}
              aria-checked={selected}
              accessibilityValue={{ text: `${index + 1} of ${options.length}` }}
              style={({ pressed }) => [
                {
                  flexDirection: 'row',
                  alignItems: option.description ? 'flex-start' : 'center',
                  gap: spacing.md,
                  minHeight: 48,
                  opacity: option.disabled ? 0.45 : pressed ? 0.85 : 1,
                },
                card && {
                  padding: spacing.lg,
                  borderRadius: radius.md,
                  borderWidth: selected ? 2 : 1,
                  borderColor: selected
                    ? colors.primary
                    : error
                      ? colors.destructive
                      : colors.border,
                  backgroundColor: colors.card,
                  margin: selected ? 0 : 1,
                },
              ]}
            >
              <View
                style={{
                  width: 22,
                  height: 22,
                  marginTop: option.description ? 1 : 0,
                  borderRadius: 11,
                  borderWidth: selected ? 7 : 1.5,
                  borderColor: selected
                    ? colors.primary
                    : error
                      ? colors.destructive
                      : colors.border,
                  backgroundColor: colors.card,
                }}
              />
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="bodyStrong">{option.label}</Text>
                {option.description ? (
                  <Text variant="caption" color="mutedForeground">
                    {option.description}
                  </Text>
                ) : null}
              </View>
              {option.aside ? (
                <Text variant="bodyStrong" style={{ fontVariant: ['tabular-nums'] }}>
                  {option.aside}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
      {error ? (
        <Text
          variant="caption"
          color="destructive"
          accessibilityLiveRegion="polite"
          style={{ marginLeft: 4 }}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}
