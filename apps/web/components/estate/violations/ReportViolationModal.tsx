'use client';

import { useState } from 'react';
import { Button, Dialog, DialogContent, DialogTitle, Field, Select, Textarea } from '@getrentos/ui';
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
      label: `${h.unitLabel}: ${h.residentName}`,
    }));

  const handleClose = () => {
    setHouseholdId('');
    setCategory('OTHER');
    setDescription('');
    onClose();
  };

  const canSubmit = householdId && description.trim().length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent size="md">
        <DialogTitle className="text-lg font-semibold text-foreground">Report Violation</DialogTitle>

        <div className="mt-4 space-y-4">
          <Field label="Household" required>
            <Select
              value={householdId}
              onValueChange={setHouseholdId}
              options={householdOptions}
              placeholder="Select a household"
              searchable
            />
          </Field>

          <Field label="Category">
            <Select value={category} onValueChange={setCategory} options={categoryOptions} />
          </Field>

          <Field label="Description" required>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="What happened, when, and any witnesses…"
            />
          </Field>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!canSubmit}
            isLoading={isSubmitting}
            loadingText="Reporting…"
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
            Report Violation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
