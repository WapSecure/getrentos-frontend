'use client';

import { LegacyInput } from '@getrentos/ui';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RefreshCcw, TriangleAlert } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { DatePicker } from '@getrentos/ui';
import { formatCurrency } from '@/lib/format';
import { landlordService } from '@/services/landlordService';
import type { Lease, RentIncreaseCheck } from '@/types/landlord';

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
  const [check, setCheck] = useState<{ rentAmount: string; result: RentIncreaseCheck } | null>(
    null
  );

  useEffect(() => {
    if (!lease || !newRent) return;
    const timer = setTimeout(() => {
      landlordService.previewRenewalCheck(lease.id, Number(newRent)).then((response) => {
        if (response.success && response.data)
          setCheck({ rentAmount: newRent, result: response.data });
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [lease, newRent]);

  if (!lease) return null;

  const activeCheck = check && check.rentAmount === newRent ? check.result : null;

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
            className="bg-card rounded-xl max-w-md w-full overflow-hidden"
          >
            <div className="p-4 border-b border-border flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-foreground">Send Renewal Offer</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  To {lease.tenantName} — {lease.unitName}
                </p>
              </div>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-white/5 text-sm text-muted-foreground">
                Current rent:{' '}
                <span className="font-medium text-foreground">
                  {formatCurrency(lease.rentAmount)}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  New Monthly Rent (₦)
                </label>
                <LegacyInput
                  type="number"
                  value={newRent}
                  onChange={(e) => setNewRent(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {Number(increasePct) >= 0 ? '+' : ''}
                  {increasePct}% vs current rent
                </p>
              </div>

              {activeCheck && (
                <div
                  className={`p-3 rounded-lg border flex gap-2 text-xs ${
                    activeCheck.exceedsGuidance
                      ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300'
                      : 'bg-gray-50 dark:bg-white/5 border-border text-muted-foreground'
                  }`}
                >
                  {activeCheck.exceedsGuidance && (
                    <TriangleAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  )}
                  <p>{activeCheck.advisory}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  New Lease End Date
                </label>
                <DatePicker value={newEndDate} onChange={setNewEndDate} />
              </div>
            </div>

            <div className="p-4 border-t border-border flex gap-3">
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
