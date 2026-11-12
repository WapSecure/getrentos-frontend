'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, ShieldAlert, Eye, Check, X, MessageSquareText } from '@sureground/icons';
import { Badge, Button, IconButton } from '@sureground/ui';
import { trustScoreDisplay } from '@sureground/shared';
import { applicationStatusBadges } from '@/lib/statusBadge';
import { formatCurrency, formatDate, getInitials } from '@/lib/format';
import type { RentalApplication } from '@/types/landlord';

interface ApplicationCardProps {
  application: RentalApplication;
  delay?: number;
  onViewDetails: () => void;
  onApprove: () => void;
  onReject: () => void;
  onRequestInfo: () => void;
}

export const ApplicationCard = ({
  application,
  delay = 0,
  onViewDetails,
  onApprove,
  onReject,
  onRequestInfo,
}: ApplicationCardProps) => {
  const isVerified = application.verificationStatus === 'verified';
  // Withdrawn counts as decided, like approved and rejected.
  const isDecided = application.status !== 'pending' && application.status !== 'under_review';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="min-w-0 rounded-2xl border border-border bg-card p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm shrink-0">
            {getInitials(application.applicantName)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-foreground truncate">
                {application.applicantName}
              </h3>
              {isVerified ? (
                <ShieldCheck className="w-3.5 h-3.5 text-success shrink-0" />
              ) : (
                <ShieldAlert className="w-3.5 h-3.5 text-warning shrink-0" />
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {application.propertyName} • {application.unitName}
            </p>
          </div>
        </div>
        <StatusBadge status={application.status} />
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div>
          <p className="text-xs text-foreground/70">Monthly income</p>
          <p className="text-sm font-medium text-foreground">
            {formatCurrency(application.monthlyIncome, { compact: true })}
          </p>
        </div>
        <div>
          <p className="text-xs text-foreground/70">Applied</p>
          <p className="text-sm font-medium text-foreground">
            {formatDate(application.applicationDate)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 mt-3">
        <span className="text-xs text-muted-foreground">Trust score</span>
        <span className="text-xs font-bold text-primary">
          {trustScoreDisplay(application.trustScore)}
        </span>
      </div>

      <div className="flex gap-2 mt-4 pt-4 border-t border-border">
        <Button variant="outline" size="sm" fullWidth className="gap-1.5" onClick={onViewDetails}>
          <Eye className="w-3.5 h-3.5" />
          Details
        </Button>
        {!isDecided && (
          <>
            <IconButton
              label="Request more info"
              size="sm"
              icon={<MessageSquareText />}
              onClick={onRequestInfo}
            />
            <Button variant="danger-ghost" size="sm" className="gap-1.5" onClick={onReject}>
              <X className="w-3.5 h-3.5" />
              Reject
            </Button>
            <Button variant="primary" size="sm" className="gap-1.5" onClick={onApprove}>
              <Check className="w-3.5 h-3.5" />
              Approve
            </Button>
          </>
        )}
      </div>
    </motion.div>
  );
};

const StatusBadge = ({ status }: { status: RentalApplication['status'] }) => {
  const { label, variant } = applicationStatusBadges[status];
  return <Badge variant={variant}>{label}</Badge>;
};
