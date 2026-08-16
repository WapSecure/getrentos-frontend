'use client';

import { LegacyInput } from '@getrentos/ui';

import { LegacySelect } from '@getrentos/ui';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@getrentos/ui';
import type { Vendor } from '@/types/landlord';

interface AddVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (vendor: Omit<Vendor, 'id' | 'rating' | 'jobsCompleted'>) => void;
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

export const AddVendorModal = ({ isOpen, onClose, onSave }: AddVendorModalProps) => {
  const [name, setName] = useState('');
  const [serviceType, setServiceType] = useState(serviceTypes[0]);
  const [phone, setPhone] = useState('');

  const reset = () => {
    setName('');
    setServiceType(serviceTypes[0]);
    setPhone('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const isValid = name.trim() && phone.trim();

  const handleSubmit = () => {
    if (!isValid) return;
    onSave({ name: name.trim(), serviceType, phone: phone.trim() });
    handleClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-card rounded-xl max-w-sm w-full overflow-hidden"
          >
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h3 className="font-semibold text-foreground">Add Vendor</h3>
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
                <label className="block text-sm font-medium text-foreground mb-1">
                  Service Type
                </label>
                <LegacySelect
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {serviceTypes.map((type) => (
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
                Add Vendor
              </Button>
              <Button variant="ghost" fullWidth onClick={handleClose}>
                Cancel
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
