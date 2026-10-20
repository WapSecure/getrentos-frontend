'use client';

import { useState } from 'react';
import {
  Button,
  Checkbox,
  CurrencyInput,
  DatePicker,
  Dialog,
  DialogContent,
  DialogTitle,
  Field,
  Input,
  ListSkeleton,
  Pagination,
  Select,
} from '@getrentos/ui';
import type { Household } from '@/types/estate';

interface CreateDuesModalProps {
  isOpen: boolean;
  households: Household[];
  householdTotal: number;
  householdPage: number;
  householdPageSize: number;
  onHouseholdPageChange: (page: number) => void;
  isHouseholdsLoading?: boolean;
  onClose: () => void;
  onSubmit: (data: {
    amount: number;
    dueDate: string;
    description?: string;
    category?: 'RENT' | 'SERVICE_CHARGE' | 'DEPOSIT' | 'LEVY';
    billingCycle?: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
    isRecurring?: boolean;
    householdIds?: string[];
  }) => void;
  isSubmitting?: boolean;
}

const categoryOptions = [
  { value: 'LEVY', label: 'Levy' },
  { value: 'SERVICE_CHARGE', label: 'Service Charge' },
  { value: 'DEPOSIT', label: 'Deposit' },
];

const billingCycleOptions = [
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'ANNUAL', label: 'Annual' },
];

export const CreateDuesModal = ({
  isOpen,
  households,
  householdTotal,
  householdPage,
  householdPageSize,
  onHouseholdPageChange,
  isHouseholdsLoading,
  onClose,
  onSubmit,
  isSubmitting,
}: CreateDuesModalProps) => {
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('LEVY');
  const [billingCycle, setBillingCycle] = useState('MONTHLY');
  const [isRecurring, setIsRecurring] = useState(false);
  const [chargeAll, setChargeAll] = useState(true);
  const [selectedHouseholdIds, setSelectedHouseholdIds] = useState<string[]>([]);

  // The caller requests only active households from the server. Retaining the
  // local guard makes this safe if a cached response predates that filter.
  const activeHouseholds = households.filter((h) => h.status === 'active');

  const handleClose = () => {
    setAmount('');
    setDueDate('');
    setDescription('');
    setCategory('LEVY');
    setBillingCycle('MONTHLY');
    setIsRecurring(false);
    setChargeAll(true);
    setSelectedHouseholdIds([]);
    onClose();
  };

  const toggleHousehold = (id: string) => {
    setSelectedHouseholdIds((prev) =>
      prev.includes(id) ? prev.filter((h) => h !== id) : [...prev, id]
    );
  };

  const canSubmit =
    amount && Number(amount) > 0 && dueDate && (chargeAll || selectedHouseholdIds.length > 0);

  return (
    <Dialog open={isOpen} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent size="md">
        <DialogTitle className="text-lg font-semibold text-foreground">Charge Dues</DialogTitle>

        <div className="mt-4 space-y-4">
          <Field label="Amount" required>
            <CurrencyInput
              prefix="₦"
              value={amount}
              onValueChange={(v) => setAmount(v === 0 ? '' : String(v))}
              min={1}
            />
          </Field>

          <Field label="Due Date" required>
            <DatePicker value={dueDate} onChange={setDueDate} />
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Category">
              <Select value={category} onValueChange={setCategory} options={categoryOptions} />
            </Field>
            <Field label="Billing Cycle">
              <Select
                value={billingCycle}
                onValueChange={setBillingCycle}
                options={billingCycleOptions}
              />
            </Field>
          </div>

          <Checkbox
            checked={isRecurring}
            onCheckedChange={setIsRecurring}
            label="Repeat automatically every billing cycle"
          />

          <Field label="Description" optionalLabel="(optional)">
            <Input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Q3 estate maintenance levy"
            />
          </Field>

          <div className="space-y-2">
            <Checkbox
              checked={chargeAll}
              onCheckedChange={setChargeAll}
              label={`Charge all active households (${householdTotal})`}
            />

            {!chargeAll && (
              <div className="max-h-40 overflow-y-auto rounded-lg border border-border divide-y divide-border">
                {isHouseholdsLoading ? (
                  <ListSkeleton
                    rows={3}
                    label="Loading households"
                    className="rounded-none border-0"
                  />
                ) : activeHouseholds.length === 0 ? (
                  <p className="px-3 py-4 text-sm text-muted-foreground">
                    No active households on this page.
                  </p>
                ) : (
                  activeHouseholds.map((household) => (
                    <Checkbox
                      key={household.id}
                      className="px-3 py-2"
                      checked={selectedHouseholdIds.includes(household.id)}
                      onCheckedChange={() => toggleHousehold(household.id)}
                      label={`${household.unitLabel}: ${household.residentName}`}
                    />
                  ))
                )}
                {householdTotal > 0 && (
                  <Pagination
                    page={householdPage}
                    pageSize={householdPageSize}
                    total={householdTotal}
                    onPageChange={onHouseholdPageChange}
                  />
                )}
              </div>
            )}
            {!chargeAll && selectedHouseholdIds.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {selectedHouseholdIds.length} household
                {selectedHouseholdIds.length === 1 ? '' : 's'} selected across pages.
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!canSubmit}
            isLoading={isSubmitting}
            loadingText="Charging…"
            onClick={() =>
              onSubmit({
                amount: Number(amount),
                dueDate,
                description: description.trim() || undefined,
                category: category as 'RENT' | 'SERVICE_CHARGE' | 'DEPOSIT' | 'LEVY',
                billingCycle: billingCycle as 'MONTHLY' | 'QUARTERLY' | 'ANNUAL',
                isRecurring,
                householdIds: chargeAll ? undefined : selectedHouseholdIds,
              })
            }
          >
            Charge Dues
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
