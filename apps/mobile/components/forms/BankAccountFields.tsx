import { useState } from 'react';
import { View } from 'react-native';
import { Chip, NumberField, useTheme } from '@getrentos/ui-native';
import { COMMON_BANKS } from '@/lib/api/sellerPayout';

/** A Nigerian account number is 10 digits (NUBAN). */
export const accountNumberOk = (n: string) => /^\d{10}$/.test(n);

/**
 * Bank and account number, the way every payout form asks: tap a common bank,
 * or "Other bank" to type its code. Codes keep their leading zeros.
 */
export function BankAccountFields({
  bankCode,
  onBankCode,
  accountNumber,
  onAccountNumber,
}: {
  bankCode: string;
  onBankCode: (code: string) => void;
  accountNumber: string;
  onAccountNumber: (n: string) => void;
}) {
  const { spacing } = useTheme();
  const [other, setOther] = useState(
    () => !!bankCode && !COMMON_BANKS.some((b) => b.code === bankCode)
  );
  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {COMMON_BANKS.map((b) => (
          <Chip
            key={b.code}
            label={b.name}
            size="sm"
            selected={!other && bankCode === b.code}
            onPress={() => {
              setOther(false);
              onBankCode(b.code);
            }}
          />
        ))}
        <Chip
          label="Other bank"
          size="sm"
          selected={other}
          onPress={() => {
            setOther(true);
            onBankCode('');
          }}
        />
      </View>
      {other ? (
        <NumberField
          label="Bank code"
          value={bankCode}
          onValueChange={onBankCode}
          code
          maxLength={6}
          required
          hint="Your bank’s code, e.g. 058 for GTBank"
        />
      ) : null}
      <NumberField
        label="Account number"
        value={accountNumber}
        onValueChange={onAccountNumber}
        code
        maxLength={10}
        required
      />
    </View>
  );
}
