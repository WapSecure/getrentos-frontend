'use client';

import { motion } from 'framer-motion';
import { MessageCircle, FileCheck, ShieldCheck, Home } from '@sureground/icons';
import { Badge, Button } from '@sureground/ui';
import { paymentStatusBadges } from '@/lib/statusBadge';
import { formatDate, getInitials } from '@/lib/format';
import type { Tenant, RentPaymentStatus } from '@/types/landlord';
import { ROUTES } from '@/lib/constants/auth';
import { trustScoreDisplay } from '@sureground/shared';

const rentStatusConfig = paymentStatusBadges;

// A bare "Pending" beside a name reads as the person's status, so the wording is scoped to rent.
const RENT_LABEL: Record<RentPaymentStatus, string> = {
  paid: 'Rent paid',
  pending: 'Rent due',
  overdue: 'Rent overdue',
  processing: 'Processing',
};

interface TenantCardProps {
  tenant: Tenant;
  delay?: number;
}

// A lease can start in the future, so the tense comes from the date; module scope keeps the time read out of render.
const moveInTense = (dateString?: string | null): string => {
  if (!dateString) return 'Moved in';
  const date = new Date(dateString);
  return !Number.isNaN(date.getTime()) && date.getTime() > Date.now() ? 'Moves in' : 'Moved in';
};

export const TenantCard = ({ tenant, delay = 0 }: TenantCardProps) => {
  const rentStatus = rentStatusConfig[tenant.rentStatus];
  const moveInLabel = moveInTense(tenant.moveInDate);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="bg-card rounded-2xl border border-border p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm shrink-0">
            {getInitials(tenant.name)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate font-semibold text-foreground">{tenant.name}</h3>
              {tenant.verified && <ShieldCheck className="w-3.5 h-3.5 text-success" />}
            </div>
            <p className="truncate text-xs text-muted-foreground">{tenant.email}</p>
          </div>
        </div>
        <Badge
          variant={rentStatus.variant}
          icon={rentStatus.icon ? <rentStatus.icon className="w-3 h-3" /> : undefined}
        >
          {RENT_LABEL[tenant.rentStatus]}
        </Badge>
      </div>

      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-4">
        <Home className="w-4 h-4 text-muted-foreground/60" />
        {tenant.propertyName} • {tenant.unitName}
      </div>
      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-muted-foreground">
          {moveInLabel} {formatDate(tenant.moveInDate)}
        </p>
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium text-muted-foreground">Trust score</span>
          <span className="text-xs font-bold text-primary">
            {trustScoreDisplay(tenant.trustScore)}
          </span>
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
          View lease
        </Button>
      </div>
    </motion.div>
  );
};
