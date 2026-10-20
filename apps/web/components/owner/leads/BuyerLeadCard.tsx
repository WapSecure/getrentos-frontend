'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, ShieldAlert, MessageSquare } from 'lucide-react';
import { Badge, type BadgeVariant, Button, Card } from '@getrentos/ui';
import { getInitials, formatDate } from '@/lib/format';
import type { BuyerLead, BuyerLeadStage } from '@/types/owner';

const stageConfig: Record<BuyerLeadStage, { label: string; variant: BadgeVariant }> = {
  new: {
    label: 'New',
    variant: 'info',
  },
  contacted: {
    label: 'Contacted',
    variant: 'info',
  },
  qualified: {
    label: 'Qualified',
    variant: 'info',
  },
  viewing_scheduled: {
    label: 'Viewing Scheduled',
    variant: 'warning',
  },
  offer_made: {
    label: 'Offer Made',
    variant: 'success',
  },
  closed: {
    label: 'Closed',
    variant: 'neutral',
  },
  lost: {
    label: 'Lost',
    variant: 'danger',
  },
};

interface BuyerLeadCardProps {
  lead: BuyerLead;
  delay?: number;
  onMessage: () => void;
}

export const BuyerLeadCard = ({ lead, delay = 0, onMessage }: BuyerLeadCardProps) => {
  const stage = stageConfig[lead.stage];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <Card className="rounded-2xl p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm shrink-0">
              {getInitials(lead.buyerName)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-semibold text-foreground truncate">{lead.buyerName}</h3>
                {lead.verified ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-success shrink-0" aria-label="Verified" />
                ) : (
                  <ShieldAlert className="w-3.5 h-3.5 text-warning shrink-0" aria-label="Not verified" />
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">{lead.propertyName}</p>
            </div>
          </div>
          <Badge variant={stage.variant} className="whitespace-nowrap">
            {stage.label}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div>
            <p className="text-xs text-muted-foreground">Trust Score</p>
            <p className="text-sm font-bold text-primary">{lead.trustScore}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Inquired</p>
            <p className="text-sm font-medium text-foreground">{formatDate(lead.inquiryDate)}</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <Button
            variant="secondary"
            size="sm"
            className="w-full"
            title="Message Buyer"
            onClick={onMessage}
            icon={<MessageSquare className="w-4 h-4" />}
          >
            Message buyer
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};
