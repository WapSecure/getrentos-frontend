'use client';

import { useState } from 'react';
import {
  Button,
  CurrencyInput,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  RadioGroup,
} from '@getrentos/ui';
import { formatCurrency } from '@/lib/format';

/** Matches the backend: the smallest part-payment accepted. */
const MIN_PART_PAYMENT = 1_000;

interface PayAmountDialogProps {
  /** The charge being paid, or null when closed. */
  payment: { propertyName: string; owed: number } | null;
  onClose: () => void;
  onPay: (amount: number | undefined) => void;
}

/**
 * Pay what a charge owes, or part of it. Anything paid goes to this charge
 * first; the landlord sees it straight away.
 */
export const PayAmountDialog = ({ payment, onClose, onPay }: PayAmountDialogProps) => {
  const [mode, setMode] = useState<'full' | 'part'>('full');
  const [amount, setAmount] = useState('');

  const close = () => {
    setMode('full');
    setAmount('');
    onClose();
  };

  const owed = payment?.owed ?? 0;
  const part = Number(amount);
  const partValid = part >= Math.min(MIN_PART_PAYMENT, owed) && part < owed;

  return (
    <Dialog open={!!payment} onOpenChange={(open) => !open && close()}>
      <DialogContent className="p-0 sm:p-0">
        <div className="p-4 pr-12 border-b border-border">
          <DialogTitle className="font-semibold text-foreground">Make a payment</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-0.5">
            {payment?.propertyName}: {formatCurrency(owed)} owed on this charge.
          </DialogDescription>
        </div>

        <div className="p-4 space-y-3">
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
              label="Amount (₦)"
              hint={`At least ${formatCurrency(Math.min(MIN_PART_PAYMENT, owed))}. The rest stays owed on this charge. The first rent on a new lease has to be paid in full.`}
            >
              <CurrencyInput
                prefix="₦"
                value={amount}
                onValueChange={(v) => setAmount(v === 0 ? '' : String(v))}
              />
            </Field>
          )}

          <Button
            variant="primary"
            fullWidth
            disabled={mode === 'part' && !partValid}
            onClick={() => {
              onPay(mode === 'part' ? part : undefined);
              close();
            }}
          >
            Pay {formatCurrency(mode === 'part' && partValid ? part : owed)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
