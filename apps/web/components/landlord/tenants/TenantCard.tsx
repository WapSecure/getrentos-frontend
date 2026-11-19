'use client';

import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { MessageCircle, FileCheck, ShieldCheck, Home, Phone } from '@sureground/icons';
import { Badge, Button, useToast } from '@sureground/ui';
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
import { landlordService } from '@/services/landlordService';
import { unwrap } from '@/lib/apiHelpers';
import { trustScoreDisplay } from '@sureground/shared';

const rentStatusConfig = paymentStatusBadges;

// A bare "Pending" beside a name reads as the person's status, so the wording is scoped to rent.
const RENT_LABEL: Record<RentPaymentStatus, string> = {
  paid: 'Paid up',
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
  const noCharges = tenant.hasCharges === false;
  const rentStatus = rentStatusConfig[tenant.rentStatus];
  const moveInLabel = moveInTense(tenant.moveInDate);
  const router = useRouter();
  const toast = useToast();
  const openChat = useMutation({
    mutationFn: () =>
      unwrap(landlordService.startConversation(tenant.tenantUserId as string, tenant.propertyId)),
    onSuccess: (conversation) =>
      router.push(
        `${ROUTES.LANDLORD_MESSAGES}?conversation=${encodeURIComponent(conversation.id)}`
      ),
    onError: (err: Error) => toast.error(err.message || 'We could not open that conversation.'),
  });
  const leaseHref = tenant.leaseId
    ? `${ROUTES.LANDLORD_LEASES}?lease=${encodeURIComponent(tenant.leaseId)}`
    : ROUTES.LANDLORD_LEASES;

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
        {noCharges ? (
          <Badge variant="neutral">No charges yet</Badge>
        ) : (
          <Badge
            variant={rentStatus.variant}
            icon={rentStatus.icon ? <rentStatus.icon className="w-3 h-3" /> : undefined}
          >
            {RENT_LABEL[tenant.rentStatus]}
          </Badge>
        )}
      </div>

      <div className="mt-3 flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
        <Home className="h-4 w-4 shrink-0 text-primary/70" aria-hidden="true" />
        <span className="truncate">
          {tenant.propertyName} · {tenant.unitName}
        </span>
      </div>

      <RecordFacts
        columns={tenant.nextDueDate ? 3 : 2}
        facts={[
          { label: moveInLabel, value: formatDate(tenant.moveInDate) },
          ...(tenant.nextDueDate
            ? [{ label: 'Next rent due', value: formatDate(tenant.nextDueDate) }]
            : []),
          { label: 'Trust score', value: trustScoreDisplay(tenant.trustScore), tone: 'brand' },
        ]}
      />

      <RecordActions className="flex-nowrap">
        {tenant.tenantUserId ? (
          <Button
            variant="outline"
            size="sm"
            fullWidth
            className="gap-1.5"
            onClick={() => openChat.mutate()}
            isLoading={openChat.isPending}
            loadingText="Opening…"
            aria-label={`Message ${tenant.name}`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Message
          </Button>
        ) : tenant.phone ? (
          <Button
            href={`tel:${tenant.phone}`}
            variant="outline"
            size="sm"
            fullWidth
            className="gap-1.5"
            aria-label={`Call ${tenant.name}`}
          >
            <Phone className="w-3.5 h-3.5" />
            Call
          </Button>
        ) : null}
        <Button href={leaseHref} variant="outline" size="sm" fullWidth className="gap-1.5">
          <FileCheck className="w-3.5 h-3.5" />
          View lease
        </Button>
      </RecordActions>
    </motion.div>
  );
};
