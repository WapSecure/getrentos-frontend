'use client';

import { useMemo, useState } from 'react';
import { Dialog, DialogContent, Button, Select, CurrencyInput } from '@getrentos/ui';
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

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">Tenancy</span>
            <Select
              value={leaseId}
              onValueChange={pickLease}
              placeholder="Select a tenancy"
              options={leases.map((l) => ({ value: l.id, label: l.label }))}
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">Amount held</span>
            <CurrencyInput value={amount} onValueChange={setAmount} placeholder="Deposit amount" />
            {selected && !selected.securityDeposit && (
              <span className="text-xs text-muted-foreground">
                This lease has no deposit on record — set the amount here.
              </span>
            )}
          </label>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={close} disabled={isPending}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={submit}
              disabled={!leaseId || amount <= 0 || isPending}
            >
              {isPending ? 'Recording…' : 'Record deposit'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
