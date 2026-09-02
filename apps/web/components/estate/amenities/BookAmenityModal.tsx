'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button, LegacyInput } from '@getrentos/ui';
import type { Amenity } from '@/types/estate';

interface BookAmenityModalProps {
  isOpen: boolean;
  amenity: Amenity | null;
  onClose: () => void;
  onSubmit: (data: { amenityId: string; startsAt: string; endsAt: string }) => void;
  isSubmitting?: boolean;
  error?: string | null;
}

export const BookAmenityModal = ({
  isOpen,
  amenity,
  onClose,
  onSubmit,
  isSubmitting,
  error,
}: BookAmenityModalProps) => {
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');

  const handleClose = () => {
    setStartsAt('');
    setEndsAt('');
    onClose();
  };

  const canSubmit = !!amenity && !!startsAt && !!endsAt;

  return (
    <AnimatePresence>
      {isOpen && amenity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-card rounded-xl max-w-sm w-full overflow-hidden"
          >
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h3 className="font-semibold text-foreground">Book {amenity.name}</h3>
              <button onClick={handleClose} className="p-1 rounded-lg hover:bg-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Starts</label>
                <LegacyInput
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Ends</label>
                <LegacyInput
                  type="datetime-local"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                />
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>

            <div className="p-4 border-t border-border flex gap-3">
              <Button variant="ghost" fullWidth onClick={handleClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                fullWidth
                disabled={!canSubmit || isSubmitting}
                onClick={() =>
                  onSubmit({
                    amenityId: amenity.id,
                    startsAt: new Date(startsAt).toISOString(),
                    endsAt: new Date(endsAt).toISOString(),
                  })
                }
              >
                {isSubmitting ? 'Booking…' : 'Book'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
