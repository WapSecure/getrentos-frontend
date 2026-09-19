'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Tag } from 'lucide-react';
import {
  Button,
  Checkbox,
  CurrencyInput,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  EmptyState,
  Field,
  Pagination,
  Select,
  Toast,
  type ToastVariant,
} from '@getrentos/ui';
import { formatCurrency } from '@getrentos/shared';
import { rentSuffix } from '@/lib/leaseTerm';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';
import { landlordService } from '@/services/landlordService';
import type { Property } from '@/types/landlord';
import { usePlanGateModal } from '@/hooks/usePlanGateModal';
import { UpgradeToProModal } from '@/components/shared/subscription/UpgradeToProModal';

interface BulkPricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: Property[];
}

const PAGE_SIZE = 10;

export function BulkPricingModal({ isOpen, onClose, properties }: BulkPricingModalProps) {
  const queryClient = useQueryClient();
  const [propertyId, setPropertyId] = useState('');
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);
  const [askingRent, setAskingRent] = useState('');
  const [askingRentPeriod, setAskingRentPeriod] = useState<'year' | 'month'>('year');
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);
  const planGate = usePlanGateModal();

  const { data: unitsData } = useQuery({
    queryKey: [
      ...landlordKeys.units(propertyId || undefined),
      { page, pageSize: PAGE_SIZE, bulkPricing: true },
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
  const units = useMemo(() => unitsData?.items ?? [], [unitsData]);
  const totalUnits = unitsData?.total ?? 0;

  const eligibleUnits = useMemo(
    () => units.filter((unit) => !propertyId || unit.propertyId === propertyId),
    [units, propertyId]
  );

  const reset = () => {
    setPropertyId('');
    setSelectedUnitIds([]);
    setAskingRent('');
    setAskingRentPeriod('year');
    setPage(1);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const bulkPrice = useMutation({
    mutationFn: () =>
      unwrap(
        landlordService.bulkUpdateUnitPricing(
          selectedUnitIds,
          Math.round(Number(askingRent)),
          askingRentPeriod
        )
      ),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: landlordKeys.units() });
      void queryClient.invalidateQueries({ queryKey: landlordKeys.listings() });
      // Published adverts carry the price the market sees, so say when they moved
      // too — otherwise the landlord cannot tell what the re-price reached.
      const listings =
        result.listingsUpdated > 0
          ? ` and ${result.listingsUpdated} live advert${result.listingsUpdated === 1 ? '' : 's'}`
          : '';
      setToast({
        message: `Updated pricing for ${result.updated} unit${result.updated === 1 ? '' : 's'}${listings}.`,
        variant: 'success',
      });
      handleClose();
    },
    onError: (error: Error) => {
      if (planGate.handleError(error)) return;
      setToast({ message: error.message || 'Unable to update pricing.', variant: 'error' });
    },
  });

  const rentValue = Number(askingRent);
  const isValid = selectedUnitIds.length > 0 && rentValue > 0;

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
                    setPage(1);
                  }}
                  placeholder="All properties"
                  options={[
                    { value: '', label: 'All properties' },
                    ...properties.map((property) => ({ value: property.id, label: property.name })),
                  ]}
                />
              </Field>
              <Field
                label="New rent (₦)"
                htmlFor="bulk-price-amount"
                required
                className="sm:col-span-2"
              >
                <div className="flex gap-2">
                  <CurrencyInput
                    id="bulk-price-amount"
                    prefix="₦"
                    min="1"
                    value={askingRent}
                    onValueChange={(v) => setAskingRent(v === 0 ? '' : String(v))}
                    placeholder={askingRentPeriod === 'year' ? 'e.g. 2500000' : 'e.g. 250000'}
                    className="flex-1"
                  />
                  <select
                    value={askingRentPeriod}
                    onChange={(e) => setAskingRentPeriod(e.target.value as 'year' | 'month')}
                    className="px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    aria-label="Rent period"
                  >
                    <option value="year">per year</option>
                    <option value="month">per month</option>
                  </select>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Applied to the selected units and to any live advert for them, so the price the
                  market sees does not drift from the one you set.
                </p>
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
                        {unit.askingRent !== undefined
                          ? `Currently ${formatCurrency(unit.askingRent, { compact: true })}${rentSuffix(unit.askingRentPeriod)}`
                          : 'Not priced yet'}
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
      <UpgradeToProModal
        isOpen={planGate.isOpen}
        onClose={planGate.close}
        reason={planGate.reason}
      />
    </>
  );
}
