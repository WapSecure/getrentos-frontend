'use client';

import { motion } from 'framer-motion';
import { MessageCircle, FileCheck, ShieldCheck, Home } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { formatDate, getInitials } from '@/lib/format';
import type { Tenant, RentPaymentStatus } from '@/types/landlord';
import { ROUTES } from '@/lib/constants/auth';

const rentStatusConfig: Record<RentPaymentStatus, { label: string; className: string }> = {
  paid: {
    label: 'Rent Paid',
    className: 'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20',
  },
  pending: {
    label: 'Rent Pending',
    className: 'text-yellow-700 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20',
  },
  overdue: {
    label: 'Rent Overdue',
    className: 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/20',
  },
  processing: {
    label: 'Processing',
    className: 'text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20',
  },
};

interface TenantCardProps {
  tenant: Tenant;
  delay?: number;
}

export const TenantCard = ({ tenant, delay = 0 }: TenantCardProps) => {
  const rentStatus = rentStatusConfig[tenant.rentStatus];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="bg-card rounded-2xl border border-border p-4"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-linear-to-r from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-semibold text-sm shrink-0">
            {getInitials(tenant.name)}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-foreground">{tenant.name}</h3>
              {tenant.verified && <ShieldCheck className="w-3.5 h-3.5 text-green-500" />}
            </div>
            <p className="text-xs text-muted-foreground">{tenant.email}</p>
          </div>
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${rentStatus.className}`}
        >
          {rentStatus.label}
        </span>
      </div>

      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-4">
        <Home className="w-4 h-4 text-gray-400" />
        {tenant.propertyName} • {tenant.unitName}
      </div>
      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-gray-400">Moved in {formatDate(tenant.moveInDate)}</p>
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium text-muted-foreground">Trust Score</span>
          <span className="text-xs font-bold text-primary">{tenant.trustScore}</span>
        </div>
      </div>

      <div className="flex gap-2 mt-4 pt-4 border-t border-border">
        <Button
          href={ROUTES.LANDLORD_MESSAGES}
          variant="outline"
          size="sm"
          fullWidth
          className="gap-1.5"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          Message
        </Button>
        <Button
          href={ROUTES.LANDLORD_LEASES}
          variant="outline"
          size="sm"
          fullWidth
          className="gap-1.5"
        >
          <FileCheck className="w-3.5 h-3.5" />
          View Lease
        </Button>
      </div>
    </motion.div>
  );
};
