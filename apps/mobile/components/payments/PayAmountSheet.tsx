import { useState } from 'react';
import { View } from 'react-native';
import { Button, CurrencyField, SegmentedControl, Text, useTheme } from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import type { Payment } from '@/lib/api/payments';

/** Matches the backend: the smallest part-payment accepted. */
const MIN_PART_PAYMENT = 1_000;

interface Props {
  payment: Payment | null;
  onClose: () => void;
  onPay: (amount: number | undefined) => void;
}

/**
 * Pay what a charge owes, or part of it (same rules as web). Anything paid
 * goes to this charge first.
 */
export function PayAmountSheet({ payment, onClose, onPay }: Props) {
  return (
    <Sheet open={!!payment} onClose={onClose} title="Make a payment">
      {/* Remount per charge so the amount always starts blank. */}
      {payment ? <PayAmountForm key={payment.id} payment={payment} onPay={onPay} /> : null}
    </Sheet>
  );
}

function PayAmountForm({
  payment,
  onPay,
}: {
  payment: Payment;
  onPay: (amount: number | undefined) => void;
}) {
  const { spacing } = useTheme();
  const [mode, setMode] = useState<'full' | 'part'>('full');
  const [amount, setAmount] = useState<number | null>(null);
  const owed = payment.outstanding ?? payment.amount;
  const min = Math.min(MIN_PART_PAYMENT, owed);
  const part = amount ?? 0;
  const partValid = part >= min && part < owed;

  return (
    <View style={{ gap: spacing.lg }}>
      <Text variant="body" color="mutedForeground">
        {payment.propertyName}: ₦{owed.toLocaleString()} owed on this charge.
      </Text>
      <SegmentedControl
        accessibilityLabel="How much to pay"
        value={mode}
        onChange={setMode}
        options={[
          { value: 'full', label: 'Pay in full' },
          { value: 'part', label: 'Pay part' },
        ]}
      />
      {mode === 'part' ? (
        <View style={{ gap: spacing.xs }}>
          <CurrencyField label="Amount" value={amount} onValueChange={setAmount} />
          <Text variant="caption" color="mutedForeground">
            At least ₦{min.toLocaleString()}, and you can pay up to ₦{(owed - 1).toLocaleString()}{' '}
            as a part-payment. The rest stays owed on this charge. The first rent on a new lease has
            to be paid in full.
          </Text>
        </View>
      ) : null}
      <Button
        label={`Pay ₦${(mode === 'part' && partValid ? part : owed).toLocaleString()}`}
        disabled={mode === 'part' && !partValid}
        onPress={() => onPay(mode === 'part' ? part : undefined)}
      />
    </View>
  );
}
