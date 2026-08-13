'use client';

import { Textarea } from '@/components/ui/Textarea';

import { LegacySelect } from '@/components/ui/LegacySelect';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DatePicker } from '@/components/ui/DatePicker';
import { TimePicker } from '@/components/ui/TimePicker';
import type { RealtorLead, ViewingAppointment } from '@/types/realtor';

export type CreateViewingInput = Omit<ViewingAppointment, 'id' | 'status'> & { leadId: string };

interface ScheduleViewingModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads: RealtorLead[];
  defaultLeadId?: string;
  onSubmit: (appointment: CreateViewingInput) => void;
}

export const ScheduleViewingModal = ({
  isOpen,
  onClose,
  leads,
  defaultLeadId,
  onSubmit,
}: ScheduleViewingModalProps) => {
  const [leadId, setLeadId] = useState(defaultLeadId || '');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');

  const selectedLead = leads.find((l) => l.id === leadId);

  const handleClose = () => {
    setLeadId(defaultLeadId || '');
    setDate('');
    setTime('');
    setNotes('');
    onClose();
  };

  const handleSubmit = () => {
    if (!selectedLead) return;
    onSubmit({
      leadId,
      leadName: selectedLead.leadName,
      listingId: selectedLead.listingId,
      listingTitle: selectedLead.listingTitle,
      scheduledDate: date,
      scheduledTime: time,
      notes: notes || undefined,
    });
    handleClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-card rounded-xl max-w-sm w-full overflow-hidden"
          >
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h3 className="font-semibold text-foreground">Schedule Viewing</h3>
              <button onClick={handleClose} className="p-1 rounded-lg hover:bg-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Lead <span className="text-red-500">*</span>
                </label>
                <LegacySelect
                  value={leadId}
                  onChange={(e) => setLeadId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select a lead</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.leadName} — {l.listingTitle}
                    </option>
                  ))}
                </LegacySelect>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Date</label>
                <DatePicker value={date} onChange={setDate} />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Time</label>
                <TimePicker value={time} onChange={setTime} />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Notes <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="p-4 border-t border-border flex gap-3">
              <Button variant="ghost" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1 gap-1.5"
                onClick={handleSubmit}
                disabled={!leadId || !date || !time}
              >
                <CalendarClock className="w-4 h-4" />
                Schedule
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
