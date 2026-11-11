'use client';

import { ReasonDialog } from '@sureground/ui';

interface DisputePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (reason: string) => Promise<void>;
}

const MIN_REASON = 10;
const MAX_REASON = 1000;

// The parent displays the server error; a failed send keeps the reason for a retry.
export const DisputePaymentDialog = ({
  open,
  onOpenChange,
  onSubmit,
}: DisputePaymentDialogProps) => (
  <ReasonDialog
    open={open}
    onOpenChange={onOpenChange}
    title="Report a problem"
    description="Tell us what's wrong with this charge: our support team will review it within 2 business days."
    reasonLabel="Reason for dispute"
    reasonPlaceholder="e.g. I was charged twice for the same month's rent"
    reasonHint={(length) => `${length}/${MAX_REASON} characters`}
    minLength={MIN_REASON}
    maxLength={MAX_REASON}
    validateOn="submit"
    tooShortMessage={`Say what is wrong in at least ${MIN_REASON} characters.`}
    confirmLabel="Send report"
    onSubmit={({ reason }) => onSubmit(reason)}
  />
);
