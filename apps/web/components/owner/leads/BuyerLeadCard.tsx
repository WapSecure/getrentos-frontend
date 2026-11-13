'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, ShieldAlert, MessageSquare } from '@sureground/icons';
import { Badge, type BadgeVariant, Button } from '@sureground/ui';
import { formatDate } from '@/lib/format';
import {
  RecordActions,
  RecordAvatar,
  RecordFacts,
  recordCardClass,
} from '@/components/shared/records/RecordParts';
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
    label: 'Viewing scheduled',
    variant: 'warning',
  },
  offer_made: {
    label: 'Offer made',
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
      className={recordCardClass()}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <RecordAvatar name={lead.buyerName} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-foreground truncate">{lead.buyerName}</h3>
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
        <Badge variant={stage.variant} className="whitespace-nowrap">
          {stage.label}
        </Badge>
      </div>

      <RecordFacts
        facts={[
          { label: 'Trust score', value: lead.trustScore, tone: 'brand' },
          { label: 'Inquired', value: formatDate(lead.inquiryDate) },
        ]}
      />

      <RecordActions>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          title="Message buyer"
          onClick={onMessage}
          icon={<MessageSquare className="w-4 h-4" />}
        >
          Message buyer
        </Button>
      </RecordActions>
    </motion.div>
  );
};
