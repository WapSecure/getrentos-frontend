'use client';

import { LegacySelect } from '@getrentos/ui';
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@getrentos/ui';
import { Button, CurrencyInput, DatePicker } from '@getrentos/ui';
import { Receipt } from 'lucide-react';
import type { Unit } from '@/types/landlord';

export interface ChargeUnitInput {
  unitId: string;
  category: 'RENT' | 'SERVICE_CHARGE' | 'DEPOSIT' | 'LEVY';
  amount: number;
  dueDate: string;
  billingCycle: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
}

interface ChargeUnitModalProps {
  unit: Unit | null;
  onClose: () => void;
  onCharge: (input: ChargeUnitInput) => void;
  isPending?: boolean;
  errorMessage?: string | null;
}

/** Charges one unit's tenant. Deliberately single-unit: Free plans collect rent. */
export const ChargeUnitModal = ({
  unit,
  onClose,
  onCharge,
  isPending,
  errorMessage,
}: ChargeUnitModalProps) => (
  <Dialog open={!!unit} onOpenChange={(open) => !open && onClose()}>
    <DialogContent className="max-w-md">
      {unit && (
        <ChargeUnitForm
          key={unit.id}
          unit={unit}
          onClose={onClose}
          onCharge={onCharge}
          isPending={isPending}
          errorMessage={errorMessage}
        />
      )}
    </DialogContent>
  </Dialog>
);

const ChargeUnitForm = ({
  unit,
  onClose,
  onCharge,
  isPending,
  errorMessage,
}: {
  unit: Unit;
  onClose: () => void;
  onCharge: (input: ChargeUnitInput) => void;
  isPending?: boolean;
  errorMessage?: string | null;
}) => {
  // Prefill from what the lease actually charges (never the legacy unit column),
  // and mirror its cadence so the charge matches the signed agreement.
  const rent = unit.leaseRent ?? unit.askingRent;
  const period = unit.leaseRentPeriod ?? unit.askingRentPeriod;

  const [amount, setAmount] = useState(rent !== undefined ? String(rent) : '');
  const [dueDate, setDueDate] = useState('');
  const [category, setCategory] = useState<ChargeUnitInput['category']>('RENT');
  const [billingCycle, setBillingCycle] = useState<ChargeUnitInput['billingCycle']>(
    period === 'year' ? 'ANNUAL' : 'MONTHLY'
  );

  return (
    <>
      <div className="p-4 border-b border-border">
        <DialogTitle className="font-semibold text-foreground">Charge rent</DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground mt-0.5">
          {unit.propertyName} • {unit.unitName}
          {unit.tenantName ? ` — ${unit.tenantName}` : ''}
        </DialogDescription>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Category</label>
          <LegacySelect
            value={category}
            onChange={(event) => setCategory(event.target.value as ChargeUnitInput['category'])}
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground"
          >
            <option value="RENT">Rent</option>
            <option value="SERVICE_CHARGE">Service charge</option>
            <option value="DEPOSIT">Deposit</option>
            <option value="LEVY">Levy</option>
          </LegacySelect>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Amount {period ? `(${period === 'year' ? 'per year' : 'per month'})` : ''}
          </label>
          <CurrencyInput
            prefix="₦"
            value={amount}
            onValueChange={(value) => setAmount(value === 0 ? '' : String(value))}
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground"
          />
          {rent === undefined && (
            <p className="mt-1 text-xs text-muted-foreground">
              This unit has no listing or lease rent to copy — enter the amount yourself.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Billing cycle</label>
          <LegacySelect
            value={billingCycle}
            onChange={(event) =>
              setBillingCycle(event.target.value as ChargeUnitInput['billingCycle'])
            }
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground"
          >
            <option value="MONTHLY">Monthly</option>
            <option value="QUARTERLY">Quarterly</option>
            <option value="ANNUAL">Annual</option>
          </LegacySelect>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Due date</label>
          <DatePicker value={dueDate} onChange={setDueDate} />
        </div>

        {errorMessage && (
          <p role="alert" className="text-xs text-red-600 dark:text-red-400">
            {errorMessage}
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <Button variant="ghost" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            className="flex-1 gap-2"
            disabled={isPending || Number(amount) <= 0 || !dueDate}
            onClick={() =>
              onCharge({
                unitId: unit.id,
                category,
                amount: Number(amount),
                dueDate,
                billingCycle,
              })
            }
          >
            <Receipt className="w-4 h-4" />
            {isPending ? 'Charging…' : 'Charge unit'}
          </Button>
        </div>
      </div>
    </>
  );
};
