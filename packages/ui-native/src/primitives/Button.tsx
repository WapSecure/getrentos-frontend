import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTheme } from '../theme';
import { Text } from './Text';
import { PressableScale, type PressableScaleProps } from './PressableScale';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableScaleProps, 'style' | 'children'> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const HEIGHT: Record<ButtonSize, number> = { sm: 42, md: 50, lg: 56 };

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = true,
  icon,
  iconRight,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const { colors, radius } = useTheme();
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

  const body = (
    <View style={styles.content}>
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <Animated.View entering={FadeIn.duration(120)} style={styles.content}>
          {icon}
          <Text
            variant={size === 'sm' ? 'callout' : 'bodyStrong'}
            style={{ color: palette.fg, fontWeight: '700' }}
            numberOfLines={1}
          >
            {label}
          </Text>
          {iconRight}
        </Animated.View>
      )}
    </View>
  );

  const frame: StyleProp<ViewStyle> = [
    styles.base,
    {
      height: HEIGHT[size],
      paddingHorizontal: size === 'sm' ? 16 : 22,
      borderRadius: radius.lg,
      alignSelf: fullWidth ? 'stretch' : 'flex-start',
      borderColor: palette.border,
      borderWidth: variant === 'outline' ? StyleSheet.hairlineWidth * 2 : 0,
    },
    variant !== 'primary' && variant !== 'destructive' && { backgroundColor: palette.bg },
    isDisabled && { opacity: 0.5 },
    style,
  ];

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      hitSlop={6}
      haptic={variant === 'primary' || variant === 'destructive'}
      style={frame}
      {...rest}
    >
      {variant === 'primary' ? (
        <LinearGradient
          colors={[colors.primary, colors.primaryHover]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : variant === 'destructive' ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.destructive }]} />
      ) : null}
      {body}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
});
