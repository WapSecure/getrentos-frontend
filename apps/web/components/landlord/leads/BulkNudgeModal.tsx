'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import {
  Alert,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Textarea,
} from '@getrentos/ui';

interface BulkNudgeModalProps {
  leadCount: number;
  onClose: () => void;
  onSend: (message: string) => void;
  isSubmitting?: boolean;
  isError?: boolean;
}

const DEFAULT_MESSAGE =
  "Hi, just following up on your interest: still looking? Let us know if you'd like to move forward.";

export const BulkNudgeModal = ({
  leadCount,
  onClose,
  onSend,
  isSubmitting,
  isError,
}: BulkNudgeModalProps) => {
  const [message, setMessage] = useState(DEFAULT_MESSAGE);

  if (leadCount === 0) return null;

  const handleClose = () => {
    setMessage(DEFAULT_MESSAGE);
    onClose();
  };

  return (
    <Dialog open={leadCount > 0} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent size="sm" padded={false}>
        <div className="p-4 pr-12 border-b border-border flex justify-between items-center gap-3">
          <div className="min-w-0">
            <DialogTitle className="font-semibold text-foreground">
              Nudge {leadCount} lead{leadCount === 1 ? '' : 's'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Sends the same follow-up message to each selected lead.
            </DialogDescription>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="Write a follow-up message..."
            aria-label="Follow-up message"
          />
          {isError && (
            <Alert variant="danger">
              Something went wrong sending these nudges. Please try again.
            </Alert>
          )}
        </div>

        <div className="p-4 border-t border-border flex gap-3">
          <Button variant="ghost" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button
            variant="primary"
            className="flex-1 gap-2"
            onClick={() => onSend(message)}
            disabled={!message.trim()}
            isLoading={isSubmitting}
            loadingText="Sending…"
          >
            <Send className="w-4 h-4" />
            {`Nudge ${leadCount}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
