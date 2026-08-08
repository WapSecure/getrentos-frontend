'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Check, XCircle, HelpCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/format';
import type { VerificationRequest } from '@/types/admin';

interface ReviewVerificationModalProps {
  request: VerificationRequest | null;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onRequestClarification: (id: string, reason: string) => void;
}

export const ReviewVerificationModal = ({
  request,
  onClose,
  onApprove,
  onReject,
  onRequestClarification,
}: ReviewVerificationModalProps) => {
  const [mode, setMode] = useState<'view' | 'reject' | 'clarify'>('view');
  const [reason, setReason] = useState('');

  if (!request) return null;

  const handleClose = () => {
    setMode('view');
    setReason('');
    onClose();
  };

  const handleApprove = () => {
    onApprove(request.id);
    handleClose();
  };

  const handleSubmitReason = () => {
    if (mode === 'reject') onReject(request.id, reason);
    if (mode === 'clarify') onRequestClarification(request.id, reason);
    handleClose();
  };

  return (
    <AnimatePresence>
      {request && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-[#1a2a2f] rounded-xl max-w-md w-full overflow-hidden"
          >
            <div className="p-4 border-b border-gray-200 dark:border-white/10 flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {request.applicantName}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {request.subjectLabel}
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {mode === 'view' ? (
                <>
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-white/5 overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Role</span>
                      <span className="text-gray-900 dark:text-white font-medium capitalize">
                        {request.applicantRole}
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-3 py-2 text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Submitted</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {formatDate(request.submittedAt)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Submitted Documents ({request.documentCount})
                    </p>
                    <div className="space-y-2">
                      {Array.from({ length: request.documentCount }).map((_, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300"
                        >
                          <FileText className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          Document {i + 1}.pdf
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {mode === 'reject' ? 'Reason for rejection' : 'What clarification is needed?'}
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    placeholder={
                      mode === 'reject'
                        ? 'e.g. Document is illegible or expired'
                        : 'e.g. Please resubmit a clearer scan'
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c4a747]"
                  />
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-white/10 flex gap-2">
              {mode === 'view' ? (
                <>
                  <Button
                    variant="ghost"
                    className="flex-1 gap-1.5"
                    onClick={() => setMode('clarify')}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    Need Info
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 gap-1.5 text-red-600 dark:text-red-400"
                    onClick={() => setMode('reject')}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Reject
                  </Button>
                  <Button variant="primary" className="flex-1 gap-1.5" onClick={handleApprove}>
                    <Check className="w-3.5 h-3.5" />
                    Approve
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" className="flex-1" onClick={() => setMode('view')}>
                    Back
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={handleSubmitReason}
                    disabled={!reason.trim()}
                  >
                    Submit
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
