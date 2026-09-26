import { useEffect, type ReactNode } from 'react';
import {
  AccessibilityInfo,
  Pressable,
  View,
  type AccessibilityRole,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { AlertCircle, Check, CheckCircle2, Info, TriangleAlert } from 'lucide-react-native';
import { useTheme } from '../theme';
import { Text } from './Text';

/* -------------------------------- Checkbox -------------------------------- */

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Visible label; also what screen readers announce unless overridden. */
  label: ReactNode;
  accessibilityLabel?: string;
  error?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** A checkbox whose whole row is a 44-point target. */
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
        accessibilityHint={error ? `Error: ${error}` : undefined}
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
        <Text variant="caption" color="destructive" style={{ marginLeft: 32 }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

/* -------------------------------- FormAlert -------------------------------- */

export type FormAlertTone = 'error' | 'warning' | 'success' | 'info';

export interface FormAlertProps {
  message: string | null | undefined;
  tone?: FormAlertTone;
  title?: string;
}

/**
 * Inline status for a form: announced to screen readers the moment it appears
 * or changes, so a failed submit is never silent for VoiceOver/TalkBack users.
 */
export function FormAlert({ message, tone = 'error', title }: FormAlertProps) {
  const { colors, spacing, radius } = useTheme();

  useEffect(() => {
    if (message)
      AccessibilityInfo.announceForAccessibility(title ? `${title}. ${message}` : message);
  }, [message, title]);

  if (!message) return null;

  const palette = {
    error: { fg: colors.destructive, bg: colors.destructiveSubtle, Icon: AlertCircle },
    warning: { fg: colors.warning, bg: colors.warningSubtle, Icon: TriangleAlert },
    success: { fg: colors.success, bg: colors.successSubtle, Icon: CheckCircle2 },
    info: { fg: colors.primary, bg: colors.accent, Icon: Info },
  }[tone];

  return (
    <Animated.View
      entering={FadeIn.duration(160)}
      exiting={FadeOut.duration(120)}
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

/* -------------------------------- LinkButton -------------------------------- */

export interface LinkButtonProps {
  label: string;
  onPress: () => void;
  tone?: 'primary' | 'muted';
  disabled?: boolean;
  accessibilityRole?: AccessibilityRole;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}

/** A text-only action ("Forgot password?", "Resend code") with a full 44-point target. */
export function LinkButton({
  label,
  onPress,
  tone = 'primary',
  disabled,
  accessibilityRole = 'button',
  accessibilityHint,
  style,
}: LinkButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      hitSlop={{ left: 8, right: 8 }}
      style={({ pressed }) => [
        { minHeight: 44, justifyContent: 'center', opacity: disabled ? 0.45 : pressed ? 0.6 : 1 },
        style,
      ]}
    >
      <Text
        variant="callout"
        color={tone === 'primary' ? 'primary' : 'mutedForeground'}
        style={{ fontWeight: tone === 'primary' ? '700' : '600' }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
