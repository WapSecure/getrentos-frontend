'use client';

import { useState } from 'react';
import { Button, Dialog, DialogContent, DialogTitle, Field, Input, Select } from '@getrentos/ui';
import type { Vendor, VendorInput, BusinessRegistrationType } from '@/types/landlord';
import { BUSINESS_TYPE_LABELS } from '@/services/agencyOnboardingService';

interface VendorFormModalProps {
  isOpen: boolean;
  /** Present when editing an existing vendor; absent when adding. */
  vendor?: Vendor | null;
  onClose: () => void;
  onSave: (vendor: VendorInput) => void;
}

const serviceTypes = [
  'Plumbing',
  'Electrical',
  'Appliances / HVAC',
  'Security',
  'Internet',
  'General Maintenance',
  'Other',
];

export const VendorFormModal = ({ isOpen, vendor, onClose, onSave }: VendorFormModalProps) => (
  <Dialog open={isOpen} onOpenChange={(next) => !next && onClose()}>
    <DialogContent size="sm" padded={false}>
      <VendorForm
        key={vendor?.id ?? 'new'}
        vendor={vendor ?? null}
        onClose={onClose}
        onSave={onSave}
      />
    </DialogContent>
  </Dialog>
);

const VendorForm = ({
  vendor,
  onClose,
  onSave,
}: {
  vendor: Vendor | null;
  onClose: () => void;
  onSave: (vendor: VendorInput) => void;
}) => {
  const [name, setName] = useState(vendor?.name ?? '');
  const [serviceType, setServiceType] = useState(vendor?.serviceType ?? serviceTypes[0]);
  const [phone, setPhone] = useState(vendor?.phone ?? '');
  const [registrationNumber, setRegistrationNumber] = useState(vendor?.registrationNumber ?? '');
  const [businessType, setBusinessType] = useState<BusinessRegistrationType | ''>(
    vendor?.businessType ?? ''
  );
  // A vendor added before this list existed may carry a type that is not in it.
  const options = serviceTypes.includes(serviceType)
    ? serviceTypes
    : [serviceType, ...serviceTypes];

  const handleClose = onClose;

  const isValid = name.trim() && phone.trim();

  const handleSubmit = () => {
    if (!isValid) return;
    onSave({
      name: name.trim(),
      serviceType,
      phone: phone.trim(),
      registrationNumber: registrationNumber.trim() || undefined,
      businessType: businessType || undefined,
    });
    handleClose();
  };

  return (
    <>
      <div className="p-4 pr-12 border-b border-border">
        <DialogTitle className="font-semibold text-foreground">
          {vendor ? 'Edit Vendor' : 'Add Vendor'}
        </DialogTitle>
      </div>

      <div className="p-4 space-y-4">
        <Field label="Vendor Name" required>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. AquaFlow Plumbers"
          />
        </Field>
        <Field label="Service Type">
          <Select
            value={serviceType}
            onValueChange={setServiceType}
            options={options.map((type) => ({ value: type, label: type }))}
          />
        </Field>
        <Field label="Phone" required>
          <Input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+234 803 555 1122"
          />
        </Field>
        <Field
          label="CAC number"
          optionalLabel="(optional)"
          hint="For a registered business, so we can verify its payout account."
        >
          <Input
            type="text"
            value={registrationNumber}
            onChange={(e) => setRegistrationNumber(e.target.value)}
            placeholder="e.g. RC1234567"
          />
        </Field>
        {registrationNumber.trim() && (
          <Field label="Registration type">
            <Select
              value={businessType}
              onValueChange={(value) => setBusinessType(value as BusinessRegistrationType | '')}
              placeholder="Select a type…"
              searchable={false}
              options={(Object.keys(BUSINESS_TYPE_LABELS) as BusinessRegistrationType[]).map(
                (t) => ({ value: t, label: BUSINESS_TYPE_LABELS[t] })
              )}
            />
          </Field>
        )}
      </div>

      <div className="p-4 border-t border-border flex gap-3">
        <Button variant="primary" fullWidth onClick={handleSubmit} disabled={!isValid}>
          {vendor ? 'Save Changes' : 'Add Vendor'}
        </Button>
        <Button variant="ghost" fullWidth onClick={handleClose}>
          Cancel
        </Button>
      </div>
    </>
  );
};
