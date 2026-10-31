'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Check, XCircle, HelpCircle, FileText, Download } from 'lucide-react';
import { Alert, Field, Skeleton, Textarea } from '@getrentos/ui';
import { Dialog, DialogContent, DialogTitle } from '@getrentos/ui';
import { Button, IconLink } from '@getrentos/ui';
import { DocumentPreviewButton } from '@getrentos/ui';
import { formatDate, unwrap } from '@getrentos/shared';
import { adminService } from '@/services/adminService';
import type { VerificationRequest } from '@/types/admin';
import { useAdminCan } from '@/hooks/useAdminCan';
import { roleLabel } from '@/lib/roleLabels';

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
  // Approve and reject are a separate permission from reviewing; a reviewer
  // without it can still ask the applicant for more information.
  const canDecide = useAdminCan('verifications.approve');
  const [mode, setMode] = useState<'view' | 'reject' | 'clarify'>('view');
  const [reason, setReason] = useState('');
  const isSubmitting = isApproving || isRejecting || isRequestingClarification;
  // A decided request can still be opened to read its documents, not re-decided.
  const decided = request?.status === 'approved' || request?.status === 'rejected';

  // Fetch the real submitted documents (signed preview URLs) for the request
  // being reviewed so the reviewer can inspect the actual files.
  const {
    data: detail,
    isLoading: detailLoading,
    isError: detailError,
    isFetching: detailFetching,
    refetch: refetchDetail,
  } = useQuery({
    queryKey: ['admin', 'verifications', 'detail', request?.id],
    queryFn: () => (request ? unwrap(adminService.getVerificationDetail(request.id)) : null),
    enabled: Boolean(request),
  });
  const documents = detail?.documents ?? [];
  const media = detail?.media ?? [];
  const detailUnavailable = detailLoading || detailError;

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
        <DialogContent className="p-0">
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
                      {roleLabel(request.applicantRole)}
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
                  {detailError ? (
                    <Alert
                      variant="danger"
                      action={
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => void refetchDetail()}
                          isLoading={detailFetching}
                        >
                          Try again
                        </Button>
                      }
                    >
                      The submitted documents could not be loaded. Do not decide this request
                      without reviewing them.
                    </Alert>
                  ) : detailLoading ? (
                    <div
                      className="space-y-2"
                      role="status"
                      aria-label="Loading submitted documents"
                    >
                      <Skeleton className="h-10 w-full rounded-lg" />
                      <Skeleton className="h-10 w-full rounded-lg" />
                    </div>
                  ) : documents.length === 0 ? (
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
                          <IconLink
                            href={doc.url}
                            target="_blank"
                            rel="noreferrer"
                            label={`Download ${doc.name}`}
                            title="Download"
                            icon={<Download />}
                            size="sm"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {request.type === 'property' && (
                  <div>
                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                      Property Media ({media.length})
                    </p>
                    {detailLoading ? (
                      <div
                        className="grid grid-cols-1 gap-2 sm:grid-cols-2"
                        role="status"
                        aria-label="Loading property media"
                      >
                        <Skeleton className="h-10 w-full rounded-lg" />
                        <Skeleton className="h-10 w-full rounded-lg" />
                      </div>
                    ) : media.length === 0 ? (
                      <Alert variant="warning">
                        No property media is available. Confirm whether media is required before
                        approval.
                      </Alert>
                    ) : (
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {media.map((file) => (
                          <div
                            key={file.url}
                            className="flex items-center gap-2 rounded-lg border border-border p-2"
                          >
                            <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <span className="min-w-0 flex-1 truncate text-sm">{file.name}</span>
                            <DocumentPreviewButton file={file} title={`View ${file.name}`} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <Field
                label={mode === 'reject' ? 'Reason for rejection' : 'What clarification is needed?'}
                hint="Required · At least 10 characters for the review record."
              >
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  required
                  minLength={10}
                  placeholder={
                    mode === 'reject'
                      ? 'e.g. Document is illegible or expired'
                      : 'e.g. Please resubmit a clearer scan'
                  }
                />
              </Field>
            )}
          </div>

          <div className="p-4 border-t border-border flex gap-2">
            {decided ? (
              <>
                <p className="flex-1 self-center text-sm text-muted-foreground">
                  {request.status === 'approved'
                    ? 'This request was approved.'
                    : 'This request was rejected.'}
                </p>
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </>
            ) : mode === 'view' ? (
              <>
                <Button
                  variant="ghost"
                  className="flex-1 gap-1.5"
                  onClick={() => setMode('clarify')}
                  disabled={isSubmitting || detailUnavailable}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  Need Info
                </Button>
                {canDecide && (
                  <>
                    <Button
                      variant="outline"
                      className="flex-1 gap-1.5 text-destructive"
                      onClick={() => setMode('reject')}
                      disabled={isSubmitting || detailUnavailable}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject
                    </Button>
                    <Button
                      variant="primary"
                      className="flex-1 gap-1.5"
                      onClick={handleApprove}
                      isLoading={isApproving}
                      disabled={isSubmitting || detailUnavailable}
                    >
                      <Check className="w-3.5 h-3.5" />
                      Approve
                    </Button>
                  </>
                )}
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
                  disabled={reason.trim().length < 10 || isSubmitting}
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
