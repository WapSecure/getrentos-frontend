'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CalendarClock, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DatePicker } from '@/components/ui/DatePicker';
import { TimePicker } from '@/components/ui/TimePicker';
import type { BuyerLead } from '@/types/owner';

interface ScheduleViewingModalProps {
  lead: BuyerLead | null;
  onClose: () => void;
  onSchedule: (leadId: string, date: string, time: string) => void;
}

export const ScheduleViewingModal = ({ lead, onClose, onSchedule }: ScheduleViewingModalProps) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  if (!lead) return null;

  const handleClose = () => {
    setDate('');
    setTime('');
    setConfirmed(false);
    onClose();
  };

  const handleSchedule = () => {
    onSchedule(lead.id, date, time);
    setConfirmed(true);
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
            <div className="p-4 border-b border-border flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-foreground">Schedule Viewing</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {lead.buyerName} · {lead.propertyName}
                </p>
              </div>
              <button onClick={handleClose} className="p-1 rounded-lg hover:bg-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {confirmed ? (
                <div className="text-center py-4">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                    <Check className="w-7 h-7 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-sm text-foreground">
                    Viewing scheduled for {date} at {time}. {lead.buyerName} has been notified.
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Date</label>
                    <DatePicker value={date} onChange={setDate} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Time</label>
                    <TimePicker value={time} onChange={setTime} />
                  </div>
                </>
              )}
            </div>

            <div className="p-4 border-t border-border flex gap-3">
              {confirmed ? (
                <Button variant="primary" className="w-full" onClick={handleClose}>
                  Done
                </Button>
              ) : (
                <>
                  <Button variant="ghost" onClick={handleClose} className="flex-1">
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-1 gap-2"
                    onClick={handleSchedule}
                    disabled={!date || !time}
                  >
                    <CalendarClock className="w-4 h-4" />
                    Confirm
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
