'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button, Select } from '@getrentos/ui';
import type { Household } from '@/types/estate';

interface ReportViolationModalProps {
  isOpen: boolean;
  households: Household[];
  onClose: () => void;
  onSubmit: (data: {
    householdId: string;
    description: string;
    category: 'NOISE' | 'UNAUTHORIZED_PARKING' | 'PET_VIOLATION' | 'PROPERTY_MAINTENANCE' | 'OTHER';
  }) => void;
  isSubmitting?: boolean;
}

const categoryOptions = [
  { value: 'NOISE', label: 'Noise' },
  { value: 'UNAUTHORIZED_PARKING', label: 'Unauthorized Parking' },
  { value: 'PET_VIOLATION', label: 'Pet Violation' },
  { value: 'PROPERTY_MAINTENANCE', label: 'Property Maintenance' },
  { value: 'OTHER', label: 'Other' },
];

export const ReportViolationModal = ({
  isOpen,
  households,
  onClose,
  onSubmit,
  isSubmitting,
}: ReportViolationModalProps) => {
  const [householdId, setHouseholdId] = useState('');
  const [category, setCategory] = useState('OTHER');
  const [description, setDescription] = useState('');

  const householdOptions = households
    .filter((h) => h.status === 'active')
    .map((h) => ({
      value: h.id,
      label: `${h.unitLabel} — ${h.residentName}`,
    }));

  const handleClose = () => {
    setHouseholdId('');
    setCategory('OTHER');
    setDescription('');
    onClose();
  };

  const canSubmit = householdId && description.trim().length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-card rounded-xl max-w-md w-full overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="p-4 border-b border-border flex justify-between items-center shrink-0">
              <h3 className="font-semibold text-foreground">Report Violation</h3>
              <button onClick={handleClose} className="p-1 rounded-lg hover:bg-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Household</label>
                <Select
                  value={householdId}
                  onValueChange={setHouseholdId}
                  options={householdOptions}
                  placeholder="Select a household"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Category</label>
                <Select value={category} onValueChange={setCategory} options={categoryOptions} />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="What happened, when, and any witnesses…"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            <div className="p-4 border-t border-border flex gap-3 shrink-0">
              <Button variant="ghost" fullWidth onClick={handleClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                fullWidth
                disabled={!canSubmit || isSubmitting}
                onClick={() =>
                  onSubmit({
                    householdId,
                    description: description.trim(),
                    category: category as
                      | 'NOISE'
                      | 'UNAUTHORIZED_PARKING'
                      | 'PET_VIOLATION'
                      | 'PROPERTY_MAINTENANCE'
                      | 'OTHER',
                  })
                }
              >
                {isSubmitting ? 'Reporting…' : 'Report Violation'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
