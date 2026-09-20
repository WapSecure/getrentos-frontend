'use client';

import { LegacyInput } from '@getrentos/ui';

import { LegacySelect } from '@getrentos/ui';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@getrentos/ui';
import type { Vendor, VendorInput } from '@/types/landlord';

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
  <AnimatePresence>
    {isOpen && (
      <VendorForm
        key={vendor?.id ?? 'new'}
        vendor={vendor ?? null}
        onClose={onClose}
        onSave={onSave}
      />
    )}
  </AnimatePresence>
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
  // A vendor added before this list existed may carry a type that is not in it.
  const options = serviceTypes.includes(serviceType)
    ? serviceTypes
    : [serviceType, ...serviceTypes];

  const handleClose = onClose;

  const isValid = name.trim() && phone.trim();

  const handleSubmit = () => {
    if (!isValid) return;
    onSave({ name: name.trim(), serviceType, phone: phone.trim() });
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-card rounded-xl max-w-sm w-full overflow-hidden"
      >
        <div className="p-4 border-b border-border flex justify-between items-center">
          <h3 className="font-semibold text-foreground">{vendor ? 'Edit Vendor' : 'Add Vendor'}</h3>
          <button onClick={handleClose} className="p-1 rounded-lg hover:bg-secondary">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Vendor Name <span className="text-red-500">*</span>
            </label>
            <LegacyInput
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. AquaFlow Plumbers"
              className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Service Type</label>
            <LegacySelect
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {options.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </LegacySelect>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Phone <span className="text-red-500">*</span>
            </label>
            <LegacyInput
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+234 803 555 1122"
              className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="p-4 border-t border-border flex gap-3">
          <Button variant="primary" fullWidth onClick={handleSubmit} disabled={!isValid}>
            {vendor ? 'Save Changes' : 'Add Vendor'}
          </Button>
          <Button variant="ghost" fullWidth onClick={handleClose}>
            Cancel
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
