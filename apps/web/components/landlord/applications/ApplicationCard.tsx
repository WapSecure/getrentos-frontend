'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, ShieldAlert, Eye, Check, X, MessageSquareText } from 'lucide-react';
import { Badge, Button } from '@getrentos/ui';
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
  const isDecided = application.status === 'approved' || application.status === 'rejected';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="bg-card rounded-2xl border border-border p-4"
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
          <p className="text-xs text-muted-foreground/60">Monthly Income</p>
          <p className="text-sm font-medium text-foreground">
            {formatCurrency(application.monthlyIncome, { compact: true })}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground/60">Applied</p>
          <p className="text-sm font-medium text-foreground">
            {formatDate(application.applicationDate)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 mt-3">
        <span className="text-xs text-muted-foreground">Trust Score</span>
        <span className="text-xs font-bold text-primary">{application.trustScore}</span>
      </div>

      <div className="flex gap-2 mt-4 pt-4 border-t border-border">
        <Button variant="outline" size="sm" fullWidth className="gap-1.5" onClick={onViewDetails}>
          <Eye className="w-3.5 h-3.5" />
          Details
        </Button>
        {!isDecided && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="px-2.5 text-muted-foreground"
              title="Request more info"
              onClick={onRequestInfo}
            >
              <MessageSquareText className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="px-2.5 text-destructive hover:text-destructive"
              title="Reject"
              onClick={onReject}
            >
              <X className="w-4 h-4" />
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="px-2.5"
              title="Approve"
              onClick={onApprove}
            >
              <Check className="w-4 h-4" />
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
