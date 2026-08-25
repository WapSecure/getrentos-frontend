'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Receipt } from 'lucide-react';
import {
  Button,
  Checkbox,
  CurrencyInput,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  DatePicker,
  Pagination,
  Select,
  Toast,
  type ToastVariant,
} from '@getrentos/ui';
import { formatCurrency } from '@getrentos/shared';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';
import {
  landlordService,
  type BillingCycle,
  type ChargeCategory,
} from '@/services/landlordService';
import type { Property } from '@/types/landlord';

const categoryOptions: { value: ChargeCategory; label: string }[] = [
  { value: 'RENT', label: 'Rent' },
  { value: 'SERVICE_CHARGE', label: 'Service charge' },
  { value: 'DEPOSIT', label: 'Deposit' },
  { value: 'LEVY', label: 'Levy' },
];

const billingCycleOptions: { value: BillingCycle; label: string }[] = [
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'ANNUAL', label: 'Annual' },
];

interface BulkChargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: Property[];
}

const PAGE_SIZE = 10;

export function BulkChargeModal({ isOpen, onClose, properties }: BulkChargeModalProps) {
  const queryClient = useQueryClient();
  const [propertyId, setPropertyId] = useState('');
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);
  const [category, setCategory] = useState<ChargeCategory>('RENT');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('MONTHLY');
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const { data: unitsData } = useQuery({
    queryKey: [
      ...landlordKeys.units(propertyId || undefined),
      { page, pageSize: PAGE_SIZE, bulkCharge: true },
    ],
    queryFn: () =>
      unwrap(
        landlordService.listUnits({
          propertyId: propertyId || undefined,
          page,
          pageSize: PAGE_SIZE,
        })
      ),
    enabled: isOpen,
  });
  const units = unitsData?.items ?? [];
  const totalUnits = unitsData?.total ?? 0;

  const eligibleUnits = useMemo(
    () =>
      units.filter(
        (unit) =>
          unit.occupancyStatus !== 'vacant' && (!propertyId || unit.propertyId === propertyId)
      ),
    [units, propertyId]
  );

  const reset = () => {
    setPropertyId('');
    setSelectedUnitIds([]);
    setCategory('RENT');
    setAmount('');
    setDueDate('');
    setBillingCycle('MONTHLY');
    setPage(1);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const bulkCharge = useMutation({
    mutationFn: () =>
      unwrap(
        landlordService.bulkCharge({
          unitIds: selectedUnitIds,
          category,
          amount: Math.round(Number(amount)),
          dueDate,
          billingCycle,
        })
      ),
    onSuccess: (result) => {
      // Partial key match invalidates every payments status variant (all/overdue/...).
      void queryClient.invalidateQueries({ queryKey: ['landlord', 'payments'] });
      void queryClient.invalidateQueries({ queryKey: landlordKeys.rentCollectionStats });
      const summary =
        result.skipped.length > 0
          ? `Charged ${result.created} unit${result.created === 1 ? '' : 's'}, skipped ${result.skipped.length} without a signed lease.`
          : `Charged ${result.created} unit${result.created === 1 ? '' : 's'}.`;
      setToast({ message: summary, variant: result.created > 0 ? 'success' : 'error' });
      if (result.created > 0) handleClose();
    },
    onError: (error: Error) => {
      setToast({ message: error.message || 'Unable to create these charges.', variant: 'error' });
    },
  });

  const amountValue = Number(amount);
  const isValid = selectedUnitIds.length > 0 && amountValue > 0 && dueDate;

  const toggleUnit = (unitId: string) => {
    setSelectedUnitIds((current) =>
      current.includes(unitId) ? current.filter((id) => id !== unitId) : [...current, unitId]
    );
  };

  const toggleAll = () => {
    const currentPageIds = eligibleUnits.map((unit) => unit.id);
    const allCurrentPageSelected = currentPageIds.every((id) => selectedUnitIds.includes(id));
    setSelectedUnitIds((current) =>
      allCurrentPageSelected
        ? current.filter((id) => !currentPageIds.includes(id))
        : [...new Set([...current, ...currentPageIds])]
    );
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-2xl">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (isValid) bulkCharge.mutate();
            }}
            className="p-6"
          >
            <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-foreground">
              Bulk charge
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm text-muted-foreground">
              Apply the same charge to every selected unit&apos;s current lease in one go.
            </DialogDescription>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Property" hint="Narrows the unit list below." className="sm:col-span-2">
                <Select
                  ariaLabel="Filter units by property"
                  value={propertyId}
                  onValueChange={(value) => {
                    setPropertyId(value);
                    setSelectedUnitIds([]);
                    setPage(1);
                  }}
                  placeholder="All properties"
                  options={[
                    { value: '', label: 'All properties' },
                    ...properties.map((property) => ({ value: property.id, label: property.name })),
                  ]}
                />
              </Field>
              <Field label="Category" required>
                <Select
                  ariaLabel="Charge category"
                  value={category}
                  onValueChange={(value) => setCategory(value as ChargeCategory)}
                  options={categoryOptions}
                />
              </Field>
              <Field label="Billing cycle" required>
                <Select
                  ariaLabel="Billing cycle"
                  value={billingCycle}
                  onValueChange={(value) => setBillingCycle(value as BillingCycle)}
                  options={billingCycleOptions}
                />
              </Field>
              <Field label="Amount (₦)" htmlFor="bulk-charge-amount" required>
                <CurrencyInput
                  id="bulk-charge-amount"
                  prefix="₦"
                  min={1}
                  value={amount}
                  onValueChange={(v) => setAmount(v === 0 ? '' : String(v))}
                  placeholder="e.g. 150000"
                />
              </Field>
              <Field label="Due date" required>
                <DatePicker value={dueDate} onChange={setDueDate} />
              </Field>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-foreground">
                  Units ({selectedUnitIds.length} selected across {totalUnits})
                </p>
                {eligibleUnits.length > 0 && (
                  <button
                    type="button"
                    onClick={toggleAll}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    {eligibleUnits.every((unit) => selectedUnitIds.includes(unit.id))
                      ? 'Deselect page'
                      : 'Select page'}
                  </button>
                )}
              </div>

              {eligibleUnits.length === 0 ? (
                <div className="rounded-xl border border-border p-6 text-center">
                  <Receipt className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No occupied units on this page{propertyId ? ' for this property' : ''}. Only
                    units with a tenant can be charged.
                  </p>
                </div>
              ) : (
                <div className="max-h-56 overflow-y-auto rounded-xl border border-border divide-y divide-border">
                  {eligibleUnits.map((unit) => (
                    <label
                      key={unit.id}
                      className="flex items-center justify-between gap-3 p-3 cursor-pointer hover:bg-secondary/50"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Checkbox
                          checked={selectedUnitIds.includes(unit.id)}
                          onCheckedChange={() => toggleUnit(unit.id)}
                          aria-label={`Select ${unit.unitName}`}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {unit.unitName} · {unit.propertyName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {unit.tenantName || 'Tenant'}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatCurrency(unit.monthlyRent, { compact: true })}/mo
                      </span>
                    </label>
                  ))}
                </div>
              )}
              {totalUnits > 0 && (
                <Pagination
                  page={page}
                  pageSize={PAGE_SIZE}
                  total={totalUnits}
                  onPageChange={setPage}
                  className="mt-3"
                />
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-border pt-5">
              <Button type="button" variant="outline" rounded="md" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                rounded="md"
                isLoading={bulkCharge.isPending}
                disabled={!isValid}
              >
                Charge {selectedUnitIds.length || ''} unit{selectedUnitIds.length === 1 ? '' : 's'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </>
  );
}
