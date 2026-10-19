import type { ReactNode } from 'react';
import { Pressable, Switch, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../theme';
import { Text } from './Text';

/* -------------------------------- SwitchRow -------------------------------- */

export interface SwitchRowProps {
  label: string;
  description?: string;
  /** Spoken name when the visible label needs context ("Email for rent reminders"). */
  accessibilityLabel?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  /** Shown left of the text, e.g. a channel icon. */
  icon?: ReactNode;
  /** `destructive` turns the track red when on, for switches like "Emergency". */
  tone?: 'default' | 'destructive';
  style?: StyleProp<ViewStyle>;
}

/**
 * A settings row with a switch. The whole row toggles and is one element for
 * screen readers ("Push notifications, switch, on"), with a 52-point target.
 */
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
        // The row carries the semantics; the switch itself would be announced twice.
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        trackColor={{
          true: tone === 'destructive' ? colors.destructive : colors.primary,
          false: colors.border,
        }}
        thumbColor={colors.card}
        ios_backgroundColor={colors.border}
      />
    </Pressable>
  );
}

/* -------------------------------- RadioGroup -------------------------------- */

export interface RadioOption<T extends string = string> {
  value: T;
  label: string;
  description?: string;
  /** Right-aligned detail: a price, a count. */
  aside?: string;
  disabled?: boolean;
}

export interface RadioGroupProps<T extends string> {
  value: T | null | undefined;
  onChange: (value: T) => void;
  options: readonly RadioOption<T>[];
  /** `list`: compact rows. `card`: each option a bordered, selectable tile. */
  variant?: 'list' | 'card';
  label?: string;
  /** Spoken group name when the screen shows its own heading instead of `label`. */
  accessibilityLabel?: string;
  error?: string;
  style?: StyleProp<ViewStyle>;
}

/** Choose one of a few options that should all be visible at once. */
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
                  // Keep the content still when the border thickens.
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
