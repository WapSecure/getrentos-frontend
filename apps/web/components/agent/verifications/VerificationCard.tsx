'use client';

import { motion } from 'framer-motion';
import { UserCheck, CheckCircle2, XCircle, CloudOff, Cloud } from 'lucide-react';
import { formatDate } from '@/lib/format';
import type { VerificationVisit } from '@/types/agent';

interface VerificationCardProps {
  visit: VerificationVisit;
  delay?: number;
}

const subjectLabels: Record<VerificationVisit['subjectType'], string> = {
  tenant: 'Tenant',
  buyer: 'Buyer',
  property: 'Property',
};

export const VerificationCard = ({ visit, delay = 0 }: VerificationCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="bg-card rounded-2xl border border-border p-4 hover:shadow-lg transition-all duration-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-accent shrink-0">
            <UserCheck className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground truncate">{visit.subjectName}</h3>
            <p className="text-xs text-muted-foreground truncate">
              {subjectLabels[visit.subjectType]} · {visit.address}
            </p>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${
            visit.syncStatus === 'synced'
              ? 'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20'
              : 'text-orange-700 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20'
          }`}
        >
          {visit.syncStatus === 'synced' ? (
            <Cloud className="w-3 h-3" />
          ) : (
            <CloudOff className="w-3 h-3" />
          )}
          {visit.syncStatus === 'synced' ? 'Synced' : 'Pending Sync'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="flex items-center gap-1.5">
          {visit.idVerified ? (
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          ) : (
            <XCircle className="w-4 h-4 text-muted-foreground/50" />
          )}
          <span className="text-xs text-muted-foreground">ID Verified</span>
        </div>
        <div className="flex items-center gap-1.5">
          {visit.addressConfirmed ? (
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          ) : (
            <XCircle className="w-4 h-4 text-muted-foreground/50" />
          )}
          <span className="text-xs text-muted-foreground">Address Confirmed</span>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-border">
        {formatDate(visit.scheduledDate)}
      </p>
    </motion.div>
  );
};
