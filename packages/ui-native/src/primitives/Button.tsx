import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTheme } from '../theme';
import { useReducedMotion } from '../accessibility';
import { Text } from './Text';
import { PressableScale, type PressableScaleProps } from './PressableScale';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableScaleProps, 'style' | 'children'> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** Shown beside the spinner while loading ("Saving…"). Without it the label keeps its space, hidden. */
  loadingLabel?: string;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const MIN_HEIGHT: Record<ButtonSize, number> = { sm: 44, md: 50, lg: 56 };
const VERTICAL_PADDING: Record<ButtonSize, number> = { sm: 9, md: 12, lg: 15 };

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingLabel,
  fullWidth = true,
  icon,
  iconRight,
  disabled,
  accessibilityLabel,
  style,
  ...rest
}: ButtonProps) {
  const { colors, radius } = useTheme();
  const reduceMotion = useReducedMotion();
  const isDisabled = disabled || loading;

  const palette = useMemo(() => {
    switch (variant) {
      case 'secondary':
        return { bg: colors.secondary, fg: colors.secondaryForeground, border: 'transparent' };
      case 'outline':
        return { bg: 'transparent', fg: colors.foreground, border: colors.border };
      case 'ghost':
        return { bg: 'transparent', fg: colors.primary, border: 'transparent' };
      case 'destructive':
        return { bg: colors.destructive, fg: colors.destructiveForeground, border: 'transparent' };
      default:
        return { bg: colors.primary, fg: colors.primaryForeground, border: 'transparent' };
    }
  }, [variant, colors]);

  const textStyle = {
    color: palette.fg,
    fontWeight: '700' as const,
    flexShrink: 1,
    textAlign: 'center' as const,
  };
  const textVariant = size === 'sm' ? 'callout' : 'bodyStrong';

  // While loading, the label stays laid out (invisible) under the spinner so the
  // button keeps its size. A loading label replaces it instead, since it may be longer.
  const content = (
    <View style={[styles.content, loading && styles.hidden]}>
      {icon}
      <Text variant={textVariant} style={textStyle} numberOfLines={2}>
        {label}
      </Text>
      {iconRight}
    </View>
  );
  const body =
    loading && loadingLabel ? (
      <View style={styles.content}>
        <ActivityIndicator color={palette.fg} />
        <Text variant={textVariant} style={textStyle} numberOfLines={1}>
          {loadingLabel}
        </Text>
      </View>
    ) : (
      <View style={styles.content}>
        <Animated.View
          entering={reduceMotion ? undefined : FadeIn.duration(120)}
          style={styles.content}
        >
          {content}
        </Animated.View>
        {loading ? (
          <View style={[StyleSheet.absoluteFill, styles.content]}>
            <ActivityIndicator color={palette.fg} />
          </View>
        ) : null}
      </View>
    );

  const frame: StyleProp<ViewStyle> = [
    styles.base,
    {
      minHeight: MIN_HEIGHT[size],
      paddingHorizontal: size === 'sm' ? 16 : 22,
      paddingVertical: VERTICAL_PADDING[size],
      borderRadius: radius.md,
      alignSelf: fullWidth ? 'stretch' : 'flex-start',
      borderColor: palette.border,
      borderWidth: variant === 'outline' ? StyleSheet.hairlineWidth * 2 : 0,
    },
    { backgroundColor: palette.bg },
    style,
  ];

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={loading && loadingLabel ? loadingLabel : (accessibilityLabel ?? label)}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      hitSlop={6}
      haptic={variant === 'primary' || variant === 'destructive'}
      style={frame}
      {...rest}
    >
      {body}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flexShrink: 1,
  },
  hidden: { opacity: 0 },
});
