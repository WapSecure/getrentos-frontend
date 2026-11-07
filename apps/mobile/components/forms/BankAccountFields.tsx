import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
import { Chip, NumberField, Text, useTheme } from '@getrentos/ui-native';
import { SelectField } from '@/components/forms/SelectField';
import { errorMessage } from '@/lib/api/client';
import { COMMON_BANKS } from '@/lib/api/sellerPayout';
import { accountNumberOk, useAccountName, useBanks } from '@/hooks/useBankAccountLookup';

export { accountNumberOk };

const OTHER_BANK = 'other';

/**
 * Bank and account number, the way every payout form asks (audit D10): pick
 * the bank by name (or tap a common one), type the 10 digits, and the name on
 * the account appears before saving. "Other bank" still takes a code for a
 * bank not listed. Codes keep their leading zeros.
 */
export function BankAccountFields({
  bankCode,
  onBankCode,
  accountNumber,
  onAccountNumber,
  onAccountName,
}: {
  bankCode: string;
  onBankCode: (code: string) => void;
  accountNumber: string;
  onAccountNumber: (n: string) => void;
  /** Told the account holder's name once it is found, and null while it is not. */
  onAccountName?: (name: string | null) => void;
}) {
  const { colors, spacing } = useTheme();
  const bankList = useBanks();
  const banks: readonly { code: string; name: string }[] = bankList.data?.banks ?? COMMON_BANKS;
  const options = useMemo(
    () => [
      ...banks.map((b) => ({ value: b.code, label: b.name })),
      { value: OTHER_BANK, label: 'Other bank (enter its code)' },
    ],
    [banks]
  );

  const [other, setOther] = useState(false);
  // A saved code that is not in the list opens "Other bank" with it filled in,
  // once the full list has arrived (or could not be fetched).
  const listed = banks.some((b) => b.code === bankCode);
  const settled = !!bankList.data || bankList.isError;
  const showOther = other || (!!bankCode && !listed && settled);

  const pickBank = (code: string) => {
    if (code === OTHER_BANK) {
      setOther(true);
      onBankCode('');
    } else {
      setOther(false);
      onBankCode(code);
    }
  };

  const lookup = useAccountName(bankCode, accountNumber);
  const { accountName } = lookup;
  useEffect(() => {
    onAccountName?.(accountName);
  }, [accountName, onAccountName]);

  const lengthError =
    accountNumber.length > 0 && accountNumber.length < 10
      ? 'Account numbers are 10 digits (NUBAN).'
      : undefined;
  const lookupError = lookup.error
    ? errorMessage(
        lookup.error,
        'We could not check the account name just now. You can still save.'
      )
    : undefined;
  const showNameLine = !lengthError && !lookupError && (lookup.checking || !!accountName);

  return (
    <View style={{ gap: spacing.md }}>
      <SelectField
        label="Bank"
        value={showOther ? OTHER_BANK : bankCode}
        options={options}
        onChange={pickBank}
        placeholder="Choose your bank"
        required
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {COMMON_BANKS.map((b) => (
          <Chip
            key={b.code}
            label={b.name}
            size="sm"
            selected={!showOther && bankCode === b.code}
            onPress={() => pickBank(b.code)}
          />
        ))}
      </View>
      {showOther ? (
        <NumberField
          label="Bank code"
          value={bankCode}
          onValueChange={onBankCode}
          code
          maxLength={9}
          required
          hint="Your bank’s code, e.g. 058 for GTBank"
        />
      ) : null}
      <View style={{ gap: spacing.xs }}>
        <NumberField
          label="Account number"
          value={accountNumber}
          onValueChange={onAccountNumber}
          code
          maxLength={10}
          required
          error={lengthError ?? lookupError}
          hint={showNameLine ? undefined : 'Your 10-digit NUBAN account number.'}
        />
        {showNameLine ? (
          <View
            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}
            accessibilityLiveRegion="polite"
          >
            {lookup.checking ? (
              <>
                <ActivityIndicator size="small" color={colors.mutedForeground} />
                <Text variant="caption" color="mutedForeground">
                  Checking the name on this account…
                </Text>
              </>
            ) : (
              <>
                <CheckCircle2 size={14} color={colors.success} />
                <Text variant="caption" color="success" style={{ fontWeight: '600' }}>
                  {accountName}
                </Text>
              </>
            )}
          </View>
        ) : null}
      </View>
    </View>
  );
}
