'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
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
            className="bg-white dark:bg-[#1a2a2f] rounded-xl max-w-sm w-full overflow-hidden"
          >
            <div className="p-4 border-b border-gray-200 dark:border-white/10 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900 dark:text-white">Request Viewing</h3>
              <button
                onClick={handleClose}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Property <span className="text-red-500">*</span>
                </label>
                <select
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c4a747]"
                >
                  <option value="">Select a property</option>
                  {listings.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c4a747]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Time
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c4a747]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Anything the owner should know"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c4a747]"
                />
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-white/10 flex gap-3">
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
