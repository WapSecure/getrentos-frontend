'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Tag } from 'lucide-react';
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  EmptyState,
  Field,
  Input,
  Select,
  Toast,
  type ToastVariant,
} from '@getrentos/ui';
import { formatCurrency } from '@getrentos/shared';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';
import { landlordService } from '@/services/landlordService';
import type { Property, Unit } from '@/types/landlord';

interface BulkPricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  units: Unit[];
  properties: Property[];
}

export function BulkPricingModal({ isOpen, onClose, units, properties }: BulkPricingModalProps) {
  const queryClient = useQueryClient();
  const [propertyId, setPropertyId] = useState('');
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);
  const [monthlyRent, setMonthlyRent] = useState('');
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const eligibleUnits = useMemo(
    () => units.filter((unit) => !propertyId || unit.propertyId === propertyId),
    [units, propertyId]
  );

  const reset = () => {
    setPropertyId('');
    setSelectedUnitIds([]);
    setMonthlyRent('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const bulkPrice = useMutation({
    mutationFn: () =>
      unwrap(
        landlordService.bulkUpdateUnitPricing(selectedUnitIds, Math.round(Number(monthlyRent)))
      ),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: landlordKeys.units() });
      setToast({
        message: `Updated pricing for ${result.updated} unit${result.updated === 1 ? '' : 's'}.`,
        variant: 'success',
      });
      handleClose();
    },
    onError: (error: Error) => {
      setToast({ message: error.message || 'Unable to update pricing.', variant: 'error' });
    },
  });

  const rentValue = Number(monthlyRent);
  const isValid = selectedUnitIds.length > 0 && rentValue > 0;

  const toggleUnit = (unitId: string) => {
    setSelectedUnitIds((current) =>
      current.includes(unitId) ? current.filter((id) => id !== unitId) : [...current, unitId]
    );
  };

  const toggleAll = () => {
    setSelectedUnitIds((current) =>
      current.length === eligibleUnits.length ? [] : eligibleUnits.map((unit) => unit.id)
    );
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-2xl">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (isValid) bulkPrice.mutate();
            }}
            className="p-6"
          >
            <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-foreground">
              Bulk pricing
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm text-muted-foreground">
              Set the same monthly rent across several similar units at once.
            </DialogDescription>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Property" hint="Narrows the unit list below." className="sm:col-span-2">
                <Select
                  ariaLabel="Filter units by property"
                  value={propertyId}
                  onValueChange={(value) => {
                    setPropertyId(value);
                    setSelectedUnitIds([]);
                  }}
                  placeholder="All properties"
                  options={[
                    { value: '', label: 'All properties' },
                    ...properties.map((property) => ({ value: property.id, label: property.name })),
                  ]}
                />
              </Field>
              <Field
                label="New monthly rent (₦)"
                htmlFor="bulk-price-amount"
                required
                className="sm:col-span-2"
              >
                <Input
                  id="bulk-price-amount"
                  type="number"
                  min="1"
                  value={monthlyRent}
                  onChange={(event) => setMonthlyRent(event.target.value)}
                  placeholder="e.g. 200000"
                />
              </Field>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-foreground">
                  Units ({selectedUnitIds.length} of {eligibleUnits.length} selected)
                </p>
                {eligibleUnits.length > 0 && (
                  <button
                    type="button"
                    onClick={toggleAll}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    {selectedUnitIds.length === eligibleUnits.length
                      ? 'Deselect all'
                      : 'Select all'}
                  </button>
                )}
              </div>

              {eligibleUnits.length === 0 ? (
                <div className="rounded-xl border border-border p-6 text-center">
                  <EmptyState
                    icon={Tag}
                    title="No units"
                    description="No units match this property."
                  />
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
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        Currently {formatCurrency(unit.monthlyRent, { compact: true })}/mo
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-border pt-5">
              <Button type="button" variant="outline" rounded="md" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                rounded="md"
                isLoading={bulkPrice.isPending}
                disabled={!isValid}
              >
                Update pricing
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
