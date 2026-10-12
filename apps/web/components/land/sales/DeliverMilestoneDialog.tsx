'use client';

import { useId, useState } from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  Textarea,
} from '@getrentos/ui';
import type { LandMilestone, LandMilestoneDeliverInput } from '@/types/landDeveloper';
import { LandDocumentPicker } from '../documents/LandDocumentPicker';

interface DeliverMilestoneDialogProps {
  milestone: LandMilestone | null;
  /** The land sold; its documents can be attached as evidence. Unknown: no picker. */
  propertyId?: string | null;
  onOpenChange: (open: boolean) => void;
  isSaving: boolean;
  onDeliver: (milestone: LandMilestone, input: LandMilestoneDeliverInput) => void;
}

const DeliverForm = ({
  milestone,
  propertyId,
  isSaving,
  onDeliver,
  onCancel,
}: {
  milestone: LandMilestone;
  propertyId?: string | null;
  isSaving: boolean;
  onDeliver: DeliverMilestoneDialogProps['onDeliver'];
  onCancel: () => void;
}) => {
  const id = useId();
  const [note, setNote] = useState('');
  const [documentId, setDocumentId] = useState(milestone.documentId ?? '');

  return (
    <form
      className="mt-4 space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onDeliver(milestone, {
          ...(note.trim() ? { note: note.trim() } : {}),
          ...(documentId ? { documentId } : {}),
        });
      }}
    >
      <Field
        label="Note to the buyer"
        htmlFor={`${id}-note`}
        hint="Optional. What was done, where, and anything the buyer should check."
      >
        <Textarea
          id={`${id}-note`}
          value={note}
          maxLength={2000}
          rows={4}
          onChange={(event) => setNote(event.target.value)}
        />
      </Field>
      <LandDocumentPicker
        propertyId={propertyId}
        label="Evidence document"
        hint="Optional. e.g. the executed deed or the survey plan in the buyer's name."
        value={documentId}
        onChange={setDocumentId}
        disabled={isSaving}
      />
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={isSaving}>
          Mark delivered
        </Button>
      </div>
    </form>
  );
};

/** Marks a conveyance step delivered, with an optional note and evidence document. */
export const DeliverMilestoneDialog = ({
  milestone,
  propertyId,
  onOpenChange,
  isSaving,
  onDeliver,
}: DeliverMilestoneDialogProps) => (
  <Dialog open={milestone !== null} onOpenChange={onOpenChange}>
    {milestone && (
      <DialogContent className="max-w-lg">
        <DialogTitle className="text-lg font-semibold text-foreground">
          {milestone.label}
        </DialogTitle>
        <DialogDescription className="mt-1 text-sm text-muted-foreground">
          The buyer is asked to confirm this step. Escrow moves only once they do, and they can
          dispute it if it was not done.
        </DialogDescription>
        <DeliverForm
          key={milestone.key}
          milestone={milestone}
          propertyId={propertyId}
          isSaving={isSaving}
          onDeliver={onDeliver}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    )}
  </Dialog>
);
