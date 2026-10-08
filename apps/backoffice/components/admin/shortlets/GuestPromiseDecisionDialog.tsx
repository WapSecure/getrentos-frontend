'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Button,
  CurrencyInput,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  Textarea,
} from '@getrentos/ui';
import { formatCurrency, unwrap } from '@getrentos/shared';
import { adminShortletService } from '@/services/adminShortletService';
import type { AdminGuestPromiseOutcome, AdminShortletDispute } from '@/types/shortlet';

const OUTCOMES: { value: AdminGuestPromiseOutcome; label: string; hint: string }[] = [
  {
    value: 'FULL_REFUND',
    label: 'Uphold: full refund',
    hint: 'Refunds everything the guest paid (stay, tax, held deposit) and ends the stay. The host is not paid.',
  },
  {
    value: 'PARTIAL_REFUND',
    label: 'Partly uphold: partial refund',
    hint: 'Refunds part of the stay. The stay carries on and the host is paid the rest.',
  },
  {
    value: 'NOT_UPHELD',
    label: 'Not upheld',
    hint: "No refund. The host's payment for the stay is released.",
  },
];

/** Support's money decision on a Guest Promise report. */
export function GuestPromiseDecisionDialog({
  dispute,
  onClose,
  onDecided,
}: {
  dispute: AdminShortletDispute;
  onClose: () => void;
  onDecided: (dispute: AdminShortletDispute) => void;
}) {
  const [outcome, setOutcome] = useState<AdminGuestPromiseOutcome | null>(null);
  const [amount, setAmount] = useState('');
  const [resolution, setResolution] = useState('');
  const [error, setError] = useState<string | null>(null);
  const stayTotal = dispute.amount ?? 0;

  const decide = useMutation({
    mutationFn: () =>
      unwrap(
        adminShortletService.decideGuestPromise(dispute.id, {
          outcome: outcome!,
          resolution: resolution.trim(),
          ...(outcome === 'PARTIAL_REFUND' ? { refundAmount: Number(amount) } : {}),
        })
      ),
    onSuccess: onDecided,
    onError: (e: Error) => setError(e.message),
  });

  const submit = () => {
    if (!outcome) return setError('Choose a decision.');
    if (outcome === 'PARTIAL_REFUND') {
      const n = Number(amount);
      if (!(n > 0 && n < stayTotal)) {
        return setError(
          `A partial refund must be more than ₦0 and less than ${formatCurrency(stayTotal)}.`
        );
      }
    }
    if (resolution.trim().length < 5)
      return setError('Explain the decision to the guest and host.');
    setError(null);
    decide.mutate();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg p-0">
        <div className="p-5">
          <DialogTitle>Decide this Guest Promise report</DialogTitle>
          <DialogDescription>
            {dispute.listingTitle ?? 'Shortlet'} · stay worth {formatCurrency(stayTotal)}. Money
            moves as soon as you confirm, and the decision can&rsquo;t be changed afterwards.
          </DialogDescription>
        </div>
        <div className="space-y-4 border-t border-border p-5">
          <fieldset className="space-y-2">
            {OUTCOMES.map((o) => (
              <label
                key={o.value}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm ${
                  outcome === o.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-secondary/50'
                }`}
              >
                <input
                  type="radio"
                  name="outcome"
                  className="mt-1"
                  checked={outcome === o.value}
                  onChange={() => setOutcome(o.value)}
                />
                <span>
                  <span className="font-medium">{o.label}</span>
                  <span className="block text-xs text-muted-foreground">{o.hint}</span>
                </span>
              </label>
            ))}
          </fieldset>
          {outcome === 'PARTIAL_REFUND' && (
            <Field label="Refund to the guest" hint={`Less than ${formatCurrency(stayTotal)}`}>
              <CurrencyInput
                prefix="₦"
                value={amount}
                onValueChange={(v) => setAmount(v === 0 ? '' : String(v))}
              />
            </Field>
          )}
          <Field label="Decision, as the guest and host will read it">
            <Textarea
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="e.g. The photos show the generator the listing promises is missing."
            />
          </Field>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={decide.isPending}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={decide.isPending}>
              {decide.isPending ? 'Deciding…' : 'Confirm decision'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
