'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  RadioGroup,
} from '@sureground/ui';
import { formatCurrency, unwrap } from '@sureground/shared';
import {
  adminChargebacksService,
  type Chargeback,
  type ChargebackOutcome,
} from '@/services/adminChargebacksService';

/**
 * Monnify disputes, and Paystack ones Paystack archived with no resolution,
 * never get an outcome from the payment company, so finance records it here.
 */
export function canDecideByHand(c: Chargeback): boolean {
  return (
    c.status === 'OPEN' &&
    (c.provider === 'MONNIFY' || (c.provider === 'PAYSTACK' && c.providerStatus === 'archived'))
  );
}

export function DecideChargebackDialog({
  chargeback,
  onClose,
  onDecided,
}: {
  chargeback: Chargeback;
  onClose: () => void;
  onDecided: (outcome: ChargebackOutcome) => void;
}) {
  const [outcome, setOutcome] = useState<ChargebackOutcome | null>(null);
  const [error, setError] = useState<string | null>(null);
  const amount = formatCurrency(chargeback.amount);

  const decide = useMutation({
    mutationFn: (o: ChargebackOutcome) =>
      unwrap(adminChargebacksService.decideByHand(chargeback.id, o)),
    onSuccess: (_data, o) => onDecided(o),
    onError: (e: Error) => setError(e.message || 'Could not record the outcome.'),
  });

  const options: { value: ChargebackOutcome; label: string; description: string }[] = [
    {
      value: 'WON',
      label: 'Won: the payer’s bank sided with us',
      description: `The ${amount} stays with the receiver, and anything frozen for this dispute is released.`,
    },
    {
      value: 'LOST',
      label: 'Lost: the payer got their money back',
      description: `${amount} is taken back from the receiver’s balance (never more than this payment credited them) and shown on their next statement.`,
    },
  ];

  return (
    <Dialog open onOpenChange={(o) => !o && !decide.isPending && onClose()}>
      <DialogContent className="sm:max-w-lg p-0">
        <div className="p-5">
          <DialogTitle>Record the outcome</DialogTitle>
          <DialogDescription>
            {chargeback.provider === 'MONNIFY' ? 'Monnify' : 'Paystack'} dispute{' '}
            {chargeback.providerDisputeId} · payment {chargeback.reference} · {amount}.{' '}
            {chargeback.provider === 'MONNIFY'
              ? 'Monnify does not send outcomes to Sureground, so check it on Monnify’s dashboard first.'
              : 'Paystack archived it without a result, so check the outcome with Paystack first.'}{' '}
            This can&rsquo;t be changed afterwards.
          </DialogDescription>
        </div>
        <div className="space-y-4 border-t border-border p-5">
          <RadioGroup
            variant="card"
            aria-label="Outcome"
            value={outcome ?? ''}
            onValueChange={(v) => setOutcome(v as ChargebackOutcome)}
            options={options}
          />
          {error && <Alert variant="danger">{error}</Alert>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={decide.isPending}>
              Cancel
            </Button>
            <Button
              variant={outcome === 'LOST' ? 'danger' : 'primary'}
              disabled={!outcome}
              onClick={() => outcome && decide.mutate(outcome)}
              isLoading={decide.isPending}
              loadingText="Recording…"
            >
              {outcome === 'LOST'
                ? `Record lost and take back ${amount}`
                : outcome === 'WON'
                  ? 'Record won and release'
                  : 'Record outcome'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
