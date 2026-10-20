'use client';

import { useState } from 'react';
import { Save } from 'lucide-react';
import {
  Alert,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Textarea,
} from '@getrentos/ui';

interface AddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: string) => Promise<boolean>;
  initialNote: string;
  propertyTitle: string;
}

export const AddNoteModal = ({
  isOpen,
  onClose,
  onSave,
  initialNote,
  propertyTitle,
}: AddNoteModalProps) => {
  const [note, setNote] = useState(initialNote);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setError(null);
    const saved = await onSave(note);
    setIsSaving(false);
    if (saved) onClose();
    else setError('The note could not be saved. Your draft is unchanged.');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSaving && onClose()}>
      <DialogContent>
        <DialogTitle className="pr-8 font-semibold text-foreground">Add Note</DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground mt-0.5">
          For: {propertyTitle}
        </DialogDescription>

        <div className="mt-4">
          <Textarea
            aria-label="Note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add your personal notes about this property..."
            rows={5}
            className="resize-none"
          />
          {error && (
            <Alert variant="danger" className="mt-2">
              {error}
            </Alert>
          )}
          <div className="flex gap-3 mt-4">
            <Button
              variant="primary"
              onClick={() => void handleSave()}
              fullWidth
              isLoading={isSaving}
              icon={<Save className="w-4 h-4" />}
            >
              Save Note
            </Button>
            <Button variant="ghost" onClick={onClose} fullWidth disabled={isSaving}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
