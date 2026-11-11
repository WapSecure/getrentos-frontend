'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from '@sureground/icons';
import {
  Alert,
  Button,
  Card,
  Field,
  Input,
  RadioGroup,
  SaveButton,
  Select,
  Switch,
  useToast,
} from '@sureground/ui';
import {
  FOREIGN_ACCOUNT_COUNTRIES,
  FOREIGN_PAYOUTS_PENDING_NOTE,
  currencyForCountry,
  payoutAccountLabel,
  schemeForCountry,
  validateForeignBankAccount,
  withStepUpSummary,
  type ForeignAccountField,
  type ForeignBankAccountInput,
} from '@sureground/shared';
import { unwrap } from '@/lib/apiHelpers';
import { ownerPayoutKeys } from '@/lib/queryKeys';
import {
  ownerPayoutService,
  type ForeignBankAccount,
  type PayoutMethod,
} from '@/services/ownerPayoutService';

const errorOf = (e: unknown, fallback: string) =>
  (e as { error?: string; message?: string })?.error ??
  (e as { message?: string })?.message ??
  fallback;

export function foreignAccountLabel(account: ForeignBankAccount): string {
  const country = FOREIGN_ACCOUNT_COUNTRIES.find((c) => c.code === account.country)?.name;
  const number = account.iban ?? account.accountNumber ?? '';
  return [account.bankName || country, number].filter(Boolean).join(' · ');
}

/**
 * Where statement payouts go: the Nigerian account, or an account abroad once a licensed partner
 * is live. Sits under the existing payout account; every change goes through step-up.
 */
export function PayoutDestinationSettings() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const preference = useQuery({
    queryKey: ownerPayoutKeys.preference,
    queryFn: () => unwrap(ownerPayoutService.getPreference()),
  });
  const accounts = useQuery({
    queryKey: ownerPayoutKeys.foreignAccounts,
    queryFn: () => unwrap(ownerPayoutService.listForeignAccounts()),
  });

  const saved = preference.data;
  const [method, setMethod] = useState<PayoutMethod | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [fallback, setFallback] = useState<boolean | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      queryClient.invalidateQueries({ queryKey: ownerPayoutKeys.preference }),
      queryClient.invalidateQueries({ queryKey: ownerPayoutKeys.foreignAccounts }),
    ]);

  const save = async (): Promise<boolean> => {
    setError(null);
    const where =
      chosenMethod === 'FOREIGN_ACCOUNT' && selected
        ? `your ${selected.currency} account abroad`
        : 'your Nigerian account';
    const response = await withStepUpSummary(`Send your payouts to ${where}`, () =>
      ownerPayoutService.updatePreference({
        method: chosenMethod,
        foreignAccountId:
          chosenMethod === 'FOREIGN_ACCOUNT' ? (chosenAccountId ?? undefined) : undefined,
        fallbackToNgAccount: chosenFallback,
      })
    );
    if (!response.success) {
      setError(errorOf(response, 'Your payout destination wasn’t saved. Please try again.'));
      return false;
    }
    setMethod(null);
    setAccountId(null);
    setFallback(null);
    await refresh();
    toast.success('Payout destination saved.');
    return true;
  };

  const remove = useMutation({
    mutationFn: (account: ForeignBankAccount) =>
      withStepUpSummary(`Remove ${foreignAccountLabel(account)}`, () =>
        unwrap(ownerPayoutService.removeForeignAccount(account.id))
      ),
    onSuccess: () => {
      setAccountId(null);
      return refresh();
    },
    onError: (e) => setError(errorOf(e, 'That account wasn’t removed. Please try again.')),
  });

  if (preference.isError) {
    return (
      <Alert
        variant="danger"
        className="mt-8"
        action={
          <Button variant="outline" size="sm" onClick={() => preference.refetch()}>
            Try again
          </Button>
        }
      >
        We couldn’t load where your payouts go.
      </Alert>
    );
  }
  if (!saved) return null;

  const ng = saved.ngAccount;
  const abroadNote = saved.foreignPayoutsAvailable
    ? null
    : `${FOREIGN_PAYOUTS_PENDING_NOTE} Until then, ${
        chosenFallback ? 'we pay your Nigerian account' : 'we hold your payouts'
      }.`;

  return (
    <section className="mt-8 border-t border-border pt-6">
      <h3 className="text-base font-semibold text-foreground">Where payouts go</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Choose your Nigerian account or an account abroad for statement payouts.
      </p>

      <RadioGroup<PayoutMethod>
        className="mt-4"
        aria-label="Payout destination"
        variant="card"
        columns={2}
        value={chosenMethod}
        onValueChange={setMethod}
        options={[
          {
            value: 'NG_ACCOUNT',
            label: 'Nigerian account',
            description: ng
              ? `${payoutAccountLabel(ng)} · ${ng.accountName}`
              : 'No Nigerian payout account for statements yet.',
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

      {chosenMethod === 'FOREIGN_ACCOUNT' && (
        <div className="mt-4 space-y-4">
          {abroadNote && <Alert variant="info">{abroadNote}</Alert>}

          {list.length > 0 && (
            <div className="space-y-2">
              <RadioGroup<string>
                aria-label="Account abroad"
                value={chosenAccountId ?? ''}
                onValueChange={setAccountId}
                options={list.map((account) => ({
                  value: account.id,
                  label: foreignAccountLabel(account),
                  description: `${account.accountHolderName} · ${account.currency}`,
                }))}
              />
              {selected && (
                <Button
                  variant="danger-ghost"
                  size="sm"
                  icon={<Trash2 className="w-4 h-4" />}
                  isLoading={remove.isPending}
                  onClick={() => remove.mutate(selected)}
                >
                  Remove this account
                </Button>
              )}
            </div>
          )}

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
            <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
              Add an account abroad
            </Button>
          )}

          <Switch
            checked={chosenFallback}
            onCheckedChange={setFallback}
            disabled={!ng}
            label="If a payout abroad isn’t available yet, pay my Nigerian account"
            description={
              chosenFallback ? undefined : 'Payouts are held until they can be sent abroad.'
            }
          />
        </div>
      )}

      <div className="mt-6 space-y-3">
        {error && <Alert variant="danger">{error}</Alert>}
        <SaveButton
          label="Save payout destination"
          onClick={save}
          disabled={!dirty || (chosenMethod === 'FOREIGN_ACCOUNT' && !chosenAccountId)}
        />
      </div>
    </section>
  );
}

const EMPTY: ForeignBankAccountInput = {
  accountHolderName: '',
  country: 'GB',
  currency: 'GBP',
};

function ForeignAccountForm({
  onAdded,
  onCancel,
}: {
  onAdded: (account: ForeignBankAccount) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<ForeignBankAccountInput>(EMPTY);
  const [showErrors, setShowErrors] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scheme = schemeForCountry(form.country);
  const result = validateForeignBankAccount(form);
  const errors = showErrors && !result.ok ? result.errors : {};

  const set = (field: ForeignAccountField) => (value: string) =>
    setForm((f) => ({ ...f, [field]: value }));
  const text = (field: ForeignAccountField, label: string, extra: object = {}) => (
    <Field label={label} error={errors[field]}>
      <Input
        value={(form[field] as string | undefined) ?? ''}
        onChange={(e) => set(field)(e.target.value)}
        autoComplete="off"
        {...extra}
      />
    </Field>
  );
  const digits = { inputMode: 'numeric' as const };

  const add = async (): Promise<boolean> => {
    setShowErrors(true);
    setError(null);
    if (!result.ok) return false;
    const last4 = (result.value.iban ?? result.value.accountNumber ?? '').slice(-4);
    const response = await withStepUpSummary(
      `Add your ${result.value.currency} account ending ${last4} for payouts abroad`,
      () => ownerPayoutService.addForeignAccount(result.value)
    );
    if (!response.success || !response.data) {
      setError(errorOf(response, 'That account wasn’t added. Please try again.'));
      return false;
    }
    await onAdded(response.data);
    return true;
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Country" error={errors.country}>
          <Select
            value={form.country}
            onValueChange={(country) =>
              setForm((f) => ({
                accountHolderName: f.accountHolderName,
                bankName: f.bankName,
                country,
                currency: currencyForCountry(country) ?? '',
              }))
            }
            options={FOREIGN_ACCOUNT_COUNTRIES.map((c) => ({ value: c.code, label: c.name }))}
            searchable
            searchPlaceholder="Search countries"
          />
        </Field>
        <Field label="Currency" hint="Set by the country.">
          <Input value={form.currency} readOnly />
        </Field>
      </div>

      <Field
        label="Name on the account"
        hint="Must match the name on your verified identity."
        error={errors.accountHolderName}
      >
        <Input
          value={form.accountHolderName}
          onChange={(e) => set('accountHolderName')(e.target.value)}
          autoComplete="name"
        />
      </Field>

      {scheme === 'UK' && (
        <div className="grid gap-4 sm:grid-cols-2">
          {text('sortCode', 'Sort code', { ...digits, placeholder: '40-47-84', maxLength: 8 })}
          {text('accountNumber', 'Account number', { ...digits, maxLength: 8 })}
        </div>
      )}
      {scheme === 'US' && (
        <div className="grid gap-4 sm:grid-cols-2">
          {text('routingNumber', 'Routing number (ABA)', { ...digits, maxLength: 9 })}
          {text('accountNumber', 'Account number', { ...digits, maxLength: 17 })}
        </div>
      )}
      {scheme === 'CA' && (
        <div className="grid gap-4 sm:grid-cols-3">
          {text('transitNumber', 'Transit number', { ...digits, maxLength: 5 })}
          {text('institutionNumber', 'Institution number', { ...digits, maxLength: 3 })}
          {text('accountNumber', 'Account number', { ...digits, maxLength: 12 })}
        </div>
      )}
      {scheme === 'IBAN' && text('iban', 'IBAN', { maxLength: 42, autoCapitalize: 'characters' })}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Bank name" optionalLabel="Optional">
          <Input value={form.bankName ?? ''} onChange={(e) => set('bankName')(e.target.value)} />
        </Field>
        <Field label="SWIFT/BIC" optionalLabel="Optional" error={errors.swiftBic}>
          <Input
            value={form.swiftBic ?? ''}
            onChange={(e) => set('swiftBic')(e.target.value)}
            maxLength={11}
            autoCapitalize="characters"
          />
        </Field>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      <div className="flex flex-wrap gap-2">
        <SaveButton label="Add account" onClick={add} />
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </Card>
  );
}
