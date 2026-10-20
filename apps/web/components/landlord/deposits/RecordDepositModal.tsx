'use client';

import { useMemo, useState } from 'react';
import { Dialog, DialogContent, Button, Field, Select, CurrencyInput } from '@getrentos/ui';
import type { CreateDepositHoldInput } from '@/services/depositService';

export interface DepositLeaseOption {
  id: string;
  label: string;
  securityDeposit?: number;
}

interface RecordDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  leases: DepositLeaseOption[];
  onCreate: (input: CreateDepositHoldInput) => void;
  isPending: boolean;
}

export const RecordDepositModal = ({
  isOpen,
  onClose,
  leases,
  onCreate,
  isPending,
}: RecordDepositModalProps) => {
  const [leaseId, setLeaseId] = useState('');
  const [amount, setAmount] = useState<number>(0);

  const selected = useMemo(() => leases.find((l) => l.id === leaseId), [leases, leaseId]);

  const pickLease = (id: string) => {
    setLeaseId(id);
    const lease = leases.find((l) => l.id === id);
    if (lease?.securityDeposit) setAmount(lease.securityDeposit);
  };

  const reset = () => {
    setLeaseId('');
    setAmount(0);
  };
  const close = () => {
    reset();
    onClose();
  };

  const submit = () => {
    if (!leaseId || amount <= 0) return;
    onCreate({ leaseId, amount });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="w-full max-w-lg">
        <div className="space-y-5 p-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Record a deposit</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Hold a tenant&apos;s security deposit against their tenancy.
            </p>
          </div>

          <Field label="Tenancy" required>
            <Select
              value={leaseId}
              onValueChange={pickLease}
              placeholder="Select a tenancy"
              options={leases.map((l) => ({ value: l.id, label: l.label }))}
            />
          </Field>

          <Field
            label="Amount held"
            required
            hint={
              selected && !selected.securityDeposit
                ? 'This lease has no deposit on record. Set the amount here.'
                : undefined
            }
          >
            <CurrencyInput value={amount} onValueChange={setAmount} placeholder="Deposit amount" />
          </Field>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={close} disabled={isPending}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={submit}
              disabled={!leaseId || amount <= 0}
              isLoading={isPending}
              loadingText="Recording…"
            >
              Record deposit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
