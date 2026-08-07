'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, ShieldAlert, Eye, Check, X, MessageSquareText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
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
      className="bg-white dark:bg-[#1a2a2f] rounded-2xl border border-gray-200 dark:border-white/10 p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-full bg-gradient-to-r from-[#c4a747] to-[#e8d5a3] flex items-center justify-center text-[#0a1a1f] font-semibold text-sm flex-shrink-0">
            {getInitials(application.applicantName)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                {application.applicantName}
              </h3>
              {isVerified ? (
                <ShieldCheck className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
              ) : (
                <ShieldAlert className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {application.propertyName} • {application.unitName}
            </p>
          </div>
        </div>
        <StatusBadge status={application.status} />
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div>
          <p className="text-xs text-gray-400">Monthly Income</p>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {formatCurrency(application.monthlyIncome, { compact: true })}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Applied</p>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {formatDate(application.applicationDate)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 mt-3">
        <span className="text-xs text-gray-500 dark:text-gray-400">Trust Score</span>
        <span className="text-xs font-bold text-[#c4a747]">{application.trustScore}</span>
      </div>

      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
        <Button variant="outline" size="sm" fullWidth className="gap-1.5" onClick={onViewDetails}>
          <Eye className="w-3.5 h-3.5" />
          Details
        </Button>
        {!isDecided && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="px-2.5 text-gray-500"
              title="Request more info"
              onClick={onRequestInfo}
            >
              <MessageSquareText className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="px-2.5 text-red-500 hover:text-red-700"
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
  const config: Record<RentalApplication['status'], { label: string; className: string }> = {
    pending: {
      label: 'Pending',
      className: 'text-yellow-700 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20',
    },
    under_review: {
      label: 'Under Review',
      className: 'text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20',
    },
    approved: {
      label: 'Approved',
      className: 'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20',
    },
    rejected: {
      label: 'Rejected',
      className: 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/20',
    },
  };
  const { label, className } = config[status];
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${className}`}>
      {label}
    </span>
  );
};
