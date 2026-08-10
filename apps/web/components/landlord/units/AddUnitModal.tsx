'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { Property, Unit } from '@/types/landlord';

interface AddUnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: Property[];
  defaultPropertyId?: string;
  onSave: (unit: Omit<Unit, 'id' | 'occupancyStatus' | 'tenantId' | 'tenantName'>) => void;
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
  const [monthlyRent, setMonthlyRent] = useState('');

  const propertyId = properties.some((p) => p.id === selectedPropertyId)
    ? selectedPropertyId
    : defaultPropertyId || properties[0]?.id || '';

  const handleClose = () => {
    setSelectedPropertyId('');
    setUnitName('');
    setBedrooms('1');
    setBathrooms('1');
    setMonthlyRent('');
    onClose();
  };

  const handleSubmit = () => {
    const property = properties.find((p) => p.id === propertyId);
    if (!property || !unitName.trim() || !monthlyRent) return;
    onSave({
      propertyId,
      propertyName: property.name,
      unitName: unitName.trim(),
      bedrooms: Number(bedrooms),
      bathrooms: Number(bathrooms),
      monthlyRent: Number(monthlyRent),
    });
    handleClose();
  };

  const isValid = propertyId && unitName.trim() && Number(monthlyRent) > 0;

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
            <div className="p-4 border-b border-border flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-foreground">Add Unit</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Define a new unit within a property
                </p>
              </div>
              <button onClick={handleClose} className="p-1 rounded-lg hover:bg-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Property <span className="text-red-500">*</span>
                </label>
                <select
                  value={propertyId}
                  onChange={(e) => setSelectedPropertyId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Unit Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={unitName}
                  onChange={(e) => setUnitName(e.target.value)}
                  placeholder="e.g. Unit 3B"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Bedrooms</label>
                  <input
                    type="number"
                    min={0}
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Bathrooms
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={bathrooms}
                    onChange={(e) => setBathrooms(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Monthly Rent (₦) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={monthlyRent}
                  onChange={(e) => setMonthlyRent(e.target.value)}
                  placeholder="450000"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="p-4 border-t border-border flex gap-3">
              <Button variant="primary" fullWidth onClick={handleSubmit} disabled={!isValid}>
                Add Unit
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
