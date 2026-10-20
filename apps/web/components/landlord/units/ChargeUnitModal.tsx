'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@getrentos/ui';
import { Alert, Button, CurrencyInput, DatePicker, Field, Select } from '@getrentos/ui';
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
    <DialogContent className="max-w-md p-0">
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
        <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-foreground">
          Charge rent
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground mt-0.5">
          {unit.propertyName} • {unit.unitName}
          {unit.tenantName ? `: ${unit.tenantName}` : ''}
        </DialogDescription>
      </div>

      <div className="p-4 space-y-3">
        <Field label="Category">
          <Select
            value={category}
            onValueChange={(value) => setCategory(value as ChargeUnitInput['category'])}
            searchable={false}
            options={[
              { value: 'RENT', label: 'Rent' },
              { value: 'SERVICE_CHARGE', label: 'Service charge' },
              { value: 'DEPOSIT', label: 'Deposit' },
              { value: 'LEVY', label: 'Levy' },
            ]}
          />
        </Field>

        <Field
          label={`Amount ${period ? `(${period === 'year' ? 'per year' : 'per month'})` : ''}`}
          required
          hint={
            rent === undefined
              ? 'This unit has no listing or lease rent to copy: enter the amount yourself.'
              : undefined
          }
        >
          <CurrencyInput
            prefix="₦"
            value={amount}
            onValueChange={(value) => setAmount(value === 0 ? '' : String(value))}
          />
        </Field>

        <Field label="Billing cycle">
          <Select
            value={billingCycle}
            onValueChange={(value) => setBillingCycle(value as ChargeUnitInput['billingCycle'])}
            searchable={false}
            options={[
              { value: 'MONTHLY', label: 'Monthly' },
              { value: 'QUARTERLY', label: 'Quarterly' },
              { value: 'ANNUAL', label: 'Annual' },
            ]}
          />
        </Field>

        <Field label="Due date" required>
          <DatePicker value={dueDate} onChange={setDueDate} />
        </Field>

        {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

        <div className="flex gap-2 pt-1">
          <Button variant="ghost" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            className="flex-1 gap-2"
            disabled={Number(amount) <= 0 || !dueDate}
            isLoading={isPending}
            loadingText="Charging…"
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
            Charge unit
          </Button>
        </div>
      </div>
    </>
  );
};
