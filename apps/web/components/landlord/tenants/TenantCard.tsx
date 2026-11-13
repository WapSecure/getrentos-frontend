'use client';

import { motion } from 'framer-motion';
import { MessageCircle, FileCheck, ShieldCheck, Home } from '@sureground/icons';
import { Badge, Button } from '@sureground/ui';
import { paymentStatusBadges } from '@/lib/statusBadge';
import { formatDate } from '@/lib/format';
import {
  RecordActions,
  RecordAvatar,
  RecordFacts,
  recordCardClass,
} from '@/components/shared/records/RecordParts';
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
      className={recordCardClass()}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <RecordAvatar name={tenant.name} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate font-semibold text-foreground">{tenant.name}</h3>
              {tenant.verified && (
                <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-success" aria-label="Verified" />
              )}
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

      <div className="mt-3 flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
        <Home className="h-4 w-4 shrink-0 text-primary/70" aria-hidden="true" />
        <span className="truncate">
          {tenant.propertyName} · {tenant.unitName}
        </span>
      </div>

      <RecordFacts
        facts={[
          { label: moveInLabel, value: formatDate(tenant.moveInDate) },
          { label: 'Trust score', value: trustScoreDisplay(tenant.trustScore), tone: 'brand' },
        ]}
      />

      <RecordActions className="flex-nowrap">
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
      </RecordActions>
    </motion.div>
  );
};
