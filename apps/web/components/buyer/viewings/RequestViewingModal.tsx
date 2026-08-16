'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CalendarClock } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { DatePicker } from '@getrentos/ui';
import { TimePicker } from '@getrentos/ui';
import { Select } from '@getrentos/ui';
import { Textarea } from '@getrentos/ui';
import type { BuyerPropertyListing } from '@/types/buyer';

interface RequestViewingModalProps {
  isOpen: boolean;
  onClose: () => void;
  listings: BuyerPropertyListing[];
  defaultPropertyId?: string;
  onSubmit: (propertyId: string, date: string, time: string, notes: string) => void;
}

export const RequestViewingModal = ({
  isOpen,
  onClose,
  listings,
  defaultPropertyId,
  onSubmit,
}: RequestViewingModalProps) => {
  const [propertyId, setPropertyId] = useState(defaultPropertyId || '');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');

  const handleClose = () => {
    setPropertyId(defaultPropertyId || '');
    setDate('');
    setTime('');
    setNotes('');
    onClose();
  };

  const handleSubmit = () => {
    onSubmit(propertyId, date, time, notes);
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
              <h3 className="font-semibold text-foreground">Request Viewing</h3>
              <button onClick={handleClose} className="p-1 rounded-lg hover:bg-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Property <span className="text-red-500">*</span>
                </label>
                <Select
                  value={propertyId}
                  onValueChange={setPropertyId}
                  placeholder="Select a property"
                  options={listings.map((listing) => ({ value: listing.id, label: listing.title }))}
                />
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
                  placeholder="Anything the owner should know"
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
                disabled={!propertyId || !date || !time}
              >
                <CalendarClock className="w-4 h-4" />
                Request
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
