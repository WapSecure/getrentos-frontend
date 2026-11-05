'use client';

import { Mail, Phone, ShieldCheck, Check, MessageSquareText } from 'lucide-react';
import { Button, Dialog, DialogContent, DialogDescription, DialogTitle } from '@getrentos/ui';
import { formatDate, getInitials } from '@/lib/format';
import { ScreeningPanel } from '@/components/landlord/applications/ScreeningPanel';
import type { RentalApplication } from '@/types/landlord';

interface ApplicationDetailsModalProps {
  application: RentalApplication | null;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onRequestInfo: (id: string) => void;
  /**
   * Who already holds an approved application for this unit, when the page
   * knows. Approving would be refused, so say so here instead of after.
   */
  unitHeldBy?: string | null;
  /** The next step once approved: the lease drafted for them, to review and send. */
  onReviewLease?: () => void;
}

export const ApplicationDetailsModal = ({
  application,
  onClose,
  onApprove,
  onReject,
  onRequestInfo,
  unitHeldBy = null,
  onReviewLease,
}: ApplicationDetailsModalProps) => {
  // Only an open application can be decided; withdrawn ones are closed like approved and rejected.
  const isDecided = application?.status !== 'pending' && application?.status !== 'under_review';

  return (
    <Dialog open={!!application} onOpenChange={(next) => !next && onClose()}>
      {application && (
        <DialogContent size="lg" padded={false} className="flex flex-col">
          <div className="p-4 pr-12 border-b border-border flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 shrink-0 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                {getInitials(application.applicantName)}
              </div>
              <div className="min-w-0">
                <DialogTitle className="font-semibold text-foreground">
                  {application.applicantName}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Applied for {application.propertyName} • {application.unitName}
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-5 overflow-y-auto flex-1">
            <div className="p-3 rounded-lg bg-accent border border-primary/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Platform trust score</span>
              </div>
              <span className="text-lg font-bold text-primary">{application.trustScore}</span>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Personal information
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Mail className="w-4 h-4 text-muted-foreground/60" />
                  {application.applicantEmail}
                </div>
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Phone className="w-4 h-4 text-muted-foreground/60" />
                  {application.applicantPhone}
                </div>
              </div>
            </div>

            <ScreeningPanel
              key={application.id}
              applicationId={application.id}
              employmentStatus={application.employmentStatus}
            />

            <p className="text-xs text-muted-foreground">
              Submitted {formatDate(application.applicationDate, 'long')}
            </p>
          </div>

          {application.status === 'approved' && onReviewLease && (
            <div className="p-4 border-t border-border flex items-center justify-between gap-3 shrink-0">
              <p className="text-xs text-muted-foreground">
                Approved. Their lease is drafted and waiting for you to send.
              </p>
              <Button variant="primary" size="sm" onClick={onReviewLease}>
                Review lease
              </Button>
            </div>
          )}
          {!isDecided && (
            <div className="p-4 border-t border-border flex flex-wrap gap-2 shrink-0 sm:flex-nowrap">
              {unitHeldBy && (
                <p className="w-full text-xs text-muted-foreground" role="status">
                  {unitHeldBy}&apos;s application for this unit is already approved, so this one can
                  only be declined. Reject it, or ask the applicant whether another unit suits.
                </p>
              )}
              <Button
                variant="outline"
                size="sm"
                fullWidth
                className="gap-1.5"
                onClick={() => onRequestInfo(application.id)}
              >
                <MessageSquareText className="w-3.5 h-3.5" />
                Request info
              </Button>
              <Button variant="danger" size="sm" fullWidth onClick={() => onReject(application.id)}>
                Reject
              </Button>
              <Button
                variant="primary"
                size="sm"
                fullWidth
                className="gap-1.5"
                onClick={() => onApprove(application.id)}
                disabled={Boolean(unitHeldBy)}
              >
                <Check className="w-3.5 h-3.5" />
                Approve
              </Button>
            </div>
          )}
        </DialogContent>
      )}
    </Dialog>
  );
};
