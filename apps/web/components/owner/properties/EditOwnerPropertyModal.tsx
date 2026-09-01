'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@getrentos/ui';
import { Button, CurrencyInput, Input, Select } from '@getrentos/ui';
import type { OwnerProperty } from '@/types/owner';
import { LocationFields } from '@/components/shared/location/LocationFields';
import { PROPERTY_TYPE_OPTIONS } from '@/lib/propertyTypes';

type OwnerPropertyUpdates = Pick<
  OwnerProperty,
  'name' | 'propertyType' | 'address' | 'city' | 'state' | 'country' | 'estimatedValue'
>;

interface EditOwnerPropertyModalProps {
  property: OwnerProperty | null;
  onClose: () => void;
  onSave: (id: string, updates: OwnerPropertyUpdates) => Promise<void>;
}

export const EditOwnerPropertyModal = ({
  property,
  onClose,
  onSave,
}: EditOwnerPropertyModalProps) => {
  return (
    <Dialog open={!!property} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {property && (
          <EditOwnerPropertyForm
            key={property.id}
            property={property}
            onSave={onSave}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

const EditOwnerPropertyForm = ({
  property,
  onSave,
  onClose,
}: {
  property: OwnerProperty;
  onSave: (id: string, updates: OwnerPropertyUpdates) => Promise<void>;
  onClose: () => void;
}) => {
  const [name, setName] = useState(property.name);
  const [propertyType, setPropertyType] = useState(property.propertyType);
  const [address, setAddress] = useState(property.address);
  const [city, setCity] = useState(property.city);
  const [state, setState] = useState(property.state);
  const [country, setCountry] = useState(property.country ?? 'Nigeria');
  const [estimatedValue, setEstimatedValue] = useState(String(property.estimatedValue));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await onSave(property.id, {
        name,
        propertyType,
        address,
        city,
        state,
        country,
        estimatedValue: Number(estimatedValue) || property.estimatedValue,
      });
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to update the property.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="p-4 border-b border-border">
        <DialogTitle className="font-semibold text-foreground">Edit Property</DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground mt-0.5">
          Update your property&apos;s core details
        </DialogDescription>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Property Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Property Type</label>
          <Select
            value={propertyType}
            onValueChange={setPropertyType}
            options={PROPERTY_TYPE_OPTIONS.map(({ value, label }) => ({ value: label, label }))}
            ariaLabel="Property type"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Address</label>
          <Input value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>

        <LocationFields
          country={country}
          state={state}
          city={city}
          onCountryChange={setCountry}
          onStateChange={setState}
          onCityChange={setCity}
          required
        />

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Estimated Value (₦)
          </label>
          <CurrencyInput
            prefix="₦"
            min={0}
            value={estimatedValue}
            onValueChange={(v) => setEstimatedValue(v === 0 ? '' : String(v))}
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <Button
          variant="primary"
          fullWidth
          onClick={handleSave}
          disabled={!name.trim() || !address.trim() || isSaving}
          isLoading={isSaving}
        >
          {isSaving ? 'Saving…' : 'Save Changes'}
        </Button>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </>
  );
};
