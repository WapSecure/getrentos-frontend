'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Landmark, Loader2 } from 'lucide-react';
import { Field, NumberInput, Select } from '@getrentos/ui';
import { unwrap } from '@/lib/apiHelpers';
import { NIGERIAN_BANKS } from '@/lib/banks';
import { paymentKeys } from '@/lib/queryKeys';
import { getBanks, resolveBankAccount } from '@/services/paymentStatusService';

const OTHER_BANK = 'other';

/** A Nigerian account number is 10 digits (NUBAN). */
export const accountNumberOk = (n: string) => /^\d{10}$/.test(n);
const bankCodeOk = (c: string) => /^\d{3,9}$/.test(c);

interface BankAccountFieldsProps {
  bankCode: string;
  onBankCode: (code: string) => void;
  accountNumber: string;
  onAccountNumber: (n: string) => void;
  /** Prefix for the controls' ids, unique on the page. */
  idPrefix: string;
  /** Told the account holder's name once it is found, and null while it is not. */
  onAccountName?: (name: string | null) => void;
}

/**
 * Bank and account number, the way every web payout form asks (audit D10): pick
 * the bank by name, type the 10 digits, and the name on the account appears
 * before saving. "Other bank" still takes a code for a bank not listed.
 */
export function BankAccountFields({
  bankCode,
  onBankCode,
  accountNumber,
  onAccountNumber,
  idPrefix,
  onAccountName,
}: BankAccountFieldsProps) {
  const { data: bankList } = useQuery({
    queryKey: paymentKeys.banks,
    queryFn: () => unwrap(getBanks()),
    staleTime: 60 * 60_000,
    // Without the list the form still works from the built-in banks.
    throwOnError: false,
  });
  const banks = bankList?.banks ?? NIGERIAN_BANKS;
  const options = useMemo(
    () => [
      ...banks.map((b) => ({ value: b.code, label: b.name })),
      { value: OTHER_BANK, label: 'Other bank (enter its code)' },
    ],
    [banks]
  );

  const [other, setOther] = useState(false);
  // A saved code that is not in the list opens "Other bank" with it filled in.
  const listed = banks.some((b) => b.code === bankCode);
  const showOther = other || (!!bankCode && !listed && !!bankList);

  const ready = bankCodeOk(bankCode) && accountNumberOk(accountNumber);
  const lookup = useQuery({
    queryKey: paymentKeys.accountName(bankCode, accountNumber),
    queryFn: () => unwrap(resolveBankAccount({ bankCode, accountNumber })),
    enabled: ready,
    retry: false,
    // A failed lookup is shown under the field; it must not take the form down.
    throwOnError: false,
    staleTime: 10 * 60_000,
  });
  const accountName = ready ? (lookup.data?.accountName ?? null) : null;
  useEffect(() => {
    onAccountName?.(accountName);
  }, [accountName, onAccountName]);

  const lengthError =
    accountNumber.length > 0 && accountNumber.length < 10
      ? 'Account numbers are 10 digits (NUBAN).'
      : undefined;

  let nameLine: React.ReactNode = 'Your 10-digit NUBAN account number.';
  if (ready && lookup.isFetching) {
    nameLine = (
      <span className="inline-flex items-center gap-1.5">
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking the name on this account…
      </span>
    );
  } else if (accountName) {
    nameLine = (
      <span className="inline-flex items-center gap-1.5 text-success font-medium">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> {accountName}
      </span>
    );
  }

  return (
    <div className="space-y-4">
      <Field label="Bank" htmlFor={`${idPrefix}-bank`}>
        <Select
          id={`${idPrefix}-bank`}
          value={showOther ? OTHER_BANK : bankCode}
          onValueChange={(value) => {
            if (value === OTHER_BANK) {
              setOther(true);
              onBankCode('');
            } else {
              setOther(false);
              onBankCode(value);
            }
          }}
          options={options}
          placeholder="Choose your bank"
          searchable
          searchPlaceholder="Search banks"
        />
      </Field>
      {showOther && (
        <Field label="Bank code" htmlFor={`${idPrefix}-bank-code`} hint="e.g. 058 for GTBank">
          <NumberInput
            id={`${idPrefix}-bank-code`}
            value={bankCode}
            onValueChange={onBankCode}
            placeholder="Your bank's code"
            maxLength={9}
            leadingIcon={<Landmark className="w-4 h-4" />}
          />
        </Field>
      )}
      <Field
        label="Account number"
        htmlFor={`${idPrefix}-account-number`}
        hint={nameLine}
        error={lengthError ?? (ready && lookup.isError ? lookup.error.message : undefined)}
      >
        <NumberInput
          id={`${idPrefix}-account-number`}
          value={accountNumber}
          onValueChange={onAccountNumber}
          placeholder="0123456789"
          maxLength={10}
        />
      </Field>
    </div>
  );
}
