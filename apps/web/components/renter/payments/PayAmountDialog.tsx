'use client';

import { useState } from 'react';
import {
  Button,
  CurrencyInput,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
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
      <DialogContent className="p-0">
        <div className="p-4 border-b border-border">
          <DialogTitle className="font-semibold text-foreground">Make a payment</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-0.5">
            {payment?.propertyName}: {formatCurrency(owed)} owed on this charge.
          </DialogDescription>
        </div>

        <div className="p-4 space-y-3">
          <div role="radiogroup" aria-label="How much to pay" className="grid grid-cols-2 gap-2">
            {(['full', 'part'] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={mode === m}
                onClick={() => setMode(m)}
                className={`rounded-lg border p-3 text-left text-sm cursor-pointer ${
                  mode === m ? 'border-primary bg-primary/5' : 'border-border hover:bg-secondary'
                }`}
              >
                <span className="block font-medium text-foreground">
                  {m === 'full' ? 'Pay in full' : 'Pay part'}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {m === 'full' ? formatCurrency(owed) : 'Choose an amount'}
                </span>
              </button>
            ))}
          </div>

          {mode === 'part' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Amount (₦)</label>
              <CurrencyInput
                prefix="₦"
                value={amount}
                onValueChange={(v) => setAmount(v === 0 ? '' : String(v))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                At least {formatCurrency(Math.min(MIN_PART_PAYMENT, owed))}. The rest stays owed on
                this charge. The first rent on a new lease has to be paid in full.
              </p>
            </div>
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
