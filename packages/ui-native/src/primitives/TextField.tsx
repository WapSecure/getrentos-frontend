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
import { Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '../theme';
import { Text } from './Text';

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string | null;
  hint?: string;
  /** Renders a show/hide toggle and manages `secureTextEntry`. */
  secure?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  rightAccessory?: React.ReactNode;
}

/**
 * Labeled text input with an error slot. `forwardRef` so it drops straight into
 * `react-hook-form`'s `Controller` and focus chaining.
 */
export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, error, hint, secure, containerStyle, rightAccessory, onFocus, onBlur, ...rest },
  ref,
) {
  const { colors, radius } = useTheme();
  const [focused, setFocused] = useState(false);
  const [reveal, setReveal] = useState(false);

  const borderColor = error ? colors.destructive : focused ? colors.primary : colors.border;

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text variant="callout" color="mutedForeground" style={styles.label}>
          {label}
        </Text>
      ) : null}

      <View
        style={[
          styles.field,
          {
            borderColor,
            borderRadius: radius.md,
            backgroundColor: colors.card,
            borderWidth: focused ? 2 : StyleSheet.hairlineWidth * 2,
          },
        ]}
      >
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
            hitSlop={10}
            onPress={() => setReveal((v) => !v)}
          >
            {reveal ? (
              <EyeOff size={18} color={colors.mutedForeground} />
            ) : (
              <Eye size={18} color={colors.mutedForeground} />
            )}
          </Pressable>
        ) : (
          rightAccessory
        )}
      </View>

      {error ? (
        <Text variant="caption" color="destructive" style={styles.helper}>
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" color="mutedForeground" style={styles.helper}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: { marginLeft: 2 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    minHeight: 50,
    gap: 8,
  },
  input: { flex: 1, fontSize: 16, paddingVertical: 12 },
  helper: { marginLeft: 2 },
});
