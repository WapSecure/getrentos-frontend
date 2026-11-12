import { useEffect, type ReactNode } from 'react';
import {
  AccessibilityInfo,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type AccessibilityRole,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { AlertCircle, Check, CheckCircle2, Info, TriangleAlert } from '@sureground/icons/native';
import { useTheme } from '../theme';
import { useReducedMotion } from '../accessibility';
import { Text } from './Text';

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  accessibilityLabel?: string;
  error?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Checkbox({
  checked,
  onChange,
  label,
  accessibilityLabel,
  error,
  disabled,
  style,
}: CheckboxProps) {
  const { colors, radius } = useTheme();
  return (
    <View style={[{ gap: 2 }, style]}>
      <Pressable
        onPress={() => onChange(!checked)}
        disabled={disabled}
        accessibilityRole="checkbox"
        accessibilityLabel={accessibilityLabel ?? (typeof label === 'string' ? label : undefined)}
        accessibilityState={{ checked, disabled }}
        aria-checked={checked}
        accessibilityHint={error ? `Error: ${error}` : undefined}
        aria-invalid={!!error}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 }}
      >
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: radius.sm - 2,
            borderWidth: 1.5,
            borderColor: checked ? colors.primary : error ? colors.destructive : colors.border,
            backgroundColor: checked ? colors.primary : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {checked ? <Check size={14} color={colors.primaryForeground} strokeWidth={3} /> : null}
        </View>
        {typeof label === 'string' ? (
          <Text variant="callout" color="mutedForeground" style={{ flex: 1 }}>
            {label}
          </Text>
        ) : (
          <View style={{ flex: 1 }}>{label}</View>
        )}
      </Pressable>
      {error ? (
        <Text
          variant="caption"
          color="destructive"
          accessibilityLiveRegion="polite"
          style={{ marginLeft: 32 }}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

export type FormAlertTone = 'error' | 'warning' | 'success' | 'info';

export interface FormAlertProps {
  message: string | null | undefined;
  tone?: FormAlertTone;
  title?: string;
}

export function FormAlert({ message, tone = 'error', title }: FormAlertProps) {
  const { colors, spacing, radius } = useTheme();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (message && Platform.OS === 'ios')
      AccessibilityInfo.announceForAccessibility(title ? `${title}. ${message}` : message);
  }, [message, title]);

  if (!message) return null;

  const palette = {
    error: { fg: colors.destructive, bg: colors.destructiveSubtle, Icon: AlertCircle },
    warning: { fg: colors.warning, bg: colors.warningSubtle, Icon: TriangleAlert },
    success: { fg: colors.success, bg: colors.successSubtle, Icon: CheckCircle2 },
    info: { fg: colors.accentForeground, bg: colors.accent, Icon: Info },
  }[tone];

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeIn.duration(160)}
      exiting={reduceMotion ? undefined : FadeOut.duration(120)}
      accessible
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: radius.md,
        backgroundColor: palette.bg,
      }}
    >
      <palette.Icon size={18} color={palette.fg} style={{ marginTop: 1 }} />
      <View style={{ flex: 1, gap: 2 }}>
        {title ? (
          <Text variant="callout" style={{ color: palette.fg, fontWeight: '700' }}>
            {title}
          </Text>
        ) : null}
        <Text variant="callout" style={{ color: title ? colors.foreground : palette.fg }}>
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}

export interface LinkButtonProps {
  label: string;
  icon?: ReactNode;
  accessibilityLabel?: string;
  onPress: () => void;
  tone?: 'primary' | 'muted' | 'destructive';
  disabled?: boolean;
  accessibilityRole?: AccessibilityRole;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}

export function LinkButton({
  label,
  icon,
  accessibilityLabel,
  onPress,
  tone = 'primary',
  disabled,
  accessibilityRole = 'button',
  accessibilityHint,
  style,
}: LinkButtonProps) {
  // Inline links may be drawn shorter than 44pt (e.g. legal links in a sentence); the hit area
  // still grows to 44pt so they stay easy to tap.
  const flat = StyleSheet.flatten(style) ?? {};
  const drawn = typeof flat.height === 'number' ? flat.height : flat.minHeight;
  const vertical = typeof drawn === 'number' && drawn < 44 ? Math.ceil((44 - drawn) / 2) : 0;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      hitSlop={{ left: 8, right: 8, top: vertical, bottom: vertical }}
      style={({ pressed }) => [
        {
          minHeight: 44,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          opacity: disabled ? 0.45 : pressed ? 0.6 : 1,
        },
        style,
      ]}
    >
      {icon}
      <Text
        variant="callout"
        color={
          tone === 'primary'
            ? 'primary'
            : tone === 'destructive'
              ? 'destructive'
              : 'mutedForeground'
        }
        style={{ fontWeight: tone === 'muted' ? '600' : '700' }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
