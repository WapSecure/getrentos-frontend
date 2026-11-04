'use client';

import { Mail, CalendarClock, CheckCircle2, XCircle } from 'lucide-react';
import { Badge, Card, IconButton, type BadgeVariant } from '@getrentos/ui';
import { getInitials, formatDate } from '@/lib/format';
import type { RealtorLead, LeadStage } from '@/types/realtor';

const stageConfig: Record<LeadStage, { label: string; variant: BadgeVariant }> = {
  new: { label: 'New', variant: 'info' },
  contacted: { label: 'Contacted', variant: 'info' },
  viewing_scheduled: { label: 'Viewing Scheduled', variant: 'warning' },
  offer_made: { label: 'Offer Made', variant: 'warning' },
  closed_won: { label: 'Closed Won', variant: 'success' },
  closed_lost: { label: 'Closed Lost', variant: 'neutral' },
};

interface LeadCardProps {
  lead: RealtorLead;
  isUpdating?: boolean;
  onScheduleViewing: () => void;
  onCloseWon: () => void;
  onCloseLost: () => void;
}

export const LeadCard = ({
  lead,
  isUpdating = false,
  onScheduleViewing,
  onCloseWon,
  onCloseLost,
}: LeadCardProps) => {
  const stage = stageConfig[lead.stage];
  const isClosed = lead.stage === 'closed_won' || lead.stage === 'closed_lost';

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm shrink-0">
            {getInitials(lead.leadName)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-foreground truncate">{lead.leadName}</h3>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {lead.listingTitle} · {lead.leadType === 'buyer' ? 'Buyer' : 'Renter'}
            </p>
          </div>
        </div>
        <Badge variant={stage.variant} className="shrink-0 whitespace-nowrap">
          {stage.label}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Email</p>
          <p className="text-sm font-medium text-foreground truncate">{lead.email || '—'}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Inquired</p>
          <p className="text-sm font-medium text-foreground">{formatDate(lead.inquiryDate)}</p>
        </div>
      </div>

      <div className="flex gap-2 mt-4 pt-4 border-t border-border">
        {/* Leads are enquirers, not clients: in-app messaging is for clients, so reach them by email. */}
        {lead.email && (
          <IconButton
            label="Email"
            icon={<Mail />}
            size="sm"
            onClick={() => {
              window.location.href = `mailto:${lead.email}`;
            }}
          />
        )}
        {!isClosed && (
          <>
            <IconButton
              label="Schedule Viewing"
              icon={<CalendarClock />}
              size="sm"
              onClick={onScheduleViewing}
            />
            <IconButton
              label="Mark Closed Lost"
              icon={<XCircle />}
              size="sm"
              variant="danger"
              onClick={onCloseLost}
              disabled={isUpdating}
            />
            <IconButton
              label="Mark Closed Won"
              icon={<CheckCircle2 />}
              size="sm"
              className="text-success"
              onClick={onCloseWon}
              disabled={isUpdating}
            />
          </>
        )}
      </div>
    </Card>
  );
};
