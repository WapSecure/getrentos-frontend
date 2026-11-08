import { useState } from 'react';
import { View } from 'react-native';
import { CurrencyField, RadioGroup, Text, useTheme } from '@getrentos/ui-native';
import { PaySheet } from '@/components/payments/PaySheet';
import type { PaymentProviderChoice } from '@/hooks/usePaymentProviders';
import type { Payment } from '@/lib/api/payments';
import { formatNaira } from '@/lib/format';
import { RENT_PART_PROTECTION, RENT_PROTECTION } from '@/lib/paymentCopy';

/** Matches the backend: the smallest part-payment accepted. */
const MIN_PART_PAYMENT = 1_000;

interface Props {
  payment: Payment | null;
  onClose: () => void;
  onPay: (amount: number | undefined) => void;
  /** Which company takes the payment (Paystack or Monnify). */
  providers: PaymentProviderChoice;
  /** Why the last try failed when the chosen company could not take it: choose another. */
  providerError?: string | null;
  /** While the payment is being started: the sheet stays open and shows it. */
  busy?: boolean;
}

/**
 * Pay rent: what a charge owes, or part of it (same rules and layout as the
 * web pay dialog). Anything paid goes to this charge first.
 */
export function PayAmountSheet({ payment, onClose, onPay, providers, providerError, busy }: Props) {
  const { spacing } = useTheme();
  const [mode, setMode] = useState<'full' | 'part'>('full');
  const [amount, setAmount] = useState<number | null>(null);
  // Start blank for each charge, without remounting the sheet (that would cut its animation).
  const [forId, setForId] = useState<string | null>(null);
  if (payment && payment.id !== forId) {
    setForId(payment.id);
    setMode('full');
    setAmount(null);
  }
  if (!payment && forId) setForId(null);
  // Keep the last charge on screen while the sheet slides away.
  const [shown, setShown] = useState<Payment | null>(payment);
  if (payment && payment !== shown) setShown(payment);
  const p = payment ?? shown;

  const owed = p ? (p.outstanding ?? p.amount) : 0;
  const min = Math.min(MIN_PART_PAYMENT, owed);
  const part = amount ?? 0;
  const partValid = part >= min && part < owed;
  const paying = mode === 'part' ? (partValid ? part : 0) : owed;
  // Only once something is typed: an empty box is not yet a mistake.
  const partError =
    mode !== 'part' || !amount
      ? undefined
      : part < min
        ? `Enter at least ${formatNaira(min)}.`
        : part >= owed
          ? `You owe ${formatNaira(owed)} on this charge. To pay all of it, choose Pay in full.`
          : undefined;

  return (
    <PaySheet
      open={!!payment}
      onClose={onClose}
      title="Pay rent"
      context={p?.propertyName}
      dueDate={p?.dueDate}
      overdue={p?.status === 'overdue'}
      owed={owed}
      amount={paying}
      itemLabel={mode === 'full' ? 'Rent' : 'Part payment'}
      receiverLine={`The fee goes to the payment company, so your landlord receives the full ${formatNaira(paying)}.`}
      protection={mode === 'part' ? RENT_PART_PROTECTION : RENT_PROTECTION}
      ready={mode === 'full' || partValid}
      providers={providers}
      providerError={providerError}
      onPay={() => onPay(mode === 'part' ? part : undefined)}
      busy={busy}
      howMuch={
        <View style={{ gap: spacing.md }}>
          <RadioGroup
            accessibilityLabel="How much to pay"
            variant="card"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'full', label: 'Pay in full', description: formatNaira(owed) },
              { value: 'part', label: 'Pay part', description: 'Choose an amount' },
            ]}
          />
          {mode === 'part' ? (
            <View style={{ gap: spacing.xs }}>
              <CurrencyField
                label="Amount"
                value={amount}
                onValueChange={setAmount}
                error={partError}
              />
              <Text variant="caption" color="mutedForeground">
                At least {formatNaira(min)}. The rest stays owed on this charge. The first rent on a
                new lease has to be paid in full.
              </Text>
            </View>
          ) : null}
        </View>
      }
    />
  );
}
