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
import type { LandlordLead } from '@/types/landlord';

const defaultMessage = (lead: LandlordLead) =>
  `Hi ${lead.leadName.split(' ')[0]}, just following up on your interest in ${lead.propertyName}: still looking?`;

interface NudgeModalProps {
  lead: LandlordLead | null;
  onClose: () => void;
  onSend: (message: string) => void;
  isSubmitting?: boolean;
  isError?: boolean;
}

export const NudgeModal = ({ lead, onClose, onSend, isSubmitting, isError }: NudgeModalProps) => {
  const [message, setMessage] = useState(() => (lead ? defaultMessage(lead) : ''));

  if (!lead) return null;

  const handleClose = () => {
    setMessage('');
    onClose();
  };

  return (
    <Dialog open={!!lead} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent size="sm" padded={false}>
        <div className="p-4 pr-12 border-b border-border flex justify-between items-center gap-3">
          <div className="min-w-0">
            <DialogTitle className="font-semibold text-foreground">
              Nudge {lead.leadName}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              {lead.propertyName}
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
            <Alert variant="danger">Couldn&apos;t send the nudge. Please try again.</Alert>
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
            Send
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
