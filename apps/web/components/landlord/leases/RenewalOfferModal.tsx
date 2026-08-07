'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/format';
import type { Lease } from '@/types/landlord';

interface RenewalOfferModalProps {
  lease: Lease | null;
  onClose: () => void;
  onSend: (leaseId: string, newRent: number, newEndDate: string) => void;
}

const addOneYear = (dateString: string) => {
  const date = new Date(dateString);
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().split('T')[0];
};

export const RenewalOfferModal = ({ lease, onClose, onSend }: RenewalOfferModalProps) => {
  const [newRent, setNewRent] = useState(() =>
    lease ? String(Math.round(lease.rentAmount * 1.05)) : ''
  );
  const [newEndDate, setNewEndDate] = useState(() => (lease ? addOneYear(lease.leaseEnd) : ''));

  if (!lease) return null;

  const increasePct = newRent
    ? (((Number(newRent) - lease.rentAmount) / lease.rentAmount) * 100).toFixed(1)
    : '0';

  return (
    <AnimatePresence>
      {lease && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-[#1a2a2f] rounded-xl max-w-md w-full overflow-hidden"
          >
            <div className="p-4 border-b border-gray-200 dark:border-white/10 flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Send Renewal Offer</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  To {lease.tenantName} — {lease.unitName}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-white/5 text-sm text-gray-600 dark:text-gray-400">
                Current rent:{' '}
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatCurrency(lease.rentAmount)}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  New Monthly Rent (₦)
                </label>
                <input
                  type="number"
                  value={newRent}
                  onChange={(e) => setNewRent(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c4a747]"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {Number(increasePct) >= 0 ? '+' : ''}
                  {increasePct}% vs current rent
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  New Lease End Date
                </label>
                <input
                  type="date"
                  value={newEndDate}
                  onChange={(e) => setNewEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c4a747]"
                />
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-white/10 flex gap-3">
              <Button variant="ghost" fullWidth onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                fullWidth
                className="gap-1.5"
                onClick={() => onSend(lease.id, Number(newRent), newEndDate)}
                disabled={!newRent || !newEndDate}
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                Send Offer
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
