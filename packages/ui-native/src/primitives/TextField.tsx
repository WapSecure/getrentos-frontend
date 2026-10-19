import { forwardRef, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
  type TextStyle,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '../theme';
import { useReducedMotion } from '../accessibility';
import { Text } from './Text';

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string | null;
  hint?: string;
  secure?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  leftIcon?: React.ReactNode;
  rightAccessory?: React.ReactNode;
  /** Adds an asterisk to the label and tells screen readers the field is required. */
  required?: boolean;
  /** Shows "Optional" beside the label, for forms where most fields are required. */
  optional?: boolean;
  /** Shows "120 / 500" under the field. Needs `maxLength`. */
  showCount?: boolean;
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
    required,
    optional,
    showCount,
    onFocus,
    onBlur,
    accessibilityLabel,
    accessibilityHint,
    ...rest
  },
  ref
) {
  const { colors, radius } = useTheme();
  const reduceMotion = useReducedMotion();
  const [focused, setFocused] = useState(false);
  const [reveal, setReveal] = useState(false);

  const borderColor = error ? colors.destructive : focused ? colors.primary : 'transparent';
  const multiline = !!rest.multiline;
  const length = typeof rest.value === 'string' ? rest.value.length : 0;
  const counted = showCount && rest.maxLength ? rest.maxLength : null;
  const a11yLabel = accessibilityLabel ?? label ?? rest.placeholder;

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <View style={styles.labelRow} importantForAccessibility="no-hide-descendants">
          <Text variant="callout" color="mutedForeground" style={styles.label}>
            {label}
            {required ? (
              <Text variant="callout" color="destructive">
                {' *'}
              </Text>
            ) : null}
          </Text>
          {optional && !required ? (
            <Text variant="caption" color="mutedForeground">
              Optional
            </Text>
          ) : null}
        </View>
      ) : null}

      <View
        accessibilityState={{ disabled: rest.editable === false }}
        style={[
          styles.field,
          multiline && styles.fieldMultiline,
          {
            borderRadius: radius.md,
            backgroundColor: focused ? colors.card : colors.secondary,
            borderColor,
            borderWidth: 1.5,
          },
        ]}
      >
        {leftIcon ? <View style={styles.left}>{leftIcon}</View> : null}
        <TextInput
          ref={ref}
          // The visible label is a sibling, so screen readers need it on the input itself.
          accessibilityLabel={required && a11yLabel ? `${a11yLabel}, required` : a11yLabel}
          accessibilityHint={error ? `Error: ${error}` : (accessibilityHint ?? hint)}
          accessibilityState={{ disabled: rest.editable === false }}
          aria-invalid={!!error}
          placeholderTextColor={colors.mutedForeground}
          selectionColor={colors.primary}
          secureTextEntry={secure && !reveal}
          textAlignVertical={multiline ? 'top' : 'center'}
          style={[styles.input, multiline && styles.inputMultiline, { color: colors.foreground }]}
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
            onPress={() => setReveal((v) => !v)}
            style={[styles.right, styles.reveal]}
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

      {error || hint || counted ? (
        <View style={styles.helperRow}>
          <View style={{ flex: 1 }}>
            {error ? (
              <Animated.View
                accessibilityLiveRegion="polite"
                entering={reduceMotion ? undefined : FadeIn.duration(140)}
                exiting={reduceMotion ? undefined : FadeOut.duration(100)}
              >
                <Text variant="caption" color="destructive" style={styles.helper}>
                  {error}
                </Text>
              </Animated.View>
            ) : hint ? (
              <Text variant="caption" color="mutedForeground" style={styles.helper}>
                {hint}
              </Text>
            ) : null}
          </View>
          {counted ? (
            <Text
              variant="caption"
              color={length >= counted ? 'destructive' : 'mutedForeground'}
              style={styles.count}
              accessibilityLabel={`${length} of ${counted} characters`}
            >
              {length.toLocaleString()} / {counted.toLocaleString()}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
});

// react-native-web accepts outlineStyle 'none'; React Native's types only list border styles.
const WEB_NO_OUTLINE = { outlineStyle: 'none' } as unknown as TextStyle;

const styles = StyleSheet.create({
  container: { gap: 7 },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 8,
    marginRight: 4,
  },
  label: { marginLeft: 4, fontWeight: '600' },
  field: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, minHeight: 54 },
  fieldMultiline: { alignItems: 'flex-start', minHeight: 116 },
  left: { marginRight: 8 },
  right: { marginLeft: 8 },
  reveal: {
    width: 44,
    minHeight: 44,
    marginRight: -10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // The field's border shows focus, so the browser's own outline is removed on web.
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 14,
    ...(Platform.OS === 'web' ? WEB_NO_OUTLINE : null),
  },
  inputMultiline: { minHeight: 112, paddingTop: 14 },
  helper: { marginLeft: 4 },
  helperRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  count: { marginRight: 4, fontVariant: ['tabular-nums'] },
});
