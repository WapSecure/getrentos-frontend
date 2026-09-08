import { forwardRef, useMemo } from 'react';
import { StyleSheet, View, type TextInput } from 'react-native';
import { useTheme } from '../theme';
import { Text } from './Text';
import { TextField, type TextFieldProps } from './TextField';

export function passwordStrength(pw: string): 0 | 1 | 2 | 3 | 4 {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score as 0 | 1 | 2 | 3 | 4;
}

const LABELS = ['Weak', 'Fair', 'Good', 'Strong'] as const;

export interface PasswordFieldProps extends Omit<TextFieldProps, 'secure'> {
  /** Show the 4-bar strength meter under the field. */
  showStrength?: boolean;
}

/** Secure text field with a reveal toggle and an optional strength meter. */
export const PasswordField = forwardRef<TextInput, PasswordFieldProps>(function PasswordField(
  { showStrength = false, value = '', ...rest },
  ref
) {
  const { colors } = useTheme();
  const score = useMemo(() => passwordStrength(String(value)), [value]);
  const meterColor = [colors.destructive, colors.warning, colors.primary, colors.success][
    Math.max(0, score - 1)
  ];

  return (
    <View style={{ gap: 6 }}>
      <TextField ref={ref} secure value={value} autoCapitalize="none" {...rest} />
      {showStrength && String(value).length > 0 ? (
        <View style={{ gap: 4 }}>
          <View style={styles.bars}>
            {[1, 2, 3, 4].map((lvl) => (
              <View
                key={lvl}
                style={[
                  styles.bar,
                  { backgroundColor: score >= lvl ? meterColor : colors.secondary },
                ]}
              />
            ))}
          </View>
          <Text variant="caption" color="mutedForeground">
            Password strength: {LABELS[Math.max(0, score - 1)]}
          </Text>
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  bars: { flexDirection: 'row', gap: 4 },
  bar: { flex: 1, height: 3, borderRadius: 2 },
});
