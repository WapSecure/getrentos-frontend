'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, ShieldAlert, Eye, Check, X, MessageSquareText } from '@sureground/icons';
import { Badge, Button, IconButton } from '@sureground/ui';
import { trustScoreDisplay } from '@sureground/shared';
import { applicationStatusBadges } from '@/lib/statusBadge';
import { formatCurrency, formatDate } from '@/lib/format';
import {
  RecordActions,
  RecordAvatar,
  RecordFacts,
  recordCardClass,
} from '@/components/shared/records/RecordParts';
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
      className={recordCardClass()}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <RecordAvatar name={application.applicantName} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-foreground truncate">
                {application.applicantName}
              </h3>
              {isVerified ? (
                <ShieldCheck className="w-3.5 h-3.5 text-success shrink-0" aria-label="Verified" />
              ) : (
                <ShieldAlert
                  className="w-3.5 h-3.5 text-warning shrink-0"
                  aria-label="Not verified"
                />
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {application.propertyName} · {application.unitName}
            </p>
          </div>
        </div>
        <StatusBadge status={application.status} />
      </div>

      <RecordFacts
        columns={3}
        facts={[
          {
            label: 'Monthly income',
            value: formatCurrency(application.monthlyIncome, { compact: true }),
          },
          { label: 'Applied', value: formatDate(application.applicationDate) },
          {
            label: 'Trust score',
            value: trustScoreDisplay(application.trustScore),
            tone: 'brand',
          },
        ]}
      />

      <RecordActions className="flex-nowrap">
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
      </RecordActions>
    </motion.div>
  );
};

const StatusBadge = ({ status }: { status: RentalApplication['status'] }) => {
  const { label, variant } = applicationStatusBadges[status];
  return <Badge variant={variant}>{label}</Badge>;
};
