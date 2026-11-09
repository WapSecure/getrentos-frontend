import { forwardRef } from 'react';
import type { TextInputInstance, TextInput } from 'react-native';
import { Text } from './Text';
import { TextField, type TextFieldProps } from './TextField';
import { group, sanitizeNumber, wholeNumber } from './numberFormat';

export { sanitizeNumber };

type BaseProps = Omit<TextFieldProps, 'value' | 'onChangeText' | 'keyboardType' | 'secure'>;

export interface NumberFieldProps extends BaseProps {
  /** Raw, never formatted. */
  value: string;
  onValueChange: (value: string) => void;
  decimals?: number;
  grouped?: boolean;
  unit?: string;
  /** For digit codes (account numbers, OTPs): keeps leading zeros, never grouped. */
  code?: boolean;
  currency?: boolean | string;
}

export const NumberField = forwardRef<TextInputInstance, NumberFieldProps>(function NumberField(
  {
    value,
    onValueChange,
    decimals = 0,
    grouped = false,
    unit,
    code = false,
    currency,
    rightAccessory,
    leftIcon,
    maxLength,
    ...rest
  },
  ref
) {
  const symbol = currency ? (typeof currency === 'string' ? currency : '₦') : null;
  const places = code || symbol ? 0 : decimals;
  const display = (grouped || symbol) && !code ? groupDisplay(value) : value;
  return (
    <TextField
      ref={ref}
      {...rest}
      value={display}
      onChangeText={(text) => {
        const clean = places > 0 || code ? sanitizeNumber(text, places) : wholeNumber(text);
        const next = symbol ? clean.replace(/^0+(?=\d)/, '') : clean;
        // Applied here, not as the native maxLength, so pasted dashes and grouping commas don't count.
        onValueChange(maxLength ? next.slice(0, maxLength) : next);
      }}
      keyboardType={places > 0 ? 'decimal-pad' : 'number-pad'}
      inputMode={places > 0 ? 'decimal' : 'numeric'}
      autoCorrect={false}
      autoCapitalize="none"
      leftIcon={
        leftIcon ??
        (symbol ? (
          <Text variant="bodyStrong" color="mutedForeground">
            {symbol}
          </Text>
        ) : undefined)
      }
      rightAccessory={
        rightAccessory ??
        (unit ? (
          <Text variant="callout" color="mutedForeground">
            {unit}
          </Text>
        ) : undefined)
      }
    />
  );
});

function groupDisplay(value: string) {
  if (!value) return value;
  const [whole, fraction] = value.split('.');
  return fraction === undefined ? group(whole) : `${group(whole)}.${fraction}`;
}

export interface CurrencyFieldProps extends BaseProps {
  /** Whole naira. */
  value: number | null | undefined;
  onValueChange: (value: number | null) => void;
  symbol?: string;
  max?: number;
}

export const CurrencyField = forwardRef<TextInputInstance, CurrencyFieldProps>(
  function CurrencyField({ value, onValueChange, symbol = '₦', max, leftIcon, ...rest }, ref) {
    const display = value == null || Number.isNaN(value) ? '' : group(String(Math.trunc(value)));
    return (
      <TextField
        ref={ref}
        {...rest}
        value={display}
        onChangeText={(text) => {
          const digits = text.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
          if (!digits) return onValueChange(null);
          const next = Number(digits);
          if (max != null && next > max) return;
          onValueChange(next);
        }}
        keyboardType="number-pad"
        inputMode="numeric"
        autoCorrect={false}
        leftIcon={
          leftIcon ?? (
            <Text variant="bodyStrong" color="mutedForeground">
              {symbol}
            </Text>
          )
        }
      />
    );
  }
);
