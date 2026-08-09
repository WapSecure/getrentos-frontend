'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Check, Users, Clock, Home, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Roommate {
  id: string;
  name: string;
  sharePercentage: number;
}

interface RoommateAgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  roommates: Roommate[];
}

export const RoommateAgreementModal = ({
  isOpen,
  onClose,
  roommates,
}: RoommateAgreementModalProps) => {
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!agreed) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onClose();
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-card rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="p-4 border-b border-border flex justify-between items-center sticky top-0 bg-card z-10">
              <div>
                <h3 className="font-semibold text-foreground">Roommate Agreement</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Review and agree to the roommate terms
                </p>
              </div>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h4 className="font-semibold text-blue-800 dark:text-blue-300">
                    Household Agreement
                  </h4>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  This agreement outlines the shared responsibilities and expectations for all
                  roommates.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-secondary">
                    <Users className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">Roommates</h4>
                    <p className="text-sm text-muted-foreground">
                      {roommates.map((r) => r.name).join(', ')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-secondary">
                    <Home className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">Shared Responsibilities</h4>
                    <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                      <li>Keep common areas clean and tidy</li>
                      <li>Respect quiet hours (10 PM - 8 AM)</li>
                      <li>Notify roommates of guests in advance</li>
                      <li>Share household supplies costs</li>
                      <li>Maintain open communication</li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-secondary">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">Financial Agreement</h4>
                    <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                      <li>Rent split according to agreed percentages</li>
                      <li>Utilities and shared expenses equally divided</li>
                      <li>Payments due by the 1st of each month</li>
                      <li>Late payments subject to fees</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                      Notice Period
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-400">
                      Any roommate wishing to leave must provide 30 days notice and find a suitable
                      replacement.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 pt-4 border-t border-border">
                <input
                  type="checkbox"
                  id="agree"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <label htmlFor="agree" className="text-sm text-foreground">
                  I have read and agree to the terms of this roommate agreement. All roommates will
                  be notified of this agreement.
                </label>
              </div>

              <Button
                variant="primary"
                fullWidth
                onClick={handleSubmit}
                disabled={!agreed || isSubmitting}
                isLoading={isSubmitting}
              >
                <Check className="w-4 h-4" />
                Sign Agreement
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
