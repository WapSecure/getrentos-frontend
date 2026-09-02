'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Check, XCircle, HelpCircle, FileText, Download } from 'lucide-react';
import { Textarea } from '@getrentos/ui';
import { Dialog, DialogContent, DialogTitle } from '@getrentos/ui';
import { Button } from '@getrentos/ui';
import { DocumentPreviewButton } from '@getrentos/ui';
import { formatDate, unwrap } from '@getrentos/shared';
import { adminService } from '@/services/adminService';
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

  // Fetch the real submitted documents (signed preview URLs) for the request
  // being reviewed so the reviewer can inspect the actual files.
  const { data: detail } = useQuery({
    queryKey: ['admin', 'verifications', 'detail', request?.id],
    queryFn: () => (request ? unwrap(adminService.getVerificationDetail(request.id)) : null),
    enabled: Boolean(request),
  });
  const documents = detail?.documents ?? [];

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
                    Submitted Documents ({documents.length || request.documentCount})
                  </p>
                  {documents.length === 0 ? (
                    <div className="rounded-lg border border-border p-3 text-xs text-muted-foreground">
                      No document files are available to preview for this request.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {documents.map((doc) => (
                        <div
                          key={doc.url}
                          className="flex items-center gap-2 p-2 rounded-lg border border-border"
                        >
                          <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                            {doc.name}
                          </span>
                          <DocumentPreviewButton file={doc} title="View document" />
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noreferrer"
                            title="Download"
                            className="p-1.5 rounded-lg text-muted-foreground transition-colors hover:text-primary hover:bg-secondary"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
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
