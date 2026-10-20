'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CalendarClock } from 'lucide-react';
import { Alert, Button, DatePicker, Field, IconButton, TimePicker } from '@getrentos/ui';
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
    <AnimatePresence>
      {lead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-card rounded-xl max-w-sm w-full overflow-hidden"
          >
            <div className="p-4 border-b border-border flex justify-between items-center gap-3">
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground">Confirm Viewing</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {lead.leadName} · {lead.propertyName}
                </p>
              </div>
              <IconButton label="Close" size="sm" icon={<X />} onClick={handleClose} />
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
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
