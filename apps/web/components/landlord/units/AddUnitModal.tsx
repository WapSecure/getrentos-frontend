'use client';

import { useState } from 'react';
import {
  Button,
  CurrencyInput,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  Input,
  NumberInput,
  Select,
} from '@getrentos/ui';
import type { Property, Unit } from '@/types/landlord';

interface AddUnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: Property[];
  defaultPropertyId?: string;
  onSave: (
    unit: Omit<Unit, 'id' | 'occupancyStatus' | 'tenantId' | 'tenantName'>
  ) => Promise<boolean>;
}

export const AddUnitModal = ({
  isOpen,
  onClose,
  properties,
  defaultPropertyId,
  onSave,
}: AddUnitModalProps) => {
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [unitName, setUnitName] = useState('');
  const [bedrooms, setBedrooms] = useState('1');
  const [bathrooms, setBathrooms] = useState('1');
  const [askingRent, setAskingRent] = useState('');
  const [askingRentPeriod, setAskingRentPeriod] = useState<'year' | 'month'>('year');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const propertyId = properties.some((p) => p.id === selectedPropertyId)
    ? selectedPropertyId
    : defaultPropertyId || properties[0]?.id || '';

  const handleClose = () => {
    setSelectedPropertyId('');
    setUnitName('');
    setBedrooms('1');
    setBathrooms('1');
    setAskingRent('');
    setAskingRentPeriod('year');
    onClose();
  };

  const handleSubmit = async () => {
    const property = properties.find((p) => p.id === propertyId);
    if (!property || !unitName.trim() || isSubmitting) return;
    setIsSubmitting(true);
    const saved = await onSave({
      propertyId,
      propertyName: property.name,
      unitName: unitName.trim(),
      bedrooms: Number(bedrooms),
      bathrooms: Number(bathrooms),
      askingRent: askingRent ? Number(askingRent) : undefined,
      askingRentPeriod,
    });
    setIsSubmitting(false);
    if (saved) handleClose();
  };

  const isValid = propertyId && unitName.trim();

  return (
    <Dialog open={isOpen} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent padded={false}>
        <div className="p-4 pr-12 border-b border-border flex justify-between items-center gap-3">
          <div className="min-w-0">
            <DialogTitle className="font-semibold text-foreground">Add Unit</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Define a new unit within a property
            </DialogDescription>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <Field label="Property" required>
            <Select
              value={propertyId}
              onValueChange={setSelectedPropertyId}
              options={properties.map((p) => ({ value: p.id, label: p.name }))}
            />
          </Field>

          <Field label="Unit Name" required>
            <Input
              type="text"
              value={unitName}
              onChange={(e) => setUnitName(e.target.value)}
              placeholder="e.g. Unit 3B"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Bedrooms">
              <NumberInput min={0} value={bedrooms} onValueChange={setBedrooms} />
            </Field>
            <Field label="Bathrooms">
              <NumberInput min={0} value={bathrooms} onValueChange={setBathrooms} />
            </Field>
          </div>

          <Field
            label="Rent"
            hint="Optional. Rent is quoted per year here, as it is paid in Nigeria. This is what the advert will ask for."
          >
            <div className="flex gap-2">
              <CurrencyInput
                prefix="₦"
                min={0}
                value={askingRent}
                onValueChange={(v) => setAskingRent(v === 0 ? '' : String(v))}
                placeholder={askingRentPeriod === 'year' ? '2500000' : '250000'}
                className="min-w-0 flex-1"
              />
              <div className="w-32 shrink-0">
                <Select
                  id="unit-rent-period"
                  value={askingRentPeriod}
                  onValueChange={(value) => setAskingRentPeriod(value as 'year' | 'month')}
                  ariaLabel="Rent period"
                  searchable={false}
                  options={[
                    { value: 'year', label: 'per year' },
                    { value: 'month', label: 'per month' },
                  ]}
                />
              </div>
            </div>
          </Field>
        </div>

        <div className="p-4 border-t border-border flex gap-3">
          <Button
            variant="primary"
            fullWidth
            onClick={() => void handleSubmit()}
            disabled={!isValid}
            isLoading={isSubmitting}
          >
            Add Unit
          </Button>
          <Button variant="ghost" fullWidth onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
