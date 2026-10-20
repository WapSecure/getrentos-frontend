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
}

export const ApplicationDetailsModal = ({
  application,
  onClose,
  onApprove,
  onReject,
  onRequestInfo,
}: ApplicationDetailsModalProps) => {
  const isDecided = application?.status === 'approved' || application?.status === 'rejected';

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
                <span className="text-sm font-medium text-foreground">Platform Trust Score</span>
              </div>
              <span className="text-lg font-bold text-primary">{application.trustScore}</span>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Personal Information
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

            <p className="text-xs text-muted-foreground/60">
              Submitted {formatDate(application.applicationDate, 'long')}
            </p>
          </div>

          {!isDecided && (
            <div className="p-4 border-t border-border flex flex-wrap gap-2 shrink-0 sm:flex-nowrap">
              <Button
                variant="outline"
                size="sm"
                fullWidth
                className="gap-1.5"
                onClick={() => onRequestInfo(application.id)}
              >
                <MessageSquareText className="w-3.5 h-3.5" />
                Request Info
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
