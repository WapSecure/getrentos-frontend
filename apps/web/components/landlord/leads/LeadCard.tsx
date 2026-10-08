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
import { Badge, Button, Checkbox } from '@getrentos/ui';
import { getInitials, formatDate, formatRelativeTime } from '@/lib/format';
import { leadStageBadges } from '@/lib/statusBadge';
import type { LandlordLead } from '@/types/landlord';

const NUDGE_COOLDOWN_HOURS = 24;

const isNudgeCooldownActive = (lastNudgedAt?: string): boolean =>
  !!lastNudgedAt &&
  Date.now() - new Date(lastNudgedAt).getTime() < NUDGE_COOLDOWN_HOURS * 60 * 60 * 1000;

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
  const stage = leadStageBadges[lead.stage];
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
          <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm shrink-0">
            {getInitials(lead.leadName)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-foreground truncate">{lead.leadName}</h3>
              {lead.verified ? (
                <ShieldCheck className="w-3.5 h-3.5 text-success shrink-0" />
              ) : (
                <ShieldAlert className="w-3.5 h-3.5 text-warning shrink-0" />
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">{lead.propertyName}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Badge
            variant={stage.variant}
            icon={stage.icon ? <stage.icon className="w-3 h-3" /> : undefined}
          >
            {stage.label}
          </Badge>
          {lead.stale && (
            <Badge variant="warning" icon={<Flame className="w-3 h-3" />}>
              Going cold · {lead.daysSinceActivity}d
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div>
          <p className="text-xs text-muted-foreground">Trust Score</p>
          <p className="text-sm font-bold text-primary">{lead.trustScore}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">First Contact</p>
          <p className="text-sm font-medium text-foreground">{formatDate(lead.inquiryDate)}</p>
        </div>
      </div>

      <div className="flex gap-2 mt-4 pt-4 border-t border-border flex-wrap items-center">
        {lead.leadUserId && (
          <Button
            variant="ghost"
            size="sm"
            className="px-2.5 text-muted-foreground"
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
              className="px-2.5 text-muted-foreground"
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
