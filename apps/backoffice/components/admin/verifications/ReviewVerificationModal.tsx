'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Check, XCircle, HelpCircle, FileText, Download } from '@sureground/icons';
import { Alert, Field, Skeleton, Textarea } from '@sureground/ui';
import { Dialog, DialogContent, DialogTitle } from '@sureground/ui';
import { Button, IconLink } from '@sureground/ui';
import { DocumentPreviewButton } from '@sureground/ui';
import { formatDate, humaniseCodesInText, unwrap } from '@sureground/shared';
import { adminService } from '@/services/adminService';
import { OwnershipDocCheckPanel } from '@/components/admin/verifications/OwnershipDocCheckPanel';
import { ListingWarningsPanel } from '@/components/admin/verifications/ListingWarningsPanel';
import type { VerificationRequest } from '@/types/admin';
import { useAdminCan } from '@/hooks/useAdminCan';
import { roleLabel } from '@/lib/roleLabels';

interface ReviewVerificationModalProps {
  request: VerificationRequest | null;
  onClose: () => void;
  /** crossCheckIssues lists problems the document cross-check raised in this session, if it was run. */
  onApprove: (id: string, crossCheckIssues: string[]) => void;
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
  // Approve and reject need a separate permission; a reviewer without it can still ask for more information.
  const canDecide = useAdminCan('verifications.approve');
  const [mode, setMode] = useState<'view' | 'reject' | 'clarify'>('view');
  const [reason, setReason] = useState('');
  const [crossCheckIssues, setCrossCheckIssues] = useState<string[]>([]);
  const isSubmitting = isApproving || isRejecting || isRequestingClarification;
  const decided = request?.status === 'approved' || request?.status === 'rejected';

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
  const listingWarnings = request?.type === 'property' ? (detail?.listingWarnings ?? []) : [];

  const handleClose = () => {
    if (isSubmitting) return;
    setMode('view');
    setReason('');
    onClose();
  };

  // The mutations close the modal only on success, so a failed request keeps the entered reason.
  const handleApprove = () => {
    if (!request) return;
    onApprove(request.id, crossCheckIssues);
  };

  const handleSubmitReason = () => {
    if (!request) return;
    if (mode === 'reject') onReject(request.id, reason);
    if (mode === 'clarify') onRequestClarification(request.id, reason);
  };

  return (
    <Dialog open={!!request} onOpenChange={(open) => !open && handleClose()}>
      {request && (
        <DialogContent
          size={mode === 'view' ? 'xl' : 'lg'}
          padded={false}
          className="flex max-h-[88dvh] flex-col"
        >
          <div className="shrink-0 px-5 py-4 border-b border-border flex justify-between items-center pr-12 sm:px-6">
            <div>
              <DialogTitle className="text-lg font-semibold text-foreground">
                {request.applicantName}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5">{request.subjectLabel}</p>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 sm:px-6">
            {mode === 'view' ? (
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:items-start">
                {/* Documents and media */}
                <div className="min-w-0 space-y-5">
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-2">
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
                              {humaniseCodesInText(doc.name)}
                            </span>
                            <DocumentPreviewButton file={doc} title="View document" />
                            <IconLink
                              href={doc.url}
                              target="_blank"
                              rel="noreferrer"
                              label={`Download ${humaniseCodesInText(doc.name)}`}
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
                      <p className="mb-2 text-sm font-semibold text-foreground">
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
                </div>

                {/* Request facts and cross-checks */}
                <div className="min-w-0 space-y-5">
                  <dl className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-secondary/50 px-3 py-2.5 ring-1 ring-border/60">
                      <dt className="text-xs font-medium text-muted-foreground">Role</dt>
                      <dd className="mt-1 text-sm font-semibold text-foreground capitalize sm:text-base">
                        {roleLabel(request.applicantRole)}
                      </dd>
                    </div>
                    <div className="rounded-lg bg-secondary/50 px-3 py-2.5 ring-1 ring-border/60">
                      <dt className="text-xs font-medium text-muted-foreground">Submitted</dt>
                      <dd className="mt-1 text-sm font-semibold text-foreground sm:text-base">
                        {formatDate(request.submittedAt)}
                      </dd>
                    </div>
                  </dl>
                  {request.type === 'property' && detail?.approvalRisk?.secondOfficerRequired ? (
                    <Alert
                      variant="warning"
                      title="A second officer must also approve this property"
                    >
                      <ul className="list-disc space-y-0.5 pl-4">
                        {detail.approvalRisk.reasons.map((reason) => (
                          <li key={reason}>{reason}</li>
                        ))}
                      </ul>
                    </Alert>
                  ) : null}
                  <ListingWarningsPanel warnings={listingWarnings} />
                  {request.type === 'property' && detail?.ownershipProofs?.length ? (
                    <OwnershipDocCheckPanel
                      proofs={detail.ownershipProofs}
                      onIssuesChange={setCrossCheckIssues}
                    />
                  ) : null}
                </div>
              </div>
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

          <div className="shrink-0 px-5 py-4 border-t border-border flex gap-2 sm:px-6">
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
                  Need info
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
                      // The server refuses it too; the panel above says what to resolve first.
                      disabled={isSubmitting || detailUnavailable || listingWarnings.length > 0}
                      title={
                        listingWarnings.length > 0
                          ? 'Resolve the automated listing warning first'
                          : undefined
                      }
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
