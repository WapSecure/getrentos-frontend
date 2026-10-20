'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  Textarea,
} from '@getrentos/ui';

interface LeaseTerminationRequestProps {
  leaseId: string;
  propertyName: string;
  onSubmit: (noticeDate: string, reason: string) => Promise<void>;
}

export const LeaseTerminationRequest = ({
  propertyName,
  onSubmit,
}: LeaseTerminationRequestProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [noticeDate, setNoticeDate] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = () => {
    setError(null);
    setIsOpen(true);
  };

  const close = () => {
    setError(null);
    setIsOpen(false);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(noticeDate, reason);
      setIsOpen(false);
      setNoticeDate('');
      setReason('');
    } catch (err) {
      // The API refuses a second notice while one is already awaiting a decision.
      // Letting the rejection escape left the button spinning on "Submitting…"
      // with the modal open and nothing said about why.
      setError(err instanceof Error ? err.message : 'Unable to submit this request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-destructive-subtle">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground">Early Lease Termination</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Request to terminate your lease before the end date
              </p>
              <Button variant="danger" size="sm" className="mt-2" onClick={open}>
                Request Termination
              </Button>
            </div>
          </div>

          <Alert variant="warning" className="mt-3">
            Early termination may incur penalties. Review your lease agreement for details.
          </Alert>
        </Card>
      </motion.div>

      <Dialog open={isOpen} onOpenChange={(next) => (next ? open() : close())}>
        <DialogContent className="p-0">
          <div className="p-4 pr-12 border-b border-border">
            <DialogTitle className="font-semibold text-foreground">
              Request Early Termination
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              {propertyName}
            </DialogDescription>
          </div>

          <div className="p-4 space-y-4">
            <Field label="Proposed Move-Out Date" required>
              <DatePicker
                value={noticeDate}
                onChange={setNoticeDate}
                min={new Date().toISOString().slice(0, 10)}
              />
            </Field>

            <Field label="Reason for Termination" required>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please provide details..."
                rows={4}
              />
            </Field>

            {error && <Alert variant="danger">{error}</Alert>}

            <div className="flex gap-3">
              <Button
                variant="primary"
                fullWidth
                onClick={handleSubmit}
                disabled={!noticeDate || !reason || isSubmitting}
                isLoading={isSubmitting}
              >
                Submit Request
              </Button>
              <Button variant="ghost" fullWidth onClick={close}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
