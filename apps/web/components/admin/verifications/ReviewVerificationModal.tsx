'use client';

import { Textarea } from '@getrentos/ui';

import { useState } from 'react';
import { Check, XCircle, HelpCircle, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@getrentos/ui';
import { Button } from '@getrentos/ui';
import { formatDate } from '@/lib/format';
import type { VerificationRequest } from '@/types/admin';

interface ReviewVerificationModalProps {
  request: VerificationRequest | null;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onRequestClarification: (id: string, reason: string) => void;
  isApproving?: boolean;
  isRejecting?: boolean;
  isRequestingClarification?: boolean;
}

export const ReviewVerificationModal = ({
  request,
  onClose,
  onApprove,
  onReject,
  onRequestClarification,
  isApproving = false,
  isRejecting = false,
  isRequestingClarification = false,
}: ReviewVerificationModalProps) => {
  const [mode, setMode] = useState<'view' | 'reject' | 'clarify'>('view');
  const [reason, setReason] = useState('');
  const isSubmitting = isApproving || isRejecting || isRequestingClarification;

  const handleClose = () => {
    if (isSubmitting) return;
    setMode('view');
    setReason('');
    onClose();
  };

  // The mutations own success/failure feedback and close the modal
  // themselves on success, so a failed request leaves it open with the
  // entered reason intact rather than closing blindly.
  const handleApprove = () => {
    if (!request) return;
    onApprove(request.id);
  };

  const handleSubmitReason = () => {
    if (!request) return;
    if (mode === 'reject') onReject(request.id, reason);
    if (mode === 'clarify') onRequestClarification(request.id, reason);
  };

  return (
    <Dialog open={!!request} onOpenChange={(open) => !open && handleClose()}>
      {request && (
        <DialogContent>
          <div className="p-4 border-b border-border flex justify-between items-center pr-12">
            <div>
              <DialogTitle className="font-semibold text-foreground">
                {request.applicantName}
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{request.subjectLabel}</p>
            </div>
          </div>

          <div className="p-4 space-y-3">
            {mode === 'view' ? (
              <>
                <div className="rounded-lg border border-border divide-y divide-border overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 text-sm">
                    <span className="text-muted-foreground">Role</span>
                    <span className="text-foreground font-medium capitalize">
                      {request.applicantRole}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 text-sm">
                    <span className="text-muted-foreground">Submitted</span>
                    <span className="text-foreground font-medium">
                      {formatDate(request.submittedAt)}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Submitted Documents ({request.documentCount})
                  </p>
                  <div className="space-y-2">
                    {Array.from({ length: request.documentCount }).map((_, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 p-2 rounded-lg border border-border text-sm text-muted-foreground"
                      >
                        <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        Document {i + 1}.pdf
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {mode === 'reject' ? 'Reason for rejection' : 'What clarification is needed?'}
                </label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder={
                    mode === 'reject'
                      ? 'e.g. Document is illegible or expired'
                      : 'e.g. Please resubmit a clearer scan'
                  }
                  className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}
          </div>

          <div className="p-4 border-t border-border flex gap-2">
            {mode === 'view' ? (
              <>
                <Button
                  variant="ghost"
                  className="flex-1 gap-1.5"
                  onClick={() => setMode('clarify')}
                  disabled={isSubmitting}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  Need Info
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-1.5 text-red-600 dark:text-red-400"
                  onClick={() => setMode('reject')}
                  disabled={isSubmitting}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Reject
                </Button>
                <Button
                  variant="primary"
                  className="flex-1 gap-1.5"
                  onClick={handleApprove}
                  isLoading={isApproving}
                  disabled={isSubmitting}
                >
                  <Check className="w-3.5 h-3.5" />
                  Approve
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={() => setMode('view')}
                  disabled={isSubmitting}
                >
                  Back
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={handleSubmitReason}
                  isLoading={mode === 'reject' ? isRejecting : isRequestingClarification}
                  disabled={!reason.trim() || isSubmitting}
                >
                  Submit
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
};
