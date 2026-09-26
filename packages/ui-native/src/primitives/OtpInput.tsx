import { useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useTheme } from '../theme';

export interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  /** Paints every cell in the error colour, e.g. after a rejected code. */
  invalid?: boolean;
  onComplete?: (value: string) => void;
}

/**
 * Segmented one-time-code entry. A single logical value, rendered as `length`
 * boxes; taps focus the right cell, backspace steps back, and OS SMS
 * autofill drops the whole code into the first box.
 */
export function OtpInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  autoFocus = false,
  invalid = false,
  onComplete,
}: OtpInputProps) {
  const { colors, radius } = useTheme();
  const inputs = useRef<Array<TextInput | null>>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const digits = value.replace(/\D/g, '').slice(0, length).split('');

  const setAt = (index: number, raw: string) => {
    const incoming = raw.replace(/\D/g, '');
    if (!incoming) {
      // deletion
      const next = digits.slice();
      next[index] = '';
      const joined = next.join('').slice(0, length);
      onChange(joined);
      return;
    }
    const next = value.replace(/\D/g, '').split('');
    incoming
      .slice(0, length - index)
      .split('')
      .forEach((d, offset) => {
        next[index + offset] = d;
      });
    const joined = next.join('').slice(0, length);
    onChange(joined);
    const focusIndex = Math.min(index + incoming.length, length - 1);
    inputs.current[focusIndex]?.focus();
    if (joined.length === length) onComplete?.(joined);
  };

  return (
    <View style={styles.row} accessibilityLabel="Verification code">
      {Array.from({ length }).map((_, i) => {
        const filled = !!digits[i];
        const focused = focusedIndex === i;
        const borderColor = invalid
          ? colors.destructive
          : focused || filled
            ? colors.primary
            : colors.border;
        return (
          <TextInput
            key={i}
            ref={(el) => {
              inputs.current[i] = el;
            }}
            value={digits[i] ?? ''}
            editable={!disabled}
            autoFocus={autoFocus && i === 0}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="sms-otp"
            maxLength={length}
            selectTextOnFocus
            caretHidden
            accessibilityLabel={`Digit ${i + 1} of ${length}`}
            accessibilityHint={invalid ? 'The code was not accepted' : undefined}
            selectionColor={colors.primary}
            onFocus={() => setFocusedIndex(i)}
            onBlur={() => setFocusedIndex((f) => (f === i ? null : f))}
            onChangeText={(t) => setAt(i, t)}
            onKeyPress={({ nativeEvent }) => {
              if (nativeEvent.key === 'Backspace' && !digits[i] && i > 0) {
                const next = digits.slice();
                next[i - 1] = '';
                onChange(next.join(''));
                inputs.current[i - 1]?.focus();
              }
            }}
            style={[
              styles.box,
              {
                borderRadius: radius.md,
                color: colors.foreground,
                backgroundColor: focused ? colors.card : filled ? colors.card : colors.secondary,
                borderColor,
                borderWidth: focused || filled || invalid ? 2 : StyleSheet.hairlineWidth * 2,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  box: {
    flex: 1,
    aspectRatio: 0.86,
    maxWidth: 52,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
  },
});
