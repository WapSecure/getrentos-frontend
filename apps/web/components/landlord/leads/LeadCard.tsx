'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, ShieldAlert, MessageSquare, FileText, CalendarCheck, X } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { getInitials, formatDate } from '@/lib/format';
import type { LandlordLead, LeadStage } from '@/types/landlord';

const stageConfig: Record<LeadStage, { label: string; className: string }> = {
  inquiry: {
    label: 'Inquiry',
    className: 'text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20',
  },
  requested: {
    label: 'Viewing Requested',
    className: 'text-yellow-700 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20',
  },
  confirmed: {
    label: 'Viewing Confirmed',
    className: 'text-indigo-700 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-900/20',
  },
  completed: {
    label: 'Viewing Completed',
    className: 'text-teal-700 bg-teal-50 dark:text-teal-400 dark:bg-teal-900/20',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'text-gray-700 bg-gray-100 dark:text-gray-300 dark:bg-white/10',
  },
  pending: {
    label: 'Applied',
    className: 'text-purple-700 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20',
  },
  under_review: {
    label: 'Under Review',
    className: 'text-orange-700 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20',
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

interface LeadCardProps {
  lead: LandlordLead;
  delay?: number;
  onMessage: () => void;
  onViewApplication: () => void;
  onConfirmViewing: () => void;
  onCancelViewing: () => void;
  isUpdatingViewing?: boolean;
}

export const LeadCard = ({
  lead,
  delay = 0,
  onMessage,
  onViewApplication,
  onConfirmViewing,
  onCancelViewing,
  isUpdatingViewing,
}: LeadCardProps) => {
  const stage = stageConfig[lead.stage];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="bg-card rounded-2xl border border-border p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-full bg-linear-to-r from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-semibold text-sm shrink-0">
            {getInitials(lead.leadName)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-foreground truncate">{lead.leadName}</h3>
              {lead.verified ? (
                <ShieldCheck className="w-3.5 h-3.5 text-green-500 shrink-0" />
              ) : (
                <ShieldAlert className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">{lead.propertyName}</p>
          </div>
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${stage.className}`}
        >
          {stage.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div>
          <p className="text-xs text-gray-400">Trust Score</p>
          <p className="text-sm font-bold text-primary">{lead.trustScore}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">First Contact</p>
          <p className="text-sm font-medium text-foreground">{formatDate(lead.inquiryDate)}</p>
        </div>
      </div>

      <div className="flex gap-2 mt-4 pt-4 border-t border-border flex-wrap">
        {lead.leadUserId && (
          <Button
            variant="ghost"
            size="sm"
            className="px-2.5 text-gray-500"
            title="Message"
            onClick={onMessage}
          >
            <MessageSquare className="w-4 h-4" />
          </Button>
        )}
        {lead.applicationId && (
          <Button variant="outline" size="sm" className="gap-1.5" onClick={onViewApplication}>
            <FileText className="w-3.5 h-3.5" />
            View Application
          </Button>
        )}
        {lead.viewingRequestId && lead.stage === 'requested' && (
          <>
            <Button
              variant="primary"
              size="sm"
              className="gap-1.5"
              disabled={isUpdatingViewing}
              onClick={onConfirmViewing}
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              Confirm Viewing
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="px-2.5 text-gray-500"
              title="Cancel Viewing"
              disabled={isUpdatingViewing}
              onClick={onCancelViewing}
            >
              <X className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
    </motion.div>
  );
};
