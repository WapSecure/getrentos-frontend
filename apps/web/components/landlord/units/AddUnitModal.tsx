'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import {
  Button,
  CurrencyInput,
  Field,
  IconButton,
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
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-card rounded-xl max-w-md w-full overflow-hidden"
          >
            <div className="p-4 border-b border-border flex justify-between items-center gap-3">
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground">Add Unit</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Define a new unit within a property
                </p>
              </div>
              <IconButton label="Close" size="sm" icon={<X />} onClick={handleClose} />
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
                label="Rent (₦)"
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
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
