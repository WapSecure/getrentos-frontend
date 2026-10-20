'use client';

import { useState } from 'react';
import { CalendarClock } from 'lucide-react';
import {
  Alert,
  Button,
  DatePicker,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  TimePicker,
} from '@getrentos/ui';
import type { LandlordLead } from '@/types/landlord';

interface ConfirmViewingModalProps {
  lead: LandlordLead | null;
  onClose: () => void;
  onConfirm: (scheduledAt: string) => void;
  isSubmitting?: boolean;
  isError?: boolean;
}

export const ConfirmViewingModal = ({
  lead,
  onClose,
  onConfirm,
  isSubmitting,
  isError,
}: ConfirmViewingModalProps) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  if (!lead) return null;

  const handleClose = () => {
    setDate('');
    setTime('');
    onClose();
  };

  const handleConfirm = () => {
    if (!date || !time) return;
    onConfirm(new Date(`${date}T${time}`).toISOString());
  };

  return (
    <Dialog open={!!lead} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent size="sm" padded={false}>
        <div className="p-4 pr-12 border-b border-border flex justify-between items-center gap-3">
          <div className="min-w-0">
            <DialogTitle className="font-semibold text-foreground">Confirm Viewing</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              {lead.leadName} · {lead.propertyName}
            </DialogDescription>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <Field label="Date" required>
            <DatePicker value={date} onChange={setDate} />
          </Field>
          <Field label="Time" required>
            <TimePicker value={time} onChange={setTime} />
          </Field>
          {isError && (
            <Alert variant="danger">Couldn&apos;t confirm the viewing. Please try again.</Alert>
          )}
        </div>

        <div className="p-4 border-t border-border flex gap-3">
          <Button variant="ghost" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button
            variant="primary"
            className="flex-1 gap-2"
            onClick={handleConfirm}
            disabled={!date || !time}
            isLoading={isSubmitting}
            loadingText="Confirming…"
          >
            <CalendarClock className="w-4 h-4" />
            Confirm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
