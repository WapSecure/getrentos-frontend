'use client';

import { motion } from 'framer-motion';
import {
  ShieldCheck,
  ShieldAlert,
  MessageSquare,
  FileText,
  CalendarCheck,
  X,
  Flame,
  Send,
} from 'lucide-react';
import { Button, Checkbox } from '@getrentos/ui';
import { getInitials, formatDate, formatRelativeTime } from '@/lib/format';
import type { LandlordLead, LeadStage } from '@/types/landlord';

const NUDGE_COOLDOWN_HOURS = 24;

const isNudgeCooldownActive = (lastNudgedAt?: string): boolean =>
  !!lastNudgedAt &&
  Date.now() - new Date(lastNudgedAt).getTime() < NUDGE_COOLDOWN_HOURS * 60 * 60 * 1000;

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
  selected: boolean;
  onToggleSelect: () => void;
  onMessage: () => void;
  onViewApplication: () => void;
  onConfirmViewing: () => void;
  onCancelViewing: () => void;
  onNudge: () => void;
  isUpdatingViewing?: boolean;
}

export const LeadCard = ({
  lead,
  delay = 0,
  selected,
  onToggleSelect,
  onMessage,
  onViewApplication,
  onConfirmViewing,
  onCancelViewing,
  onNudge,
  isUpdatingViewing,
}: LeadCardProps) => {
  const stage = stageConfig[lead.stage];
  const cooldownActive = isNudgeCooldownActive(lead.lastNudgedAt);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={`bg-card rounded-2xl border p-4 ${selected ? 'border-primary' : 'border-border'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Checkbox checked={selected} onCheckedChange={onToggleSelect} className="shrink-0 mt-1" />
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
        <div className="flex flex-col items-end gap-1.5">
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${stage.className}`}
          >
            {stage.label}
          </span>
          {lead.stale && (
            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20">
              <Flame className="w-3 h-3" />
              Going cold · {lead.daysSinceActivity}d
            </span>
          )}
        </div>
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

      <div className="flex gap-2 mt-4 pt-4 border-t border-border flex-wrap items-center">
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
        {lead.stale && lead.leadUserId && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={cooldownActive}
            onClick={onNudge}
          >
            <Send className="w-3.5 h-3.5" />
            {cooldownActive ? `Nudged ${formatRelativeTime(lead.lastNudgedAt!)}` : 'Nudge'}
          </Button>
        )}
      </div>
    </motion.div>
  );
};
