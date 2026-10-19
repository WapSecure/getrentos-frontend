import { forwardRef } from 'react';
import type { TextInput } from 'react-native';
import { Text } from './Text';
import { TextField, type TextFieldProps } from './TextField';
import { group, sanitizeNumber } from './numberFormat';

export { sanitizeNumber };

type BaseProps = Omit<TextFieldProps, 'value' | 'onChangeText' | 'keyboardType' | 'secure'>;

export interface NumberFieldProps extends BaseProps {
  /** The raw string held by the form ("1250", "12.5"), never formatted. */
  value: string;
  onValueChange: (value: string) => void;
  /** Decimal places allowed. 0 (default) means whole numbers only. */
  decimals?: number;
  /** Shows 1,250,000 while typing; the value passed back stays unformatted. */
  grouped?: boolean;
  /** Unit shown at the end of the field, e.g. "m²", "units", "%". */
  unit?: string;
  /**
   * Codes made of digits (account numbers, OTPs, bank codes) keep leading
   * zeros and are never grouped. Set this for them.
   */
  code?: boolean;
}

/**
 * A number-only field. Use it for any count, measurement or numeric code so
 * that a pasted or hardware-keyboard letter can never reach the form.
 */
export const NumberField = forwardRef<TextInput, NumberFieldProps>(function NumberField(
  {
    value,
    onValueChange,
    decimals = 0,
    grouped = false,
    unit,
    code = false,
    rightAccessory,
    ...rest
  },
  ref
) {
  const places = code ? 0 : decimals;
  const display = grouped && !code ? groupDisplay(value) : value;
  return (
    <TextField
      ref={ref}
      {...rest}
      value={display}
      onChangeText={(text) => onValueChange(sanitizeNumber(text, places))}
      keyboardType={places > 0 ? 'decimal-pad' : 'number-pad'}
      inputMode={places > 0 ? 'decimal' : 'numeric'}
      autoCorrect={false}
      autoCapitalize="none"
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
  /** Whole naira. null or undefined shows an empty field rather than "0". */
  value: number | null | undefined;
  onValueChange: (value: number | null) => void;
  /** Currency symbol shown before the amount. */
  symbol?: string;
  /** Largest amount accepted; typing past it is ignored. */
  max?: number;
}

/**
 * Money in whole naira, shown grouped (₦ 1,250,000). Leading zeros and
 * anything that is not a digit are dropped; clearing the field gives null.
 */
export const CurrencyField = forwardRef<TextInput, CurrencyFieldProps>(function CurrencyField(
  { value, onValueChange, symbol = '₦', max, leftIcon, ...rest },
  ref
) {
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
});
