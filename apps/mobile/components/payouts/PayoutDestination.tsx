import { useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Card,
  FormAlert,
  NumberField,
  RadioGroup,
  SwitchRow,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import {
  FOREIGN_ACCOUNT_COUNTRIES,
  FOREIGN_PAYOUTS_PENDING_NOTE,
  currencyForCountry,
  payoutAccountLabel,
  schemeForCountry,
  validateForeignBankAccount,
  type ForeignAccountField,
  type ForeignBankAccountInput,
} from '@sureground/shared';
import { ApiError, errorMessage } from '@/lib/api/client';
import { ownerPayoutApi, type ForeignBankAccount, type PayoutMethod } from '@/lib/api/sellerPayout';
import { qk } from '@/lib/query/keys';
import { withStepUpSummary } from '@/lib/stepUp';
import { SelectField } from '@/components/forms/SelectField';

export function foreignAccountLabel(account: ForeignBankAccount): string {
  const country = FOREIGN_ACCOUNT_COUNTRIES.find((c) => c.code === account.country)?.name;
  const number = account.iban ?? account.accountNumber ?? '';
  return [account.bankName || country, number].filter(Boolean).join(' · ');
}

/**
 * Where statement payouts go, as on web: the Nigerian account, or an account abroad once a licensed
 * partner is live. Only owners have a preference; anyone else sees nothing. Changes go through step-up.
 */
export function PayoutDestination() {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const preference = useQuery({
    queryKey: qk.seller.payoutPreference,
    queryFn: ownerPayoutApi.preference,
    retry: false,
  });
  const accounts = useQuery({
    queryKey: qk.seller.foreignAccounts,
    queryFn: ownerPayoutApi.foreignAccounts,
    enabled: preference.isSuccess,
  });
  const saved = preference.data;
  const [method, setMethod] = useState<PayoutMethod | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [fallback, setFallback] = useState<boolean | null>(null);
  const [adding, setAdding] = useState(false);

  const list = accounts.data ?? [];
  const chosenMethod = method ?? saved?.method ?? 'NG_ACCOUNT';
  const chosenAccountId = accountId ?? saved?.foreignAccount?.id ?? list[0]?.id ?? null;
  const chosenFallback = fallback ?? saved?.fallbackToNgAccount ?? true;
  const selected = list.find((a) => a.id === chosenAccountId);
  const dirty =
    !!saved &&
    (chosenMethod !== saved.method ||
      chosenFallback !== saved.fallbackToNgAccount ||
      (chosenMethod === 'FOREIGN_ACCOUNT' &&
        chosenAccountId !== (saved.foreignAccount?.id ?? null)));

  const refresh = () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: qk.seller.payoutPreference }),
      qc.invalidateQueries({ queryKey: qk.seller.foreignAccounts }),
    ]);

  const save = useMutation({
    mutationFn: () => {
      const where =
        chosenMethod === 'FOREIGN_ACCOUNT' && selected
          ? `your ${selected.currency} account abroad`
          : 'your Nigerian account';
      return withStepUpSummary(`Send your payouts to ${where}`, () =>
        ownerPayoutApi.updatePreference({
          method: chosenMethod,
          foreignAccountId:
            chosenMethod === 'FOREIGN_ACCOUNT' ? (chosenAccountId ?? undefined) : undefined,
          fallbackToNgAccount: chosenFallback,
        })
      );
    },
    onSuccess: async () => {
      setMethod(null);
      setAccountId(null);
      setFallback(null);
      await refresh();
      toast.show('Payout destination saved.', 'success');
    },
  });
  const remove = useMutation({
    mutationFn: (account: ForeignBankAccount) =>
      withStepUpSummary(`Remove ${foreignAccountLabel(account)}`, () =>
        ownerPayoutApi.removeForeignAccount(account.id)
      ),
    onSuccess: () => {
      setAccountId(null);
      return refresh();
    },
  });

  // Not an owner (or not offered yet): nothing to choose.
  const hidden =
    preference.error instanceof ApiError && [403, 404].includes(preference.error.status);
  if (hidden || preference.isPending) return null;
  if (preference.isError) {
    return (
      <View style={{ gap: spacing.sm }}>
        <FormAlert message="We couldn’t load where your payouts go." />
        <Button
          label="Try again"
          size="sm"
          variant="secondary"
          onPress={() => void preference.refetch()}
          style={{ alignSelf: 'flex-start' }}
        />
      </View>
    );
  }
  if (!saved) return null;

  const ng = saved.ngAccount;
  const abroadNote = saved.foreignPayoutsAvailable
    ? null
    : `${FOREIGN_PAYOUTS_PENDING_NOTE} Until then, ${
        chosenFallback ? 'we pay your Nigerian account' : 'we hold your payouts'
      }.`;
  const failure = save.error ?? remove.error;

  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ gap: 2 }}>
        <Text variant="heading" headingLevel={2}>
          Where payouts go
        </Text>
        <Text variant="caption" color="mutedForeground">
          Your Nigerian account or an account abroad, for statement payouts.
        </Text>
      </View>
      <RadioGroup<PayoutMethod>
        variant="card"
        accessibilityLabel="Payout destination"
        value={chosenMethod}
        onChange={setMethod}
        options={[
          {
            value: 'NG_ACCOUNT',
            label: 'Nigerian account',
            description: ng
              ? `${payoutAccountLabel(ng)} · ${ng.accountName}`
              : 'Add your payout account above first.',
            disabled: !ng,
          },
          {
            value: 'FOREIGN_ACCOUNT',
            label: 'Account abroad',
            description: list.length
              ? `${list.length} saved`
              : 'UK, US, Canada or a euro IBAN account',
          },
        ]}
      />

      {chosenMethod === 'FOREIGN_ACCOUNT' ? (
        <View style={{ gap: spacing.md }}>
          {abroadNote ? <FormAlert tone="info" message={abroadNote} /> : null}
          {list.length > 0 ? (
            <View style={{ gap: spacing.sm }}>
              <RadioGroup<string>
                accessibilityLabel="Account abroad"
                value={chosenAccountId ?? ''}
                onChange={setAccountId}
                options={list.map((a) => ({
                  value: a.id,
                  label: foreignAccountLabel(a),
                  description: `${a.accountHolderName} · ${a.currency}`,
                }))}
              />
              {selected ? (
                <Button
                  label="Remove this account"
                  size="sm"
                  variant="ghost"
                  loading={remove.isPending}
                  onPress={() => remove.mutate(selected)}
                  style={{ alignSelf: 'flex-start' }}
                />
              ) : null}
            </View>
          ) : null}
          {adding ? (
            <ForeignAccountForm
              onCancel={() => setAdding(false)}
              onAdded={async (account) => {
                setAdding(false);
                setAccountId(account.id);
                await refresh();
              }}
            />
          ) : (
            <Button
              label="Add an account abroad"
              size="sm"
              variant="secondary"
              onPress={() => setAdding(true)}
              style={{ alignSelf: 'flex-start' }}
            />
          )}
          <SwitchRow
            label="If a payout abroad isn’t available yet, pay my Nigerian account"
            description={
              chosenFallback ? undefined : 'Payouts are held until they can be sent abroad.'
            }
            value={chosenFallback}
            onValueChange={setFallback}
            disabled={!ng}
          />
        </View>
      ) : null}

      {failure ? (
        <FormAlert message={errorMessage(failure, 'That wasn’t saved. Please try again.')} />
      ) : null}
      <Button
        label="Save payout destination"
        loading={save.isPending}
        disabled={!dirty || (chosenMethod === 'FOREIGN_ACCOUNT' && !chosenAccountId)}
        onPress={() => save.mutate()}
      />
    </View>
  );
}

const EMPTY: ForeignBankAccountInput = { accountHolderName: '', country: 'GB', currency: 'GBP' };

function ForeignAccountForm({
  onAdded,
  onCancel,
}: {
  onAdded: (account: ForeignBankAccount) => void | Promise<void>;
  onCancel: () => void;
}) {
  const { spacing } = useTheme();
  const [form, setForm] = useState<ForeignBankAccountInput>(EMPTY);
  const [showErrors, setShowErrors] = useState(false);
  const scheme = schemeForCountry(form.country);
  const result = validateForeignBankAccount(form);
  const errors: Partial<Record<ForeignAccountField, string>> =
    showErrors && !result.ok ? result.errors : {};
  const value = (field: ForeignAccountField) => (form[field] as string | null | undefined) ?? '';
  const set = (field: ForeignAccountField) => (next: string) =>
    setForm((f) => ({ ...f, [field]: next }));

  const add = useMutation({
    mutationFn: () => {
      if (!result.ok) throw new Error('invalid');
      const last4 = (result.value.iban ?? result.value.accountNumber ?? '').slice(-4);
      return withStepUpSummary(
        `Add your ${result.value.currency} account ending ${last4} for payouts abroad`,
        () => ownerPayoutApi.addForeignAccount(result.value)
      );
    },
    onSuccess: (account) => onAdded(account),
  });

  // Digit-only fields use the numeric code input; the shared validator checks each scheme's rules.
  const digits = (field: ForeignAccountField, label: string, maxLength: number) => (
    <NumberField
      code
      label={label}
      value={value(field)}
      onValueChange={set(field)}
      maxLength={maxLength}
      error={errors[field]}
    />
  );

  return (
    <Card style={{ gap: spacing.md }}>
      <SelectField
        label="Country"
        value={form.country}
        options={FOREIGN_ACCOUNT_COUNTRIES.map((c) => ({ value: c.code, label: c.name }))}
        onChange={(country) =>
          setForm((f) => ({
            accountHolderName: f.accountHolderName,
            bankName: f.bankName,
            country,
            currency: currencyForCountry(country) ?? '',
          }))
        }
        hint={form.currency ? `Paid in ${form.currency}, set by the country.` : undefined}
        error={errors.country}
      />
      <TextField
        label="Name on the account"
        value={form.accountHolderName}
        onChangeText={set('accountHolderName')}
        autoComplete="name"
        hint="Must match the name on your verified identity."
        error={errors.accountHolderName}
      />
      {scheme === 'UK' ? (
        <>
          {digits('sortCode', 'Sort code', 6)}
          {digits('accountNumber', 'Account number', 8)}
        </>
      ) : scheme === 'US' ? (
        <>
          {digits('routingNumber', 'Routing number (ABA)', 9)}
          {digits('accountNumber', 'Account number', 17)}
        </>
      ) : scheme === 'CA' ? (
        <>
          {digits('transitNumber', 'Transit number', 5)}
          {digits('institutionNumber', 'Institution number', 3)}
          {digits('accountNumber', 'Account number', 12)}
        </>
      ) : scheme === 'IBAN' ? (
        <TextField
          label="IBAN"
          value={value('iban')}
          onChangeText={set('iban')}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={42}
          error={errors.iban}
        />
      ) : null}
      <TextField
        label="Bank name (optional)"
        value={value('bankName')}
        onChangeText={set('bankName')}
      />
      <TextField
        label="SWIFT/BIC (optional)"
        value={value('swiftBic')}
        onChangeText={set('swiftBic')}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={11}
        error={errors.swiftBic}
      />
      {add.isError ? (
        <FormAlert
          message={errorMessage(add.error, 'That account wasn’t added. Please try again.')}
        />
      ) : null}
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <Button label="Cancel" variant="ghost" onPress={onCancel} />
        <Button
          label="Add account"
          loading={add.isPending}
          onPress={() => {
            setShowErrors(true);
            if (result.ok) add.mutate();
          }}
          style={{ flex: 1 }}
        />
      </View>
    </Card>
  );
}
