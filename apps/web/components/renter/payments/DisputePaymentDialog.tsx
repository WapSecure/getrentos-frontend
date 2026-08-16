'use client';

import { Textarea } from '@getrentos/ui';

import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@getrentos/ui';
import { Button } from '@getrentos/ui';

interface DisputePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (reason: string) => void;
}

export const DisputePaymentDialog = ({
  open,
  onOpenChange,
  onSubmit,
}: DisputePaymentDialogProps) => {
  const [reason, setReason] = useState('');

  const handleClose = (next: boolean) => {
    if (!next) setReason('');
    onOpenChange(next);
  };

  const handleSubmit = () => {
    if (!reason.trim()) return;
    onSubmit(reason.trim());
    setReason('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <div className="p-4 border-b border-border">
          <DialogTitle className="font-semibold text-foreground">Dispute Payment</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-0.5">
            Tell us what&apos;s wrong with this charge — our support team will review it within 2
            business days.
          </DialogDescription>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Reason for dispute
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder="e.g. I was charged twice for the same month's rent"
              className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <Button variant="primary" fullWidth onClick={handleSubmit} disabled={!reason.trim()}>
            Submit Dispute
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
