'use client';

import { useState } from 'react';
import { Button, Dialog, DialogContent, DialogTitle, Field, Textarea } from '@getrentos/ui';

interface CloseViolationModalProps {
  isOpen: boolean;
  action: 'resolve' | 'dismiss' | null;
  onClose: () => void;
  onConfirm: (resolutionNotes?: string) => void;
  isSubmitting?: boolean;
}

export const CloseViolationModal = ({
  isOpen,
  action,
  onClose,
  onConfirm,
  isSubmitting,
}: CloseViolationModalProps) => {
  const [resolutionNotes, setResolutionNotes] = useState('');

  const handleClose = () => {
    if (isSubmitting) return;
    setResolutionNotes('');
    onClose();
  };

  const title = action === 'dismiss' ? 'Dismiss Violation' : 'Resolve Violation';

  return (
    <Dialog open={isOpen} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent size="sm">
        <DialogTitle className="text-lg font-semibold text-foreground">{title}</DialogTitle>

        <div className="mt-4">
          <Field label="Notes" optionalLabel="(optional)">
            <Textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              disabled={isSubmitting}
              rows={3}
              placeholder="How this was handled…"
            />
          </Field>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            isLoading={isSubmitting}
            loadingText="Saving…"
            onClick={() => onConfirm(resolutionNotes.trim() || undefined)}
          >
            {title}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
