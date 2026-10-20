'use client';

import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  DocumentUpload,
  Field,
  Select,
  Textarea,
} from '@getrentos/ui';

const categoryOptions = [
  { value: 'SECURITY', label: 'Security' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'SAFETY', label: 'Safety' },
  { value: 'OTHER', label: 'Other' },
];

const priorityOptions = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
];

interface ReportIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    description: string;
    category?: 'SECURITY' | 'MAINTENANCE' | 'SAFETY' | 'OTHER';
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    photo?: File;
  }) => void;
  isSubmitting?: boolean;
}

export const ReportIncidentModal = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: ReportIncidentModalProps) => {
  const [category, setCategory] = useState('OTHER');
  const [priority, setPriority] = useState('MEDIUM');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);

  const handleClose = () => {
    setCategory('OTHER');
    setPriority('MEDIUM');
    setDescription('');
    setPhoto(null);
    onClose();
  };

  const canSubmit = description.trim().length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent size="md">
        <DialogTitle className="text-lg font-semibold text-foreground">Report Incident</DialogTitle>

        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Category">
              <Select value={category} onValueChange={setCategory} options={categoryOptions} />
            </Field>
            <Field label="Priority">
              <Select value={priority} onValueChange={setPriority} options={priorityOptions} />
            </Field>
          </div>

          <Field label="Description" required>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="What happened, where, and who's involved…"
            />
          </Field>

          <Field label="Photo" optionalLabel="(optional)">
            <DocumentUpload
              value={photo ? [{ id: 'photo', file: photo }] : []}
              onChange={(items) => setPhoto(items[0]?.file ?? null)}
              accept="image/*"
              multiple={false}
              label=""
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
                description: description.trim(),
                category: category as 'SECURITY' | 'MAINTENANCE' | 'SAFETY' | 'OTHER',
                priority: priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
                photo: photo ?? undefined,
              })
            }
          >
            Report Incident
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
