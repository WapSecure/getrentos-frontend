'use client';

import { useState } from 'react';
import { Dialog, DialogContent, Button, Select, Textarea, DatePicker } from '@getrentos/ui';
import {
  INSPECTION_TYPES,
  INSPECTION_TYPE_LABELS,
  type CreateInspectionInput,
  type InspectionType,
} from '@/services/inspectionService';

interface PropertyOption {
  id: string;
  name: string;
}

interface CreateInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: PropertyOption[];
  onCreate: (input: CreateInspectionInput) => void;
  isPending: boolean;
}

export const CreateInspectionModal = ({
  isOpen,
  onClose,
  properties,
  onCreate,
  isPending,
}: CreateInspectionModalProps) => {
  const [propertyId, setPropertyId] = useState('');
  const [type, setType] = useState<InspectionType>('MOVE_IN');
  const [scheduledFor, setScheduledFor] = useState('');
  const [summaryNotes, setSummaryNotes] = useState('');

  const reset = () => {
    setPropertyId('');
    setType('MOVE_IN');
    setScheduledFor('');
    setSummaryNotes('');
  };

  const close = () => {
    reset();
    onClose();
  };

  const submit = () => {
    if (!propertyId) return;
    onCreate({
      propertyId,
      type,
      scheduledFor: type === 'ROUTINE' && scheduledFor ? scheduledFor : undefined,
      summaryNotes: summaryNotes.trim() || undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="w-full max-w-lg">
        <div className="space-y-5 p-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground">New inspection</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Record the condition of a property at move-in, move-out, or a routine check.
            </p>
          </div>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">Property</span>
            <Select
              value={propertyId}
              onValueChange={setPropertyId}
              placeholder="Select a property"
              options={properties.map((p) => ({ value: p.id, label: p.name }))}
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">Type</span>
            <Select
              value={type}
              onValueChange={(v) => setType(v as InspectionType)}
              options={INSPECTION_TYPES.map((t) => ({
                value: t,
                label: INSPECTION_TYPE_LABELS[t],
              }))}
            />
          </label>

          {type === 'ROUTINE' && (
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-foreground">Scheduled for (optional)</span>
              <DatePicker value={scheduledFor} onChange={setScheduledFor} />
            </label>
          )}

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">Notes (optional)</span>
            <Textarea
              value={summaryNotes}
              onChange={(e) => setSummaryNotes(e.target.value)}
              placeholder="Anything worth recording about this inspection"
              rows={3}
            />
          </label>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={close} disabled={isPending}>
              Cancel
            </Button>
            <Button variant="primary" onClick={submit} disabled={!propertyId || isPending}>
              {isPending ? 'Creating…' : 'Create inspection'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
