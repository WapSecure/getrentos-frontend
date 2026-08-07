'use client';

import { motion } from 'framer-motion';
import {
  ShieldCheck,
  ShieldAlert,
  MessageSquare,
  CalendarClock,
  Handshake,
  UserPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getInitials, formatDate } from '@/lib/format';
import type { BuyerLead, BuyerLeadStage } from '@/types/owner';

const stageConfig: Record<BuyerLeadStage, { label: string; className: string }> = {
  new: {
    label: 'New',
    className: 'text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20',
  },
  contacted: {
    label: 'Contacted',
    className: 'text-purple-700 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20',
  },
  viewing_scheduled: {
    label: 'Viewing Scheduled',
    className: 'text-yellow-700 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20',
  },
  offer_made: {
    label: 'Offer Made',
    className: 'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20',
  },
};

interface BuyerLeadCardProps {
  lead: BuyerLead;
  delay?: number;
  onMessage: () => void;
  onScheduleViewing: () => void;
  onConvertToOffer: () => void;
  onAssignRealtor: () => void;
}

export const BuyerLeadCard = ({
  lead,
  delay = 0,
  onMessage,
  onScheduleViewing,
  onConvertToOffer,
  onAssignRealtor,
}: BuyerLeadCardProps) => {
  const stage = stageConfig[lead.stage];

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
            {getInitials(lead.buyerName)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                {lead.buyerName}
              </h3>
              {lead.verified ? (
                <ShieldCheck className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
              ) : (
                <ShieldAlert className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{lead.propertyName}</p>
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
          <p className="text-sm font-bold text-[#c4a747]">{lead.trustScore}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Inquired</p>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {formatDate(lead.inquiryDate)}
          </p>
        </div>
      </div>

      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
        <Button
          variant="ghost"
          size="sm"
          className="px-2.5 text-gray-500"
          title="Message Buyer"
          onClick={onMessage}
        >
          <MessageSquare className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="px-2.5 text-gray-500"
          title="Schedule Viewing"
          onClick={onScheduleViewing}
        >
          <CalendarClock className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="px-2.5 text-gray-500"
          title="Assign Realtor"
          onClick={onAssignRealtor}
        >
          <UserPlus className="w-4 h-4" />
        </Button>
        <div className="flex-1" />
        {lead.stage !== 'offer_made' && (
          <Button variant="primary" size="sm" className="gap-1.5" onClick={onConvertToOffer}>
            <Handshake className="w-3.5 h-3.5" />
            Convert to Offer
          </Button>
        )}
      </div>
    </motion.div>
  );
};
