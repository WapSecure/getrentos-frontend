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
} from '@sureground/icons';
import { Badge, Button, Checkbox, IconButton } from '@sureground/ui';
import { formatDate, formatRelativeTime } from '@/lib/format';
import {
  RecordActions,
  RecordAvatar,
  RecordFacts,
  recordCardClass,
} from '@/components/shared/records/RecordParts';
import { leadStageBadges } from '@/lib/statusBadge';
import type { LandlordLead } from '@/types/landlord';
import { trustScoreDisplay } from '@sureground/shared';

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
      className={recordCardClass(selected)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Checkbox checked={selected} onCheckedChange={onToggleSelect} className="shrink-0 mt-1" />
          <RecordAvatar name={lead.leadName} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-foreground truncate">{lead.leadName}</h3>
              {lead.verified ? (
                <ShieldCheck className="w-3.5 h-3.5 text-success shrink-0" aria-label="Verified" />
              ) : (
                <ShieldAlert
                  className="w-3.5 h-3.5 text-warning shrink-0"
                  aria-label="Not verified"
                />
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

      <RecordFacts
        facts={[
          { label: 'Trust score', value: trustScoreDisplay(lead.trustScore), tone: 'brand' },
          { label: 'First contact', value: formatDate(lead.inquiryDate) },
        ]}
      />

      <RecordActions>
        {lead.leadUserId && (
          <IconButton
            label={`Message ${lead.leadName}`}
            size="sm"
            icon={<MessageSquare />}
            onClick={onMessage}
          />
        )}
        {lead.applicationId && (
          <Button variant="outline" size="sm" className="gap-1.5" onClick={onViewApplication}>
            <FileText className="w-3.5 h-3.5" />
            View application
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
              Confirm viewing
            </Button>
            <Button
              variant="danger-ghost"
              size="sm"
              className="gap-1.5"
              disabled={isUpdatingViewing}
              onClick={onCancelViewing}
            >
              <X className="w-3.5 h-3.5" />
              Cancel viewing
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
      </RecordActions>
    </motion.div>
  );
};
