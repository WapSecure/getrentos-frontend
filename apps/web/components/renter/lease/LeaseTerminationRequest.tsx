'use client';

import { Textarea } from '@getrentos/ui';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { DatePicker } from '@getrentos/ui';

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

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await onSubmit(noticeDate, reason);
    setIsSubmitting(false);
    setIsOpen(false);
    setNoticeDate('');
    setReason('');
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl border border-border overflow-hidden"
      >
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Early Lease Termination</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Request to terminate your lease before the end date
              </p>
              <Button variant="danger" size="sm" className="mt-2" onClick={() => setIsOpen(true)}>
                Request Termination
              </Button>
            </div>
          </div>

          <div className="mt-3 p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
              <p className="text-xs text-yellow-700 dark:text-yellow-400">
                Early termination may incur penalties. Review your lease agreement for details.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Termination Request Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-xl max-w-md w-full mx-4 overflow-hidden"
          >
            <div className="p-4 border-b border-border flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-foreground">Request Early Termination</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{propertyName}</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Proposed Move-Out Date
                </label>
                <DatePicker
                  value={noticeDate}
                  onChange={setNoticeDate}
                  min={new Date().toISOString().slice(0, 10)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Reason for Termination
                </label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Please provide details..."
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

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
                <Button variant="ghost" fullWidth onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};
