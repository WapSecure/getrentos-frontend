import { forwardRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '../theme';
import { Text } from './Text';

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string | null;
  hint?: string;
  secure?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  leftIcon?: React.ReactNode;
  rightAccessory?: React.ReactNode;
}

/**
 * Filled input with an animated focus state and a spring-in error line.
 * `forwardRef` for react-hook-form Controller + focus chaining.
 */
export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  {
    label,
    error,
    hint,
    secure,
    containerStyle,
    leftIcon,
    rightAccessory,
    onFocus,
    onBlur,
    ...rest
  },
  ref
) {
  const { colors, radius } = useTheme();
  const [focused, setFocused] = useState(false);
  const [reveal, setReveal] = useState(false);

  const borderColor = error ? colors.destructive : focused ? colors.primary : 'transparent';

  return (
    <Animated.View
      layout={LinearTransition.springify().damping(18)}
      style={[styles.container, containerStyle]}
    >
      {label ? (
        <Text variant="callout" color="mutedForeground" style={styles.label}>
          {label}
        </Text>
      ) : null}

      <View
        style={[
          styles.field,
          {
            borderRadius: radius.md,
            backgroundColor: colors.secondary,
            borderColor,
            borderWidth: 1.5,
          },
        ]}
      >
        {leftIcon ? <View style={styles.left}>{leftIcon}</View> : null}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.mutedForeground}
          selectionColor={colors.primary}
          secureTextEntry={secure && !reveal}
          style={[styles.input, { color: colors.foreground }]}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
        {secure ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={reveal ? 'Hide password' : 'Show password'}
            hitSlop={12}
            onPress={() => setReveal((v) => !v)}
            style={styles.right}
          >
            {reveal ? (
              <EyeOff size={18} color={colors.mutedForeground} />
            ) : (
              <Eye size={18} color={colors.mutedForeground} />
            )}
          </Pressable>
        ) : rightAccessory ? (
          <View style={styles.right}>{rightAccessory}</View>
        ) : null}
      </View>

      {error ? (
        <Animated.View entering={FadeIn.duration(140)} exiting={FadeOut.duration(100)}>
          <Text variant="caption" color="destructive" style={styles.helper}>
            {error}
          </Text>
        </Animated.View>
      ) : hint ? (
        <Text variant="caption" color="mutedForeground" style={styles.helper}>
          {hint}
        </Text>
      ) : null}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: { gap: 7 },
  label: { marginLeft: 4, fontWeight: '600' },
  field: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, minHeight: 54 },
  left: { marginRight: 8 },
  right: { marginLeft: 8 },
  input: { flex: 1, fontSize: 16, paddingVertical: 14 },
  helper: { marginLeft: 4 },
});
