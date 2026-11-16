import { useEffect, useRef, useState } from 'react';
import { StyleSheet, TextInput, type TextInputInstance, View } from 'react-native';
import { useTheme } from '../theme';
import { Text } from './Text';

export interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  invalid?: boolean;
  onComplete?: (value: string) => void;
  accessibilityLabel?: string;
}

/** One real input behind drawn cells: a single autofill target and one thing for a screen reader to focus. */
export function OtpInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  autoFocus = false,
  invalid = false,
  onComplete,
  accessibilityLabel,
}: OtpInputProps) {
  const { colors, radius } = useTheme();
  const input = useRef<TextInputInstance | null>(null);
  const [focused, setFocused] = useState(false);
  const digits = value.replace(/\D/g, '').slice(0, length);

  // Cleared after a refused code: put the cursor back so the next attempt can be typed straight away.
  const hadDigits = useRef(digits.length > 0);
  useEffect(() => {
    if (hadDigits.current && digits.length === 0 && !disabled) input.current?.focus();
    hadDigits.current = digits.length > 0;
  }, [digits.length, disabled]);

  const change = (raw: string) => {
    const next = raw.replace(/\D/g, '').slice(0, length);
    if (next === digits) return;
    onChange(next);
    if (next.length === length) onComplete?.(next);
  };

  const active = focused ? Math.min(digits.length, length - 1) : -1;

  return (
    <View style={styles.row}>
      {Array.from({ length }).map((_, i) => {
        const filled = i < digits.length;
        const current = i === active;
        const borderColor = invalid
          ? colors.destructive
          : current || filled
            ? colors.primary
            : colors.border;
        return (
          <View
            key={i}
            importantForAccessibility="no-hide-descendants"
            accessibilityElementsHidden
            style={[
              styles.box,
              {
                borderRadius: radius.md,
                backgroundColor: current || filled ? colors.card : colors.secondary,
                borderColor,
                borderWidth: current || filled || invalid ? 2 : StyleSheet.hairlineWidth * 2,
              },
            ]}
          >
            <Text variant="bodyStrong" maxFontSizeMultiplier={1.4} style={styles.digit}>
              {digits[i] ?? ''}
            </Text>
          </View>
        );
      })}
      <TextInput
        ref={input}
        value={digits}
        onChangeText={change}
        editable={!disabled}
        autoFocus={autoFocus}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={length}
        caretHidden
        accessibilityLabel={accessibilityLabel ?? `Verification code, ${length} digits`}
        accessibilityHint={invalid ? 'The code was not accepted' : undefined}
        accessibilityState={{ disabled }}
        aria-invalid={invalid}
        maxFontSizeMultiplier={1.4}
        selectionColor="transparent"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  box: {
    flex: 1,
    aspectRatio: 0.86,
    maxWidth: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digit: { fontSize: 22, lineHeight: 28, textAlign: 'center' },
  // Laid over the cells so a tap or long-press-to-paste lands on it; nearly invisible, never hidden, so autofill still offers the code.
  input: {
    ...StyleSheet.absoluteFill,
    color: 'transparent',
    opacity: 0.02,
    fontSize: 16,
  },
});
