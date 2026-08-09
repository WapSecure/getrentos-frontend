'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import type { OwnerProperty } from '@/types/owner';

type OwnerPropertyUpdates = Pick<
  OwnerProperty,
  'name' | 'propertyType' | 'address' | 'city' | 'state' | 'estimatedValue'
>;

interface EditOwnerPropertyModalProps {
  property: OwnerProperty | null;
  onClose: () => void;
  onSave: (id: string, updates: OwnerPropertyUpdates) => void;
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
  onSave: (id: string, updates: OwnerPropertyUpdates) => void;
  onClose: () => void;
}) => {
  const [name, setName] = useState(property.name);
  const [propertyType, setPropertyType] = useState(property.propertyType);
  const [address, setAddress] = useState(property.address);
  const [city, setCity] = useState(property.city);
  const [state, setState] = useState(property.state);
  const [estimatedValue, setEstimatedValue] = useState(String(property.estimatedValue));

  const handleSave = () => {
    onSave(property.id, {
      name,
      propertyType,
      address,
      city,
      state,
      estimatedValue: Number(estimatedValue) || property.estimatedValue,
    });
    onClose();
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
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Property Type</label>
          <input
            type="text"
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
            placeholder="e.g. Apartment, Duplex, Bungalow"
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">State</label>
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Estimated Value (₦)
          </label>
          <input
            type="number"
            min={0}
            value={estimatedValue}
            onChange={(e) => setEstimatedValue(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <Button
          variant="primary"
          fullWidth
          onClick={handleSave}
          disabled={!name.trim() || !address.trim()}
        >
          Save Changes
        </Button>
      </div>
    </>
  );
};
