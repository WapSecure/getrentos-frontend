'use client';

import { useState } from 'react';
import { CurrencyInput, Field, RadioGroup } from '@getrentos/ui';
import { PayDialog } from '@/components/shared/payments/PayDialog';
import type { PaymentProviderChoice } from '@/hooks/usePaymentProviders';
import { formatCurrency } from '@/lib/format';
import { RENT_PART_PROTECTION, RENT_PROTECTION } from '@/lib/paymentCopy';

/** Matches the backend: the smallest part-payment accepted. */
const MIN_PART_PAYMENT = 1_000;

interface PayAmountDialogProps {
  /** The charge being paid, or null when closed. */
  payment: {
    propertyName: string;
    owed: number;
    dueDate?: string | null;
    overdue?: boolean;
  } | null;
  onClose: () => void;
  onPay: (amount: number | undefined) => void;
  /** Which company takes the payment (Paystack or Monnify). */
  providers: PaymentProviderChoice;
  /** Why the last try failed when the chosen company could not take it: choose another. */
  providerError?: string | null;
  /** Why the last try failed for any other reason. */
  error?: string | null;
  /** While the payment is being started: the dialog stays open and shows it. */
  busy?: boolean;
}

/**
 * Pay what a charge owes, or part of it: choose how much, choose who takes
 * the payment, see exactly what will be charged, then go to that company's
 * secure page. Anything paid goes to this charge first.
 */
export const PayAmountDialog = ({
  payment,
  onClose,
  onPay,
  providers,
  providerError,
  error,
  busy,
}: PayAmountDialogProps) => {
  const [mode, setMode] = useState<'full' | 'part'>('full');
  const [amount, setAmount] = useState('');

  // Start blank each time it opens. The page closes it once the payment has started.
  const [wasOpen, setWasOpen] = useState(false);
  if (!!payment !== wasOpen) {
    setWasOpen(!!payment);
    if (!payment) {
      setMode('full');
      setAmount('');
    }
  }

  // Not while the payment is starting: its result lands here.
  const close = () => {
    if (!busy) onClose();
  };

  const owed = payment?.owed ?? 0;
  const part = Number(amount);
  const minPart = Math.min(MIN_PART_PAYMENT, owed);
  const partValid = part >= minPart && part < owed;
  // Only once something is typed: an empty box is not yet a mistake.
  const partError =
    mode !== 'part' || !amount
      ? undefined
      : part < minPart
        ? `Enter at least ${formatCurrency(minPart)}.`
        : part >= owed
          ? `You owe ${formatCurrency(owed)} on this charge. To pay all of it, choose Pay in full.`
          : undefined;
  const paying = mode === 'full' ? owed : partValid ? part : 0;

  return (
    <PayDialog
      open={!!payment}
      onClose={close}
      title="Pay rent"
      context={payment?.propertyName}
      dueDate={payment?.dueDate}
      overdue={payment?.overdue}
      owed={owed}
      amount={paying}
      itemLabel={mode === 'full' ? 'Rent' : 'Part payment'}
      receiverLine={`The fee goes to the payment company, so your landlord receives the full ${formatCurrency(paying)}.`}
      protection={mode === 'part' ? RENT_PART_PROTECTION : RENT_PROTECTION}
      providers={providers}
      providerError={providerError}
      error={error}
      busy={busy}
      onPay={() => onPay(mode === 'part' ? part : undefined)}
      amountStep={
        <>
          <RadioGroup
            aria-label="How much to pay"
            variant="card"
            columns={2}
            value={mode}
            onValueChange={setMode}
            options={[
              { value: 'full', label: 'Pay in full', description: formatCurrency(owed) },
              { value: 'part', label: 'Pay part', description: 'Choose an amount' },
            ]}
          />
          {mode === 'part' && (
            <Field
              label="Amount"
              hint={`At least ${formatCurrency(minPart)}. The rest stays owed on this charge. The first rent on a new lease has to be paid in full.`}
              error={partError}
            >
              <CurrencyInput
                prefix="₦"
                value={amount}
                onValueChange={(v) => setAmount(v === 0 ? '' : String(v))}
              />
            </Field>
          )}
        </>
      }
    />
  );
};
