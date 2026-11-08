'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Alert,
  Button,
  CurrencyInput,
  DatePicker,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  Input,
} from '@getrentos/ui';
import { formatCurrency, unwrap } from '@getrentos/shared';
import { adminChargebacksService } from '@/services/adminChargebacksService';

const REFERENCE = /^[A-Za-z0-9_.|-]{4,100}$/;
const MAX_AMOUNT = 1_000_000_000;

/** Today in Lagos, as YYYY-MM-DD. */
function lagosToday(): string {
  return new Date(Date.now() + 60 * 60_000).toISOString().slice(0, 10);
}

/**
 * Monnify does not tell GetRentos when a payer disputes a card payment, so
 * finance copies each one in from Monnify's dashboard (audit GW-11). Recording
 * it holds the money back exactly as a Paystack dispute does.
 */
export function RecordMonnifyDisputeDialog({
  onClose,
  onRecorded,
}: {
  onClose: () => void;
  onRecorded: () => void;
}) {
  const [disputeId, setDisputeId] = useState('');
  const [reference, setReference] = useState('');
  const [amount, setAmount] = useState('');
  const [dueOn, setDueOn] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [today] = useState(lagosToday);

  const naira = Number(amount);

  const record = useMutation({
    mutationFn: () =>
      unwrap(
        adminChargebacksService.recordMonnify({
          disputeId: disputeId.trim(),
          reference: reference.trim(),
          amount: naira,
          // Evidence is due by the end of that day in Lagos.
          ...(dueOn ? { dueAt: new Date(`${dueOn}T23:59:00+01:00`).toISOString() } : {}),
        })
      ),
    onSuccess: onRecorded,
    onError: (e: Error) => setError(e.message || 'Could not record this dispute.'),
  });

  const submit = () => {
    const id = disputeId.trim();
    if (id.length < 3 || id.length > 100) {
      return setError('Enter the dispute ID exactly as Monnify shows it.');
    }
    if (!REFERENCE.test(reference.trim())) {
      return setError(
        'Enter the GetRentos payment reference: 4 to 100 letters, numbers, dots, dashes, underscores or bars.'
      );
    }
    if (!Number.isInteger(naira) || naira < 1 || naira > MAX_AMOUNT) {
      return setError(
        `Enter the disputed amount in whole naira, up to ${formatCurrency(MAX_AMOUNT)}.`
      );
    }
    setError(null);
    record.mutate();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && !record.isPending && onClose()}>
      <DialogContent className="sm:max-w-lg p-0">
        <div className="p-5">
          <DialogTitle>Record a Monnify dispute</DialogTitle>
          <DialogDescription>
            Monnify does not tell GetRentos when a payer disputes a card payment. Copy each one in
            from Monnify&rsquo;s dashboard so the money is held back while it is open.
          </DialogDescription>
        </div>
        <div className="space-y-4 border-t border-border p-5">
          <Field label="Dispute ID" hint="Monnify's own ID for the dispute">
            <Input
              value={disputeId}
              onChange={(e) => setDisputeId(e.target.value)}
              maxLength={100}
              autoComplete="off"
            />
          </Field>
          <Field label="Payment reference" hint="The GetRentos reference of the disputed payment">
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              maxLength={100}
              autoComplete="off"
            />
          </Field>
          <Field label="Disputed amount" hint="Whole naira, as Monnify shows it">
            <CurrencyInput
              prefix="₦"
              value={amount}
              maxValue={MAX_AMOUNT}
              onValueChange={(v) => setAmount(v === 0 ? '' : String(v))}
            />
          </Field>
          <Field label="Evidence due (optional)" hint="The deadline Monnify gives for evidence">
            <DatePicker
              value={dueOn}
              onChange={setDueOn}
              min={today}
              clearable
              placeholder="No deadline given"
            />
          </Field>
          <Alert variant="warning">
            {naira > 0
              ? `Recording this holds back ${formatCurrency(naira)} of that payment: `
              : 'Recording this holds back the disputed money: '}
            frozen if GetRentos still has it, kept back from the receiver&rsquo;s payouts if it is
            in their balance, or listed to recover if it was already paid out. It stays held until
            you record the outcome.
          </Alert>
          {error && <Alert variant="danger">{error}</Alert>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={record.isPending}>
              Cancel
            </Button>
            <Button onClick={submit} isLoading={record.isPending} loadingText="Recording…">
              {naira > 0 ? `Record and hold ${formatCurrency(naira)}` : 'Record dispute'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
